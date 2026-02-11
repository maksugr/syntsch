export type Lang = "en" | "de" | "ru";

const translations: Record<
    Lang,
    {
        categories: Record<string, string>;
        ui: Record<string, string>;
    }
> = {
    en: {
        categories: {
            music: "music",
            cinema: "cinema",
            theater: "theater",
            exhibition: "exhibition",
            lecture: "lecture",
            festival: "festival",
            performance: "performance",
            club: "club",
        },
        ui: {
            nothingYet: "NOTHING YET",
            date: "Date",
            venue: "Venue",
            city: "City",
            eventLink: "Event link",
            permalink: "permanent link",
            about: "About",
            aboutTitle: "WHAT IS THIS",
            aboutText1:
                "PTYTSCH is an autonomous cultural digest powered by artificial intelligence. Every day, AI scouts Berlin's cultural landscape — exhibitions, concerts, performances, lectures, club nights — and selects the single most compelling upcoming event.",
            aboutText2:
                "Then it writes an original essay in the spirit of Dazed and i-D: sharp, opinionated, alive to the strange energy of this city.",
            aboutText3:
                "No editors. No rewritten press releases. Just truth and emotion.",
            loadMore: "more",
            notFound: "NOTHING HERE",
            backHome: "back to PTYTSCH",
            published: "Published",
            minRead: "min read",
            copied: "copied",
            copyLink: "copy link",
            weAreClose: "We are close",
        },
    },
    de: {
        categories: {
            music: "Musik",
            cinema: "Kino",
            theater: "Theater",
            exhibition: "Ausstellung",
            lecture: "Vortrag",
            festival: "Festival",
            performance: "Performance",
            club: "Club",
        },
        ui: {
            nothingYet: "NOCH NICHTS",
            date: "Datum",
            venue: "Ort",
            city: "Stadt",
            eventLink: "Zum Event",
            permalink: "Permanenter Link",
            about: "Über",
            aboutTitle: "WAS IST DAS",
            aboutText1:
                "PTYTSCH ist ein autonomer Kulturdigest, angetrieben von künstlicher Intelligenz. Jeden Tag durchsucht die KI Berlins Kulturlandschaft — Ausstellungen, Konzerte, Performances, Vorträge, Clubnächte — und wählt das eine überzeugendste bevorstehende Ereignis aus.",
            aboutText2:
                "Dann schreibt sie ein originales Essay im Geist von Dazed und i-D: scharf, meinungsstark, lebendig gegenüber der seltsamen Energie dieser Stadt.",
            aboutText3:
                "Keine Redakteure. Keine umgeschriebenen Pressemitteilungen. Nur Wahrheit und Emotion.",
            loadMore: "mehr",
            notFound: "HIER IST NICHTS",
            backHome: "zurück zu PTYTSCH",
            published: "Veröffentlicht",
            minRead: "Min. Lesezeit",
            copied: "kopiert",
            copyLink: "Link kopieren",
            weAreClose: "Wir sind nah",
        },
    },
    ru: {
        categories: {
            music: "музыка",
            cinema: "кино",
            theater: "театр",
            exhibition: "выставка",
            lecture: "лекция",
            festival: "фестиваль",
            performance: "перформанс",
            club: "клуб",
        },
        ui: {
            nothingYet: "ПОКА НИЧЕГО",
            date: "Дата",
            venue: "Место",
            city: "Город",
            eventLink: "Ссылка",
            permalink: "постоянная ссылка",
            about: "О проекте",
            aboutTitle: "ЧТО ЭТО",
            aboutText1:
                "PTYTSCH — автономный культурный дайджест на основе искусственного интеллекта. Каждый день ИИ исследует культурный ландшафт Берлина — выставки, концерты, перформансы, лекции, клубные ночи — и выбирает одно самое интересное предстоящее событие.",
            aboutText2:
                "Затем пишет оригинальное эссе в духе Dazed и i-D: острое, с позицией, чувствующее странную энергию этого города.",
            aboutText3:
                "Никаких редакторов. Никаких переписанных пресс-релизов. Только правда и эмоция.",
            loadMore: "больше",
            notFound: "ЗДЕСЬ НИЧЕГО",
            backHome: "назад на PTYTSCH",
            published: "Опубликовано",
            minRead: "мин. чтения",
            copied: "скопировано",
            copyLink: "скопировать ссылку",
            weAreClose: "Мы рядом",
        },
    },
};

export function t(lang: Lang, key: string): string {
    const [section, name] = key.split(".");
    return translations[lang]?.[section as "categories" | "ui"]?.[name] ?? key;
}

export function tCategory(lang: Lang, category: string): string {
    return translations[lang]?.categories[category] ?? category;
}

export function tUi(lang: Lang, key: string): string {
    return translations[lang]?.ui[key] ?? key;
}

export function isDatePast(dateStr: string): boolean {
    const d = new Date(dateStr + "T23:59:59");
    return !isNaN(d.getTime()) && d < new Date();
}

const LOCALE_MAP: Record<Lang, string> = {
    en: "en-GB",
    de: "de-DE",
    ru: "ru-RU",
};

export function readingTime(wordCount: number | null): number {
    if (!wordCount || wordCount <= 0) return 1;
    return Math.max(1, Math.round(wordCount / 200));
}

export function formatDate(lang: Lang, dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(LOCALE_MAP[lang], {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}
