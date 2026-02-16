import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24 text-center px-6 md:px-10 lg:px-16">
      <h1
        className="text-6xl md:text-8xl lg:text-[10rem] leading-[0.85] mb-12"
        style={{ fontFamily: "var(--font-display)" }}
      >
        NOTHING HERE
      </h1>
      <Link
        href="/en/"
        className="font-mono text-sm tracking-wide no-underline transition-colors duration-100"
        style={{ color: "#999999", textDecoration: "none" }}
      >
        ← back to SYNTSCH
      </Link>
    </div>
  );
}
