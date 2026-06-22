import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

BREVO_SMTP_SERVER = "smtp-brevo.com"
BREVO_SMTP_USER = os.getenv("BREVO_SMTP_USER")
BREVO_SMTP_PASS = os.getenv("BREVO_SMTP_PASS")
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL", "dangimahima94@gmail.com")

def try_send_email(port, use_ssl=False):
    print(f"\n--- Trying Port {port} (SSL: {use_ssl}) ---")
    receiver_email = "mahimadangi78@gmail.com"
    msg = MIMEMultipart()
    msg['From'] = f"Task Allotment System <{BREVO_SENDER_EMAIL}>"
    msg['To'] = receiver_email
    msg['Subject'] = f"SMTP Test Email - Port {port}"
    
    body = f"This is a test email using Brevo SMTP from Python on port {port}."
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        if use_ssl:
            print("Connecting via SMTP_SSL...")
            server = smtplib.SMTP_SSL(BREVO_SMTP_SERVER, port, timeout=10)
        else:
            print("Connecting via SMTP...")
            server = smtplib.SMTP(BREVO_SMTP_SERVER, port, timeout=10)
            print("Starting TLS...")
            server.starttls()
        
        print("Logging in...")
        server.login(BREVO_SMTP_USER, BREVO_SMTP_PASS)
        print("Sending email...")
        server.sendmail(BREVO_SENDER_EMAIL, receiver_email, msg.as_string())
        server.quit()
        print(f"SMTP successful on port {port}!")
        return True
    except Exception as e:
        print(f"Failed on port {port}: {e}")
        return False

if __name__ == "__main__":
    if not BREVO_SMTP_USER or not BREVO_SMTP_PASS:
        print("Error: SMTP credentials not loaded.")
        exit(1)
        
    # Try port 587, 2525, 465
    for port, use_ssl in [(587, False), (2525, False), (465, True)]:
        if try_send_email(port, use_ssl):
            break
