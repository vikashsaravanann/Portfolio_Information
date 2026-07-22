# Vikash's AI Portfolio Platform

This repository contains the source code for Vikash's professional developer portfolio. It features a custom AI Chatbot, automated workflow bridges, a unified serverless contact delivery backend, and a premium modern UI design.

## Recent UI/UX Enhancements
We recently undertook a comprehensive redesign to ensure the portfolio reflects enterprise-level standards:
* **Component Restyling**:
  * Transformed the "Get In Touch" and "Visitor Guest Book" forms into sharp, fully-covered rectangular layouts (`100%` width, `8px` border radius) for a sleek, modern appearance without awkward gaps.
  * Reordered the footer widgets to prioritize key information: *About the Engineer*, *Contact Card*, *Quick Actions*, and *Digital Presence*.
  * Cleaned up the "Quick Actions" and "Digital Presence" link lists, removing boxed borders and backgrounds, and utilizing a unified professional accent color (`#0ea5e9`) for all icons.
* **Typography & Styling**: Upgraded the "About Me" section and headers using the professional 'Outfit' font (bold), enhancing visual hierarchy and readability.
* **Integrations**: Integrated a dynamic LinkedIn profile badge block directly into the UI.
* **AI Chatbot**: Fixed click-handling bugs in the AI Chatbot's send button and quick-action chips to ensure lightning-fast responsiveness.

## Contact Form Backend Configuration

Both contact forms (the main footer contact form and the interactive form inside the AI Chatbot bubble) submit messages directly to the unified backend route `/api/contact`.

To receive incoming contact messages, configure **any** of the following notification channels in your local `.env` file or hosting environment variables dashboard. The backend will automatically detect and route messages to all configured systems:

### 1. Discord Webhooks (Recommended & Free)
Deliver form submissions directly as rich cards to a Discord server channel:
* `DISCORD_WEBHOOK_URL`: The webhook URL copied from your Discord channel settings.

### 2. Telegram Bot (Free)
Deliver form submissions as instant alerts directly to your phone via Telegram:
* `TELEGRAM_BOT_TOKEN`: The HTTP API token received from `@BotFather`.
* `TELEGRAM_CHAT_ID`: Your private Telegram user chat ID (you can get this by messaging `@userinfobot`).

### 3. SMTP Emails (Nodemailer)
Deliver submissions directly to your email inbox:
* `SMTP_HOST`: The SMTP server host address (e.g., `smtp.gmail.com`).
* `SMTP_PORT`: The connection port, typically `465` (SSL/TLS) or `587` (STARTTLS).
* `SMTP_USER`: The sender email address.
* `SMTP_PASS`: The sender account password (if using Gmail, generate and use a secure **App Password**).
* `CONTACT_RECEIVER_EMAIL`: The inbox address where you want to receive these messages (defaults to `vikash07052008@gmail.com` if left blank).

---

## Local Development

1. Install local dependencies:
   ```bash
   npm install
   ```
2. Start the local Express bridge server:
   ```bash
   npm start
   ```
3. Open `index.html` in your browser. The frontend will automatically detect localhost and route form submissions and chatbot completions to `http://localhost:3000`.

---

## Broadcast Automation Hub

The **Broadcast Automation Hub** (`automation-hub.html`) allows you to dispatch multi-channel announcements to a pre-defined list of recipients. 
It supports parallel dispatching to **Email (SMTP)**, **SMS (Fast2SMS)**, **Telegram**, and **WhatsApp (Cloud API)**.

### Accessing the Hub
The hub requires authentication. Set the `BROADCAST_ADMIN_TOKEN` in your environment variables. 
When you visit the page, you will be prompted to enter this token.

### Setting up the Channels

#### 1. Telegram
To allow recipients to receive Telegram broadcasts, they must start a conversation with your bot.
1. Set `TELEGRAM_BROADCAST_BOT_TOKEN` in your environment.
2. Set a secure `TELEGRAM_WEBHOOK_SECRET`.
3. Set your Telegram Bot's webhook to point to your live site:
   `https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://your-domain.com/api/broadcast/telegram-webhook?secret=<YOUR_SECRET>`
4. When a user sends `/start` to your bot, it will reply with their Chat ID. Add this ID to their profile in your recipient source.

#### 2. WhatsApp (Option A: Meta Cloud API)
To send WhatsApp messages serverlessly, you must use the official Meta WhatsApp Business Cloud API.
1. Register as a Meta Developer and create an App with WhatsApp access.
2. Generate a permanent access token and note your Phone Number ID.
3. Add `WHATSAPP_CLOUD_API_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` to your environment.
*(Note: To send freeform text messages, an active 24-hour service window with the user is required. Otherwise, you must configure pre-approved templates in the code.)*

#### 3. SMS (Fast2SMS)
Set `FAST2SMS_API_KEY`. It automatically parses 10-digit Indian phone numbers.

### Recipient Data Source
For security, recipient data is not stored in the repository. Provide a JSON file endpoint in `BROADCAST_RECIPIENTS_SOURCE`. The JSON must be an array of objects like:
```json
[
  {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "telegram_chat_id": "123456789"
  }
]
```
