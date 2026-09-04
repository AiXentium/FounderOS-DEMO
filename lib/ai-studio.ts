import { openPageGeminiStatus } from '@/lib/openpage-gemini';

export function aiMode(): 'demo' | 'openai-compatible' {
  return process.env.OPENAI_API_KEY || process.env.AI_BASE_URL || process.env.AI_GATEWAY_API_KEY || process.env.OMNIROUTE_BASE_URL || process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY || process.env.CEREBRAS_API_KEY || process.env.TOGETHER_API_KEY || process.env.MISTRAL_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.FIREWORKS_API_KEY || process.env.OLLAMA_BASE_URL ? 'openai-compatible' : 'demo';
}

export function aiProviderStatus() {
  const gemini = openPageGeminiStatus();
  return {
    mode: aiMode(),
    model: process.env.AI_MODEL ?? 'local-demo-design-engine',
    providers: {
      openai: { configured: Boolean(process.env.OPENAI_API_KEY), model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini' },
      gemini: { configured: gemini.configured, model: gemini.model, provider: 'Google AI Studio' },
    },
    canva: process.env.CANVA_CLIENT_ID ? 'configured' : 'optional connector not configured',
    capabilities: ['website generation', 'brand voice', 'design critique', 'SEO copy', 'social repurposing', 'image prompts', 'Canva-ready export'],
  };
}

export function generateDesignBrief(prompt: string, direction = 'editorial') {
  return {
    direction,
    title: prompt || 'A focused, conversion-ready digital home',
    sections: ['Hero promise', 'Proof and credibility', 'Offer breakdown', 'Process', 'FAQ', 'Focused CTA'],
    rules: ['One primary action per viewport', 'Use a distinct type scale', 'Keep copy specific and concrete', 'Use real proof before decorative effects'],
  };
}

export function critiquePage(title: string) {
  return {
    score: title.length >= 24 ? 88 : 64,
    strengths: ['Clear visual hierarchy', 'Strong whitespace rhythm', 'Single primary CTA'],
    improvements: title.length < 24 ? ['Make the promise more specific and outcome-focused'] : ['Add proof close to the first CTA', 'Test a shorter mobile headline'],
  };
}

export async function smartDesignBrief(prompt: string, direction = 'editorial') {
  if (aiMode() === 'demo') return { mode: 'demo' as const, brief: generateDesignBrief(prompt, direction) };
  try {
    const { chat } = await import('@/lib/connectors/llm');
    const result = await chat({ system: 'You are a senior web art director. Return concise JSON with title, sections (array), rules (array). Avoid generic startup language.', messages: [{ role: 'user', content: `Create a professional website brief. Direction: ${direction}. Request: ${prompt}` }] });
    return { mode: 'live' as const, brief: JSON.parse(result.text) };
  } catch { return { mode: 'demo' as const, brief: generateDesignBrief(prompt, direction) }; }
}
