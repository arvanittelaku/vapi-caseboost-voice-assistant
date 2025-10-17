/**
 * Routing Configuration
 * Keywords and rules for routing conversations to sub-agents
 */

module.exports = {
  // Keyword mappings for each sub-agent
  keywords: {
    paula: {
      primary: [
        'performance lead',
        'buy leads',
        'instant leads',
        'immediate leads',
        'lead delivery',
        'qualified leads',
        'pre-qualified',
        'ready to close',
        'no setup',
        'quick results'
      ],
      secondary: [
        'purchase leads',
        'get leads',
        'need cases now',
        'immediate cases',
        'fast leads'
      ]
    },
    
    alex: {
      primary: [
        'ai intake',
        'ai agent',
        'automated intake',
        'automation',
        '24/7',
        'after hours',
        'intake system',
        'chatbot',
        'voice agent',
        'miss calls'
      ],
      secondary: [
        'automate',
        'artificial intelligence',
        'chat bot',
        'virtual assistant',
        'lead capture',
        'response time'
      ]
    },
    
    peter: {
      primary: [
        'google ads',
        'ppc',
        'paid advertising',
        'facebook ads',
        'meta ads',
        'youtube ads',
        'local service ads',
        'advertising budget',
        'ad spend'
      ],
      secondary: [
        'pay per click',
        'search ads',
        'social media ads',
        'instagram ads',
        'online advertising',
        'digital marketing'
      ]
    },
    
    patricia: {
      primary: [
        'practice area',
        'case value',
        'practice growth',
        'which practice area',
        'practice specific',
        'best practice area'
      ],
      secondary: [
        'medical malpractice',
        'medical negligence',
        'personal injury',
        'pi cases',
        'car accident',
        'immigration',
        'visa',
        'divorce',
        'family law',
        'custody',
        'child support',
        'injury law'
      ]
    }
  },

  // Confidence threshold for routing
  // If confidence is below this, fallback to primary agent (Sarah)
  confidenceThreshold: 0.6,

  // Minimum keyword matches required
  minKeywordMatches: 1,

  // Weight for primary vs secondary keywords
  keywordWeights: {
    primary: 3.0,  // Increased from 2.0 to give more weight to service-specific keywords
    secondary: 1.0
  },

  // Context-based routing hints
  contextHints: {
    // If these phrases appear, boost confidence for specific agent
    'immediate': 'paula',     // Immediate needs → Paula (performance leads)
    'automate': 'alex',       // Automation → Alex (AI intake)
    'advertise': 'peter',     // Advertising → Peter (PPC)
    'practice': 'patricia'    // Practice area focus → Patricia
  },

  // Negative keywords (if present, REDUCE confidence)
  negativeKeywords: {
    paula: ['build system', 'long term', 'organic', 'seo'],
    alex: ['human only', 'no automation', 'traditional'],
    peter: ['free', 'no budget', 'organic only'],
    patricia: ['specific service', 'not about practice area']
  },

  // Routing priority order (if multiple agents match equally)
  // Services take priority over practice areas (more specific intent)
  priorityOrder: ['paula', 'alex', 'peter', 'patricia'],

  // Maximum confidence score (1.0 = 100%)
  maxConfidence: 1.0,

  // Fallback agent (primary/general agent)
  fallbackAgent: 'sarah',

  // Enable LLM fallback for ambiguous cases
  enableLLMFallback: true,

  // LLM fallback prompt template
  llmFallbackPrompt: `Given this user message: "{{userMessage}}"

Which CaseBoost specialist would be most appropriate to handle this inquiry?

Available specialists:
- Paula (Performance Lead Delivery): Instant qualified leads, no setup, immediate results
- Alex (AI Intake): 24/7 automated intake systems, lead capture automation
- Peter (PPC Specialist): Google Ads, paid advertising, marketing campaigns  
- Patricia (Practice Area Consultant): Medical malpractice, immigration, personal injury, family law expertise
- Sarah (General): General inquiries, multiple services, consultation scheduling

Respond with ONLY the specialist name (Paula, Alex, Peter, Patricia, or Sarah) and nothing else.`,

  // Routing rules for specific scenarios
  rules: {
    // If user mentions budget under £2K, route to Paula (not Peter)
    lowBudget: {
      threshold: 2000,
      routeTo: 'paula',
      reason: 'Low budget better suited for performance lead delivery'
    },
    
    // If user mentions multiple services, keep with Sarah
    multipleServices: {
      keywords: ['and', 'also', 'multiple', 'everything'],
      routeTo: 'sarah',
      reason: 'Multiple services need comprehensive consultation'
    },
    
    // If user asks about practice area + specific service, route to service specialist
    practiceAreaPlusService: {
      priority: 'service',
      reason: 'Service specialist can address practice area context'
    }
  },

  // Logging configuration
  logging: {
    logAllRoutingDecisions: true,
    logConfidenceScores: true,
    logKeywordMatches: true
  }
};

