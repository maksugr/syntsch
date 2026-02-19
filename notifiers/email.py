import logging

import httpx

import config

logger = logging.getLogger(__name__)

CATEGORY_COLORS = {
    "music": "#B91C1C",
    "cinema": "#92600A",
    "theater": "#6B2164",
    "exhibition": "#1A6B3C",
    "lecture": "#1E4D7B",
    "festival": "#9C4A1A",
    "performance": "#2D2D2D",
    "club": "#4A1942",
}

SEGMENT_MAP = {
    "en": lambda: config.RESEND_SEGMENT_EN,
    "de": lambda: config.RESEND_SEGMENT_DE,
    "ru": lambda: config.RESEND_SEGMENT_RU,
}

SUBJECTS = {
    "en": "New on SYNTSCH: {title}",
    "de": "Neu auf SYNTSCH: {title}",
    "ru": "Новое на SYNTSCH: {title}",
}

CTA_TEXT = {
    "en": "Read →",
    "de": "Lesen →",
    "ru": "Читать →",
}

TAGLINE = {
    "en": "AI-powered daily essays on&nbsp;the&nbsp;most compelling upcoming cultural events in&nbsp;Berlin.",
    "de": "KI-gestützte tägliche Essays über&nbsp;die spannendsten kulturellen Veranstaltungen in&nbsp;Berlin.",
    "ru": "Ежедневные эссе об&nbsp;интереснейших культурных событиях Берлина, написанные&nbsp;ИИ.",
}

LABEL_VENUE = {"en": "Venue", "de": "Ort", "ru": "Место"}
LABEL_DATE = {"en": "Date", "de": "Datum", "ru": "Дата"}
LABEL_UNSUBSCRIBE = {"en": "Unsubscribe", "de": "Abmelden", "ru": "Отписаться"}

CATEGORY_NAMES = {
    "en": {
        "music": "music",
        "cinema": "cinema",
        "theater": "theater",
        "exhibition": "exhibition",
        "lecture": "lecture",
        "festival": "festival",
        "performance": "performance",
        "club": "club",
    },
    "de": {
        "music": "Musik",
        "cinema": "Kino",
        "theater": "Theater",
        "exhibition": "Ausstellung",
        "lecture": "Vortrag",
        "festival": "Festival",
        "performance": "Performance",
        "club": "Club",
    },
    "ru": {
        "music": "музыка",
        "cinema": "кино",
        "theater": "театр",
        "exhibition": "выставка",
        "lecture": "лекция",
        "festival": "фестиваль",
        "performance": "перформанс",
        "club": "клуб",
    },
}


def _translate_category(category: str, language: str) -> str:
    return CATEGORY_NAMES.get(language, CATEGORY_NAMES["en"]).get(category, category)


def _build_event_block(
    venue: str, start_date: str, category: str, color: str, language: str
) -> str:
    if not venue and not start_date:
        return ""

    cat_label = _translate_category(category, language)
    lbl_venue = LABEL_VENUE.get(language, LABEL_VENUE["en"])
    lbl_date = LABEL_DATE.get(language, LABEL_DATE["en"])

    meta_parts = []
    if start_date:
        meta_parts.append(
            f"<span style='color:#666666;text-transform:uppercase;font-size:10px;letter-spacing:2px;'>{lbl_date}</span>&nbsp; {start_date}"
        )
    if venue:
        meta_parts.append(
            f"<span style='color:#666666;text-transform:uppercase;font-size:10px;letter-spacing:2px;'>{lbl_venue}</span>&nbsp; {venue}"
        )

    return f"""<div style="margin-bottom:28px;font-family:'Courier New',monospace;font-size:13px;color:#000000;">
<div style="margin-bottom:12px;"><span style="font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#ffffff;background:{color};padding:3px 8px;font-size:12px;">{cat_label}</span></div>
<div>{" &nbsp;&middot;&nbsp; ".join(meta_parts)}</div>
</div>"""


