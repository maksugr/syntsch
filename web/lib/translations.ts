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
            about: "About",
            aboutTitle: "WHAT IS THIS",
            aboutText1:
                "PTYTSCH is an autonomous cultural digest powered by artificial intelligence. Every day, AI scouts Berlin's cultural landscape — exhibitions, concerts, performances, lectures, club nights — and selects the single most compelling upcoming event.",
            aboutText2:
                "Than it writes an original essay: sharp, opinionated, alive to the strange energy of this city.",
            aboutText3:
                "No editors. No rewritten press releases. Just truth, emotion, and experiments.",
            aboutText4:
                "The name is a nod to «Птюч» (Ptuch) — the legendary Moscow magazine and club of the 1990s that mixed electronic music, video art, and fashion into a single underground pulse. A brief, unrepeatable flash that proved culture doesn't need permission.",
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
            about: "Über",
            aboutTitle: "WAS IST DAS",
            aboutText1:
                "PTYTSCH ist ein autonomer Kulturdigest, angetrieben von künstlicher Intelligenz. Jeden Tag durchsucht die KI Berlins Kulturlandschaft — Ausstellungen, Konzerte, Performances, Vorträge, Clubnächte — und wählt das eine überzeugendste bevorstehende Ereignis aus.",
            aboutText2:
                "Dann schreibt sie ein originales Essay: scharf, meinungsstark, lebendig gegenüber der seltsamen Energie dieser Stadt.",
            aboutText3:
                "Keine Redakteure. Keine umgeschriebenen Pressemitteilungen. Nur Wahrheit, Emotion und Experimente.",
            aboutText4:
                "Der Name ist eine Verbeugung vor «Птюч» (Ptjutsch) — dem legendären Moskauer Magazin und Club der 1990er, der elektronische Musik, Videokunst und Mode zu einem einzigen unterirdischen Puls verschmolz. Ein kurzer, unwiederholbarer Blitz, der bewies, dass Kultur keine Erlaubnis braucht.",
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
            about: "О проекте",
            aboutTitle: "ЧТО ЭТО",
            aboutText1:
                "PTYTSCH — автономный культурный дайджест на основе искусственного интеллекта. Каждый день ИИ исследует культурный ландшафт Берлина — выставки, концерты, перформансы, лекции, клубные ночи — и выбирает одно самое интересное предстоящее событие.",
            aboutText2:
                "Затем пишет оригинальное эссе: острое, с позицией, чувствующее странную энергию этого города.",
            aboutText3:
                "Никаких редакторов. Никаких переписанных пресс-релизов. Только правда, эмоция и эксперименты.",
            aboutText4:
                "Название — дань уважения «Птюч»: легендарный московский журнал и клуб 90-х, где электронная музыка, видеоарт и мода сплавлялись в один подземный пульс. Короткая, неповторимая вспышка, доказавшая, что культуре не нужно разрешение.",
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

const NBSP = "\u00A0";

// short words that shouldn't end a line (prepositions, conjunctions, articles)
const SHORT_WORDS: Record<Lang, string[]> = {
    ru: ["в", "на", "к", "с", "и", "о", "у", "а", "не", "ни", "из", "за", "по", "до", "от", "ко", "со", "но", "же", "ли", "бы", "то", "ее", "её"],
    en: ["a", "an", "the", "in", "on", "at", "to", "of", "by", "is", "it", "or", "and", "but", "no", "if"],
    de: ["in", "an", "am", "im", "zu", "um", "ob", "und", "der", "die", "das", "den", "dem", "des", "ein", "vor"],
};

export function typograph(text: string, lang: Lang): string {
    const words = SHORT_WORDS[lang] || [];
    let result = text;
    // nbsp after short words
    for (const w of words) {
        result = result.replace(new RegExp(`(?<=\\s|^)(${w}) `, "gi"), `$1${NBSP}`);
    }
    // nbsp around em dash — keep it glued to both sides
    result = result.replace(/ — /g, `${NBSP}—${NBSP}`);
    result = result.replace(/ —/g, `${NBSP}—`);
    result = result.replace(/— /g, `—${NBSP}`);
    // nbsp after « and before »
    result = result.replace(/« /g, `«${NBSP}`);
    result = result.replace(/ »/g, `${NBSP}»`);
    return result;
}

export function tUi(lang: Lang, key: string): string {
    const raw = translations[lang]?.ui[key] ?? key;
    return typograph(raw, lang);
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
