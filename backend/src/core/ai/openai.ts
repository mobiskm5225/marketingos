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

// gpt-image-2 pricing per 1M tokens (text input $5, image output $30)
const IMG_PRICE_TEXT_INPUT_PER_M  = 5.0;
const IMG_PRICE_IMAGE_OUTPUT_PER_M = 30.0;

export interface ImageResult {
  b64: string;           // PNG, base64
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export async function generateImage(
  prompt: string,
  size: '1024x1024' | '1536x1024' | '1024x1536' = '1536x1024',
  quality: 'low' | 'medium' | 'high' = 'medium'
): Promise<ImageResult> {
  const response = await client.images.generate({
    model: 'gpt-image-2',
    prompt,
    size,
    quality,
    n: 1,
  }) as any;

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error('Image generation returned no data');

  const inputTokens  = response.usage?.input_tokens  ?? 0;
  const outputTokens = response.usage?.output_tokens ?? 0;
  const costUsd =
    (inputTokens / 1_000_000) * IMG_PRICE_TEXT_INPUT_PER_M +
    (outputTokens / 1_000_000) * IMG_PRICE_IMAGE_OUTPUT_PER_M;

  return { b64, inputTokens, outputTokens, costUsd };
}
