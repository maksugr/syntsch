import httpx

import config


async def send_article_to_telegram(title: str, lead: str, slug: str):
    token = config.TELEGRAM_BOT_TOKEN
    chat_id = config.TELEGRAM_CHAT_ID

    if not token or not chat_id:
        return

    url = f"{config.SITE_URL}/article/{slug}?lang=ru"
    text = f'<b>{title}</b>\n\n{lead}\n\n<a href="{url}">Читать →</a>'

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://api.telegram.org/bot{token}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": text,
                    "parse_mode": "HTML",
                    "disable_web_page_preview": False,
                },
            )
            resp.raise_for_status()
    except Exception as e:
        print(f"Warning: Telegram notification failed: {e}")
