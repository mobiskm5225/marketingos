import OpenAI from 'openai';
import { eq, asc } from 'drizzle-orm';
import { db } from '../db';
import { modelProviders } from '../db/schema';
import { tryDecrypt } from '../../lib/crypto';
import { resolveLocalEndpoint } from '../safe-fetch';
import log from '../../logger';

/**
 * One entry point for every model call.
 *
 * OpenAI, Ollama, vLLM, LM Studio and Gemini all speak the OpenAI protocol, so
 * they share a single path with a different baseUrl. Anthropic gets its own
 * branch. A provider is usable when it has an API key (hosted) or a base URL
 * (self-hosted) — which is the same rule the Models page reports as `connected`.
 */

export interface ResolvedProvider {
  slug: string;
  kind: string;
  apiKey: string | null;
  baseUrl: string | null;
  defaultModel: string | null;
}

export interface CompletionRequest {
  system: string;
  user: string;
  /** Provider slug. Omit to use the first usable provider. */
  provider?: string | null;
  model?: string | null;
  maxTokens?: number;
  temperature?: number;
}

export interface CompletionResult {
  text: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

/** USD per 1M tokens. Unknown models cost 0 rather than guessing. */
const PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'claude-opus-5': { input: 15, output: 75 },
  'claude-sonnet-5': { input: 3, output: 15 },
  'claude-haiku-4-5-20251001': { input: 1, output: 5 },
  'gemini-2.0-flash': { input: 0.1, output: 0.4 },
  'gemini-1.5-pro': { input: 1.25, output: 5 },
};

function priceFor(model: string, inputTokens: number, outputTokens: number): number {
  const rate = PRICING[model];
  if (!rate) return 0;
  return (inputTokens / 1_000_000) * rate.input + (outputTokens / 1_000_000) * rate.output;
}

async function loadProvider(slug?: string | null): Promise<ResolvedProvider | null> {
  const rows = slug
    ? await db.select().from(modelProviders).where(eq(modelProviders.slug, slug))
    : await db.select().from(modelProviders).orderBy(asc(modelProviders.createdAt));

  for (const row of rows) {
    const apiKey = tryDecrypt(row.apiKeyEnc);
    // Self-hosted providers need no key, only a reachable endpoint.
    if (!apiKey && !row.baseUrl) continue;
    return {
      slug: row.slug,
      kind: row.kind,
      apiKey,
      baseUrl: row.baseUrl,
      defaultModel: row.defaultModel ?? (row.models as string[])[0] ?? null,
    };
  }

  return null;
}

async function isConfigured(slug?: string | null): Promise<boolean> {
  return (await loadProvider(slug)) !== null;
}

async function complete(request: CompletionRequest): Promise<CompletionResult> {
  const result = await run(request);
  return result;
}

/** Returns just the text — the common case for internal calls like distillation. */
async function completeText(request: CompletionRequest): Promise<string> {
  const { text } = await run(request);
  return text;
}

async function run(request: CompletionRequest): Promise<CompletionResult> {
  const provider = await loadProvider(request.provider);
  if (!provider) {
    throw new Error(
      'No model provider is configured. Add an API key or endpoint on the Models page.',
    );
  }

  const model = request.model ?? provider.defaultModel;
  if (!model) throw new Error(`Provider "${provider.slug}" has no model selected.`);

  if (provider.slug === 'anthropic') {
    return callAnthropic(provider, model, request);
  }
  return callOpenAICompatible(provider, model, request);
}

async function callOpenAICompatible(
  provider: ResolvedProvider,
  model: string,
  request: CompletionRequest,
): Promise<CompletionResult> {
  const client = new OpenAI({
    // Self-hosted endpoints usually accept any non-empty key.
    apiKey: provider.apiKey ?? 'not-needed',
    ...(provider.baseUrl
      ? { baseURL: resolveLocalEndpoint(provider.baseUrl).replace(/\/+$/, '') + '/v1' }
      : {}),
  });

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: request.system },
      { role: 'user', content: request.user },
    ],
    max_tokens: request.maxTokens ?? 2048,
    temperature: request.temperature ?? 0.3,
  });

  const choice = response.choices[0];
  const text = choice?.message?.content ?? '';
  const inputTokens = response.usage?.prompt_tokens ?? 0;
  const outputTokens = response.usage?.completion_tokens ?? 0;

  // Reasoning models spend output tokens thinking before they answer, so a low
  // max_tokens returns empty content with a healthy token count — a silent
  // failure that would otherwise be recorded as a successful stage.
  if (!text.trim() && outputTokens > 0) {
    throw new Error(
      `${model} produced no output — it used all ${outputTokens} tokens before answering. Raise max tokens for this stage.`,
    );
  }
  if (choice?.finish_reason === 'length') {
    log.warn({ model, outputTokens }, 'Model output was truncated by the token limit');
  }

  return {
    text,
    model,
    provider: provider.slug,
    inputTokens,
    outputTokens,
    costUsd: priceFor(model, inputTokens, outputTokens),
  };
}

async function callAnthropic(
  provider: ResolvedProvider,
  model: string,
  request: CompletionRequest,
): Promise<CompletionResult> {
  if (!provider.apiKey) throw new Error('Anthropic requires an API key.');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': provider.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: request.maxTokens ?? 2048,
      temperature: request.temperature ?? 0.3,
      system: request.system,
      messages: [{ role: 'user', content: request.user }],
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    const detail = await response.text();
    log.warn({ status: response.status, detail: detail.slice(0, 300) }, 'Anthropic call failed');
    throw new Error(`Anthropic returned ${response.status}`);
  }

  const body = (await response.json()) as {
    content?: { type: string; text?: string }[];
    usage?: { input_tokens?: number; output_tokens?: number };
  };

  const text = (body.content ?? [])
    .filter((c) => c.type === 'text')
    .map((c) => c.text ?? '')
    .join('');

  const inputTokens = body.usage?.input_tokens ?? 0;
  const outputTokens = body.usage?.output_tokens ?? 0;

  return {
    text,
    model,
    provider: provider.slug,
    inputTokens,
    outputTokens,
    costUsd: priceFor(model, inputTokens, outputTokens),
  };
}

export const callModel = {
  isConfigured,
  /** Full result including tokens and cost — used by the run recorder. */
  run: complete,
  /** Text only. */
  complete: completeText,
  loadProvider,
};
