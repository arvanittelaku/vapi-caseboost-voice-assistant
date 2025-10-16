# CaseBoost Voice Assistant

A sophisticated voice assistant system for CaseBoost legal client growth agency, built with VAPI.ai, GoHighLevel CRM, and Twilio integration.

## 🚀 Features

- **AI-Powered Voice Assistant**: 24/7 automated lead qualification with <30 second response time
- **Performance-Based Pricing**: Pay only for qualified leads and results
- **Multi-Service Integration**: VAPI.ai, GoHighLevel CRM, Twilio SMS/Voice
- **Legal Industry Specialized**: Optimized for high-value practice areas
- **Comprehensive Knowledge Base**: Services, pricing, FAQ, policies, and case studies
- **Real-time Webhooks**: Seamless integration with CRM and communication systems
- **Automated Testing**: Comprehensive test suite for all integrations

## 📋 Prerequisites

- Node.js 18+
- VAPI.ai account and API key
- GoHighLevel CRM account and API key
- Twilio account with SMS and Voice capabilities
- Webhook endpoint (for production deployment)

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/arvanittelaku/vapi-caseboost-voice-assistant.git
   cd vapi-caseboost-voice-assistant
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env
   ```

   Edit `.env` with your API keys and configuration:

   ```env
   # VAPI Configuration
   VAPI_API_KEY=your_vapi_api_key_here
   VAPI_ASSISTANT_ID=your_assistant_id_here
   VAPI_PHONE_NUMBER_ID=your_phone_number_id_here

   # GoHighLevel CRM Configuration
   GOHIGHLEVEL_API_KEY=your_ghl_api_key_here
   GOHIGHLEVEL_LOCATION_ID=your_location_id_here

   # Twilio Configuration
   TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
   TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
   TWILIO_PHONE_NUMBER=your_twilio_phone_number_here

   # Webhook Configuration
   WEBHOOK_SECRET=your_generated_webhook_secret_here
   WEBHOOK_BASE_URL=https://yourdomain.com

   # CaseBoost Specific Configuration
   BOOKING_LINK_BASE=https://calendly.com/caseboost/consultation
   COMPANY_PHONE=02039673689
   COMPANY_EMAIL=contact@caseboost.co.uk
   COMPANY_WEBSITE=https://caseboost.co.uk

   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

## 🚀 Quick Start

1. **Test connections**

   ```bash
   npm test
   ```

2. **Deploy assistant to VAPI**

   ```bash
   npm run deploy
   ```

3. **Start webhook server**

   ```bash
   npm start
   ```

4. **Test with a real call**
   ```bash
   npm run test-vapi-call +1234567890
   ```

## 📚 Available Scripts

| Script                      | Description                                        |
| --------------------------- | -------------------------------------------------- |
| `npm start`                 | Start the webhook server                           |
| `npm run dev`               | Start in development mode with auto-reload         |
| `npm run deploy`            | Deploy assistant to VAPI and upload knowledge base |
| `npm test`                  | Run comprehensive tests for all integrations       |
| `npm run test-sms`          | Test SMS functionality                             |
| `npm run test-vapi-call`    | Test VAPI call functionality                       |
| `npm run generate-agent`    | Generate new agent from configuration              |
| `npm run generate-template` | Generate configuration template                    |

## 🏗️ Project Structure

```
vapi-caseboost-voice-assistant/
├── src/
│   ├── config/
│   │   └── assistant-config.js      # CaseBoost agent configuration
│   ├── services/
│   │   ├── vapi-client.js          # VAPI.ai integration
│   │   ├── ghl-client.js           # GoHighLevel CRM integration
│   │   ├── sms-client.js           # Twilio SMS integration
│   │   └── twilio-voice.js         # Twilio Voice integration
│   ├── webhooks/
│   │   └── vapi-webhook.js         # Webhook handler for all services
│   └── index.js                     # Main application entry point
├── scripts/
│   ├── deploy.js                   # Deployment automation
│   ├── test.js                     # Comprehensive testing suite
│   └── generate-agent.js           # Agent generation utilities
├── base-knowledge/
│   ├── brand-guidelines.txt        # Brand guidelines and voice
│   ├── business-model.txt          # Business model and pricing
│   ├── compliance.txt              # Compliance and legal requirements
│   ├── contact-information.txt     # Contact details and information
│   ├── conversation-flows.txt      # Conversation flow patterns
│   ├── data-models.txt             # Data structure and models
│   ├── performance-metrics.txt     # Performance tracking metrics
│   ├── practice-areas.txt          # Legal practice area specializations
│   ├── technical-integration.txt   # Technical integration details
│   └── vapi-implementation.txt     # VAPI-specific implementation guide
├── package.json                    # Dependencies and scripts
├── env.example                     # Environment variables template
└── README.md                       # This file
```

