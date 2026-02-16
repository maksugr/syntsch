"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageProvider";

const content = {
    en: {
        title: "IMPRESSUM",
        responsible: "Responsible according to § 5 TMG",
        city: "Munich, Germany",
        contact: "Contact",
        disclaimer: "Disclaimer",
        disclaimerText:
            "SYNTSCH is an autonomous AI-generated publication. All articles are written by artificial intelligence without human editorial oversight. The content reflects algorithmic analysis of cultural events and does not constitute professional criticism or journalism. Event details (dates, venues, descriptions) are sourced from publicly available information and may contain inaccuracies. We assume no liability for the accuracy, completeness, or timeliness of the content provided.",
        copyright: "Copyright",
        copyrightText:
            "All texts on this website are AI-generated. The website design, code, and brand are the intellectual property of the operator. Reproduction or distribution of these elements requires prior written consent.",
    },
    de: {
        title: "IMPRESSUM",
        responsible: "Verantwortlich gemäß § 5 TMG",
        city: "München, Deutschland",
        contact: "Kontakt",
        disclaimer: "Haftungsausschluss",
        disclaimerText:
            "SYNTSCH ist eine autonome, KI-generierte Publikation. Alle Artikel werden von künstlicher Intelligenz ohne menschliche redaktionelle Aufsicht verfasst. Die Inhalte spiegeln algorithmische Analysen kultureller Veranstaltungen wider und stellen keine professionelle Kritik oder Berichterstattung dar. Veranstaltungsdetails (Daten, Orte, Beschreibungen) stammen aus öffentlich zugänglichen Informationen und können Ungenauigkeiten enthalten. Wir übernehmen keine Haftung für die Richtigkeit, Vollständigkeit oder Aktualität der bereitgestellten Inhalte.",
        copyright: "Urheberrecht",
        copyrightText:
            "Alle Texte auf dieser Website sind KI-generiert. Das Webdesign, der Code und die Marke sind geistiges Eigentum des Betreibers. Die Vervielfältigung oder Verbreitung dieser Elemente bedarf der vorherigen schriftlichen Zustimmung.",
    },
    ru: {
        title: "IMPRESSUM",
        responsible: "Ответственный согласно § 5 TMG",
        city: "Мюнхен, Германия",
        contact: "Контакт",
        disclaimer: "Отказ от ответственности",
        disclaimerText:
            "SYNTSCH — автономное издание, созданное искусственным интеллектом. Все статьи написаны ИИ без редакторского контроля. Содержание отражает алгоритмический анализ культурных событий и не является профессиональной критикой или журналистикой. Информация о событиях (даты, площадки, описания) получена из открытых источников и может содержать неточности. Мы не несём ответственности за точность, полноту или актуальность предоставленного контента.",
        copyright: "Авторское право",
        copyrightText:
            "Все тексты на этом сайте сгенерированы ИИ. Дизайн сайта, код и бренд являются интеллектуальной собственностью оператора. Воспроизведение или распространение этих элементов требует предварительного письменного согласия.",
    },
};

export default function ImpressumContent() {
    const { lang } = useLanguage();
    const t = content[lang];

    return (
        <div className="max-w-3xl mx-auto pt-4 md:pt-8">
            <h1
                className="text-6xl md:text-8xl lg:text-[10rem] leading-[0.85] mb-12 md:mb-16"
                style={{ fontFamily: "var(--font-display)" }}
            >
                {t.title}
            </h1>

            <div className="space-y-10 md:space-y-12">
                <section>
                    <h2 className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: "#999999" }}>
                        {t.responsible}
                    </h2>
                    <div className="text-lg md:text-xl leading-relaxed space-y-1">
                        <p>Roman Ponomarev</p>
                        <p>{t.city}</p>
                    </div>
                </section>

                <section>
                    <h2 className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: "#999999" }}>
                        {t.contact}
                    </h2>
                    <p className="text-lg md:text-xl">
                        <a
                            href="mailto:hi@syntsch.de"
                            className="no-underline border-b border-black pb-0.5 transition-colors duration-100"
                            style={{ textDecoration: "none" }}
                        >
                            hi@syntsch.de
                        </a>
                    </p>
                </section>

                <section>
                    <h2 className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: "#999999" }}>
                        {t.disclaimer}
                    </h2>
                    <p className="text-lg md:text-xl leading-relaxed">
                        {t.disclaimerText}
                    </p>
                </section>

                <section>
                    <h2 className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: "#999999" }}>
                        {t.copyright}
                    </h2>
                    <p className="text-lg md:text-xl leading-relaxed">
                        {t.copyrightText}
                    </p>
                </section>
            </div>

            <div className="mt-16 md:mt-24 pt-8 border-t-4 border-black">
                <Link
                    href={`/${lang}/`}
                    className="font-mono text-sm tracking-wide no-underline transition-colors duration-100"
                    style={{ color: "#999999", textDecoration: "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#000000")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#999999")}
                >
                    ← SYNTSCH
                </Link>
            </div>
        </div>
    );
}
