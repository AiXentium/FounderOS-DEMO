export type VaultTemplate = {
  id: string;
  name: string;
  kind: 'frontend' | 'backend' | 'full-stack';
  description: string;
  styles: string[];
  components: string[];
  animation: string;
  source: string;
  sourceUrl?: string;
  previewUrl?: string;
  pageCount?: number;
  license?: string;
};

const FOUNDER_OS_TEMPLATES: VaultTemplate[] = [
  { id: 'editorial-studio', name: 'Editorial Studio', kind: 'full-stack', description: 'Premium founder or agency site with strong typography and calm conversion flow.', styles: ['Editorial', 'Minimal', 'High contrast'], components: ['Hero', 'Proof rail', 'Services grid', 'CTA'], animation: 'subtle scroll reveals', source: 'Founder OS + DESIGN.md' },
  { id: 'creator-launch', name: 'Creator Launch', kind: 'frontend', description: 'Media-rich creator, course, or personal brand launch system.', styles: ['Bold', 'Playful', 'Mobile-first'], components: ['Hero', 'Offer cards', 'Testimonials', 'FAQ'], animation: 'hover lift and staggered entrances', source: 'UI/UX Pro Max concepts' },
  { id: 'saas-command', name: 'SaaS Command', kind: 'full-stack', description: 'Product-led SaaS marketing shell with dashboard-ready information architecture.', styles: ['Structured', 'Technical', 'Conversion-led'], components: ['Navbar', 'Feature grid', 'Pricing', 'Signup CTA'], animation: 'controlled page transitions', source: 'Founder OS + component recipes' },
  { id: 'affiliate-magazine', name: 'Affiliate Magazine', kind: 'full-stack', description: 'SEO-friendly editorial catalog for products, experiences, and campaign links.', styles: ['Magazine', 'Trust-first', 'Content-rich'], components: ['Category nav', 'Product cards', 'Comparison table', 'Disclosure'], animation: 'image reveal and card hover', source: 'Affiliate Studio' },
  { id: 'agency-ops', name: 'Agency Operations', kind: 'backend', description: 'Client workspace foundation for projects, agents, tasks, approvals, and reporting.', styles: ['Operational', 'Dense', 'Accessible'], components: ['Workspace switcher', 'Agent roster', 'Task board', 'Reports'], animation: 'functional state transitions', source: 'Founder OS systems layer' },
];

const FREE_TEMPLATEG0_SOURCE = 'https://github.com/making530/freetemplatego-templates/tree/main';
const FREE_TEMPLATEG0_LICENSE = 'FreeTemplateGo · keep footer credit';

/**
 * Curated metadata for the 20-template FreeTemplateGo GitHub collection.
 * The vault stores links and design context, not the repository's large image
 * payload, so the app remains fast and the source remains auditable.
 */
type FreeTemplateTuple = [id: string, name: string, category: string, description: string, styles: string[], components: string[], pageCount: number, repositoryPath: string, previewSlug: string];

