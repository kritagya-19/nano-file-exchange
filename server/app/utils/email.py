import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings


def send_invite_email(to_email: str, group_name: str, inviter_name: str, invite_token: str):
    """Send a group invitation email to the specified address."""
    
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    join_link = f"{frontend_url}/invite/{invite_token}"

    subject = f"You've been invited to join \"{group_name}\" on Nano File Exchange"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#f4f6fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6fa;padding:40px 20px;">
            <tr>
                <td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
                        <!-- Header -->
                        <tr>
                            <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:32px 40px;text-align:center;">
                                <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Nano File Exchange</h1>
                            </td>
                        </tr>
                        <!-- Body -->
                        <tr>
                            <td style="padding:40px;">
                                <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;font-weight:700;">You're Invited! 🎉</h2>
                                <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
                                    <strong style="color:#1e293b;">{inviter_name}</strong> has invited you to join the group 
                                    <strong style="color:#2563eb;">"{group_name}"</strong> on Nano File Exchange.
                                </p>
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center" style="padding:8px 0 32px;">
                                            <a href="{join_link}" 
                                               style="display:inline-block;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:15px;font-weight:700;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(37,99,235,0.3);">
                                                Join Group
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.5;">
                                    If you don't have an account yet, you'll be asked to create one first — it only takes 30 seconds.
                                </p>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="padding:20px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
                                <p style="margin:0;color:#94a3b8;font-size:12px;">
                                    This invitation was sent via Nano File Exchange.<br>
                                    If you didn't expect this email, you can safely ignore it.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM_EMAIL
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"⚠ Failed to send invite email to {to_email}: {e}")
        return False
