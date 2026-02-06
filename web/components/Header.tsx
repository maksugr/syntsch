import Link from "next/link";
import LanguageSelector from "./LanguageSelector";

export default function Header() {
  return (
    <header className="border-b-4 border-black px-6 md:px-10 lg:px-16 pt-8 pb-4 md:pt-12 md:pb-6">
      <Link href="/" className="no-underline" style={{ textDecoration: 'none' }}>
        <h1
          className="text-[18vw] md:text-[14vw] lg:text-[12vw] leading-[0.85] tracking-tight"
          style={{ fontFamily: 'var(--font-bebas), sans-serif', color: '#000000' }}
        >
          PTYTSCH
        </h1>
      </Link>
      <LanguageSelector />
    </header>
  );
}