const FREE_TEMPLATEG0_CATALOG: FreeTemplateTuple[] = [
  ['auralens', 'AuraLens', 'Photography', 'Fine art photography studio with gallery-led storytelling and inquiry capture.', ['Editorial', 'Image-led', 'Minimal'], ['Hero', 'Gallery', 'Services', 'Portfolio', 'Contact'], 5, 'photography-auralens', 'photography-fine-1'],
  ['velomix', 'VeloMix', 'Fashion store', 'Fashion storefront with product discovery, shop detail, blog, and contact journeys.', ['Fashion', 'Grid-led', 'Conversion-ready'], ['Hero', 'Product grid', 'Shop', 'Blog', 'Contact'], 6, 'fashion-velomix', 'fashion-curated-2'],
  ['stratisvibe', 'StratisVibe', 'Business consulting', 'Strategic advisory site with services, pricing, insights, and lead capture.', ['Executive', 'Structured', 'Trust-first'], ['Hero', 'Services', 'Pricing', 'Blog', 'Contact'], 7, 'business-stratisvibe', 'consulting-digital-3'],
  ['curatrust', 'CuraTrust', 'Healthcare', 'Healthcare site with clinical services, doctor profiles, and trust-building content.', ['Clinical', 'Calm', 'Accessible'], ['Hero', 'Services', 'Doctors', 'Blog', 'Contact'], 7, 'healthcare-curatrust', 'medical-clinical-4'],
  ['zodiacvibe', 'ZodiacVibe', 'Astrology and tarot', 'Spiritual services site with editorial content, offerings, and personalized guidance.', ['Mystical', 'Editorial', 'Atmospheric'], ['Hero', 'Services', 'Horoscopes', 'Blog', 'Contact'], 6, 'astrology-zodiacvibe', 'creative-daily-5'],
  ['curavibe', 'CuraVibe', 'Medical clinic', 'Scandinavian-inspired clinic site with consultations, specialties, and physician trust signals.', ['Scandinavian', 'Quiet', 'Professional'], ['Hero', 'Services', 'Doctors', 'Appointments', 'Contact'], 7, 'clinic-curavibe', 'medical-medical-6'],
  ['nexussync', 'NexusSync', 'IT and technology', 'Technology services site for explaining infrastructure, capabilities, and delivery.', ['Technical', 'Confident', 'Systematic'], ['Hero', 'Capabilities', 'Service detail', 'Proof', 'Contact'], 5, 'tech-nexussync', 'software-api-7'],
  ['cognirise', 'CogniRise Academy', 'Education', 'Course and learning-path site with program discovery and enrollment-oriented structure.', ['Warm', 'Educational', 'Clear'], ['Hero', 'Courses', 'Learning path', 'Testimonials', 'Contact'], 5, 'education-cognirise', 'education-interactive-8'],
  ['aurachic', 'AuraChic Boutique', 'Fashion boutique', 'Boutique storefront with curated collections, product detail, and member offers.', ['Elegant', 'Fashion', 'Product-led'], ['Hero', 'Collections', 'Product detail', 'About', 'Contact'], 5, 'boutique-aurachic', 'fashion-casual-9'],
  ['vow-veil', 'Vow & Veil', 'Wedding and events', 'Luxury event planner site with services, portfolio, shop, blog, and inquiry paths.', ['Luxury', 'Romantic', 'Image-led'], ['Hero', 'Services', 'Portfolio', 'Shop', 'Blog', 'Contact'], 9, 'wedding-vowveil', 'wedding-bespoke-10'],
  ['devstash', 'DevStash', 'Digital marketplace', 'Digital product marketplace with product cards, detail pages, and a focused purchase path.', ['Product-led', 'Technical', 'Direct'], ['Hero', 'Product grid', 'Product detail', 'About', 'Contact'], 5, 'marketplace-devstash', 'consulting-premium-11'],
  ['nestato', 'Nestato', 'Real estate', 'Property platform with listings, property detail, agent profiles, and inquiry capture.', ['Premium', 'Spatial', 'Trust-first'], ['Hero', 'Properties', 'Property detail', 'Agents', 'Contact'], 7, 'realestate-nestato', 'real-estate-property-12'],
  ['homvila', 'Homvila', 'Architecture and interiors', 'Architecture studio site centered on portfolio work, services, and project credibility.', ['Architectural', 'Minimal', 'Gallery-led'], ['Hero', 'Services', 'Portfolio', 'Project detail', 'Contact'], 5, 'architecture-homvila', 'real-estate-architecture-13'],
  ['herday', 'HerDay', 'Spa and gifts', 'Experience and gift site with curated offerings, service detail, and simple contact flow.', ['Soft', 'Curated', 'Lifestyle'], ['Hero', 'Experiences', 'Gifts', 'About', 'Contact'], 5, 'spa-herday', 'spa-spa-14'],
  ['logifleet', 'LogiFleet', 'Logistics', 'Cross-border logistics site explaining routes, services, tracking, and operational trust.', ['Operational', 'Global', 'Clear'], ['Hero', 'Services', 'Tracking', 'Coverage', 'Contact'], 5, 'logistics-logifleet', 'logistics-freight-15'],
  ['gastronoir', 'Gastronoir', 'Restaurant and cafe', 'Restaurant site with menu, reservations, atmosphere, and location-driven conversion.', ['Atmospheric', 'Editorial', 'Hospitality'], ['Hero', 'Menu', 'About', 'Reservations', 'Contact'], 5, 'restaurant-gastronoir', 'restaurant-gourmet-16'],
  ['unitypath', 'UnityPath', 'Nonprofit and charity', 'Community nonprofit site with campaigns, events, impact storytelling, and participation CTAs.', ['Human', 'Mission-led', 'Community'], ['Hero', 'Campaigns', 'Events', 'Impact', 'Contact'], 5, 'nonprofit-unitypath', 'nonprofit-community-17'],
  ['aetherin', 'Aetherin', 'Creative agency', 'Dark creative studio site for showcasing brand engineering, portfolio work, and services.', ['Dark', 'Experimental', 'Portfolio-led'], ['Hero', 'Portfolio', 'Services', 'Case studies', 'Contact'], 4, 'agency-aetherin', 'consulting-product-18'],
  ['havenselect', 'HavenSelect', 'Luxury real estate', 'Premium property showcase focused on residences, details, and qualified inquiries.', ['Luxury', 'Quiet', 'Spatial'], ['Hero', 'Apartments', 'Property detail', 'About', 'Contact'], 4, 'luxuryrealestate-havenselect', 'real-estate-luxury-19'],
  ['florallure', 'Florallure', 'Florist', 'Botanical studio site with bouquet gallery, services, and occasion-based inquiries.', ['Botanical', 'Artisanal', 'Light'], ['Hero', 'Flowers', 'Services', 'Gallery', 'Contact'], 4, 'florist-florallure', 'home-services-bridal-20'],
];

const FREE_TEMPLATEG0_TEMPLATES: VaultTemplate[] = FREE_TEMPLATEG0_CATALOG.map(([id, name, category, description, styles, components, pageCount, repositoryPath, previewSlug]) => ({
  id: `freetemplatego-${id}`,
  name,
  kind: 'frontend',
  description,
  styles,
  components,
  animation: 'lightweight vanilla interactions',
  source: `FreeTemplateGo · ${category}`,
  sourceUrl: `${FREE_TEMPLATEG0_SOURCE}/${repositoryPath}`,
  previewUrl: `https://demo.freetemplatego.com/${previewSlug}/`,
  pageCount,
  license: FREE_TEMPLATEG0_LICENSE,
}));

export const TEMPLATE_VAULT: VaultTemplate[] = [...FOUNDER_OS_TEMPLATES, ...FREE_TEMPLATEG0_TEMPLATES];

export function templateById(id: string) { return TEMPLATE_VAULT.find((template) => template.id === id) ?? TEMPLATE_VAULT[0]; }
