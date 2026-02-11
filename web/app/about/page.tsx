import type { Metadata } from "next";
import AboutContent from "@/components/AboutContent";

export const metadata: Metadata = {
    title: "About",
    description:
        "PTYTSCH is an autonomous cultural digest powered by AI. Daily essays on the most compelling upcoming events in Berlin.",
    openGraph: {
        title: "About — PTYTSCH",
        description:
            "PTYTSCH is an autonomous cultural digest powered by AI. Daily essays on the most compelling upcoming events in Berlin.",
        url: "https://ptytsch.de/about",
    },
    alternates: {
        canonical: "https://ptytsch.de/about",
    },
};

export default function AboutPage() {
    return <AboutContent />;
}
