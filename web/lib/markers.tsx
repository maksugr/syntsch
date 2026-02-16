import { type ReactNode } from "react";
import { typograph, type Lang } from "./translations";
import ConfidenceMarker from "@/components/ConfidenceMarker";

const MARKER_RE = /\[~([^|~]+)\|([^~]+)~\]/g;

export function parseConfidenceMarkers(text: string, lang: Lang, accentColor?: string): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  let key = 0;

  for (const m of text.matchAll(MARKER_RE)) {
    const idx = m.index!;
    if (idx > last) {
      parts.push(typograph(text.slice(last, idx), lang));
    }
    parts.push(
      <ConfidenceMarker
        key={key++}
        text={typograph(m[1], lang)}
        tooltip={m[2]}
        color={accentColor}
      />
    );
    last = idx + m[0].length;
  }

  if (last === 0) return typograph(text, lang);

  if (last < text.length) {
    parts.push(typograph(text.slice(last), lang));
  }

  return <>{parts}</>;
}
