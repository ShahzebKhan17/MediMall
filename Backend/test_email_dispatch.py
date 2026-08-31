import sys
import os

# Add Backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import get_settings
from app.services import email as email_service

def main():
    settings = get_settings()
    print("=" * 60)
    print(" MediMall Email Service Diagnostic Tool")
    print("=" * 60)
    
    provider = email_service._get_active_provider()
    print(f"Active Provider: {provider.upper()}")
    
    if provider == "brevo":
        print(f"  Brevo API Key configured: {'YES' if settings.brevo_api_key else 'NO'}")
        print(f"  Brevo Sender Email: {settings.brevo_sender_email or settings.smtp_user}")
        print(f"  Brevo Sender Name: {settings.brevo_sender_name}")
    elif provider == "smtp":
        print(f"  SMTP Host: {settings.smtp_host}:{settings.smtp_port}")
        print(f"  SMTP User: {settings.smtp_user}")
        print(f"  SMTP From: {settings.smtp_from_email or settings.smtp_user}")
        print(f"  SMTP Password configured: {'YES' if settings.smtp_password else 'NO'}")
    elif provider == "resend":
        print(f"  Resend API Key configured: {'YES' if settings.resend_api_key else 'NO'}")
        print(f"  Resend From: {settings.resend_from_email}")
    else:
        print("  Mode: DEV SIMULATION (No credentials configured)")
        
    print("-" * 60)
    
    target_email = sys.argv[1] if len(sys.argv) > 1 else None
    if not target_email:
        print("Usage: python test_email_dispatch.py <recipient_email>")
        print("Example: python test_email_dispatch.py testuser@gmail.com")
        return

    print(f"Sending test verification email to: {target_email} ...")
    success = email_service.send_verification_email(
        to_email=target_email,
        user_name="Test User",
        raw_token="diagnostic_test_token_12345"
    )
    
    if success:
        print(f"\n[SUCCESS] Test email successfully dispatched to {target_email}!")
        print("Please check the inbox (and spam/promotions folder) for the email.")
    else:
        print(f"\n[FAILED] Could not send test email to {target_email}.")
        print("Check your SMTP_USER, SMTP_PASSWORD, or network connection.")
    print("=" * 60)

if __name__ == "__main__":
    main()