def _build_html(
    title: str,
    lead: str,
    url: str,
    language: str,
    category: str,
    venue: str,
    start_date: str,
) -> str:
    color = CATEGORY_COLORS.get(category, "#2D2D2D")
    cta = CTA_TEXT.get(language, CTA_TEXT["en"])
    tagline = TAGLINE.get(language, TAGLINE["en"])
    unsub = LABEL_UNSUBSCRIBE.get(language, LABEL_UNSUBSCRIBE["en"])
    event_block = _build_event_block(venue, start_date, category, color, language)

    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:3px solid #000000;">

<tr><td style="padding:32px 32px 24px;border-bottom:3px solid #000000;">
  <a href="{config.SITE_URL}/{language}/" style="text-decoration:none;margin-bottom:8px;display:inline-block;">
    <span style="font-family:'Arial Black',Arial,sans-serif;font-size:28px;font-weight:900;letter-spacing:2px;color:#000000;">SYNTSCH</span><!--
    --><img src="https://syntsch.de/icon-black.png" width="22" height="22" alt="" style="display:inline-block;vertical-align:bottom;margin-left:1px;margin-bottom:3px;">
  </a>
  <div style="font-family:'Courier New',monospace;font-size:10px;color:#888888;letter-spacing:0.3px;max-width:290px;">{tagline}</div>
</td></tr>

<tr><td style="padding:32px;">
  <a href="{url}" style="font-family:'Arial Black',Arial,sans-serif;font-size:24px;font-weight:900;line-height:1.2;color:#000000;text-decoration:none;display:block;margin-bottom:16px;">{title}</a>

  <a href="{url}" style="font-size:16px;line-height:1.5;color:#555555;text-decoration:none;display:block;margin-bottom:24px;">{lead}</a>

  {event_block}

  <table cellpadding="0" cellspacing="0"><tr><td style="background:#000000;padding:14px 32px;">
    <a href="{url}" style="font-family:'Arial Black',Arial,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:1px;">{cta}</a>
  </td></tr></table>
</td></tr>

<tr><td style="padding:24px 32px;border-top:1px solid #e0e0e0;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="font-size:11px;color:#aaaaaa;vertical-align:top;">
      <a href="{{{{{{RESEND_UNSUBSCRIBE_URL}}}}}}" style="color:#aaaaaa;text-decoration:underline;">{unsub}</a>
    </td>
    <td align="right" style="vertical-align:top;">
      <a href="{config.SITE_URL}/{language}/" style="text-decoration:none;display:inline-block;">
        <span style="font-family:'Arial Black',Arial,sans-serif;font-size:13px;font-weight:900;letter-spacing:1px;color:#aaaaaa;">SYNTSCH</span><!--
        --><img src="https://syntsch.de/icon-gray.png" width="14" height="14" alt="" style="display:inline-block;vertical-align:bottom;margin-left:1px;margin-bottom:1px;">
      </a>
      <div style="font-family:'Courier New',monospace;font-size:10px;text-align:right;margin-top:2px;"><a href="mailto:hi@syntsch.de" style="color:#aaaaaa;text-decoration:none;">hi@syntsch.de</a></div>
    </td>
  </tr></table>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""


async def send_article_email(
    title: str,
    lead: str,
    slug: str,
    language: str,
    category: str,
    venue: str = "",
    start_date: str = "",
):
    api_key = config.RESEND_API_KEY
    if not api_key:
        return

    segment_getter = SEGMENT_MAP.get(language)
    if not segment_getter:
        return
    segment_id = segment_getter()
    if not segment_id:
        return

    url = f"{config.SITE_URL}/{language}/article/{slug}/"
    subject = SUBJECTS.get(language, SUBJECTS["en"]).format(title=title)
    html = _build_html(title, lead, url, language, category, venue, start_date)

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.resend.com/broadcasts",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "audience_id": segment_id,
                    "from": "Syntsch <hi@syntsch.de>",
                    "subject": subject,
                    "html": html,
                },
            )
            resp.raise_for_status()
            broadcast_id = resp.json().get("id")

            await client.post(
                f"https://api.resend.com/broadcasts/{broadcast_id}/send",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            )
    except Exception as e:
        logger.warning("Email notification failed for [%s]: %s", language, e)
