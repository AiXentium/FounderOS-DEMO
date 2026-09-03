"use client";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  FileImage,
  Globe,
  Search,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge, SectionHead } from "@/components/terminal";
import { ConciergePanel } from "@/components/ConciergePanel";

type Brief = { sections: string[]; rules: string[] };
export default function SetupPage() {
  const [businessType, setBusinessType] = useState("");
  const [projectMode, setProjectMode] = useState("new");
  const [details, setDetails] = useState("");
  const [domain, setDomain] = useState("");
  const [status, setStatus] = useState("");
  const [analysisStatus, setAnalysisStatus] = useState("");
  const [logoStatus, setLogoStatus] = useState("");
  const [brief, setBrief] = useState<Brief | null>(null);
  const analyze = async () => {
    if (!domain.trim()) return;
    setAnalysisStatus("Analyzing website…");
    const url = /^https?:\/\//i.test(domain) ? domain : `https://${domain}`;
    const response = await fetch("/api/website/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const body = await response.json();
    if (!response.ok) return setAnalysisStatus(body.error || "Analysis failed");
    const context = [
      `Title: ${body.title || "Not found"}`,
      `Description: ${body.description || "Not found"}`,
      `Headings: ${(body.headings || []).join(" · ") || "Not found"}`,
    ].join("\n");
    setDetails((current) => (current ? `${current}\n\n${context}` : context));
    setProjectMode("reference");
    setAnalysisStatus("Website context added to intake");
  };
  const uploadLogo = async (file: File) => {
    setLogoStatus("Uploading logo…");
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/assets", { method: "POST", body: form });
    setLogoStatus(response.ok ? "Logo saved locally" : "Logo upload failed");
  };
  const start = async () => {
    setStatus("Building your project brief…");
    const response = await fetch("/api/setup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        businessType,
        projectMode,
        projectDetails: details,
        domain,
      }),
    });
    const body = await response.json();
    if (!response.ok) return setStatus(body.error || "Setup failed");
    const next = body.brief?.brief ?? body.brief;
    if (!Array.isArray(next?.sections))
      return setStatus("The brief was incomplete; try again.");
    setBrief(next);
    setStatus("Project created in Website Builder");
  };
  return (
    <div>
      <PageHeader
        eyebrow="guided setup / ai operator"
        title="Business Setup"
        right={<Badge tone="ok">● local-first</Badge>}
      />
      <ConciergePanel />
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="rounded-lg-t border border-[var(--accent-line)] bg-os-accent/5 p-5">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase text-os-accent">
            <Sparkles className="h-4 w-4" /> One setup agent for the entire
            system
          </div>
          <h2 className="mt-3 text-2xl font-semibold">
            Tell me what you’re building.
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-os-muted">
            Generate a project brief from your business, an existing website, or
            a reference template.
          </p>
        </div>
        <section className="rounded-lg-t border border-os-border bg-os-surface p-5">
          <SectionHead label="Project intake" count="step 1 of 3" />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-[11px] uppercase text-os-dim">
              Business or website type
              <input
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                placeholder="e.g. travel affiliate business"
                className="mt-2 w-full rounded-sm-t border border-os-border bg-transparent p-3 text-sm outline-none"
              />
            </label>
            <label className="text-[11px] uppercase text-os-dim">
              Starting point
              <select
                value={projectMode}
                onChange={(e) => setProjectMode(e.target.value)}
                className="mt-2 w-full rounded-sm-t border border-os-border bg-os-surface p-3 text-sm outline-none"
              >
                <option value="new">New business or website</option>
                <option value="transfer">Transfer an existing website</option>
                <option value="reference">
                  Use a site or template as reference
                </option>
              </select>
            </label>
          </div>
          <label className="mt-4 block text-[11px] uppercase text-os-dim">
            What should the agent know?
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Audience, offer, style, competitors, pages, or goals…"
              className="mt-2 h-28 w-full rounded-sm-t border border-os-border bg-transparent p-3 text-sm outline-none"
            />
          </label>
          <label className="mt-4 block text-[11px] uppercase text-os-dim">
            Domain or existing website
            <div className="mt-2 flex items-center gap-2 rounded-sm-t border border-os-border p-3">
              <Globe className="h-4 w-4 text-os-dim" />
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="yourdomain.com"
                className="w-full bg-transparent text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => void analyze()}
                disabled={!domain.trim()}
                className="flex shrink-0 items-center gap-1 rounded-sm-t border border-os-border px-2 py-1 font-mono text-[9px] uppercase text-os-accent disabled:opacity-40"
              >
                <Search className="h-3 w-3" /> Analyze
              </button>
            </div>
            {analysisStatus && (
              <div className="mt-2 font-mono text-[10px] text-os-accent">
                {analysisStatus}
              </div>
            )}
          </label>
          <div className="mt-4 rounded-sm-t border border-os-border bg-os-surface2 p-4">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase text-os-dim">
              <FileImage className="h-4 w-4 text-os-accent" /> Business logo
            </div>
            <p className="mt-1 text-xs text-os-muted">
              Upload the logo used across your website and marketing assets.
            </p>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-sm-t border border-os-border px-3 py-2 font-mono text-[10px] uppercase text-os-accent hover:bg-os-surface">
              <ArrowRight className="h-3.5 w-3.5" /> Upload logo
              <input
                type="file"
                accept="image/*,.svg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadLogo(file);
                  e.target.value = "";
                }}
              />
            </label>
            {logoStatus && (
              <div className="mt-2 flex items-center gap-1 font-mono text-[10px] text-os-ok">
                <Check className="h-3 w-3" /> {logoStatus}
              </div>
            )}
          </div>
          <button
            onClick={() => void start()}
            disabled={!businessType}
            className="mt-5 flex items-center gap-2 rounded-sm-t bg-os-accent px-4 py-3 font-mono text-[10px] font-bold uppercase text-[var(--accent-ink)] disabled:opacity-40"
          >
            Start building <ArrowRight className="h-3.5 w-3.5" />
          </button>
          {status && (
            <div className="mt-3 font-mono text-[10px] text-os-accent">
              {status}
            </div>
          )}
        </section>
        {brief && (
          <section className="rounded-lg-t border border-os-border bg-os-surface p-5">
            <SectionHead
              label="Generated project brief"
              count={`${brief.sections.length} sections`}
            />
            <div className="grid gap-2 md:grid-cols-2">
              {brief.sections.map((section) => (
                <div
                  key={section}
                  className="rounded-sm-t border border-os-border p-3 text-sm"
                >
                  {section}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
