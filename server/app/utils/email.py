"""
Email sending utility for group invitations using EmailJS REST API.
"""

import requests
import logging
from app.config import settings

logger = logging.getLogger(__name__)

def send_invite_email(to_email: str, group_name: str, inviter_name: str, invite_token: str) -> bool:
    """Send a group invitation email via EmailJS API.
    
    Returns True if email was sent successfully, False otherwise.
    """
    if not settings.EMAILJS_SERVICE_ID or not settings.EMAILJS_TEMPLATE_ID or not settings.EMAILJS_PUBLIC_KEY:
        logger.error("EmailJS credentials not configured in .env")
        return False

    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    join_link = f"{frontend_url}/invite/{invite_token}"

    url = "https://api.emailjs.com/api/v1.0/email/send"
    
    payload = {
        "service_id": settings.EMAILJS_SERVICE_ID,
        "template_id": settings.EMAILJS_TEMPLATE_ID,
        "user_id": settings.EMAILJS_PUBLIC_KEY,
        "template_params": {
            "to_email": to_email,
            "group_name": group_name,
            "inviter_name": inviter_name,
            "join_link": join_link
        }
    }
    
    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        
        # EmailJS returns 200 OK with text "OK" on success
        if response.status_code == 200:
            logger.info("✅ Email sent via EmailJS to %s", to_email)
            return True
        else:
            logger.error("❌ EmailJS API failed for %s: %s - %s", to_email, response.status_code, response.text)
            return False
            
    except requests.exceptions.RequestException as e:
        logger.error("❌ EmailJS request failed for %s: %s", to_email, str(e))
        return False
