import type { Metadata } from "next";
import PrivacyContent from "@/components/PrivacyContent";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "Privacy policy for PTYTSCH — how we handle your data.",
    openGraph: {
        title: "Privacy Policy — PTYTSCH",
        description: "Privacy policy for PTYTSCH — how we handle your data.",
        url: "https://ptytsch.de/privacy",
    },
    alternates: {
        canonical: "https://ptytsch.de/privacy",
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function PrivacyPage() {
    return <PrivacyContent />;
}