## 🔧 Configuration

### VAPI Assistant Configuration

The assistant is configured in `src/config/assistant-config.js` with:

- **Model**: GPT-4o for advanced conversation handling
- **Voice**: Professional female voice (Sarah)
- **Transcriber**: Deepgram Nova-2 for UK English
- **Tools**: Lead status updates and consultation scheduling
- **Knowledge Base**: Comprehensive legal industry content

### Practice Areas Supported

**High-Value Practice Areas:**

- Medical Negligence (£250K+ average case value)
- Immigration Law (£15K+ average case value)
- Personal Injury (£25K+ average case value)
- Family Law (£12K+ average case value)

**Secondary Practice Areas:**

- Employment Law
- Probate & Will Disputes
- Group Actions & Class Actions
- Criminal Defence
- Commercial Litigation
- Property & Landlord Law

## 🔗 API Integrations

### VAPI.ai Integration

- **Purpose**: Voice AI assistant and call management
- **Features**: Lead qualification, conversation flow, function calls
- **Webhook**: `/webhook/vapi` for call events and function calls

### GoHighLevel CRM Integration

- **Purpose**: Contact management and workflow automation
- **Features**: Contact creation, lead scoring, task management
- **Webhook**: `/webhook/ghl` for contact events and form submissions

### Twilio Integration

- **SMS**: Automated follow-up messages and booking links
- **Voice**: Incoming call handling and call transfers
- **Webhooks**: `/webhook/twilio/*` for SMS and voice events

## 📊 Performance Metrics

CaseBoost has achieved:

- **500+ Cases Generated**
- **£2.5M+ Client Revenue**
- **95% Client Retention Rate**
- **3.2x Average ROAS**
- **<30 Second Response Time**
- **99.9% System Uptime**

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Test Specific Components

```bash
# Test SMS functionality
npm run test-sms +1234567890

# Test VAPI call
npm run test-vapi-call +1234567890
```

### Test Coverage

- Environment variable validation
- Service connection testing
- VAPI configuration verification
- GoHighLevel integration testing
- Twilio services testing
- Webhook endpoint testing
- Knowledge base validation

## 🚀 Deployment

### Production Deployment

1. **Set up production environment**

   ```bash
   # Update .env with production values
   NODE_ENV=production
   WEBHOOK_BASE_URL=https://yourdomain.com
   ```

2. **Deploy to VAPI**

   ```bash
   npm run deploy
   ```

3. **Start production server**

   ```bash
   npm start
   ```

4. **Configure webhooks**
   - VAPI webhook: `https://yourdomain.com/webhook/vapi`
   - GoHighLevel webhook: `https://yourdomain.com/webhook/ghl`
   - Twilio webhooks: `https://yourdomain.com/webhook/twilio/*`

### Webhook Configuration

**VAPI Webhook Events:**

- `call-started`: Call initiation
- `call-ended`: Call completion
- `function-call`: Tool function execution
- `transcript`: Real-time transcription
- `summary`: AI-generated call summary

**GoHighLevel Webhook Events:**

- `ContactCreated`: New contact creation
- `ContactUpdated`: Contact information updates
- `FormSubmitted`: Form submission events

**Twilio Webhook Events:**

- SMS incoming/outgoing
- Voice call status updates
- Recording and transcription

## 🔒 Security

- **Webhook Signature Verification**: All webhooks verify signatures
- **Environment Variable Protection**: Sensitive data in environment variables
- **GDPR Compliance**: Full GDPR compliance for data handling
- **Data Encryption**: All data encrypted in transit and at rest
- **Access Controls**: Proper access controls and monitoring

## 📈 Monitoring

### Health Check Endpoint

```bash
curl https://yourdomain.com/health
```

### Key Metrics to Monitor

- Call connection rates
- Lead qualification rates
- Response times
- System uptime
- Error rates
- Client satisfaction scores

## 🤝 Support

### Getting Help

- **Documentation**: This README and inline code comments
- **Issues**: GitHub Issues for bug reports and feature requests
- **Support**: Contact CaseBoost team at contact@caseboost.co.uk

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **VAPI.ai** for voice AI capabilities
- **GoHighLevel** for CRM integration
- **Twilio** for SMS and voice services
- **CaseBoost Team** for legal industry expertise

---

**CaseBoost Voice Assistant** - Transforming legal client acquisition through AI-powered voice technology.

For more information, visit [CaseBoost.co.uk](https://caseboost.co.uk) or contact us at contact@caseboost.co.uk.
