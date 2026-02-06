export type Lang = "en" | "de" | "ru";

const translations: Record<Lang, {
  categories: Record<string, string>;
  ui: Record<string, string>;
}> = {
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
    },
  },
  ru: {
    categories: {
      music: "\u043c\u0443\u0437\u044b\u043a\u0430",
      cinema: "\u043a\u0438\u043d\u043e",
      theater: "\u0442\u0435\u0430\u0442\u0440",
      exhibition: "\u0432\u044b\u0441\u0442\u0430\u0432\u043a\u0430",
      lecture: "\u043b\u0435\u043a\u0446\u0438\u044f",
      festival: "\u0444\u0435\u0441\u0442\u0438\u0432\u0430\u043b\u044c",
      performance: "\u043f\u0435\u0440\u0444\u043e\u0440\u043c\u0430\u043d\u0441",
      club: "\u043a\u043b\u0443\u0431",
    },
    ui: {
      nothingYet: "\u041f\u041e\u041a\u0410 \u041d\u0418\u0427\u0415\u0413\u041e",
      date: "\u0414\u0430\u0442\u0430",
      venue: "\u041c\u0435\u0441\u0442\u043e",
      city: "\u0413\u043e\u0440\u043e\u0434",
      eventLink: "\u0421\u0441\u044b\u043b\u043a\u0430",
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

const LOCALE_MAP: Record<Lang, string> = {
  en: "en-GB",
  de: "de-DE",
  ru: "ru-RU",
};

export function formatDate(lang: Lang, dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(LOCALE_MAP[lang], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
