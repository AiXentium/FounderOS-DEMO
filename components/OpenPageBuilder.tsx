"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Brain,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Github,
  Grid2X2,
  Layers3,
  Maximize2,
  Map as MapIcon,
  Monitor,
  PenLine,
  Play,
  Plus,
  Save,
  Smartphone,
  Sparkles,
  Tablet,
  Upload,
  Wand2,
  Minimize2,
  X,
} from "lucide-react";
import {
  defaultOpenPageDocument,
  type OpenPageBlock,
  type OpenPageDocument,
} from "@/lib/openpage";
import type { ScrapedSiteAnalysis } from "@/lib/openpage-scraper";

type Project = {
  id: string;
  name: string;
  prompt?: string;
  updatedAt?: string;
  document: OpenPageDocument;
};
type SiteBlueprintPage = {
  path: string;
  title: string;
  role: string;
  sections: string[];
  imageUrls: string[];
};
type SiteBlueprint = {
  siteName: string;
  sourceUrl: string;
  direction: string;
  principles: string[];
  pages: SiteBlueprintPage[];
  realAssets: string[];
};
type SiteDraft = {
  path: string;
  title: string;
  imageCount: number;
  document: OpenPageDocument;
};
type SiteTreeNode = {
  id: string;
  wpId?: number;
  kind: "folder" | "page" | "post";
  title: string;
  slug?: string;
  url?: string;
  status?: string;
  children?: SiteTreeNode[];
};
type Asset = {
  name: string;
  storageName: string;
  folder: string;
  size: number;
  url: string;
};
type BrainResult = { title: string; snippet: string; source?: string };
type AiStatus = {
  configured: boolean;
  provider: string;
  model: string;
  detail: string;
};
type OpenPageView = "dashboard" | "editor" | "settings";
type OpenPagePreviewCache = {
  document: OpenPageDocument;
  brief: string;
  analysis?: ScrapedSiteAnalysis;
  savedAt: string;
};
type CopilotMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const OPENPAGE_PREVIEW_CACHE_KEY = "business-os.openpage.latest-preview";
const OPENPAGE_SITE_DRAFTS_KEY = "business-os.openpage.site-drafts";

const inputClass =
  "w-full rounded-sm-t border border-os-border bg-os-surface2 px-3 py-2 text-sm text-os-text outline-none focus:border-os-accent";
const buttonClass =
  "inline-flex items-center gap-2 rounded-sm-t border border-os-border px-3 py-2 font-mono text-[10px] uppercase tracking-[.12em] text-os-text transition hover:border-os-accent hover:text-os-accent disabled:cursor-not-allowed disabled:opacity-40";

function value(block: OpenPageBlock, key: string, fallback = "") {
  return typeof block.props[key] === "string"
    ? String(block.props[key])
    : fallback;
}
function setProp(
  block: OpenPageBlock,
  key: string,
  next: unknown,
): OpenPageBlock {
  return { ...block, props: { ...block.props, [key]: next } };
}

