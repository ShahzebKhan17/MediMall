import hashlib
import json
import logging
import secrets
import smtplib
import urllib.error
import urllib.request
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from typing import Optional, Tuple

import resend

from app.core.config import get_settings

logger = logging.getLogger("medimall.email")
settings = get_settings()


def generate_verification_token(user_id: Optional[str] = None) -> Tuple[str, str]:
    """
    Generates a cryptographically secure verification token.
    Returns a tuple of (raw_token, hashed_token).
    - raw_token: sent in the verification email URL to the user (contains user_id if supplied).
    - hashed_token: stored safely in the database.
    """
    random_secret = secrets.token_urlsafe(32)
    hashed_token = hash_token(random_secret)
    if user_id:
        raw_token = f"{user_id}.{random_secret}"
    else:
        raw_token = random_secret
    return raw_token, hashed_token


def hash_token(token: str) -> str:
    """Computes the SHA256 hex digest of a token."""
    return hashlib.sha256(token.strip().encode("utf-8")).hexdigest()


def get_verification_email_html(user_name: str, verification_url: str) -> str:
    """Generates a responsive, branded HTML email template for MediMall."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - MediMall</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4faf6; color: #16342e;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4faf6; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="560" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(22, 52, 46, 0.08); border: 1px solid #dbe6df;">
          
          <!-- Header / Brand -->
          <tr>
            <td style="background-color: #16342e; padding: 32px 40px; text-align: center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <span style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                      Medi<span style="color: #4cd69a;">Mall</span>
                    </span>
                    <p style="margin: 6px 0 0; font-size: 12px; color: #a3c4b8; letter-spacing: 1px; text-transform: uppercase;">Hyperlocal Healthcare &amp; Pharmacy</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #16342e;">
                Welcome to MediMall, {user_name}!
              </h1>
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #4e6a5f;">
                Thank you for creating an account with us. To secure your account and access features like ordering medicines, uploading prescriptions, and fast delivery, please verify your email address.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="{verification_url}" target="_blank" style="display: inline-block; background-color: #227f5e; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 36px; border-radius: 10px; box-shadow: 0 4px 12px rgba(34, 127, 94, 0.25);">
                      Verify My Email Address &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background-color: #f8fcfa; border: 1px solid #e0ede7; border-radius: 10px; padding: 16px; margin: 24px 0 10px;">
                <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #227f5e;">
                  &#9201; Link Expiration Notice
                </p>
                <p style="margin: 0; font-size: 13px; color: #5a756b; line-height: 1.4;">
                  This verification link will expire in <strong>24 hours</strong>. If it expires, you can request a new link at any time from your dashboard or sign-in page.
                </p>
              </div>

              <p style="margin: 20px 0 8px; font-size: 12px; color: #82918b;">
                If the button above doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0; font-size: 12px; word-break: break-all;">
                <a href="{verification_url}" style="color: #227f5e; text-decoration: underline;">{verification_url}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fcfa; padding: 24px 40px; border-top: 1px solid #eef4f0; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 12px; color: #82918b;">
                If you did not register for a MediMall account, you can safely ignore this email.
              </p>
              <p style="margin: 0; font-size: 11px; color: #a4b3ac;">
                &copy; 2026 MediMall Healthcare Technologies. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_email_smtp(to_email: str, subject: str, html_content: str) -> bool:
    """
    Sends an email using standard SMTP (e.g. Gmail SMTP, Brevo, AWS SES, etc.).
    Supports TLS (port 587) and SSL (port 465).
    """
    host = settings.smtp_host.strip() if settings.smtp_host else "smtp.gmail.com"
    port = settings.smtp_port or 587
    username = settings.smtp_user.strip() if settings.smtp_user else ""
    password = settings.smtp_password.strip() if settings.smtp_password else ""

    sender_email = settings.smtp_from_email.strip() if settings.smtp_from_email else username
    if not sender_email:
        sender_email = username

    if not (username and password):
        logger.error("SMTP credentials missing: smtp_user or smtp_password is empty")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        # If sender_email does not already include display name formatting, wrap nicely
        if "<" not in sender_email and ">" not in sender_email:
            msg["From"] = formataddr(("MediMall", sender_email))
        else:
            msg["From"] = sender_email
        msg["To"] = to_email

        part_html = MIMEText(html_content, "html", "utf-8")
        msg.attach(part_html)

        if port == 465:
            with smtplib.SMTP_SSL(host, port, timeout=20) as server:
                server.login(username, password)
                server.sendmail(msg["From"], [to_email], msg.as_string())
        else:
            with smtplib.SMTP(host, port, timeout=20) as server:
                server.ehlo()
                if settings.smtp_use_tls:
                    server.starttls()
                    server.ehlo()
                server.login(username, password)
                server.sendmail(msg["From"], [to_email], msg.as_string())

        logger.info("Email sent via SMTP (%s:%s) to %s (Subject: %s)", host, port, to_email, subject)
        return True
    except Exception as err:
        logger.error("Failed to send email via SMTP to %s: %s", to_email, err)
        return False


def send_email_brevo(to_email: str, subject: str, html_content: str, user_name: str = "") -> bool:
    """
    Sends an email using Brevo's Transactional Email REST API over HTTPS (Port 443).
    Safe and unblocked on cloud hosting platforms like Render, Vercel, and Railway.
    """
    api_key = settings.brevo_api_key.strip() if settings.brevo_api_key else ""
    if not api_key:
        logger.error("Brevo API key is missing")
        return False

    sender_email = (settings.brevo_sender_email or settings.smtp_user or "").strip()
    sender_name = (settings.brevo_sender_name or "MediMall").strip()

    if not sender_email:
        logger.error("Brevo sender email is missing (set BREVO_SENDER_EMAIL)")
        return False

    payload = {
        "sender": {"name": sender_name, "email": sender_email},
        "to": [{"email": to_email, "name": user_name or to_email}],
        "subject": subject,
        "htmlContent": html_content,
    }

    req = urllib.request.Request(
        url="https://api.brevo.com/v3/smtp/email",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "MediMall-Backend/1.0",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            status_code = response.getcode()
            if 200 <= status_code < 300:
                logger.info("Email sent via Brevo HTTPS API to %s (Subject: %s)", to_email, subject)
                return True
            res_body = response.read().decode("utf-8", errors="replace")
            logger.error("Brevo API returned unexpected status %s: %s", status_code, res_body)
            return False
    except urllib.error.HTTPError as http_err:
        err_content = http_err.read().decode("utf-8", errors="replace")
        logger.error("Brevo HTTP error %s sending to %s: %s", http_err.code, to_email, err_content)
        return False
    except Exception as err:
        logger.error("Failed to send email via Brevo to %s: %s", to_email, err)
        return False


def _get_active_provider() -> str:
    """Determines which email provider to use: 'brevo', 'smtp', 'resend', or 'dev'."""
    explicit = (settings.email_provider or "").strip().lower()
    if explicit in ("brevo", "smtp", "resend"):
        return explicit
    # Auto-detection priority:
    if settings.brevo_api_key:
        return "brevo"
    if settings.smtp_user and settings.smtp_password:
        return "smtp"
    if settings.resend_api_key:
        return "resend"
    return "dev"


def send_verification_email(to_email: str, user_name: str, raw_token: str) -> bool:
    """
    Sends a branded verification email to the user using the configured provider (Brevo, SMTP, or Resend).
    If no provider is configured, logs the verification link to the console.
    """
    base_url = settings.frontend_url.rstrip("/")
    verification_url = f"{base_url}/verify-email?token={raw_token}"
    html_content = get_verification_email_html(user_name=user_name, verification_url=verification_url)
    subject = "Verify your email address - MediMall"

    provider = _get_active_provider()

    if provider == "brevo":
        success = send_email_brevo(to_email=to_email, subject=subject, html_content=html_content, user_name=user_name)
        if success:
            return True
        logger.info("[BREVO FALLBACK] Verification link for %s: %s", to_email, verification_url)
        return False

    elif provider == "smtp":
        success = send_email_smtp(to_email=to_email, subject=subject, html_content=html_content)
        if success:
            return True
        logger.info("[SMTP FALLBACK] Verification link for %s: %s", to_email, verification_url)
        return False

    elif provider == "resend":
        api_key = settings.resend_api_key.strip() if settings.resend_api_key else ""
        if api_key:
            try:
                resend.api_key = api_key
                params: resend.Emails.SendParams = {
                    "from": settings.resend_from_email,
                    "to": [to_email],
                    "subject": subject,
                    "html": html_content,
                }
                email_response = resend.Emails.send(params)
                logger.info("Verification email sent via Resend to %s: ID %s", to_email, email_response.get("id"))
                return True
            except Exception as err:
                logger.error("Failed to send verification email via Resend to %s: %s", to_email, err)
                logger.info("[RESEND FALLBACK] Verification link for %s: %s", to_email, verification_url)
                return False

    # Development / test mode fallback when no email credentials are provided
    logger.warning(
        "No email provider credentials set. [DEV VERIFICATION LINK for %s]: %s",
        to_email,
        verification_url,
    )
    print(f"\n========================================================")
    print(f"[MEDIMALL EMAIL SERVICE - DEV SIMULATION]")
    print(f"To: {to_email} ({user_name})")
    print(f"Verification URL: {verification_url}")
    print(f"========================================================\n")
    return True


def get_password_reset_email_html(user_name: str, reset_url: str) -> str:
    """Generates a responsive, branded HTML password reset email template for MediMall."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - MediMall</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4faf6; color: #16342e;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4faf6; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="560" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(22, 52, 46, 0.08); border: 1px solid #dbe6df;">
          
          <!-- Header / Brand -->
          <tr>
            <td style="background-color: #16342e; padding: 32px 40px; text-align: center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <span style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                      Medi<span style="color: #4cd69a;">Mall</span>
                    </span>
                    <p style="margin: 6px 0 0; font-size: 12px; color: #a3c4b8; letter-spacing: 1px; text-transform: uppercase;">Hyperlocal Healthcare &amp; Pharmacy</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #16342e;">
                Reset Your Password
              </h1>
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #4e6a5f;">
                Hello {user_name}, we received a request to reset the password for your MediMall account. Click the button below to choose a new password.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="{reset_url}" target="_blank" style="display: inline-block; background-color: #227f5e; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 36px; border-radius: 10px; box-shadow: 0 4px 12px rgba(34, 127, 94, 0.25);">
                      Reset Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background-color: #f8fcfa; border: 1px solid #e0ede7; border-radius: 10px; padding: 16px; margin: 24px 0 10px;">
                <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #227f5e;">
                  &#9201; Link Expiration Notice
                </p>
                <p style="margin: 0; font-size: 13px; color: #5a756b; line-height: 1.4;">
                  This password reset link is valid for <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your account remains completely secure.
                </p>
              </div>

              <p style="margin: 20px 0 8px; font-size: 12px; color: #82918b;">
                If the button above doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0; font-size: 12px; word-break: break-all;">
                <a href="{reset_url}" style="color: #227f5e; text-decoration: underline;">{reset_url}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fcfa; padding: 24px 40px; border-top: 1px solid #eef4f0; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 12px; color: #82918b;">
                MediMall Healthcare &middot; Bangalore, Karnataka, India
              </p>
              <p style="margin: 0; font-size: 11px; color: #a4b3ac;">
                &copy; 2026 MediMall Healthcare Technologies. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_password_reset_email(to_email: str, user_name: str, raw_token: str) -> bool:
    """
    Sends a branded password reset email to the user using the configured provider (Brevo, SMTP, or Resend).
    If no provider is configured, logs the reset link to the console.
    """
    base_url = settings.frontend_url.rstrip("/")
    reset_url = f"{base_url}/reset-password?token={raw_token}"
    html_content = get_password_reset_email_html(user_name=user_name, reset_url=reset_url)
    subject = "Reset your password - MediMall"

    provider = _get_active_provider()

    if provider == "brevo":
        success = send_email_brevo(to_email=to_email, subject=subject, html_content=html_content, user_name=user_name)
        if success:
            return True
        logger.info("[BREVO FALLBACK] Password reset link for %s: %s", to_email, reset_url)
        return False

    elif provider == "smtp":
        success = send_email_smtp(to_email=to_email, subject=subject, html_content=html_content)
        if success:
            return True
        logger.info("[SMTP FALLBACK] Password reset link for %s: %s", to_email, reset_url)
        return False

    elif provider == "resend":
        api_key = settings.resend_api_key.strip() if settings.resend_api_key else ""
        if api_key:
            try:
                resend.api_key = api_key
                params: resend.Emails.SendParams = {
                    "from": settings.resend_from_email,
                    "to": [to_email],
                    "subject": subject,
                    "html": html_content,
                }
                email_response = resend.Emails.send(params)
                logger.info("Password reset email sent via Resend to %s: ID %s", to_email, email_response.get("id"))
                return True
            except Exception as err:
                logger.error("Failed to send password reset email via Resend to %s: %s", to_email, err)
                logger.info("[RESEND FALLBACK] Password reset link for %s: %s", to_email, reset_url)
                return False

    logger.warning(
        "No email provider credentials set. [DEV PASSWORD RESET LINK for %s]: %s",
        to_email,
        reset_url,
    )
    print(f"\n========================================================")
    print(f"[MEDIMALL EMAIL SERVICE - PASSWORD RESET DEV SIMULATION]")
    print(f"To: {to_email} ({user_name})")
    print(f"Password Reset URL: {reset_url}")
    print(f"========================================================\n")
    return True
