"use client";

function hash(s: string): number[] {
  let h = 5381;
  const nums: number[] = [];
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    if (i % 3 === 2) {
      nums.push(Math.abs(h));
      h = ((h << 7) ^ h) | 0;
    }
  }
  while (nums.length < 50) {
    h = ((h << 5) + h + nums.length * 7) | 0;
    nums.push(Math.abs(h));
  }
  return nums;
}

export default function GenerativeArt({ seed, color }: { seed: string; color: string }) {
  const n = hash(seed);
  const elements: React.ReactNode[] = [];

  // large bold circle
  elements.push(
    <circle
      key="c1"
      cx={n[0] % 300 + 50}
      cy={n[1] % 300 + 50}
      r={n[2] % 130 + 80}
      fill="none"
      stroke={color}
      strokeWidth={n[3] % 12 + 8}
      opacity={0.4}
    />
  );

  // big filled shape
  elements.push(
    <circle
      key="c2"
      cx={n[4] % 350 + 25}
      cy={n[5] % 350 + 25}
      r={n[6] % 80 + 50}
      fill={color}
      opacity={0.25}
    />
  );

  // second filled circle
  elements.push(
    <circle
      key="c3"
      cx={n[38] % 300 + 50}
      cy={n[39] % 300 + 50}
      r={n[40] % 70 + 35}
      fill={color}
      opacity={0.18}
    />
  );

  // bold diagonal lines
  const lineCount = n[7] % 4 + 3;
  for (let i = 0; i < lineCount; i++) {
    const idx = 8 + i * 3;
    elements.push(
      <line
        key={`l${i}`}
        x1={n[idx % n.length] % 400}
        y1={n[(idx + 1) % n.length] % 400}
        x2={n[(idx + 2) % n.length] % 400}
        y2={n[(idx + 3) % n.length] % 400}
        stroke={color}
        strokeWidth={n[(idx + 4) % n.length] % 8 + 4}
        opacity={0.3}
      />
    );
  }

  // bold polygon
  const sides = n[20] % 3 + 3;
  const cx = n[21] % 200 + 100;
  const cy = n[22] % 200 + 100;
  const r = n[23] % 100 + 60;
  const rot = n[24] % 360;
  const points = Array.from({ length: sides }, (_, i) => {
    const a = (Math.PI * 2 * i) / sides + (rot * Math.PI) / 180;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");
  elements.push(
    <polygon
      key="poly"
      points={points}
      fill={color}
      stroke={color}
      strokeWidth={6}
      fillOpacity={0.12}
      strokeOpacity={0.35}
    />
  );

  // bold arc
  const ax = n[25] % 300 + 50;
  const ay = n[26] % 300 + 50;
  const ar = n[27] % 120 + 50;
  elements.push(
    <path
      key="arc"
      d={`M ${ax - ar} ${ay} A ${ar} ${ar} 0 0 1 ${ax + ar} ${ay}`}
      fill="none"
      stroke={color}
      strokeWidth={n[28] % 10 + 6}
      opacity={0.3}
    />
  );

  // second arc
  const ax2 = n[41] % 300 + 50;
  const ay2 = n[42] % 300 + 50;
  const ar2 = n[43] % 80 + 40;
  elements.push(
    <path
      key="arc2"
      d={`M ${ax2} ${ay2 - ar2} A ${ar2} ${ar2} 0 0 1 ${ax2} ${ay2 + ar2}`}
      fill="none"
      stroke={color}
      strokeWidth={n[44] % 8 + 4}
      opacity={0.25}
    />
  );

  // dots cluster
  const dotCount = n[29] % 10 + 6;
  for (let i = 0; i < dotCount; i++) {
    const idx = 30 + i;
    elements.push(
      <circle
        key={`d${i}`}
        cx={n[idx % n.length] % 380 + 10}
        cy={n[(idx + 1) % n.length] % 380 + 10}
        r={n[(idx + 2) % n.length] % 10 + 5}
        fill={color}
        opacity={0.35}
      />
    );
  }

  return (
    <svg
      viewBox="-20 -20 440 440"
      className="gen-art w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      overflow="visible"
    >
      {elements}
    </svg>
  );
}
