import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// GPT-4o pricing per 1M tokens (as of 2025)
const PRICE_INPUT_PER_M = 2.5;
const PRICE_OUTPUT_PER_M = 10.0;

export interface AnalysisResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export async function callOpenAI(
  systemPrompt: string,
  userMessage: string,
  model = 'gpt-4o',
  maxTokens = 4096,
  temperature = 0.3
): Promise<AnalysisResult> {
  let text = '';
  let inputTokens = 0;
  let outputTokens = 0;

  const stream = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    stream: true,
    stream_options: { include_usage: true },
    max_tokens: maxTokens,
    temperature,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) text += delta;
    if (chunk.usage) {
      inputTokens = chunk.usage.prompt_tokens;
      outputTokens = chunk.usage.completion_tokens;
    }
  }

  const costUsd =
    (inputTokens / 1_000_000) * PRICE_INPUT_PER_M +
    (outputTokens / 1_000_000) * PRICE_OUTPUT_PER_M;

  return { text, inputTokens, outputTokens, costUsd };
}
