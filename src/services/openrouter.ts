import { OpenRouterModelInfo } from '../types';

export const CURATED_MODELS: OpenRouterModelInfo[] = [
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct',
    description: 'Ultra-fast, state-of-the-art open intelligence with 128k context.',
    context_length: 131072,
    pricing: { prompt: '$0.12/M', completion: '$0.30/M' }
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Gold standard for creative writing, deep reasoning, and character roleplay.',
    context_length: 200000,
    pricing: { prompt: '$3.00/M', completion: '$15.00/M' }
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3 (Chat)',
    description: 'Extremely fast, highly competent model with exceptional cost efficiency.',
    context_length: 64000,
    pricing: { prompt: '$0.14/M', completion: '$0.28/M' }
  },
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash',
    description: 'Next-gen lightning speed with 1M context and real-time generation.',
    context_length: 1048576,
    pricing: { prompt: '$0.10/M', completion: '$0.40/M' }
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o (Omni)',
    description: 'OpenAI flagship model with versatile high-fidelity intelligence.',
    context_length: 128000,
    pricing: { prompt: '$2.50/M', completion: '$10.00/M' }
  },
  {
    id: 'mistralai/mistral-large-2411',
    name: 'Mistral Large 2411',
    description: 'Top-tier multilingual, precise instruction follower with 128k context.',
    context_length: 128000,
    pricing: { prompt: '$2.00/M', completion: '$6.00/M' }
  },
  {
    id: 'qwen/qwen-2.5-72b-instruct',
    name: 'Qwen 2.5 72B Instruct',
    description: 'Powerful analytical model with strong multilingual and coding depth.',
    context_length: 131072,
    pricing: { prompt: '$0.35/M', completion: '$0.40/M' }
  }
];

export async function testOpenRouterKey(apiKey: string): Promise<{ valid: boolean; message: string; latencyMs: number }> {
  if (!apiKey || apiKey.trim().length === 0) {
    return { valid: false, message: 'Please enter an OpenRouter API key.', latencyMs: 0 };
  }

  const start = performance.now();
  try {
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
    });

    const latency = Math.round(performance.now() - start);

    if (response.ok) {
      const data = await response.json();
      const limit = data.data?.limit ? `$${data.data.limit}` : 'Pay-as-you-go';
      const usage = data.data?.usage ? `$${Number(data.data.usage).toFixed(2)}` : '$0.00';
      return {
        valid: true,
        message: `Connected successfully! Latency: ${latency}ms (Usage: ${usage} / Limit: ${limit})`,
        latencyMs: latency,
      };
    } else {
      const err = await response.json().catch(() => ({}));
      return {
        valid: false,
        message: err.error?.message || `HTTP ${response.status}: Failed to authenticate API key.`,
        latencyMs: latency,
      };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Network error testing API key';
    return {
      valid: false,
      message,
      latencyMs: Math.round(performance.now() - start),
    };
  }
}

export async function fetchLiveOpenRouterModels(apiKey?: string): Promise<OpenRouterModelInfo[]> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    }

    const res = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      return CURATED_MODELS;
    }

    const data = await res.json();
    if (Array.isArray(data.data)) {
      return data.data.slice(0, 100).map((m: { id: string; name?: string; description?: string; context_length?: number; pricing?: { prompt?: string; completion?: string } }) => ({
        id: m.id,
        name: m.name || m.id,
        description: m.description,
        context_length: m.context_length,
        pricing: m.pricing,
      }));
    }
    return CURATED_MODELS;
  } catch {
    return CURATED_MODELS;
  }
}

interface StreamChatParams {
  apiKey: string;
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  abortSignal?: AbortSignal;
  onChunk: (chunk: string) => void;
}

export async function streamOpenRouterChat({
  apiKey,
  model,
  messages,
  temperature = 0.7,
  maxTokens = 2048,
  topP = 0.9,
  abortSignal,
  onChunk,
}: StreamChatParams): Promise<{ fullText: string; latencyMs: number }> {
  const start = performance.now();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    signal: abortSignal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://aistudio.google.com',
      'X-Title': 'Aura Persona Vault',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      stream: true,
    }),
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson.error?.message) {
        errorDetail = errorJson.error.message;
      }
    } catch {
      // fallback
    }
    throw new Error(`OpenRouter Error (${errorDetail})`);
  }

  if (!response.body) {
    throw new Error('ReadableStream not supported by browser response.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) continue;
      if (trimmed === 'data: [DONE]') continue;

      if (trimmed.startsWith('data: ')) {
        const jsonStr = trimmed.slice(6);
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            onChunk(fullText);
          }
        } catch {
          // ignore incomplete SSE chunk parse errors
        }
      }
    }
  }

  const latencyMs = Math.round(performance.now() - start);
  return { fullText, latencyMs };
}
