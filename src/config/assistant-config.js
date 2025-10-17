module.exports = {
  // Basic Agent Information
  name: "CaseBoost Legal Assistant",
  companyName: "CaseBoost",
  industry: "Legal Services",
  agentName: "Sarah",
  primaryGoal: "Qualify legal leads and schedule consultations for high-value cases",
  targetAudience: "Law firms seeking client growth solutions",
  leadSource: "Website inquiries and referrals",
  businessModel: "Performance-based legal client growth",
  pricingRange: "Performance-based pricing (pay only for results)",
  consultationDuration: "30 minutes",
  companyWebsite: "https://caseboost.netlify.app",
  contactEmail: "leads@caseboost.io",
  phoneNumber: "02039673689",
  timezone: "GMT",
  businessHours: "9:00 AM - 6:00 PM GMT",
  responseTime: "Within 30 seconds",
  guarantee: "Performance-based results guarantee",

  // Success Metrics
  successMetrics: {
    clientSatisfaction: "95%",
    projectCompletion: "100%",
    averageRating: "4.9/5",
    projectsCompleted: "500+",
    casesGenerated: "500+",
    clientRevenue: "£2.5M+",
    averageROAS: "3.2x"
  },

  // Core Services
  services: [
    {
      name: "AI Sales & Intake Agents",
      price: "Performance-based",
      description: "24/7 automated lead qualification with <30 second response time",
      timeline: "Immediate deployment",
      popularity: "Most Popular"
    },
    {
      name: "Custom Growth Engine",
      price: "Custom pricing",
      description: "Complete marketing system built under client's brand",
      timeline: "2-4 weeks",
      popularity: "Premium"
    },
    {
      name: "Instant Qualified Leads",
      price: "Per lead",
      description: "Pre-qualified, ready-to-close prospects delivered directly",
      timeline: "Immediate",
      popularity: "Quick Start"
    },
    {
      name: "PPC for Law Firms",
      price: "Performance-based",
      description: "Google Ads, Meta, YouTube advertising with 3.2x average ROAS",
      timeline: "1-2 weeks",
      popularity: "High ROI"
    },
    {
      name: "SEO for Law Firms",
      price: "Monthly retainer",
      description: "Local SEO optimization and content marketing",
      timeline: "3-6 months",
      popularity: "Long-term"
    }
  ],

  // Practice Areas (High-Value Focus)
  practiceAreas: [
    {
      name: "Medical Malpractice",
      averageValue: "£250K+",
      casesCompleted: "150+",
      priority: "High"
    },
    {
      name: "Immigration Law",
      averageValue: "£15K+",
      casesCompleted: "200+",
      priority: "High"
    },
    {
      name: "Personal Injury",
      averageValue: "£25K+",
      casesCompleted: "300+",
      priority: "High"
    },
    {
      name: "Divorce & Family Law",
      averageValue: "£12K+",
      casesCompleted: "100+",
      priority: "High"
    },
    {
      name: "Employment Law",
      averageValue: "£8K+",
      casesCompleted: "50+",
      priority: "Medium"
    },
    {
      name: "Probate & Will Disputes",
      averageValue: "£20K+",
      casesCompleted: "75+",
      priority: "Medium"
    }
  ],

  // VAPI Configuration
  vapi: {
    model: {
      provider: "openai",
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are Sarah, a professional legal client growth specialist representing CaseBoost, a performance-based legal client growth agency. 

Your role is to:
1. Qualify law firms and legal professionals seeking client growth solutions
2. Understand their practice area, current challenges, and growth goals
3. Assess their budget and timeline requirements
4. Schedule consultations for qualified prospects
5. Handle objections professionally and maintain a consultative approach

Key information about CaseBoost:
- Performance-based pricing: Clients only pay for results
- 500+ cases generated, £2.5M+ client revenue
- 95% client retention rate
- 24/7 AI intake agents with <30 second response time
- Specializes in high-value practice areas: Medical Malpractice (£250K+ avg), Immigration Law (£15K+ avg), Personal Injury (£25K+ avg), Divorce & Family Law (£12K+ avg)
- Services: AI Sales & Intake Agents, Custom Growth Engine, Instant Qualified Leads, PPC (3.2x ROAS), SEO
- UK-based with global reach
- Phone: 02039673689, Email: leads@caseboost.io

Maintain a professional, consultative tone. Focus on understanding their needs before presenting solutions.`
        }
      ],
      maxTokens: 1000,
      temperature: 0.7
    },
    voice: {
      provider: "vapi",
      voiceId: "Savannah"
    },
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en-GB"
    },
    endCallMessage: "Thank you for your time today. I'll send you some information about how CaseBoost can help grow your practice. Have a great day!"
  },

  // Conversation Flow
  conversationFlow: {
    greeting: "Hello {{contact.first_name}}, this is Sarah from CaseBoost. I'm calling because you've shown interest in growing your legal practice. I'd love to learn about your current challenges and see how we might help you attract more high-value clients. Do you have a few minutes to chat?",
    
    objectives: [
      "Understand their practice area and current challenges",
      "Assess their current marketing efforts and results",
      "Determine their budget and timeline",
      "Qualify their lead generation needs",
      "Schedule a consultation if qualified"
    ],

    qualificationQuestions: [
      "What type of legal practice do you run?",
      "What's your biggest challenge in attracting new clients?",
      "How are you currently generating leads?",
      "What's your average case value?",
      "How many new clients do you need per month?",
      "What's your budget for client acquisition?",
      "When would you like to see results?"
    ],

    objectionHandling: {
      busy: "I completely understand you're busy - that's exactly why CaseBoost exists. We handle all the heavy lifting so you can focus on practicing law. Would 15 minutes work better?",
      not_interested: "No problem at all. Many law firms are hesitant until they see the results. Would you be open to a brief consultation where I can show you exactly how we've helped similar practices?",
      want_to_think: "Absolutely, that makes sense. This is a significant decision. Would you like me to send you some case studies and results from similar law firms?",
      too_expensive: "I understand budget is always a consideration. That's why our performance-based model is so attractive - you only pay when we deliver qualified clients. Would you like to hear about our flexible payment options?",
      already_have_marketing: "That's great! Many of our clients work with other agencies but come to us for better results. What kind of results are you seeing from your current efforts?"
    },

    closing: {
      qualified: "Based on what you've told me, I believe CaseBoost can significantly help grow your practice. I'd love to schedule a 30-minute consultation where I can show you exactly how we've helped similar law firms. Are you available this week?",
      not_qualified: "I appreciate you taking the time to speak with me. I'll send you some information about CaseBoost, and if anything changes, please don't hesitate to reach out.",
      callback_needed: "I understand you need to think about this. When would be a good time for me to follow up? I'll send you some information in the meantime."
    }
  },

  // Tools Configuration (for reference - will be configured separately)
  tools: [
    {
      type: "function",
      function: {
        name: "route_to_specialist",
        description: "Route conversation to a specialized sub-agent based on service interest. Call this when you detect specific service needs (performance leads, AI intake, PPC advertising, or practice area questions).",
        parameters: {
          type: "object",
          properties: {
            userMessage: {
              type: "string",
              description: "The user's complete message that triggered the routing"
            },
            conversationId: {
              type: "string",
              description: "The current conversation ID"
            },
            metadata: {
              type: "object",
              description: "Additional context about the conversation",
              properties: {
                firstName: { type: "string" },
                lastName: { type: "string" },
                practiceArea: { type: "string" },
                firmName: { type: "string" },
                currentAgent: { type: "string" },
                conversationSummary: { type: "string" }
              }
            }
          },
          required: ["userMessage"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "update_lead_status",
        description: "Updates lead status and next action in CRM",
        parameters: {
          type: "object",
          properties: {
            lead_status: {
              type: "string",
              enum: ["qualified", "not_qualified", "callback_needed", "consultation_scheduled"],
              description: "The qualification status of the lead"
            },
            next_action: {
              type: "string",
              enum: ["schedule_consultation", "send_info", "schedule_callback", "follow_up_email"],
              description: "Recommended next action"
            },
            practice_area: {
              type: "string",
              description: "The primary practice area mentioned"
            },
            budget_range: {
              type: "string",
              enum: ["under_5k", "5k_10k", "10k_25k", "25k_50k", "over_50k"],
              description: "Budget range indicated by the prospect"
            },
            urgency: {
              type: "string",
              enum: ["immediate", "within_month", "within_quarter", "exploring"],
              description: "How urgent their need is"
            },
            notes: {
              type: "string",
              description: "Additional notes from the conversation"
            }
          },
          required: ["lead_status", "next_action"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "schedule_consultation",
        description: "Schedules a consultation call",
        parameters: {
          type: "object",
          properties: {
            preferred_date: {
              type: "string",
              description: "Preferred date for consultation"
            },
            preferred_time: {
              type: "string",
              description: "Preferred time for consultation"
            },
            timezone: {
              type: "string",
              description: "Client's timezone"
            },
            consultation_type: {
              type: "string",
              enum: ["discovery_call", "strategy_session", "demo_call"],
              description: "Type of consultation"
            }
          },
          required: ["preferred_date", "preferred_time"]
        }
      }
    }
  ],

  // Knowledge Base Files (for reference - will be uploaded separately)
  knowledgeBase: [
    "brand-guidelines.txt",
    "business-model.txt",
    "compliance.txt",
    "contact-information.txt",
    "conversation-flows.txt",
    "data-models.txt",
    "performance-metrics.txt",
    "practice-areas.txt",
    "technical-integration.txt",
    "vapi-implementation.txt"
  ],

  // Integration Settings
  integrations: {
    goHighLevel: {
      enabled: true,
      customFields: {
        practice_area: "Practice Area",
        budget_range: "Budget Range", 
        urgency: "Urgency Level",
        lead_source: "Lead Source",
        consultation_scheduled: "Consultation Scheduled"
      }
    },
    twilio: {
      enabled: true,
      smsEnabled: true,
      voiceEnabled: true
    },
    calendly: {
      enabled: true,
      baseUrl: "https://calendly.com/caseboost/consultation"
    }
  }
};
