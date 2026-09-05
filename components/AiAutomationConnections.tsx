'use client';

import { ExternalLink, Sparkles } from 'lucide-react';

const providers = [
  { name: 'Claude', detail: 'Open Claude in a secure browser tab. Use the API key only if you want server-side agents.', url: 'https://claude.ai/', key: 'AI_GATEWAY_API_KEY' },
  { name: 'ChatGPT', detail: 'Open ChatGPT in a secure browser tab. ChatGPT subscriptions and API access remain separate.', url: 'https://chatgpt.com/', key: 'OPENAI_API_KEY' },
  { name: 'Gemini / Google AI Studio', detail: 'Optional provider for AI workflows and agent tasks.', url: 'https://aistudio.google.com/app/apikey', key: 'GEMINI_API_KEY' },
  { name: 'Free / local AI', detail: 'Ollama, LM Studio, FreeLLM-compatible, or any OpenAI-compatible endpoint.', url: 'https://ollama.com/', key: 'AI_BASE_URL' },
];

export function AiAutomationConnections() {
  return <section className="mb-8"><div className="mb-1 flex items-center gap-2"><Sparkles className="h-4 w-4 text-os-accent" /><h2 className="text-sm font-bold uppercase tracking-widest text-os-muted">AI automation</h2></div><p className="mb-4 text-xs text-os-dim">Open the official provider site to sign in or create credentials. Business OS never asks for your provider password.</p><div className="grid gap-3 md:grid-cols-3">{providers.map((p) => <div key={p.name} className="rounded-xl border border-os-border bg-os-surface p-4"><div className="flex items-start justify-between"><div><h3 className="text-[13px] font-semibold">{p.name}</h3><p className="mt-1 text-[11px] leading-relaxed text-os-dim">{p.detail}</p></div><a href={p.url} target="_blank" rel="noreferrer" className="rounded-sm-t border border-os-border px-2 py-1 font-mono text-[9px] uppercase text-os-accent hover:bg-os-surface2">Open <ExternalLink className="ml-1 inline h-3 w-3" /></a></div><div className="mt-4 font-mono text-[10px] text-os-muted">Configure: {p.key}</div></div>)}</div></section>;
}
