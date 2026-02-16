"use client";

import GenerativeArt from "./GenerativeArt";

export default function ArticleHero({ seed, color }: { seed: string; color: string }) {
  return (
    <div className="absolute -inset-x-6 md:-inset-x-10 lg:-inset-x-16 inset-y-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <div className="w-full h-full opacity-40">
        <GenerativeArt seed={seed} color={color} />
      </div>
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 0%, #FFFFFF 70%)" }} />
    </div>
  );
}
