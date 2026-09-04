import 'server-only';
import path from 'node:path';
import { CRED_FILES, resolveCred } from '@/lib/creds';

const ENV_TXT = path.join(process.cwd(), '..', 'env.txt');
const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? 'gemini-flash-latest';

export type GeminiStatus = { configured: boolean; provider: 'gemini'; model: string; detail: string };

export function resolveGeminiKey(): string | undefined {
  return resolveCred('GEMINI_API_KEY', [ENV_TXT, CRED_FILES.agentsEnv, CRED_FILES.socialMedia]);
}

export function openPageGeminiStatus(): GeminiStatus {
  const configured = Boolean(resolveGeminiKey());
  return { configured, provider: 'gemini', model: DEFAULT_MODEL, detail: configured ? 'Gemini key available to OpenPage generation.' : 'Set GEMINI_API_KEY in env.txt, .env.local, or Railway variables.' };
}

export async function generateWithGemini(input: { system: string; prompt: string }): Promise<string> {
  const key = resolveGeminiKey();
  if (!key) throw new Error('GEMINI_API_KEY is not configured for OpenPage.');
  const models = [DEFAULT_MODEL, 'gemini-flash-lite-latest'].filter((model, index, all) => all.indexOf(model) === index);
  let lastError = 'Gemini returned no response.';
  for (const model of models) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: input.system }] },
        contents: [{ role: 'user', parts: [{ text: input.prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 5000, responseMimeType: 'application/json' },
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      lastError = `Gemini HTTP ${response.status}`;
      continue;
    }
    const body = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('')?.trim();
    if (text) return text;
    lastError = 'Gemini returned an empty response.';
  }
  throw new Error(lastError);
}
