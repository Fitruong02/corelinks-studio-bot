// ===== README.md =====
# Corelinks Studio Discord Bot

Professional Discord bot for Corelinks Studio with comprehensive ticket management, payment integration, voice channel management, moderation tools, and analytics.

## 🚀 Features

### 🎫 Anonymous Ticket System
- Anonymous ticket creation with unique TICKET-XXXX and CUST-XXXX codes
- Service selection (Game, Discord, Minecraft) with specialized staff assignment
- Staff approval workflow with priority levels
- DM proxy system for anonymous communication
- Auto-close after 7 days of inactivity
- 5-star rating system with anonymous feedback

### 💰 Payment Integration (PayOS)
- Create invoices with full/deposit payment options
- QR code and banking link generation
- Automatic Customer role assignment on payment
- Refund system (doesn't affect revenue analytics)
- Payment timeout and reminder system
- Comprehensive payment logging

### 🔊 Voice Management
- Temporary voice channels with auto-creation
- User controls: rename, lock, limit, hide, invite, delete
- Auto-cleanup after 5 minutes of inactivity
- Permission-based channel ownership
- Comprehensive voice activity logging

### 🛡️ Moderation System
- Commands: warn, timeout, mute, kick, ban, rolelock
- Mass moderation actions for bulk operations
- Auto-moderation: spam, invite links, @everyone mentions
- Configurable thresholds and actions
- Message clearing with user filtering

### 📊 Analytics & Reporting
- Google Sheets integration for data storage
- Weekly automated reports to Founder
- Ticket, revenue, and satisfaction metrics
- Member growth tracking
- Performance analytics dashboard

### 🔔 Alert System
- Scheduled reminders for staff and founders
- Meeting notifications with attendee alerts
- Customizable alert delivery (DM/Channel)
- Recurring daily alerts option

### 👥 Role Management
- Emoji-based role picker system
- Mass role assignment/removal
- Role hierarchy and permission management
- Interactive role selection menus

### 📝 Comprehensive Logging
- Join/leave tracking with invite detection
- Voice activity monitoring
- Message edit/delete logging
- Command usage tracking
- Payment activity logs
- Moderation action logs

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js 18+ with TypeScript
- **Discord Library**: Discord.js v14
- **Database**: MySQL 8.0
- **Payment Gateway**: PayOS (Vietnam)
- **Analytics**: Google Sheets API
- **Deployment**: Pterodactyl Panel (No Docker)

### Project Structure
```
corelinks-bot/
├── src/
│   ├── config/          # Configuration management
│   ├── commands/        # Slash command handlers
│   ├── events/          # Discord event handlers
│   ├── modules/         # Core business logic
│   │   ├── ticket/      # Ticket management system
│   │   ├── payment/     # PayOS payment integration
│   │   ├── voice/       # Voice channel management
│   │   ├── moderation/  # Moderation tools
│   │   ├── logging/     # Logging system
│   │   ├── role/        # Role management
│   │   ├── alert/       # Alert/reminder system
│   │   └── analytics/   # Analytics and reporting
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript type definitions
│   └── database/        # Database models and migrations
├── package.json
├── tsconfig.json
├── nodemon.json
└── .env.example
```

## ⚙️ Installation & Setup

### Prerequisites
- Node.js 18.0.0 or higher
- MySQL 8.0 or higher
- Discord Bot Token
- PayOS API credentials
- Google Service Account for Sheets API

### 1. Environment Setup
```bash
# Clone the repository
git clone <repository-url>
cd corelinks-bot

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
```

### 2. Environment Configuration
Edit `.env` file with your credentials:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token
GUILD_ID=your_discord_guild_id
CLIENT_ID=your_discord_application_id

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=corelinks_bot
DB_USER=your_db_user
DB_PASS=your_db_password

# PayOS Configuration (Optional if payment disabled)
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key

# Google Sheets Configuration (Optional if analytics disabled)
GOOGLE_SHEETS_ID=your_google_sheets_id
GOOGLE_CREDENTIALS=your_service_account_json

# Feature Flags
ENABLE_TICKET_SYSTEM=true
ENABLE_PAYMENT_SYSTEM=true
ENABLE_VOICE_MANAGEMENT=true
ENABLE_MODERATION=true
ENABLE_ANALYTICS=true
ENABLE_ALERT_SYSTEM=true
ENABLE_ROLE_MANAGEMENT=true
ENABLE_AUTO_MODERATION=true
ENABLE_INVITE_TRACKING=true
ENABLE_RATING_SYSTEM=true

# Auto-Setup
AUTO_CREATE_CHANNELS=true
AUTO_CREATE_ROLES=true
AUTO_SETUP_PERMISSIONS=true
```

### 3. Database Setup
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE corelinks_bot;

# Database tables will be created automatically on first run
```

### 4. Discord Setup
1. Create application at https://discord.com/developers/applications
2. Create bot and copy token to `DISCORD_TOKEN`
3. Enable required intents:
   - Guilds
   - Guild Messages
   - Message Content
   - Guild Members
   - Guild Voice States
   - Guild Message Reactions
   - Direct Messages
   - Guild Invites

### 5. Role Setup
The bot will auto-create missing roles if `AUTO_CREATE_ROLES=true`:
- **Founder**: Full access to all features
- **Staff**: Moderation and ticket management
- **Customer**: Basic access after payment
- **Game Service Staff**: Specialized for game services
- **Discord Service Staff**: Specialized for Discord services
- **Minecraft Service Staff**: Specialized for Minecraft services

### 6. Channel Setup
The bot will auto-create missing channels if `AUTO_CREATE_CHANNELS=true`:
- `#ticket-requests` - Staff ticket approval
- `#ticket-logs` - Ticket activity logs
- `#payment-logs` - Payment activity logs
- `#voice-logs` - Voice and chat activity logs
- `#mod-logs` - Moderation action logs
- `#automod-logs` - Auto-moderation logs
- `#join-leave` - Member join/leave tracking
- `#invite-logs` - Invite usage tracking
- `#cmd-logs` - Command usage logs
- `#alerts` - System alerts and reminders
- `➕ Tạo phòng mới` - Voice channel creator

## 🚀 Running the Bot

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Pterodactyl Deployment
1. Create new server with Node.js egg
2. Upload project files
3. Set startup command: `npm start`
4. Configure environment variables in panel
5. Start the server

## 📖 Usage Guide

### For Customers
1. **Create Ticket**: Use `/ticket create` or react to service selection
2. **Check Status**: Use `/ticket status` to view your ticket
3. **Payment**: Receive invoice via DM, pay with QR code or banking link
4. **Voice Channels**: Join "➕ Tạo phòng mới" to create temporary channel
5. **Rate Service**: Provide 5-star rating when ticket closes

### For Staff
1. **Approve Tickets**: Monitor `#ticket-requests` and use approval buttons
2. **Create Invoices**: Use `/invoice create` with customer details
3. **Moderation**: Use `/warn`, `/timeout`, `/kick`, `/ban` commands
4. **Mass Actions**: Use `/mass` commands for bulk operations
5. **Alerts**: Use `/alert create` for reminders and notifications

### For Founders
1. **Analytics**: Receive weekly reports via DM
2. **Management**: Full access to all staff commands
3. **Configuration**: Modify auto-mod settings and feature flags
4. **Oversight**: Access to all logs and analytics data

## 🔧 Configuration

### Feature Flags
Enable/disable features by setting environment variables:
- `ENABLE_TICKET_SYSTEM=false` - Disable ticket system
- `ENABLE_PAYMENT_SYSTEM=false` - Disable PayOS integration
- `ENABLE_ANALYTICS=false` - Disable Google Sheets reporting

### Auto-Moderation Settings
Configure thresholds and actions via database or commands:
- Invite link detection and removal
- Spam detection with customizable thresholds
- @everyone mention protection
- Custom link blocking with regex patterns

### Voice Management
- Auto-delete timeout: 5 minutes (configurable)
- Default user limit: 10 users
- Permission-based channel control

## 📊 Analytics & Reports

### Weekly Reports Include:
- Total tickets created and resolved
- Revenue generated (excluding refunds)
- Average customer satisfaction rating
- Member growth statistics
- Week-over-week comparisons

### Google Sheets Integration:
- Real-time data synchronization
- Separate sheets for tickets, payments, ratings
- Automated weekly report generation
- Export capabilities for advanced analysis

## 🛠️ Troubleshooting

### Common Issues:

1. **Bot not responding to commands**
   - Check Discord token validity
   - Verify bot permissions in server
   - Ensure required intents are enabled

2. **Database connection errors**
   - Verify MySQL credentials
   - Check database exists and is accessible
   - Ensure tables are created (auto-created on startup)

3. **PayOS payment failures**
   - Verify PayOS credentials
   - Check API key permissions
   - Ensure webhook URL is accessible

4. **Google Sheets errors**
   - Verify service account credentials
   - Check sheet permissions (share with service account email)
   - Ensure Sheets API is enabled

### Debug Mode:
Set `LOG_LEVEL=debug` in environment for detailed logging.

## 🔒 Security Considerations

- Bot token and API keys stored securely in environment variables
- Anonymous ticket system protects customer identity
- Permission-based access control for all features
- Input validation on all user inputs
- Rate limiting on API calls to prevent abuse

## 📝 License

This project is proprietary software developed for Corelinks Studio. All rights reserved.

## 🆘 Support

For technical support or feature requests:
1. Create ticket using the bot's ticket system
2. Contact Corelinks Studio development team
3. Check logs for error details before reporting issues

---

**Corelinks Studio Discord Bot** - Professional customer support and server management solution.