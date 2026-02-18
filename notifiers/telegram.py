import logging

import httpx

import config

logger = logging.getLogger(__name__)


async def send_article_to_telegram(
    title: str, lead: str, slug: str, language: str = "ru"
):
    url = f"{config.SITE_URL}/{language}/article/{slug}/"
    text = f'<b>{title}</b>\n\n{lead}\n\n<a href="{url}">Читать →</a>'
    await _send_telegram_message(text, url)


async def _send_telegram_message(text: str, preview_url: str):
    token = config.TELEGRAM_BOT_TOKEN
    chat_id = config.TELEGRAM_CHAT_ID

    if not token or not chat_id:
        return

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://api.telegram.org/bot{token}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": text,
                    "parse_mode": "HTML",
                    "link_preview_options": {
                        "url": preview_url,
                        "prefer_large_media": True,
                    },
                },
            )
            resp.raise_for_status()
    except Exception as e:
        logger.warning("Telegram notification failed: %s", e)