function OpenPageSettings({ ai }: { ai: AiStatus | null }) {
  const [section, setSection] = useState<"general" | "seo" | "api">("general");
  const [siteName, setSiteName] = useState("Let's Talk Miles & Travel");
  const [description, setDescription] = useState(
    "A structured OpenPage workspace for thoughtful travel content and conversion-ready experiences.",
  );
  const [favicon, setFavicon] = useState("");
  const [language, setLanguage] = useState("English");
  const [status, setStatus] = useState("Settings are ready to customize.");
  const tabs = [
    { id: "general", label: "General" },
    { id: "seo", label: "SEO" },
    { id: "api", label: "API Keys" },
  ] as const;
  return (
    <div className="-mx-4 -my-5 min-h-[calc(100vh-4rem)] bg-[#08090a] text-[#f4f4f5] md:-mx-6">
      <header className="border-b border-white/10 bg-[#0b0c0d]">
        <div className="flex w-full items-center gap-7 px-5 py-3 text-sm">
          <a
            href="/openpage"
            className="mr-2 flex items-center gap-2 font-semibold tracking-tight"
          >
            <span className="h-3.5 w-3.5 rounded-full bg-[#84cc72] shadow-[0_0_18px_rgba(132,204,114,.35)]" />
            OpenPage
          </a>
          <nav
            className="flex items-center gap-5 text-[#a1a1aa]"
            aria-label="OpenPage navigation"
          >
            <a
              href="/openpage"
              className="flex items-center gap-2 pb-2 hover:text-white"
            >
              <Grid2X2 className="h-3.5 w-3.5" />
              Dashboard
            </a>
            <a
              href="/openpage/editor"
              className="flex items-center gap-2 pb-2 hover:text-white"
            >
              <PenLine className="h-3.5 w-3.5" />
              Editor
            </a>
          </nav>
          <a
            href="https://github.com/buildingopen/openpage"
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs text-[#a1a1aa] hover:border-white/30 hover:text-white"
          >
            <Github className="h-3.5 w-3.5" />
            GitHub
          </a>
        </div>
      </header>
      <main
        id="openpage-settings"
        className="grid w-full gap-8 px-5 pb-20 pt-8 md:grid-cols-[180px_minmax(0,1fr)] md:pt-12"
      >
        <aside className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSection(tab.id)}
              className={`flex w-full items-center rounded-xl px-4 py-2.5 text-left text-sm transition ${section === tab.id ? "bg-[#242127] text-white" : "text-[#71717a] hover:text-white"}`}
            >
              {tab.label}
            </button>
          ))}
        </aside>
        <section className="w-full">
          <h1 className="text-2xl font-semibold tracking-[-.03em]">
            {section === "general"
              ? "General"
              : section === "seo"
                ? "SEO"
                : "API Keys"}
          </h1>
          {section === "general" && (
            <div className="mt-8 space-y-6">
              <label className="block text-sm">
                <span className="mb-2 block text-[#71717a]">Site Name</span>
                <input
                  aria-label="Site Name"
                  value={siteName}
                  onChange={(event) => setSiteName(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#19191b] px-3 py-3 text-sm outline-none focus:border-[#84cc72]"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-2 block text-[#71717a]">
                  Site Description
                </span>
                <textarea
                  aria-label="Site Description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="min-h-28 w-full rounded-xl border border-white/10 bg-[#19191b] px-3 py-3 text-sm leading-relaxed outline-none focus:border-[#84cc72]"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-2 block text-[#71717a]">Favicon URL</span>
                <input
                  aria-label="Favicon URL"
                  value={favicon}
                  onChange={(event) => setFavicon(event.target.value)}
                  placeholder="https://example.com/favicon.ico"
                  className="w-full rounded-xl border border-white/10 bg-[#19191b] px-3 py-3 text-sm outline-none focus:border-[#84cc72]"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-2 block text-[#71717a]">Language</span>
                <select
                  aria-label="Language"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#19191b] px-3 py-3 text-sm outline-none focus:border-[#84cc72]"
                >
                  <option>English</option>
                  <option>German</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </label>
              <button
                onClick={() =>
                  setStatus(
                    "General settings saved for this OpenPage workspace.",
                  )
                }
                className="rounded-xl bg-[#84cc72] px-4 py-2.5 text-sm font-semibold text-[#10200e] hover:bg-[#9ae68a]"
              >
                Save settings
              </button>
            </div>
          )}
          {section === "seo" && (
            <div className="mt-8 space-y-5">
              <div className="rounded-xl border border-white/10 bg-[#101112] p-5">
                <div className="text-sm font-semibold">Search appearance</div>
                <p className="mt-2 text-sm leading-relaxed text-[#71717a]">
                  Set the title, description, and social image direction that
                  exported OpenPage pages should use.
                </p>
              </div>
              <label className="block text-sm">
                <span className="mb-2 block text-[#71717a]">
                  Default page title
                </span>
                <input
                  aria-label="Default page title"
                  defaultValue={siteName}
                  className="w-full rounded-xl border border-white/10 bg-[#19191b] px-3 py-3 text-sm outline-none focus:border-[#84cc72]"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-2 block text-[#71717a]">
                  Default meta description
                </span>
                <textarea
                  aria-label="Default meta description"
                  defaultValue={description}
                  className="min-h-24 w-full rounded-xl border border-white/10 bg-[#19191b] px-3 py-3 text-sm leading-relaxed outline-none focus:border-[#84cc72]"
                />
              </label>
              <button
                onClick={() =>
                  setStatus("SEO settings saved for this OpenPage workspace.")
                }
                className="rounded-xl bg-[#84cc72] px-4 py-2.5 text-sm font-semibold text-[#10200e] hover:bg-[#9ae68a]"
              >
                Save SEO settings
              </button>
            </div>
          )}
          {section === "api" && (
            <div className="mt-8 space-y-5">
              <div className="rounded-xl border border-[#84cc72]/30 bg-[#0d120e] p-5">
                <div className="text-sm font-semibold">Gemini generation</div>
                <p className="mt-2 text-sm leading-relaxed text-[#a1a1aa]">
                  OpenPage uses Gemini server-side for live page generation.
                  Your key stays in the Business OS environment and is never
                  placed in exported HTML.
                </p>
                <div className="mt-4 text-xs uppercase tracking-wide text-[#84cc72]">
                  {ai?.configured
                    ? `Connected · ${ai.model}`
                    : "Key not configured"}
                </div>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex rounded-xl border border-white/15 px-4 py-2.5 text-sm text-[#d4d4d8] hover:border-white/30"
                >
                  Manage Gemini key
                </a>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#101112] p-5">
                <div className="text-sm font-semibold">Separate workspaces</div>
                <p className="mt-2 text-sm leading-relaxed text-[#71717a]">
                  OpenPage drafts live in the{" "}
                  <code className="text-[#84cc72]">openpage</code> workspace and
                  its G-Brain memory namespace.
                </p>
              </div>
            </div>
          )}
          <p className="mt-8 text-xs text-[#71717a]" role="status">
            {status}
          </p>
        </section>
      </main>
    </div>
  );
}

function Canvas({ document }: { document: OpenPageDocument }) {
  const hero = document.blocks.find((item) => item.type === "hero");
  const nav = document.blocks.find((item) => item.type === "navbar");
  const features = document.blocks.find((item) => item.type === "features");
  const content = document.blocks.find((item) => item.type === "content");
  const stats = document.blocks.find((item) => item.type === "stats");
  const cta = document.blocks.find((item) => item.type === "cta");
  const footer = document.blocks.find((item) => item.type === "footer");
  const t = document.theme;
  const items = Array.isArray(features?.props.items)
    ? (features?.props.items as string[])
    : [];
  const statItems = Array.isArray(stats?.props.items)
    ? (stats?.props.items as Array<{ value?: string; label?: string }>)
    : [];
  return (
    <div
      className="overflow-hidden"
      style={{
        background: t.background,
        color: t.text,
        fontFamily: t.bodyFont,
      }}
    >
      <div className="mx-auto max-w-5xl px-7 py-6">
        {nav && (
          <div className="flex flex-wrap items-center justify-between gap-4 pb-8 text-[10px] font-bold uppercase tracking-[.16em]">
            <div className="flex items-center gap-3">
              {typeof nav.props.logoUrl === "string" && nav.props.logoUrl && (
                <img
                  src={nav.props.logoUrl}
                  alt={value(nav, "brand", document.name)}
                  className="h-9 w-auto max-w-28 object-contain"
                />
              )}
              <span>{value(nav, "brand", document.name)}</span>
            </div>
            <div className="flex flex-wrap gap-4 opacity-70">
              {(Array.isArray(nav.props.links)
                ? (nav.props.links as string[])
                : []
              ).map((link) => (
                <span key={link}>{link}</span>
              ))}
            </div>
          </div>
        )}
        {hero && (
          <section className="pb-20 pt-14">
            <div
              className="mb-5 text-[11px] font-bold uppercase tracking-[.2em]"
              style={{ color: t.accent }}
            >
              {value(hero, "eyebrow", "OPENPAGE DRAFT")}
            </div>
            <h1
              className="max-w-4xl text-6xl font-medium leading-[.93] tracking-[-.06em] md:text-8xl"
              style={{ fontFamily: t.displayFont }}
            >
              {value(hero, "headline", document.name)}
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed opacity-65">
              {value(hero, "subheadline", document.description)}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <span
                className="rounded-full px-5 py-3 text-xs font-bold text-white"
                style={{ background: t.accent }}
              >
                {value(hero, "cta", "Explore")}
              </span>
              <span className="text-xs font-bold">
                {value(hero, "secondaryCta", "Read more")} ↗
              </span>
            </div>
          </section>
        )}
        {features && (
          <section
            className="border-t py-12"
            style={{ borderColor: `${t.text}22` }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-[.18em]"
              style={{ color: t.accent }}
            >
              OPENPAGE BLOCK · {features.label}
            </div>
            <h2
              className="mt-3 max-w-2xl text-4xl font-medium tracking-[-.04em] md:text-5xl"
              style={{ fontFamily: t.displayFont }}
            >
              {value(features, "heading", "Make the page useful.")}
            </h2>
            <div className="mt-7 grid gap-3 md:grid-cols-3">
              {items.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="min-h-36 p-5"
                  style={{ background: t.surface, borderRadius: t.radius }}
                >
                  <span className="text-xs" style={{ color: t.accent }}>
                    0{index + 1}
                  </span>
                  <h3 className="mt-8 text-lg font-bold leading-tight">
                    {item}
                  </h3>
                  <p className="mt-2 text-xs opacity-60">
                    Grounded in the brief, ready for an agent to refine.
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
        {content && (
          <section
            className="max-w-3xl border-t py-12"
            style={{ borderColor: `${t.text}22` }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-[.18em]"
              style={{ color: t.accent }}
            >
              {value(content, "eyebrow", "EDITORIAL NOTE")}
            </div>
            <h2
              className="mt-3 text-4xl font-medium tracking-[-.04em] md:text-5xl"
              style={{ fontFamily: t.displayFont }}
            >
              {value(content, "heading", "A page with a point of view.")}
            </h2>
            <p className="mt-6 text-lg leading-relaxed opacity-65">
              {value(content, "body", document.description)}
            </p>
          </section>
        )}
        {document.blocks
          .filter((item) => item.type === "image")
          .map((image) => (
            <figure key={image.id} className="border-t py-10" style={{ borderColor: `${t.text}22` }}>
              {typeof image.props.src === "string" && image.props.src && (
                <img
                  src={image.props.src}
                  alt={value(image, "alt", image.label)}
                  className="max-h-[560px] w-full object-cover"
                  style={{ borderRadius: t.radius }}
                />
              )}
              {value(image, "caption") && <figcaption className="mt-3 text-xs opacity-60">{value(image, "caption")}</figcaption>}
            </figure>
          ))}
        {stats && (
          <div
            className="grid gap-5 border-y py-7 md:grid-cols-3"
            style={{ borderColor: `${t.text}22` }}
          >
            {statItems.map((item, index) => (
              <div key={`${item.label}-${index}`}>
                <div className="text-5xl" style={{ fontFamily: t.displayFont }}>
                  {item.value ?? "—"}
                </div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-[.14em] opacity-60">
                  {item.label ?? "proof point"}
                </div>
              </div>
            ))}
          </div>
        )}
        {cta && (
          <section
            className="my-10 p-8 md:p-12"
            style={{
              background: t.text,
              color: t.background,
              borderRadius: t.radius,
            }}
          >
            <h2
              className="max-w-xl text-4xl font-medium tracking-[-.04em]"
              style={{ fontFamily: t.displayFont }}
            >
              {value(cta, "heading", "Ready for the next draft?")}
            </h2>
            <p className="mt-4 max-w-lg opacity-70">
              {value(cta, "body", "Review the work before publishing.")}
            </p>
            <span
              className="mt-7 inline-flex rounded-full px-5 py-3 text-xs font-bold text-white"
              style={{ background: t.accent }}
            >
              {value(cta, "cta", "Continue")} ↗
            </span>
          </section>
        )}
        {footer && (
          <div className="pt-5 text-[10px] font-bold uppercase tracking-[.18em] opacity-50">
            {value(footer, "text", document.name)}
          </div>
        )}
      </div>
    </div>
  );
}

function SiteTree({
  nodes,
  open,
  onToggle,
  onSelect,
}: {
  nodes: SiteTreeNode[];
  open: Record<string, boolean>;
  onToggle: (id: string) => void;
  onSelect: (node: SiteTreeNode) => void;
}) {
  return (
    <div className="space-y-1">
      {nodes.map((node) => {
        const hasChildren = Boolean(node.children?.length);
        const expanded = open[node.id] ?? false;
        return (
          <div key={node.id}>
            <div className="flex items-center gap-1">
              {hasChildren ? (
                <button
                  type="button"
                  aria-label={`${expanded ? "Collapse" : "Expand"} ${node.title}`}
                  onClick={() => onToggle(node.id)}
                  className="rounded p-1 text-[#71717a] hover:text-white"
                >
                  {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
              ) : <span className="w-5" />}
              <button
                type="button"
                onClick={() => (hasChildren ? onToggle(node.id) : onSelect(node))}
                className={`min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-left text-xs ${node.kind === "folder" ? "font-semibold text-[#e4e4e7]" : "text-[#a1a1aa] hover:bg-[#19191b] hover:text-white"}`}
                title={node.url ?? node.title}
              >
                <span className="mr-1.5 text-[10px] text-[#84cc72]">{node.kind === "folder" ? "▾" : node.kind === "post" ? "◌" : "□"}</span>
                {node.title}
              </button>
              {node.kind !== "folder" && <span className="text-[9px] uppercase text-[#52525b]">{node.status}</span>}
            </div>
            {hasChildren && expanded && (
              <div className="ml-3 border-l border-white/10 pl-2">
                <SiteTree nodes={node.children ?? []} open={open} onToggle={onToggle} onSelect={onSelect} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function OpenPageBuilder({
  initialView = "dashboard",
}: {
  initialView?: OpenPageView;
}) {
  const templates = [
    {
      name: "Portfolio",
      icon: "▣",
      description: "Showcase your work and skills",
      blocks: 7,
      brief:
        "Create a polished portfolio site with a strong introduction, selected work, proof, and a clear contact call to action.",
    },
    {
      name: "Restaurant",
      icon: "⚒",
      description: "Menu, reservations, and ambiance",
      blocks: 7,
      brief:
        "Create an elegant restaurant website with a menu, signature dishes, atmosphere, location, reservations, and a clear booking call to action.",
    },
    {
      name: "Agency",
      icon: "▥",
      description: "Services, case studies, and team",
      blocks: 8,
      brief:
        "Create a conversion-ready agency website with services, case studies, team credibility, process, and a strong consultation call to action.",
    },
    {
      name: "Blog",
      icon: "▤",
      description: "Articles, topics, and subscribers",
      blocks: 7,
      brief:
        "Create a thoughtful editorial blog with a clear point of view, article categories, featured stories, and a newsletter signup.",
    },
  ] as const;
  const [document, setDocument] = useState<OpenPageDocument>(() =>
    defaultOpenPageDocument(),
  );
  const [brief, setBrief] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("");
  const [brain, setBrain] = useState<BrainResult[]>([]);
  const [status, setStatus] = useState("Starter loaded · unsaved");
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState<AiStatus | null>(null);
  const [view, setView] = useState<OpenPageView>(initialView);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">(
    "desktop",
  );
  const [showJson, setShowJson] = useState(false);
  const [sourceUrl, setSourceUrl] = useState(
    "https://letstalkmilesandtravel.com/",
  );
  const [analysis, setAnalysis] = useState<ScrapedSiteAnalysis | null>(null);
  const [blueprint, setBlueprint] = useState<SiteBlueprint | null>(null);
  const [siteDrafts, setSiteDrafts] = useState<SiteDraft[]>([]);
  const [blueprintApproved, setBlueprintApproved] = useState(false);
  const [selectedScrapedPath, setSelectedScrapedPath] = useState("");
  const [templateSaved, setTemplateSaved] = useState(false);
  const [sourcePreviewExpanded, setSourcePreviewExpanded] = useState(false);
  const [siteTree, setSiteTree] = useState<SiteTreeNode[]>([]);
  const [siteTreeOpen, setSiteTreeOpen] = useState<Record<string, boolean>>({});
  const [siteTreeStatus, setSiteTreeStatus] = useState("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetStatus, setAssetStatus] = useState("");
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "I’m connected to this OpenPage draft. Ask me to change the copy, layout, style, or create another version. I’ll update the live preview; you approve it with Save to vault.",
    },
  ]);

  const currentBlock = useMemo(
    () =>
      document.blocks.find((item) => item.id === selectedBlock) ??
      document.blocks[0],
    [document.blocks, selectedBlock],
  );
  useEffect(() => {
    void loadProjects();
    void loadBrain("OpenPage");
    void loadAssets();
    if (initialView === "editor") void loadSiteTree();
    if (initialView !== "editor") return;
    try {
      const cached = globalThis.localStorage.getItem(
        OPENPAGE_PREVIEW_CACHE_KEY,
      );
      if (!cached) return;
      const preview = JSON.parse(cached) as Partial<OpenPagePreviewCache>;
      if (preview.document && Array.isArray(preview.document.blocks)) {
        setDocument(preview.document);
        setBrief(preview.brief ?? "");
        setAnalysis(preview.analysis ?? null);
        setStatus(`Loaded latest generated preview · ${preview.document.name}`);
      }
    } catch {
      globalThis.localStorage.removeItem(OPENPAGE_PREVIEW_CACHE_KEY);
    }
  }, [initialView]);
  useEffect(() => {
    if (view === "dashboard") setBrief("");
  }, [view]);

  async function loadProjects() {
    const response = await fetch("/api/openpage");
    if (response.ok) {
      const payload = await response.json();
      setProjects(payload.projects ?? []);
      setAi(payload.ai ?? null);
    }
  }
  async function loadAssets() {
    const response = await fetch("/api/assets");
    if (response.ok) setAssets((await response.json()).assets ?? []);
  }
  async function loadSiteTree() {
    setSiteTreeStatus("Connecting to WordPress and reading the complete page tree…");
    const response = await fetch("/api/openpage?action=site-pages");
    const payload = (await response.json().catch(() => null)) as { ok?: boolean; nodes?: SiteTreeNode[]; counts?: { pages: number; posts: number }; error?: string } | null;
    if (payload?.ok && payload.nodes) {
      setSiteTree(payload.nodes);
      setSiteTreeOpen({ "wordpress-pages": true, "wordpress-posts": true });
      setSiteTreeStatus(`${payload.counts?.pages ?? 0} pages · ${payload.counts?.posts ?? 0} posts connected`);
    } else setSiteTreeStatus(`WordPress tree unavailable: ${payload?.error ?? "connection failed"}`);
  }
  async function openSiteNode(node: SiteTreeNode) {
    if (!node.wpId || node.kind === "folder") return;
    setBusy(true);
    setStatus(`Loading ${node.kind} into the OpenPage editor…`);
    const response = await fetch(`/api/openpage?action=site-page&kind=${node.kind}&id=${node.wpId}`);
    const payload = (await response.json().catch(() => null)) as { ok?: boolean; document?: OpenPageDocument; error?: string } | null;
    if (payload?.ok && payload.document) {
      setDocument(payload.document);
      setSelectedProject("");
      setBrief(`Improve the WordPress ${node.kind} “${node.title}” while preserving its brand and content.`);
      setStatus(`${node.title} loaded · local OpenPage draft · WordPress unchanged`);
    } else setStatus(`Could not load ${node.title}: ${payload?.error ?? "connection failed"}`);
    setBusy(false);
  }
  function toggleSiteTree(id: string) {
    setSiteTreeOpen((current) => ({ ...current, [id]: !current[id] }));
  }
  async function uploadAssets(fileList: FileList | null) {
    if (!fileList?.length) return;
    setBusy(true);
    setAssetStatus(`Uploading ${fileList.length} asset${fileList.length === 1 ? "" : "s"}…`);
    for (const file of Array.from(fileList)) {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "openpage");
      const response = await fetch("/api/assets", { method: "POST", body: form });
      if (!response.ok) setAssetStatus(`Upload failed for ${file.name}`);
    }
    await loadAssets();
    setAssetStatus("Assets ready in the OpenPage library.");
    setBusy(false);
  }
  function addImageBlock(asset: Asset) {
    const next: OpenPageBlock = { id: crypto.randomUUID(), type: "image", label: asset.name, props: { src: asset.url, alt: asset.name.replace(/\.[^.]+$/, ""), caption: "" } };
    setDocument((current) => ({ ...current, blocks: [...current.blocks, next], updatedAt: new Date().toISOString() }));
    setSelectedBlock(next.id);
    setStatus(`${asset.name} added to the live preview`);
  }
  function setAsLogo(asset: Asset) {
    const nav = document.blocks.find((item) => item.type === "navbar");
    if (!nav) return;
    replaceBlock(setProp(nav, "logoUrl", asset.url));
    setSelectedBlock(nav.id);
    setStatus(`${asset.name} set as the site logo in the live preview`);
  }
  async function loadBrain(query: string) {
    const response = await fetch(
      `/api/openpage?action=context&query=${encodeURIComponent(query)}`,
    );
    if (response.ok) setBrain((await response.json()).results ?? []);
  }
  function replaceBlock(next: OpenPageBlock) {
    setDocument((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      blocks: current.blocks.map((item) => (item.id === next.id ? next : item)),
    }));
  }
  function moveBlock(direction: -1 | 1) {
    if (!currentBlock) return;
    setDocument((current) => {
      const index = current.blocks.findIndex(
        (item) => item.id === currentBlock.id,
      );
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.blocks.length)
        return current;
      const blocks = [...current.blocks];
      [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
      return { ...current, blocks };
    });
  }
  function removeBlock() {
    if (!currentBlock || document.blocks.length <= 1) return;
    setDocument((current) => ({
      ...current,
      blocks: current.blocks.filter((item) => item.id !== currentBlock.id),
    }));
    setSelectedBlock("");
  }
  function addBlock() {
    const next: OpenPageBlock = {
      id: crypto.randomUUID(),
      type: "content",
      label: "New content",
      props: {
        eyebrow: "NEW BLOCK",
        heading: "A new idea to shape.",
        body: "Ask an agent to develop this section from the shared brief.",
      },
    };
    setDocument((current) => ({
      ...current,
      blocks: [...current.blocks, next],
    }));
    setSelectedBlock(next.id);
  }
  async function generate(nextBrief = brief, nextName = document.name) {
    setBusy(true);
    setStatus("Asking the live model for a complete OpenPage redesign…");
    try {
      const response = await fetch("/api/openpage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          prompt: nextBrief,
          name: nextName,
          analysis,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        document?: OpenPageDocument;
        source?: string;
        warning?: string;
        error?: string;
      } | null;
      if (payload?.ok && payload.document) {
        setDocument(payload.document);
        try {
          globalThis.localStorage.setItem(
            OPENPAGE_PREVIEW_CACHE_KEY,
            JSON.stringify({
              document: payload.document,
              brief: nextBrief,
              analysis: analysis ?? undefined,
              savedAt: new Date().toISOString(),
            } satisfies OpenPagePreviewCache),
          );
        } catch {
          /* Preview still works in the current view if storage is unavailable. */
        }
        setStatus(
          payload.source === "brand-preserving-fallback"
            ? `Redesign preview ready · ${payload.warning ?? "built from the scanned brand and page content"}`
            : analysis
              ? "Redesign preview ready · brand and source content preserved · review before saving"
              : "Live AI preview ready · review before saving",
        );
        setView("editor");
      } else
        setStatus(
          `Redesign unavailable: ${payload?.error ?? "the server returned no usable page"} · scan remains available`,
        );
    } catch (error) {
      setStatus(
        `Redesign unavailable: ${error instanceof Error ? error.message : "network error"} · scan remains available`,
      );
    } finally {
      setBusy(false);
    }
  }
  async function askCopilot(nextPrompt = copilotInput) {
    const prompt = nextPrompt.trim();
    if (!prompt || busy) return;
    setCopilotInput("");
    setCopilotMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", content: prompt },
    ]);
    setBusy(true);
    setStatus("OpenPage AI is applying your requested change…");
    try {
      const response = await fetch("/api/openpage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "edit", prompt, document, analysis }),
      });
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        document?: OpenPageDocument;
        message?: string;
        error?: string;
      } | null;
      if (payload?.ok && payload.document) {
        setDocument(payload.document);
        try {
          globalThis.localStorage.setItem(
            OPENPAGE_PREVIEW_CACHE_KEY,
            JSON.stringify({
              document: payload.document,
              brief,
              analysis: analysis ?? undefined,
              savedAt: new Date().toISOString(),
            } satisfies OpenPagePreviewCache),
          );
        } catch {
          /* The live editor remains usable if storage is unavailable. */
        }
        setCopilotMessages((current) => [
          ...current,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: `${payload.message ?? "Change applied."}\n\nThe live preview is updated. Nothing is published or saved to the vault until you approve it.`,
          },
        ]);
        setStatus("AI edit applied · review the live preview before saving");
      } else {
        setCopilotMessages((current) => [
          ...current,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: `I couldn’t apply that change: ${payload?.error ?? "the model returned no usable document"}`,
          },
        ]);
        setStatus(
          `AI edit unavailable: ${payload?.error ?? "the server returned no usable page"}`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "network error";
      setCopilotMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: `I couldn’t reach the live editor service: ${message}`,
        },
      ]);
      setStatus(`AI edit unavailable: ${message}`);
    } finally {
      setBusy(false);
    }
  }
  async function scanWebsite() {
    setBusy(true);
    setTemplateSaved(false);
    setStatus("Scanning public pages, brand styles, and layout signals…");
    try {
      const response = await fetch("/api/openpage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "scrape", url: sourceUrl, maxPages: 12 }),
      });
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        analysis?: ScrapedSiteAnalysis;
        error?: string;
      } | null;
      if (payload?.ok && payload.analysis) {
        const nextAnalysis = payload.analysis;
        setAnalysis(nextAnalysis);
        setBlueprint(null);
        setSiteDrafts([]);
        setBlueprintApproved(false);
        setSelectedScrapedPath(nextAnalysis.pages[0]?.path ?? "");
        setStatus(`Scan complete · ${nextAnalysis.pagesScanned} pages analyzed · preparing the whole-site visual blueprint…`);
        await createBlueprint(nextAnalysis);
      } else
        setStatus(
          `Scan failed: ${payload?.error ?? "the server returned no analysis"}`,
        );
    } catch (error) {
      setStatus(
        `Scan failed: ${error instanceof Error ? error.message : "network error"}`,
      );
    } finally {
      setBusy(false);
    }
  }
  async function createBlueprint(nextAnalysis = analysis) {
    if (!nextAnalysis) return;
    try {
      const response = await fetch("/api/openpage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "blueprint", analysis: nextAnalysis }),
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; blueprint?: SiteBlueprint; error?: string } | null;
      if (payload?.ok && payload.blueprint) {
        setBlueprint(payload.blueprint);
        setStatus(`Blueprint ready · ${payload.blueprint.pages.length} real site pages mapped · review before approval`);
      } else setStatus(`Blueprint unavailable: ${payload?.error ?? "the server returned no blueprint"}`);
    } catch (error) {
      setStatus(`Blueprint unavailable: ${error instanceof Error ? error.message : "network error"}`);
    }
  }
  async function approveBlueprint() {
    if (!analysis || !blueprint) return;
    setBusy(true);
    setStatus("Blueprint approved · preparing a reviewable draft for every scanned page…");
    try {
      const response = await fetch("/api/openpage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "generate-site", analysis, blueprint }),
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; documents?: SiteDraft[]; error?: string } | null;
      if (payload?.ok && payload.documents?.length) {
        setSiteDrafts(payload.documents);
        setBlueprintApproved(true);
        try { globalThis.localStorage.setItem(OPENPAGE_SITE_DRAFTS_KEY, JSON.stringify(payload.documents)); } catch { /* Drafts remain available in this session. */ }
        setStatus(`Full-site draft ready · ${payload.documents.length} real pages prepared · nothing published`);
      } else setStatus(`Full-site draft unavailable: ${payload?.error ?? "the server returned no pages"}`);
    } catch (error) {
      setStatus(`Full-site draft unavailable: ${error instanceof Error ? error.message : "network error"}`);
    } finally {
      setBusy(false);
    }
  }
  function openSiteDraft(draft: SiteDraft) {
    setDocument(draft.document);
    setBrief(`Refine the real source page ${draft.path} while preserving its approved blueprint and brand identity.`);
    setSelectedProject("");
    setSelectedBlock("");
    setStatus(`${draft.title} loaded · full-site draft · WordPress unchanged`);
    try {
      globalThis.localStorage.setItem(OPENPAGE_PREVIEW_CACHE_KEY, JSON.stringify({ document: draft.document, brief: `Refine the real source page ${draft.path}.`, analysis: analysis ?? undefined, savedAt: new Date().toISOString() } satisfies OpenPagePreviewCache));
    } catch { /* The current editor still opens if storage is unavailable. */ }
    setView("editor");
  }
  async function createRedesign() {
    if (!analysis) return;
    const redesignBrief = `Create a complete cleaner replacement for the scanned website. Use the real page titles, headings, and content themes from the scan. Preserve the recognizable brand identity, logo direction, colors, typography direction, navigation intent, and strongest calls to action. Improve hierarchy, whitespace, mobile responsiveness, accessibility, scannability, and conversion flow. Do not return an explanation or generic travel filler; return the full OpenPage JSON document for ${analysis.siteName}.`;
    setBrief(redesignBrief);
    await generate(redesignBrief, `${analysis.siteName} · Cleaner redesign`);
  }
  async function save() {
    setBusy(true);
    setStatus("Saving draft and capturing OpenPage memory…");
    const response = await fetch("/api/openpage", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "save",
        id: selectedProject || undefined,
        name: document.name,
        prompt: brief,
        document,
        sourceAnalysis: analysis,
      }),
    });
    const payload = await response.json();
    if (payload.ok) {
      setSelectedProject(payload.project.id);
      setStatus(
        payload.memory?.ok
          ? "Saved · G-Brain captured in openpage/"
          : `Saved · memory capture needs attention: ${payload.memory?.error ?? "unknown error"}`,
      );
      await loadProjects();
      await loadBrain(document.name);
    } else setStatus(`Save failed: ${payload.error ?? "unknown error"}`);
    setBusy(false);
  }
  async function saveTemplate() {
    if (!analysis) return;
    setBusy(true);
    setStatus("Saving brand system and suggestions to the template vault…");
    const response = await fetch("/api/openpage", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "save-template", analysis }),
    });
    const payload = await response.json();
    if (payload.ok) {
      setTemplateSaved(true);
      setStatus(
        payload.memory?.ok
          ? "Reusable template saved · G-Brain captured in openpage/templates/"
          : "Reusable template saved · memory capture needs attention",
      );
    } else
      setStatus(`Template save failed: ${payload.error ?? "unknown error"}`);
    setBusy(false);
  }
  async function loadSelected() {
    const project = projects.find((item) => item.id === selectedProject);
    if (project) {
      setDocument(project.document);
      setBrief(project.prompt ?? "");
      setStatus("Loaded from OpenPage workspace");
      await loadBrain(project.name);
    }
  }
  async function exportHtml() {
    const response = await fetch("/api/openpage", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "export", document }),
    });
    if (!response.ok) return setStatus("Export failed");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = globalThis.document.createElement("a");
    link.href = url;
    link.download = `${
      document.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "openpage"
    }.html`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Standalone HTML exported");
  }
  function startTemplate(name: string, nextBrief: string) {
    setBrief(nextBrief);
    setDocument(defaultOpenPageDocument(name));
    setSelectedProject("");
    setSelectedBlock("");
    setStatus(`${name} template loaded · unsaved`);
    setView("editor");
  }

  if (view === "dashboard")
    return (
      <div className="-mx-4 -my-5 min-h-[calc(100vh-4rem)] bg-[#08090a] text-[#f4f4f5] md:-mx-6">
        <header className="border-b border-white/10 bg-[#0b0c0d]">
          <div className="flex w-full items-center gap-7 px-5 py-3 text-sm">
            <button
              onClick={() => setView("dashboard")}
              className="mr-2 flex items-center gap-2 font-semibold tracking-tight"
            >
              <span className="h-3.5 w-3.5 rounded-full bg-[#84cc72] shadow-[0_0_18px_rgba(132,204,114,.35)]" />
              OpenPage
            </button>
            <nav
              className="flex items-center gap-5 text-[#a1a1aa]"
              aria-label="OpenPage navigation"
            >
              <button
                onClick={() => setView("dashboard")}
                className="flex items-center gap-2 border-b-2 border-[#84cc72] pb-2 text-[#f4f4f5]"
              >
                <Grid2X2 className="h-3.5 w-3.5" />
                Dashboard
              </button>
              <a
                href="/openpage/editor"
                className="flex items-center gap-2 pb-2 hover:text-white"
              >
                <PenLine className="h-3.5 w-3.5" />
                Editor
              </a>
            </nav>
            <a
              href="https://github.com/buildingopen/openpage"
              target="_blank"
              rel="noreferrer"
              className="ml-auto flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs text-[#a1a1aa] hover:border-white/30 hover:text-white"
            >
              <Github className="h-3.5 w-3.5" />
              GitHub
            </a>
          </div>
        </header>
        <main
          id="openpage-dashboard"
          className="w-full px-5 pb-20 pt-16 sm:pt-20"
        >
          <div className="text-center">
            <h1 className="text-4xl font-semibold tracking-[-.04em] sm:text-5xl">
              What will you build?
            </h1>
            <p className="mt-3 text-base text-[#71717a]">
              Describe your site and AI generates the layout, copy, and theme.
            </p>
          </div>
          <section className="mx-auto mt-10 rounded-[20px] border border-white/20 bg-[#101112] p-3 shadow-[0_0_70px_rgba(132,204,114,.05)]">
            <textarea
              aria-label="OpenPage brief"
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
              placeholder="Describe the page, idea, or campaign you want OpenPage to build…"
              className="min-h-28 w-full resize-none bg-transparent px-2 py-1 text-sm leading-relaxed text-[#e4e4e7] outline-none placeholder:text-[#52525b]"
            />
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-1 flex-wrap gap-2">
                <button
                  onClick={() =>
                    setBrief(
                      "Create a SaaS landing page with a clear product promise, benefits, proof, and signup CTA.",
                    )
                  }
                  className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-[#a1a1aa] hover:border-white/30 hover:text-white"
                >
                  SaaS landing page
                </button>
                <button
                  onClick={() => setBrief(templates[0].brief)}
                  className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-[#a1a1aa] hover:border-white/30 hover:text-white"
                >
                  Portfolio site
                </button>
                <button
                  onClick={() => setBrief(templates[1].brief)}
                  className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-[#a1a1aa] hover:border-white/30 hover:text-white"
                >
                  Restaurant website
                </button>
                <button
                  onClick={() =>
                    setBrief(
                      "Create a modern AI startup website with a bold hero, product benefits, trust signals, use cases, and a demo CTA.",
                    )
                  }
                  className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-[#a1a1aa] hover:border-white/30 hover:text-white"
                >
                  AI startup
                </button>
                <button
                  disabled={busy || !sourceUrl.trim()}
                  onClick={() => void scanWebsite()}
                  className="rounded-full border border-[#84cc72]/50 px-3 py-1.5 text-xs text-[#a6e896] hover:bg-[#84cc72]/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Scrape / extract
                </button>
              </div>
              <button
                disabled={busy || !brief.trim()}
                onClick={() => void generate()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#84cc72] px-5 py-3 text-sm font-semibold text-[#10200e] transition hover:bg-[#9ae68a] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Wand2 className="h-4 w-4" />
                Generate
              </button>
            </div>
          </section>
          <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="OpenPage templates">
            {templates.map((template) => (
              <button
                key={template.name}
                onClick={() => startTemplate(template.name, template.brief)}
                className="group rounded-xl border border-white/15 bg-[#101112] p-4 text-left transition hover:-translate-y-0.5 hover:border-white/35 hover:bg-[#151718]"
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="text-base text-[#84cc72]">{template.icon}</span>
                  {template.name}
                </div>
                <p className="mt-3 min-h-8 text-xs leading-relaxed text-[#71717a]">
                  {template.description}
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-[#71717a]">
                  ◌ {template.blocks} blocks
                </div>
              </button>
            ))}
          </section>
          <div className="mt-3 text-center text-xs text-[#71717a]">
            or{" "}
            <button
              onClick={() =>
                startTemplate(
                  "OpenPage blank draft",
                  "Create a clean, flexible website draft from this brief.",
                )
              }
              className="text-[#a1a1aa] underline decoration-white/20 underline-offset-4 hover:text-white"
            >
              start blank
            </button>
          </div>
          <section className="mt-5 rounded-2xl border border-[#84cc72]/30 bg-[#0d120e] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[#e4e4e7]">
                  Import a site and redesign it
                </div>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#8a8f8a]">
                  Scan an approved public site, extract its brand signals and
                  content map, then let Gemini prepare a cleaner OpenPage draft
                  without losing its identity.
                </p>
              </div>
              <span className="rounded-full border border-[#84cc72]/30 px-2.5 py-1 text-[10px] uppercase tracking-wide text-[#84cc72]">
                Brand-preserving scan
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                aria-label="Website URL to scan"
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="https://example.com"
                className="min-w-0 flex-1 rounded-xl border border-white/15 bg-[#101112] px-3 py-2.5 text-sm text-[#e4e4e7] outline-none focus:border-[#84cc72]"
              />
              <button
                disabled={busy || !sourceUrl.trim()}
                onClick={() => void scanWebsite()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#84cc72]/50 px-4 py-2.5 text-sm font-semibold text-[#a6e896] hover:bg-[#84cc72]/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Sparkles className="h-4 w-4" />
                Scan website
              </button>
            </div>
            {analysis && (
              <div className="mt-5 space-y-4">
                {blueprint && (
                  <section className="rounded-2xl border border-sky-400/50 bg-[#07111f] p-5 shadow-[0_0_55px_rgba(56,189,248,.08)]" aria-label="Whole-site visual blueprint">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-sky-100">
                          <MapIcon className="h-4 w-4 text-sky-300" />
                          AI whole-site visual blueprint
                        </div>
                        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-sky-100/65">
                          {blueprint.direction} Review the structure, real images, and page tree before OpenPage prepares any redesign drafts.
                        </p>
                      </div>
                      <span className="rounded-full border border-sky-300/40 px-2.5 py-1 text-[10px] uppercase tracking-wide text-sky-200">
                        {blueprint.pages.length} real pages mapped
                      </span>
                    </div>
                    <div className="mt-5 grid gap-3 lg:grid-cols-[1.15fr_1fr]">
                      <div className="rounded-xl border border-sky-300/20 bg-[#0b1a2b] p-4">
                        <div className="text-[10px] uppercase tracking-[.16em] text-sky-200/70">Proposed experience</div>
                        <div className="mt-4 space-y-3">
                          {blueprint.principles.slice(0, 4).map((principle, index) => (
                            <div key={principle} className="flex gap-3 text-xs leading-relaxed text-sky-50/80">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-sky-300/40 text-[10px] text-sky-200">{index + 1}</span>
                              <span>{principle}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl border border-sky-300/20 bg-[#0b1a2b] p-4">
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-[.16em] text-sky-200/70">
                          <span>Real source imagery</span>
                          <span>{blueprint.realAssets.length} found</span>
                        </div>
                        {blueprint.realAssets.length ? (
                          <div className="mt-3 grid grid-cols-4 gap-2">
                            {blueprint.realAssets.slice(0, 8).map((imageUrl) => (
                              <img key={imageUrl} src={imageUrl} alt="Real image from the approved source scan" className="h-14 w-full rounded-lg border border-sky-300/20 object-cover" loading="lazy" />
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 text-xs text-sky-50/60">No source images were found. Upload real travel photography in the editor before publishing.</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-5 border-t border-sky-300/20 pt-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="text-[10px] uppercase tracking-[.16em] text-sky-200/70">Site map and page-by-page direction</div>
                        <span className="text-[10px] text-sky-100/50">No changes made to WordPress</span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {blueprint.pages.map((page, index) => (
                          <div key={page.path} className="rounded-xl border border-sky-300/20 bg-[#0b1a2b] p-3">
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] text-sky-300">{String(index + 1).padStart(2, "0")}</span>
                              <div className="min-w-0">
                                <div className="truncate text-xs font-semibold text-sky-50">{page.title}</div>
                                <div className="mt-1 truncate font-mono text-[10px] text-sky-100/45">{page.path}</div>
                              </div>
                            </div>
                            <div className="mt-3 text-[10px] uppercase tracking-wide text-sky-200/60">{page.role}</div>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {page.sections.slice(0, 4).map((section) => <span key={section} className="rounded-full border border-sky-300/20 px-2 py-1 text-[10px] text-sky-50/65">{section}</span>)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <button disabled={busy || blueprintApproved} onClick={() => void approveBlueprint()} className="inline-flex items-center gap-2 rounded-xl bg-sky-300 px-4 py-2.5 text-sm font-semibold text-[#07111f] hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-50">
                        <Check className="h-4 w-4" />
                        {blueprintApproved ? "Blueprint approved" : "Approve blueprint & prepare full site"}
                      </button>
                      <button disabled={busy} onClick={() => void createBlueprint()} className="rounded-xl border border-sky-300/30 px-4 py-2.5 text-xs text-sky-100/75 hover:border-sky-200 hover:text-sky-50 disabled:opacity-50">Regenerate blueprint</button>
                    </div>
                  </section>
                )}
                {siteDrafts.length > 0 && (
                  <section className="rounded-2xl border border-[#84cc72]/30 bg-[#0d120e] p-5" aria-label="Full-site redesign drafts">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[#e4e4e7]">Full-site redesign drafts</div>
                        <p className="mt-1 text-xs text-[#8a8f8a]">Each draft uses the scanned page structure and real source imagery. Open one to refine it in the editor.</p>
                      </div>
                      <span className="rounded-full border border-[#84cc72]/30 px-2.5 py-1 text-[10px] uppercase tracking-wide text-[#84cc72]">Review before publish</span>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {siteDrafts.map((draft) => (
                        <button key={draft.path} onClick={() => openSiteDraft(draft)} className="rounded-xl border border-white/10 bg-[#101112] p-3 text-left hover:border-[#84cc72]/60">
                          <div className="truncate text-xs font-semibold text-[#e4e4e7]">{draft.title}</div>
                          <div className="mt-1 truncate font-mono text-[10px] text-[#71717a]">{draft.path}</div>
                          <div className="mt-3 flex items-center justify-between text-[10px] text-[#8a8f8a]"><span>{draft.imageCount} real images</span><span className="text-[#a6e896]">Open in editor ↗</span></div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-[#101112] p-3">
                    <div className="text-[10px] uppercase tracking-wide text-[#71717a]">
                      Pages scanned
                    </div>
                    <div className="mt-1 text-xl font-semibold">
                      {analysis.pagesScanned}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#101112] p-3">
                    <div className="text-[10px] uppercase tracking-wide text-[#71717a]">
                      Brand colors
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      {analysis.brand.colors.slice(0, 6).map((color) => (
                        <span
                          key={color}
                          title={color}
                          className="h-5 w-5 rounded-full border border-white/20"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#101112] p-3">
                    <div className="text-[10px] uppercase tracking-wide text-[#71717a]">
                      Layout signals
                    </div>
                    <div className="mt-1 text-xs text-[#a1a1aa]">
                      {[
                        analysis.layout.hasHeader && "header",
                        analysis.layout.hasNavigation && "navigation",
                        analysis.layout.hasHero && "hero",
                        analysis.layout.hasFooter && "footer",
                      ]
                        .filter(Boolean)
                        .join(" · ") || "content structure detected"}
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-[#71717a]">
                      Detected brand
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[#a1a1aa]">
                      {analysis.siteName} · accent {analysis.brand.accentColor}{" "}
                      ·{" "}
                      {analysis.brand.fonts.join(", ") ||
                        "font direction not detected"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        disabled={busy}
                        onClick={() => void createRedesign()}
                        className="rounded-xl bg-[#84cc72] px-4 py-2.5 text-sm font-semibold text-[#10200e] hover:bg-[#9ae68a] disabled:opacity-40"
                      >
                        <Wand2 className="mr-1 inline h-4 w-4" />
                        Create cleaner redesign
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => void saveTemplate()}
                        className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-[#d4d4d8] hover:border-white/30"
                      >
                        {templateSaved
                          ? "Template saved"
                          : "Save as reusable template"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-[#71717a]">
                      Suggestions for improvement
                    </div>
                    <ul className="mt-2 space-y-1 text-xs leading-relaxed text-[#a1a1aa]">
                      {analysis.suggestions.slice(0, 4).map((suggestion) => (
                        <li key={suggestion}>• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="grid gap-4 border-t border-white/10 pt-5 lg:grid-cols-[230px_minmax(0,1fr)]">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-[#71717a]">
                      Inspect source pages
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#71717a]">
                      Choose a scanned page to review it before redesigning.
                    </p>
                    <div className="mt-3 max-h-56 space-y-1 overflow-auto">
                      {analysis.pages.map((page) => (
                        <button
                          key={page.path}
                          aria-selected={selectedScrapedPath === page.path}
                          onClick={() => setSelectedScrapedPath(page.path)}
                          className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${selectedScrapedPath === page.path ? "border-[#84cc72]/60 bg-[#84cc72]/10 text-[#e4e4e7]" : "border-white/10 text-[#a1a1aa] hover:border-white/25"}`}
                        >
                          <span className="block truncate">{page.title}</span>
                          <span className="mt-1 block truncate text-[10px] text-[#71717a]">
                            {page.path}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-[#101112]">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
                        <span className="text-[10px] uppercase tracking-wide text-[#71717a]">
                          Source preview ·{" "}
                        {analysis.pages.find(
                          (page) => page.path === selectedScrapedPath,
                        )?.path ??
                          analysis.pages[0]?.path ??
                          "/"}
                      </span>
                      <div className="flex items-center gap-3">
                        {analysis.pages[0] && (
                          <a
                            href={
                              (
                                analysis.pages.find(
                                  (page) => page.path === selectedScrapedPath,
                                ) ?? analysis.pages[0]
                              ).url
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-[#a6e896] hover:underline"
                          >
                            Open page ↗
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setSourcePreviewExpanded((current) => !current)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-[10px] uppercase tracking-wide text-[#a1a1aa] hover:border-[#84cc72] hover:text-[#a6e896]"
                          aria-label={sourcePreviewExpanded ? "Collapse source preview" : "Expand source preview"}
                        >
                          {sourcePreviewExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                          {sourcePreviewExpanded ? "Collapse" : "Expand"}
                        </button>
                      </div>
                    </div>
                    {analysis.pages.find(
                      (page) => page.path === selectedScrapedPath,
                    ) ? (
                      <iframe
                        title="Scanned source page preview"
                        src={
                          (
                            analysis.pages.find(
                              (page) => page.path === selectedScrapedPath,
                            ) ?? analysis.pages[0]
                          ).url
                        }
                        sandbox="allow-forms allow-modals allow-popups allow-scripts allow-same-origin"
                        referrerPolicy="no-referrer"
                        className={`w-full bg-white ${sourcePreviewExpanded ? "h-[calc(100vh-11rem)] min-h-[720px]" : "h-[560px] sm:h-[680px] lg:h-[760px]"}`}
                      />
                    ) : (
                      <div className="flex h-[420px] items-center justify-center px-5 text-center text-xs text-[#71717a]">
                        No scanned page is available for preview.
                      </div>
                    )}
                    <p className="border-t border-white/10 px-3 py-2 text-[10px] leading-relaxed text-[#71717a]">
                      If the source blocks embedded viewing, use Open page ↗ to
                      inspect it in a normal browser tab.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
          <div className="mt-3 text-center text-xs text-[#52525b]">
            Using Gemini for live generation.{" "}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-[#84cc72] hover:underline"
            >
              Manage your Gemini API key
            </a>{" "}
            in Google AI Studio.
          </div>
          {projects.length > 0 && (
            <div className="mt-10 text-center">
              <button
                onClick={() => setView("editor")}
                className="text-xs text-[#71717a] underline decoration-white/20 underline-offset-4 hover:text-white"
              >
                Open {projects.length} saved OpenPage draft
                {projects.length === 1 ? "" : "s"} in the editor
              </button>
            </div>
          )}
        </main>
      </div>
    );

  if (view === "settings") return <OpenPageSettings ai={ai} />;

  if (view === "editor")
    return (
      <div className="-mx-4 -my-5 min-h-[calc(100vh-4rem)] bg-[#08090a] text-[#f4f4f5] md:-mx-6">
        <header className="border-b border-white/10 bg-[#0b0c0d]">
          <div className="flex w-full items-center gap-7 px-5 py-3 text-sm">
            <a
              href="/openpage"
              className="mr-2 flex items-center gap-2 font-semibold tracking-tight"
            >
              <span className="h-3.5 w-3.5 rounded-full bg-[#84cc72] shadow-[0_0_18px_rgba(132,204,114,.35)]" />
              OpenPage
            </a>
            <nav
              className="flex items-center gap-5 text-[#a1a1aa]"
              aria-label="OpenPage navigation"
            >
              <a
                href="/openpage"
                className="flex items-center gap-2 pb-2 hover:text-white"
              >
                <Grid2X2 className="h-3.5 w-3.5" />
                Dashboard
              </a>
              <a
                href="/openpage/editor"
                className="flex items-center gap-2 border-b-2 border-[#84cc72] pb-2 text-[#f4f4f5]"
              >
                <PenLine className="h-3.5 w-3.5" />
                Editor
              </a>
            </nav>
            <a
              href="https://github.com/buildingopen/openpage"
              target="_blank"
              rel="noreferrer"
              className="ml-auto flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs text-[#a1a1aa] hover:border-white/30 hover:text-white"
            >
              <Github className="h-3.5 w-3.5" />
              GitHub
            </a>
          </div>
        </header>
        <div className="grid min-h-[calc(100vh-7rem)] xl:grid-cols-[280px_minmax(0,1fr)_340px]">
          <aside className="border-r border-white/10 bg-[#0d0e0f] p-4">
            <div className="mb-4 flex items-center gap-5 border-b border-white/10 text-xs uppercase tracking-[.16em]">
              <span className="border-b-2 border-[#84cc72] pb-3 text-white">
                Layers
              </span>
              <span className="pb-3 text-[#71717a]">Components</span>
            </div>
            <div className="mb-2 text-[10px] uppercase tracking-[.16em] text-[#71717a]">
              Layers {document.blocks.length}
            </div>
            <div className="space-y-1">
              {document.blocks.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedBlock(item.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${item.id === currentBlock?.id ? "bg-[#242127] text-white" : "text-[#a1a1aa] hover:bg-[#19191b] hover:text-white"}`}
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] uppercase tracking-wide text-[#71717a]">
                    {item.type}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={addBlock}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 px-3 py-2.5 text-xs text-[#a1a1aa] hover:border-[#84cc72] hover:text-[#84cc72]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Component
            </button>
            <div className="mt-8 border-t border-white/10 pt-5">
              <div className="mb-3 text-[10px] uppercase tracking-[.16em] text-[#71717a]">
                Projects
              </div>
              <div className="mb-2 text-xs text-[#71717a]">
                / {document.name}
              </div>
              <select
                aria-label="OpenPage project"
                value={selectedProject}
                onChange={(event) => setSelectedProject(event.target.value)}
                className={inputClass}
              >
                <option value="">New OpenPage draft</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <div className="mt-2 flex gap-2">
                <button
                  className={buttonClass}
                  disabled={!selectedProject}
                  onClick={() => void loadSelected()}
                >
                  <ExternalLink className="h-3 w-3" />
                  Load
                </button>
                <button
                  className={buttonClass}
                  onClick={() => {
                    setDocument(defaultOpenPageDocument());
                    setSelectedProject("");
                    setStatus("Starter loaded · unsaved");
                  }}
                >
                  <Plus className="h-3 w-3" />
                  Add page
                </button>
              </div>
            </div>
            <section className="mt-6 border-t border-white/10 pt-5" aria-label="WordPress site pages">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-[10px] uppercase tracking-[.16em] text-[#71717a]">Site pages</div>
                <span className="text-[9px] uppercase tracking-wide text-[#52525b]">WordPress</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#71717a]">Open a page or post here and edit it as a separate local draft. The source site stays unchanged until you approve a publish action.</p>
              <button type="button" className={`${buttonClass} mt-3 w-full justify-center`} onClick={() => void loadSiteTree()} disabled={busy}>
                <Layers3 className="h-3 w-3" />
                {siteTree.length ? "Refresh site tree" : "Connect site pages"}
              </button>
              {siteTreeStatus && <p className="mt-2 text-[10px] leading-relaxed text-[#a1a1aa]">{siteTreeStatus}</p>}
              {siteTree.length > 0 && (
                <div className="mt-3 max-h-72 overflow-auto rounded-xl border border-white/10 bg-[#101112] p-2">
                  <SiteTree nodes={siteTree} open={siteTreeOpen} onToggle={toggleSiteTree} onSelect={(node) => void openSiteNode(node)} />
                </div>
              )}
            </section>
            <div className="mt-8 grid grid-cols-3 gap-1">
              <button
                aria-label="Desktop"
                onClick={() => setViewport("desktop")}
                className={`rounded-lg border p-2 ${viewport === "desktop" ? "border-[#84cc72] text-[#84cc72]" : "border-white/10 text-[#71717a]"}`}
              >
                <Monitor className="mx-auto h-4 w-4" />
              </button>
              <button
                aria-label="Tablet"
                onClick={() => setViewport("tablet")}
                className={`rounded-lg border p-2 ${viewport === "tablet" ? "border-[#84cc72] text-[#84cc72]" : "border-white/10 text-[#71717a]"}`}
              >
                <Tablet className="mx-auto h-4 w-4" />
              </button>
              <button
                aria-label="Mobile"
                onClick={() => setViewport("mobile")}
                className={`rounded-lg border p-2 ${viewport === "mobile" ? "border-[#84cc72] text-[#84cc72]" : "border-white/10 text-[#71717a]"}`}
              >
                <Smartphone className="mx-auto h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex gap-1">
              <button
                className={`${buttonClass} flex-1 justify-center`}
                disabled
              >
                Undo
              </button>
              <button
                className={`${buttonClass} flex-1 justify-center`}
                disabled
              >
                Redo
              </button>
            </div>
          </aside>
          <main className="min-w-0 bg-[#111213] p-4 md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="text-xs text-[#71717a]">
                Projects <span className="px-2">/</span> {document.name}{" "}
                <span className="px-2">/</span> Home
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className={buttonClass}
                  onClick={() => setShowJson((current) => !current)}
                >
                  JSON
                </button>
                <button className={buttonClass}>History</button>
                <button
                  className="inline-flex items-center gap-2 rounded-xl bg-[#84cc72] px-4 py-2 text-xs font-semibold text-[#10200e] hover:bg-[#9ae68a]"
                  onClick={() => void exportHtml()}
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </button>
              </div>
            </div>
            <div className="mb-4 flex items-center justify-center gap-5 text-xs text-[#71717a]">
              <span className={viewport === "desktop" ? "text-white" : ""}>
                Desktop
              </span>
              <span className={viewport === "tablet" ? "text-white" : ""}>
                Tablet
              </span>
              <span className={viewport === "mobile" ? "text-white" : ""}>
                Mobile
              </span>
              <button
                onClick={() => setShowJson((current) => !current)}
                className="text-[#a1a1aa] hover:text-white"
              >
                {showJson ? "Hide JSON" : "Preview"}
              </button>
            </div>
            {showJson ? (
              <pre className="mx-auto max-h-[calc(100vh-13rem)] max-w-4xl overflow-auto rounded-2xl border border-white/10 bg-[#0b0c0d] p-5 text-xs leading-relaxed text-[#a6e896]">
                {JSON.stringify(document, null, 2)}
              </pre>
            ) : (
              <div
                className={`mx-auto w-full overflow-hidden rounded-2xl border border-white/10 bg-[#19191b] shadow-2xl transition-all ${viewport === "mobile" ? "max-w-[390px]" : viewport === "tablet" ? "max-w-[760px]" : "max-w-none"}`}
              >
                <Canvas document={document} />
              </div>
            )}
            <div className="mt-4 flex items-center justify-between text-xs text-[#71717a]">
              <span>{status}</span>
              <span>
                {document.blocks.length} blocks · {document.schemaVersion}
              </span>
            </div>
          </main>
          <aside className="border-l border-white/10 bg-[#0d0e0f] p-4">
            <section
              aria-label="OpenPage AI copilot"
              className="mb-6 rounded-xl border border-[#84cc72]/35 bg-[#101512] p-3"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[.16em] text-[#a6e896]">
                  <Sparkles className="h-3.5 w-3.5" /> AI copilot
                </div>
                <span className="text-[10px] text-[#71717a]">
                  {ai?.configured ? "Gemini live" : "AI fallback"}
                </span>
              </div>
              <div
                className="max-h-52 space-y-2 overflow-auto pr-1"
                aria-live="polite"
              >
                {copilotMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-lg px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${message.role === "user" ? "ml-4 bg-[#242127] text-[#e4e4e7]" : "mr-2 border border-white/10 bg-[#0b0c0d] text-[#a1a1aa]"}`}
                  >
                    <div className="mb-1 text-[9px] uppercase tracking-[.14em] text-[#71717a]">
                      {message.role === "user" ? "You" : "OpenPage AI"}
                    </div>
                    {message.content}
                  </div>
                ))}
              </div>
              <form
                className="mt-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void askCopilot();
                }}
              >
                <textarea
                  aria-label="Ask OpenPage AI to edit this page"
                  value={copilotInput}
                  onChange={(event) => setCopilotInput(event.target.value)}
                  placeholder="Make the hero clearer, add a Barcelona itinerary section, or redo this version…"
                  rows={3}
                  className="w-full resize-y rounded-lg border border-white/15 bg-[#0b0c0d] px-3 py-2 text-xs leading-relaxed text-[#e4e4e7] outline-none placeholder:text-[#71717a] focus:border-[#84cc72]"
                />
                <button
                  type="submit"
                  disabled={busy || !copilotInput.trim()}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#84cc72] px-3 py-2 text-xs font-semibold text-[#10200e] hover:bg-[#9ae68a] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Apply to live preview
                </button>
              </form>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void askCopilot("Redo this page as a stronger, cleaner version while preserving the current brand and content.")}
                  className="rounded-lg border border-white/10 px-2 py-2 text-[10px] uppercase tracking-wide text-[#a1a1aa] hover:border-[#84cc72]/60 hover:text-[#e4e4e7] disabled:opacity-40"
                >
                  Redo version
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void askCopilot("Improve the conversion flow and calls to action without changing the brand identity.")}
                  className="rounded-lg border border-white/10 px-2 py-2 text-[10px] uppercase tracking-wide text-[#a1a1aa] hover:border-[#84cc72]/60 hover:text-[#e4e4e7] disabled:opacity-40"
                >
                  Improve CTA
                </button>
              </div>
            </section>
            <section aria-label="OpenPage asset library" className="mb-6 rounded-xl border border-white/10 bg-[#101112] p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[.16em] text-[#a1a1aa]"><ImageIcon className="h-3.5 w-3.5 text-[#84cc72]" /> Logo &amp; images</div>
                <span className="text-[10px] text-[#71717a]">{assets.length} ready</span>
              </div>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 px-3 py-2.5 text-xs text-[#a1a1aa] hover:border-[#84cc72] hover:text-[#e4e4e7]">
                <Upload className="h-3.5 w-3.5" /> Upload assets
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" multiple className="sr-only" onChange={(event) => { void uploadAssets(event.target.files); event.currentTarget.value = ""; }} />
              </label>
              {assetStatus && <p className="mt-2 text-[10px] leading-relaxed text-[#71717a]">{assetStatus}</p>}
              {assets.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {assets.slice(0, 12).map((asset) => (
                    <div key={asset.storageName} className="group relative overflow-hidden rounded-lg border border-white/10 bg-[#0b0c0d]">
                      <img src={asset.url} alt={asset.name} className="h-16 w-full object-cover" />
                      <div className="truncate px-1.5 py-1 text-[9px] text-[#a1a1aa]" title={asset.name}>{asset.name}</div>
                      <div className="absolute inset-x-1 bottom-7 hidden gap-1 group-hover:flex">
                        <button type="button" onClick={() => addImageBlock(asset)} className="flex-1 rounded bg-[#84cc72] px-1 py-1 text-[8px] font-bold text-[#10200e]">Add image</button>
                        <button type="button" onClick={() => setAsLogo(asset)} className="rounded bg-[#242127] px-1 py-1 text-[8px] font-bold text-white">Logo</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-2 text-[10px] leading-relaxed text-[#71717a]">Upload a logo or image, then hover its thumbnail to add it to the page or use it in the navigation.</p>
            </section>
            <div className="mb-5 flex items-center gap-6 border-b border-white/10 text-xs uppercase tracking-[.16em]">
              <span className="border-b-2 border-[#84cc72] pb-3 text-white">
                Properties
              </span>
              <span className="pb-3 text-[#71717a]">Design</span>
            </div>
            {currentBlock && (
              <section>
                <div className="mb-3 text-[10px] uppercase tracking-[.16em] text-[#71717a]">
                  Selected block
                </div>
                <input
                  aria-label="Selected block label"
                  value={currentBlock.label}
                  onChange={(event) =>
                    replaceBlock({ ...currentBlock, label: event.target.value })
                  }
                  className={`${inputClass} mb-3`}
                />
                <div className="grid grid-cols-2 gap-2">
                  <button className={buttonClass} onClick={() => moveBlock(-1)}>
                    <ArrowUp className="h-3 w-3" />
                    Up
                  </button>
                  <button className={buttonClass} onClick={() => moveBlock(1)}>
                    <ArrowDown className="h-3 w-3" />
                    Down
                  </button>
                </div>
                {["hero", "content", "features", "cta"].includes(
                  currentBlock.type,
                ) && (
                  <div className="mt-4 space-y-2">
                    {[
                      "eyebrow",
                      "headline",
                      "heading",
                      "subheadline",
                      "body",
                      "cta",
                      "secondaryCta",
                    ].map((key) => (
                      <input
                        key={key}
                        aria-label={key}
                        value={value(currentBlock, key)}
                        placeholder={key}
                        onChange={(event) =>
                          replaceBlock(
                            setProp(currentBlock, key, event.target.value),
                          )
                        }
                        className={inputClass}
                      />
                    ))}
                  </div>
                )}
                {currentBlock.type === "navbar" && (
                  <div className="mt-4 space-y-2">
                    <input
                      aria-label="logoUrl"
                      value={value(currentBlock, "logoUrl")}
                      onChange={(event) => replaceBlock(setProp(currentBlock, "logoUrl", event.target.value))}
                      placeholder="Logo URL (or use an uploaded asset)"
                      className={inputClass}
                    />
                    <input
                      aria-label="brand"
                      value={value(currentBlock, "brand")}
                      onChange={(event) => replaceBlock(setProp(currentBlock, "brand", event.target.value))}
                      placeholder="Brand name"
                      className={inputClass}
                    />
                  </div>
                )}
                {currentBlock.type === "image" && (
                  <div className="mt-4 space-y-2">
                    <input
                      aria-label="imageSource"
                      value={value(currentBlock, "src")}
                      onChange={(event) => replaceBlock(setProp(currentBlock, "src", event.target.value))}
                      placeholder="Image URL"
                      className={inputClass}
                    />
                    <input
                      aria-label="imageAlt"
                      value={value(currentBlock, "alt")}
                      onChange={(event) => replaceBlock(setProp(currentBlock, "alt", event.target.value))}
                      placeholder="Accessible image description"
                      className={inputClass}
                    />
                    <input
                      aria-label="imageCaption"
                      value={value(currentBlock, "caption")}
                      onChange={(event) => replaceBlock(setProp(currentBlock, "caption", event.target.value))}
                      placeholder="Caption (optional)"
                      className={inputClass}
                    />
                  </div>
                )}
                <button
                  onClick={removeBlock}
                  className="mt-4 inline-flex items-center gap-2 text-xs text-[#a1a1aa] hover:text-red-400"
                >
                  <X className="h-3.5 w-3.5" />
                  Remove block
                </button>
              </section>
            )}
            <section className="mt-8 border-t border-white/10 pt-5">
              <div className="mb-3 text-[10px] uppercase tracking-[.16em] text-[#71717a]">
                Version History <span className="ml-1">(0)</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#101112] p-3 text-xs text-[#71717a]">
                Current latest
                <br />
                <span className="text-[#a1a1aa]">Current state</span>
                <br />
                No history yet. Make some changes to see history.
              </div>
            </section>
            <section className="mt-5 border-t border-white/10 pt-5">
              <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[.16em] text-[#71717a]">
                <Brain className="h-3.5 w-3.5 text-[#84cc72]" />
                Memory vault
              </div>
              <div className="rounded-xl border border-white/10 bg-[#101112] p-3 text-xs leading-relaxed text-[#71717a]">
                <strong className="text-white">G-Brain / openpage/</strong>
                <br />
                OpenPage-only briefs and draft summaries.
              </div>
              <button
                className={`${buttonClass} mt-3 w-full justify-center`}
                onClick={() => void loadBrain(document.name)}
              >
                <Play className="h-3 w-3" />
                Refresh context
              </button>
            </section>
          </aside>
        </div>
      </div>
    );

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-4 border-b border-os-border pb-5 md:flex-row md:items-end">
        <div>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-os-accent">
            Creative / structured web
          </div>
          <h1 className="font-display text-3xl uppercase tracking-[.06em] text-os-text md:text-4xl">
            OpenPage Lab
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-os-dim">
            A separate JSON-first website workspace for agents, previews, and
            memory. The existing Website Builder remains unchanged.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setView("dashboard")} className={buttonClass}>
            <Grid2X2 className="h-3 w-3" /> Dashboard
          </button>
          <span className="rounded-full border border-os-ok/40 px-3 py-1 font-mono text-[10px] uppercase text-os-ok">
            OpenPage JSON
          </span>
          <span className="rounded-full border border-os-accent/40 px-3 py-1 font-mono text-[10px] uppercase text-os-accent">
            G-Brain · openpage/
          </span>
          <span
            className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase ${ai?.configured ? "border-os-ok/40 text-os-ok" : "border-os-border text-os-dim"}`}
          >
            {ai?.configured ? `Gemini · ${ai.model}` : "Gemini key missing"}
          </span>
        </div>
      </header>
      <div className="grid gap-5 xl:grid-cols-[270px_minmax(0,1fr)_290px]">
        <aside className="space-y-4">
          <section className="rounded-lg-t border border-os-border bg-os-surface p-4">
            <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.16em] text-os-dim">
              <Layers3 className="h-4 w-4 text-os-accent" /> Separate workspace
            </div>
            <select
              aria-label="OpenPage project"
              value={selectedProject}
              onChange={(event) => setSelectedProject(event.target.value)}
              className={inputClass}
            >
              <option value="">New OpenPage draft</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <div className="mt-3 flex gap-2">
              <button
                className={buttonClass}
                disabled={!selectedProject}
                onClick={() => void loadSelected()}
              >
                <ExternalLink className="h-3 w-3" /> Load
              </button>
              <button
                className={buttonClass}
                onClick={() => {
                  setDocument(defaultOpenPageDocument());
                  setSelectedProject("");
                  setStatus("Starter loaded · unsaved");
                }}
              >
                <Plus className="h-3 w-3" /> New
              </button>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-os-dim">
              Projects are stored with workspace{" "}
              <code className="text-os-accent">openpage</code>, separate from
              Website Builder and WordPress imports.
            </p>
          </section>
          <section className="rounded-lg-t border border-os-border bg-os-surface p-4">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[.16em] text-os-dim">
              Brief for the agents
            </div>
            <textarea
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
              className={`${inputClass} min-h-32 resize-y`}
            />
            <button
              className={`${buttonClass} mt-3 w-full justify-center border-os-accent text-os-accent`}
              disabled={busy || !brief.trim()}
              onClick={() => void generate()}
            >
              <Wand2 className="h-3 w-3" /> Generate with live AI
            </button>
            <button
              className={`${buttonClass} mt-2 w-full justify-center`}
              onClick={() => {
                setDocument(defaultOpenPageDocument(document.name));
                setStatus("Barcelona starter loaded · unsaved");
              }}
            >
              Load starter
            </button>
          </section>
        </aside>
        <main className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg-t border border-os-border bg-os-surface p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-os-accent" />
              <span className="font-mono text-[10px] uppercase tracking-[.14em] text-os-dim">
                Live structured preview
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className={buttonClass}
                disabled={busy}
                onClick={() => void save()}
              >
                <Save className="h-3 w-3" /> Save to vault
              </button>
              <button className={buttonClass} onClick={() => void exportHtml()}>
                <Download className="h-3 w-3" /> Export HTML
              </button>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg-t border border-os-border shadow-2xl">
            <Canvas document={document} />
          </div>
          <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[.1em] text-os-dim">
            <span>{status}</span>
            <span>
              {document.blocks.length} blocks · {document.schemaVersion}
            </span>
          </div>
        </main>
        <aside className="space-y-4">
          <section className="rounded-lg-t border border-os-border bg-os-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.16em] text-os-dim">
                <Layers3 className="h-4 w-4 text-os-accent" /> Blocks
              </div>
              <button
                aria-label="Add block"
                className="text-os-accent"
                onClick={addBlock}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
              {document.blocks.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedBlock(item.id)}
                  className={`flex w-full items-center justify-between border px-2 py-2 text-left text-xs transition ${item.id === currentBlock?.id ? "border-os-accent bg-os-surface2 text-os-text" : "border-transparent text-os-dim hover:border-os-border"}`}
                >
                  <span>
                    <span className="mr-2 text-[10px] text-os-accent">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {item.label}
                  </span>
                  <span className="font-mono text-[9px] uppercase opacity-60">
                    {item.type}
                  </span>
                </button>
              ))}
            </div>
          </section>
          {currentBlock && (
            <section className="rounded-lg-t border border-os-border bg-os-surface p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="font-mono text-[10px] uppercase tracking-[.16em] text-os-dim">
                  Edit block
                </div>
                <button
                  onClick={removeBlock}
                  aria-label="Remove block"
                  className="text-os-dim hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <input
                value={currentBlock.label}
                onChange={(event) =>
                  replaceBlock({ ...currentBlock, label: event.target.value })
                }
                className={`${inputClass} mb-2`}
              />
              <div className="grid grid-cols-2 gap-2">
                <button className={buttonClass} onClick={() => moveBlock(-1)}>
                  <ArrowUp className="h-3 w-3" /> Up
                </button>
                <button className={buttonClass} onClick={() => moveBlock(1)}>
                  <ArrowDown className="h-3 w-3" /> Down
                </button>
              </div>
              {["hero", "content", "features", "cta"].includes(
                currentBlock.type,
              ) && (
                <div className="mt-3 space-y-2">
                  {[
                    "eyebrow",
                    "headline",
                    "heading",
                    "subheadline",
                    "body",
                    "cta",
                    "secondaryCta",
                  ].map((key) => (
                    <input
                      key={key}
                      value={value(currentBlock, key)}
                      placeholder={key}
                      onChange={(event) =>
                        replaceBlock(
                          setProp(currentBlock, key, event.target.value),
                        )
                      }
                      className={inputClass}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
          <section className="rounded-lg-t border border-os-border bg-os-surface p-4">
            <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.16em] text-os-dim">
              <Brain className="h-4 w-4 text-os-accent" /> Memory vault
            </div>
            <div className="rounded border border-os-border bg-os-surface2 p-3 text-xs leading-relaxed text-os-dim">
              <strong className="text-os-text">G-Brain / openpage/</strong>
              <br />
              Only OpenPage briefs and draft summaries are captured here. It
              does not mix with WordPress or the existing Website Builder.
            </div>
            <button
              className={`${buttonClass} mt-3 w-full justify-center`}
              onClick={() => void loadBrain(document.name)}
            >
              <Play className="h-3 w-3" /> Refresh context
            </button>
            {brain.length > 0 && (
              <div className="mt-3 space-y-2">
                {brain.slice(0, 3).map((item) => (
                  <div
                    key={`${item.title}-${item.snippet}`}
                    className="border-l border-os-accent pl-2 text-[11px] text-os-dim"
                  >
                    <div className="text-os-text">{item.title}</div>
                    {item.snippet}
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
