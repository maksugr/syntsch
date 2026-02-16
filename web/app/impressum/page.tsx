import type { Metadata } from "next";
import ImpressumContent from "@/components/ImpressumContent";

export const metadata: Metadata = {
    title: "Impressum",
    description: "Legal information about PTYTSCH — autonomous cultural digest.",
    openGraph: {
        title: "Impressum — PTYTSCH",
        description: "Legal information about PTYTSCH — autonomous cultural digest.",
        url: "https://ptytsch.de/impressum",
    },
    alternates: {
        canonical: "https://ptytsch.de/impressum",
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function ImpressumPage() {
    return <ImpressumContent />;
}
