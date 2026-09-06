/**
 * Value-first content planning primitives.
 *
 * This replaces the old "faceless automation" framing with one source packet
 * and a reviewable content ladder. It deliberately creates production briefs,
 * not claims that a video was rendered or published.
 */
export const VALUE_FIRST_LANES = [
  'humanized-faceless-video',
  'owned-audience-bridge',
  'seo-resource',
  'pinterest-distribution',
] as const;

export type ValueFirstLane = (typeof VALUE_FIRST_LANES)[number];

export type ValueFirstInput = {
  topic: string;
  audience: string;
  offer: string;
  evidence: string;
  brandVoice?: string;
  realImages?: string;
};

export type ValueFirstPlan = {
  system: 'value-first-owned-audience';
  sourcePacket: { topic: string; audience: string; offer: string; evidence: string; brandVoice: string; realImages: string };
  productionRule: string;
  video: { title: string; promise: string; hook: string; narration: string[]; shotList: string[]; audioDirection: string; cta: string };
  repurposing: Array<{ channel: string; deliverable: string; purpose: string }>;
  bridge: { page: string; optIn: string; emailSequence: string[]; affiliateRule: string };
  seo: { title: string; outline: string[]; proofRequirements: string[] };
  pinterest: string[];
  approvalGates: string[];
  nextActions: string[];
};

function sentence(value: string, fallback: string): string {
  const clean = value.trim().replace(/\s+/g, ' ');
  if (!clean) return fallback;
  return clean.charAt(0).toUpperCase() + clean.slice(1).replace(/[.!?]*$/, '.');
}

function topicLabel(value: string): string {
  return sentence(value, 'A useful travel decision').replace(/[.!?]$/, '');
}

/** Build a deterministic, readable plan without spending an AI request. */
export function buildValueFirstPlan(input: ValueFirstInput): ValueFirstPlan {
  const topic = topicLabel(input.topic);
  const audience = sentence(input.audience, 'Travelers who want practical guidance.');
  const offer = sentence(input.offer, 'A useful guide or trusted recommendation.');
  const evidence = sentence(input.evidence, 'Add first-hand observations, dated sources, and verified links before production.');
  const brandVoice = sentence(input.brandVoice ?? '', 'Editorial, practical, warm, and specific.');
  const realImages = sentence(input.realImages ?? '', 'Use owned, licensed, or clearly attributed travel images; do not use placeholder imagery.');

  return {
    system: 'value-first-owned-audience',
    sourcePacket: { topic, audience, offer, evidence, brandVoice, realImages },
    productionRule: 'Publish fewer, better pieces. Every claim needs evidence, every visual needs rights, and every draft needs human approval.',
    video: {
      title: `${topic}: the practical guide`,
      promise: `Help ${audience.toLowerCase()} make a better decision about ${topic.toLowerCase()}`,
      hook: `Before you plan ${topic.toLowerCase()}, here are the details that change the decision.`,
      narration: [
        `Start with the real problem: ${topic.toLowerCase()} is easy to oversimplify.`,
        'Give the viewer three useful distinctions, using examples instead of generic claims.',
        'Show what to do next, who the recommendation is for, and when it is not a fit.',
        `Close with one clear next step: ${offer.toLowerCase()}`,
      ],
      shotList: [
        'Open with an original establishing shot or owned/licensed destination image that proves the subject.',
        'Cut to a labeled map, itinerary, comparison, or on-screen source that supports the first claim.',
        'Use two or three distinct visual examples; avoid looping stock clips or recycled template footage.',
        'End with the bridge-page CTA and a visible affiliate disclosure where an affiliate relationship exists.',
      ],
      audioDirection: 'Use a natural, customized narration voice with human pacing. Synthetic voice is optional, must be authorized, and cannot replace original commentary.',
      cta: `Get the practical guide and sources for ${topic.toLowerCase()}.`,
    },
    repurposing: [
      { channel: 'YouTube', deliverable: '6–10 minute evidence-led explainer with chapters and sources.', purpose: 'Build search depth and trust.' },
      { channel: 'TikTok / Reels / Shorts', deliverable: 'Three distinct 30–60 second lessons from the same research packet.', purpose: 'Discovery without posting repetitive clones.' },
      { channel: 'Newsletter', deliverable: 'A concise takeaway, source links, and one useful recommendation.', purpose: 'Move attention into an owned relationship.' },
      { channel: 'Blog', deliverable: 'A reviewable guide, comparison, or buying decision page with internal links.', purpose: 'Create durable search traffic.' },
      { channel: 'Pinterest', deliverable: 'Three original pins: checklist, visual itinerary, and comparison card.', purpose: 'Send visual discovery to the owned resource.' },
    ],
    bridge: {
      page: `A focused opt-in page for ${topic.toLowerCase()} with the promise, proof, real imagery, and one primary action.`,
      optIn: `Send the ${topic.toLowerCase()} checklist, sources, and planning template.`,
      emailSequence: [
        'Welcome: deliver the promised resource and explain what was researched.',
        'Useful follow-up: teach one decision from the video with additional evidence.',
        'Recommendation: disclose the relationship, explain who the offer is for, and link only to the approved destination.',
      ],
      affiliateRule: 'Affiliate links stay behind a clear disclosure and a helpful explanation. No raw link dumping or pressure tactics.',
    },
    seo: {
      title: `${topic}: an evidence-led guide for better planning`,
      outline: ['What the traveler is deciding', 'Key options and trade-offs', 'Recommended route or shortlist', 'What to verify before booking', 'Sources, disclosure, and next step'],
      proofRequirements: [evidence, 'Add dates checked, source URLs, and first-hand or clearly attributed observations.', 'Keep claims, prices, availability, and recommendations reviewable before publication.'],
    },
    pinterest: [
      `Checklist pin: “Before you book ${topic.toLowerCase()}.”`,
      'Visual route pin: one clean, original itinerary or map connected to the owned guide.',
      'Comparison pin: make the trade-offs legible instead of promising a universal best choice.',
    ],
    approvalGates: [
      'Research and fact check complete.',
      'Image, footage, music, and voice rights confirmed.',
      'Brand voice, accessibility, and affiliate disclosure reviewed.',
      'Human approves the final script, creative brief, and destination links before publishing.',
    ],
    nextActions: [
      'Attach the real images, sources, and any first-hand notes to the source packet.',
      'Have the Content, SEO, Brand, and Affiliate agents review the draft through G-Brain.',
      'Create the bridge page and email sequence before sending discovery traffic.',
      'Queue platform versions only after the human approval gate is complete.',
    ],
  };
}
