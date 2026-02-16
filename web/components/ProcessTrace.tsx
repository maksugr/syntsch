"use client";

import { useState } from "react";
import type { PipelineTrace } from "@/lib/types";
import { tUi } from "@/lib/translations";
import { useLanguage } from "./LanguageProvider";

const ISSUE_TYPE_KEYS: Record<string, string> = {
  factual: "issueFactual",
  voice: "issueVoice",
  structure: "issueStructure",
  language: "issueLanguage",
  depth: "issueDepth",
};

function SeverityDot({ severity }: { severity: string }) {
  const color =
    severity === "critical" ? "#B91C1C" : severity === "major" ? "#92600A" : "#666666";
  return (
    <span
      className="inline-block w-2 h-2 rounded-full mr-1.5 flex-shrink-0"
      style={{ backgroundColor: color }}
    />
  );
}

export default function ProcessTrace({ trace }: { trace: PipelineTrace }) {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [showDraft, setShowDraft] = useState(false);

  const criticalCount = trace.critique_issues.filter((i) => i.severity === "critical").length;
  const majorCount = trace.critique_issues.filter((i) => i.severity === "major").length;
  const minorCount = trace.critique_issues.filter((i) => i.severity === "minor").length;

  const finalWordCount = trace.revised_text ? trace.revised_text.split(/\s+/).length : 0;

  const issuesByType: Record<string, { critical: number; major: number; minor: number }> = {};
  for (const issue of trace.critique_issues) {
    if (!issuesByType[issue.type]) {
      issuesByType[issue.type] = { critical: 0, major: 0, minor: 0 };
    }
    const sev = issue.severity as "critical" | "major" | "minor";
    if (issuesByType[issue.type][sev] !== undefined) {
      issuesByType[issue.type][sev]++;
    }
  }

  return (
    <div className="my-8 border border-black/10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-5 py-3 text-left cursor-pointer"
      >
        <span
          className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] shrink-0"
          style={{ color: "#999999" }}
        >
          {tUi(lang, "processTitle")}
        </span>
        <span className="hidden md:flex items-center gap-3 text-[11px] font-mono" style={{ color: "#999999" }}>
          <span>{trace.draft_word_count} → {finalWordCount} {tUi(lang, "processWords")}</span>
          {trace.critique_issues.length > 0 && (
            <span className="flex items-center gap-2.5">
              {criticalCount > 0 && <span className="flex items-center gap-1"><SeverityDot severity="critical" />{criticalCount}</span>}
              {majorCount > 0 && <span className="flex items-center gap-1"><SeverityDot severity="major" />{majorCount}</span>}
              {minorCount > 0 && <span className="flex items-center gap-1"><SeverityDot severity="minor" />{minorCount}</span>}
            </span>
          )}
          {trace.research_sources_count > 0 && (
            <span>{trace.research_sources_count} {tUi(lang, "processSources")}</span>
          )}
        </span>
        <span
          className="text-sm font-mono ml-auto"
          style={{ color: "#999999", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 font-mono text-sm space-y-4">
          {trace.expanded && (
            <div className="text-[11px] font-bold" style={{ color: "#92600A" }}>
              {tUi(lang, "processExpanded")}
            </div>
          )}

          {(trace.critique_assessment || trace.critique_issues.length > 0) && (
            <div className="text-[10px] italic" style={{ color: "#aaa" }}>
              {tUi(lang, "processEditorNote")}
            </div>
          )}

          {trace.critique_assessment && (
            <p className="text-xs leading-relaxed" style={{ color: "#666666" }}>
              {trace.critique_assessment}
            </p>
          )}

          {trace.critique_issues.length > 0 && (
            <div className="space-y-3">
              {trace.critique_issues.map((issue, idx) => {
                const label = ISSUE_TYPE_KEYS[issue.type] ? tUi(lang, ISSUE_TYPE_KEYS[issue.type]) : issue.type;
                return (
                  <div key={idx} className="text-[11px]">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <SeverityDot severity={issue.severity} />
                      <span style={{ color: "#999999" }} className="uppercase">{label}</span>
                    </div>
                    <div style={{ color: "#666666" }}>{issue.fix}</div>
                  </div>
                );
              })}
            </div>
          )}

          {trace.draft_text && (
            <div>
              <button
                onClick={() => setShowDraft(!showDraft)}
                className="text-[11px] font-bold underline cursor-pointer"
                style={{ color: "#999999" }}
              >
                {showDraft ? tUi(lang, "processHideDraft") : tUi(lang, "processShowDraft")}
              </button>
              {showDraft && (
                <div
                  className="mt-2 p-3 text-xs leading-relaxed whitespace-pre-wrap"
                  style={{ backgroundColor: "#f0f0f0", color: "#666666" }}
                >
                  {trace.draft_text}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
