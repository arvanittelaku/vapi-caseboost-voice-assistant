/**
 * Sub-Agent Testing Script
 * Tests routing logic and sub-agent responses
 */

require('dotenv').config();
const SubAgentRouter = require('../src/services/sub-agent-router');
const IntentDetector = require('../src/services/intent-detector');

class SubAgentTester {
  constructor() {
    this.router = new SubAgentRouter();
    this.detector = new IntentDetector();
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Starting Sub-Agent Tests...\n');
    
    await this.testIntentDetection();
    await this.testRouting();
    await this.testEdgeCases();
    
    console.log('\n✅ All tests completed!');
  }

  /**
   * Test intent detection
   */
  async testIntentDetection() {
    console.log('📊 Testing Intent Detection...\n');

    const testCases = [
      // Paula (Performance Lead Delivery)
      {
        message: "I want to buy qualified leads for personal injury cases",
        expectedAgent: 'paula',
        description: 'Performance lead delivery'
      },
      {
        message: "We need immediate leads delivered to our firm",
        expectedAgent: 'paula',
        description: 'Immediate lead delivery'
      },
      {
        message: "How much do pre-qualified leads cost?",
        expectedAgent: 'paula',
        description: 'Pre-qualified leads inquiry'
      },

      // Alex (AI Intake)
      {
        message: "We're missing calls after hours and need 24/7 coverage",
        expectedAgent: 'alex',
        description: 'After-hours coverage'
      },
      {
        message: "Can you automate our intake process with AI?",
        expectedAgent: 'alex',
        description: 'AI intake automation'
      },
      {
        message: "We need an AI chatbot for our law firm website",
        expectedAgent: 'alex',
        description: 'AI chatbot inquiry'
      },

      // Peter (PPC)
      {
        message: "We want to run Google Ads for our medical malpractice practice",
        expectedAgent: 'peter',
        description: 'Google Ads inquiry'
      },
      {
        message: "What's your PPC management fee and average ROAS?",
        expectedAgent: 'peter',
        description: 'PPC pricing and performance'
      },
      {
        message: "Can you help with Facebook ads for immigration law?",
        expectedAgent: 'peter',
        description: 'Meta ads inquiry'
      },

      // Patricia (Practice Areas)
      {
        message: "We focus on medical malpractice cases, what's the best way to get more cases?",
        expectedAgent: 'patricia',
        description: 'Medical malpractice inquiry'
      },
      {
        message: "How do personal injury firms typically acquire clients?",
        expectedAgent: 'patricia',
        description: 'Personal injury acquisition'
      },
      {
        message: "What's the average case value for immigration cases?",
        expectedAgent: 'patricia',
        description: 'Immigration case value'
      },

      // Ambiguous (should route to Sarah)
      {
        message: "Tell me about your company",
        expectedAgent: 'sarah',
        description: 'General inquiry'
      },
      {
        message: "Can you help us with everything?",
        expectedAgent: 'sarah',
        description: 'Multiple services'
      }
    ];

    let passed = 0;
    let failed = 0;

    for (const testCase of testCases) {
      const result = this.detector.detect(testCase.message);
      const success = result.agentId === testCase.expectedAgent;
      
      if (success) {
        passed++;
        console.log(`✅ ${testCase.description}`);
        console.log(`   Message: "${testCase.message.substring(0, 60)}..."`);
        console.log(`   Routed to: ${result.agentId} (${(result.confidence * 100).toFixed(1)}% confidence)\n`);
      } else {
        failed++;
        console.log(`❌ ${testCase.description}`);
        console.log(`   Message: "${testCase.message.substring(0, 60)}..."`);
        console.log(`   Expected: ${testCase.expectedAgent}`);
        console.log(`   Got: ${result.agentId} (${(result.confidence * 100).toFixed(1)}% confidence)\n`);
      }
    }

    console.log(`\n📈 Intent Detection Results: ${passed} passed, ${failed} failed (${((passed / testCases.length) * 100).toFixed(1)}% accuracy)\n`);
  }

  /**
   * Test full routing
   */
  async testRouting() {
    console.log('🔄 Testing Full Routing...\n');

    const testMessages = [
      "We need immediate qualified leads for personal injury",
      "Can AI help us capture leads 24/7?",
      "What's your Google Ads management fee?",
      "We're a medical malpractice firm looking to grow"
    ];

    for (const message of testMessages) {
      const result = this.router.route({
        userMessage: message,
        conversationId: `test-${Date.now()}`,
        metadata: {
          firstName: 'John',
          lastName: 'Doe',
          practiceArea: 'Personal Injury'
        }
      });

      console.log(`Message: "${message}"`);
      console.log(`Routed: ${result.routed ? 'Yes' : 'No'}`);
      console.log(`Agent: ${result.agent.name} (${result.agent.role})`);
      console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      if (result.greeting) {
        console.log(`Greeting: "${result.greeting.substring(0, 80)}..."`);
      }
      console.log('');
    }
  }

  /**
   * Test edge cases
   */
  async testEdgeCases() {
    console.log('🔍 Testing Edge Cases...\n');

    const edgeCases = [
      {
        message: "",
        description: "Empty message"
      },
      {
        message: "asdfghjkl qwertyuiop",
        description: "Gibberish"
      },
      {
        message: "I need leads and AI automation and PPC and everything",
        description: "Multiple services mentioned"
      },
      {
        message: "How much does it cost?",
        description: "Vague pricing question"
      }
    ];

    for (const testCase of edgeCases) {
      const result = this.detector.detect(testCase.message);
      
      console.log(`Test: ${testCase.description}`);
      console.log(`Message: "${testCase.message}"`);
      console.log(`Result: Routed to ${result.agentId} (${(result.confidence * 100).toFixed(1)}% confidence)`);
      console.log(`Reason: ${result.reason}\n`);
    }
  }

  /**
   * Test with real conversation flow
   */
  async testConversationFlow() {
    console.log('💬 Testing Conversation Flow...\n');

    const conversation = [
      {
        message: "Hi, I'm looking for help growing my law firm",
        speaker: "Prospect"
      },
      {
        message: "We're a personal injury firm in London",
        speaker: "Prospect"
      },
      {
        message: "We need about 20 new cases per month",
        speaker: "Prospect"
      },
      {
        message: "What's the fastest way to get qualified leads?",
        speaker: "Prospect"
      }
    ];

    let currentAgent = 'sarah';
    const conversationId = `test-conv-${Date.now()}`;

    for (const turn of conversation) {
      const result = this.router.route({
        userMessage: turn.message,
        conversationId,
        metadata: { currentAgent },
        currentAgent
      });

      console.log(`${turn.speaker}: "${turn.message}"`);
      
      if (result.routed && result.agent.id !== currentAgent) {
        console.log(`  → Routing to ${result.agent.name}`);
        currentAgent = result.agent.id;
      } else {
        console.log(`  → Staying with ${result.agent.name}`);
      }
      
      console.log('');
    }
  }

  /**
   * Get routing statistics
   */
  displayStats() {
    console.log('📊 Routing Statistics...\n');
    const stats = this.router.getRoutingStats();
    
    console.log(`Total conversations: ${stats.totalConversations}`);
    console.log(`Total routing events: ${stats.totalRoutingEvents}`);
    console.log(`Average confidence: ${(stats.avgConfidence * 100).toFixed(1)}%`);
    console.log('\nAgent distribution:');
    for (const [agent, count] of Object.entries(stats.agentDistribution)) {
      console.log(`  - ${agent}: ${count} routing events`);
    }
  }
}

// CLI interface
if (require.main === module) {
  const tester = new SubAgentTester();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'all':
      tester.runAllTests();
      break;
    case 'intent':
      tester.testIntentDetection();
      break;
    case 'routing':
      tester.testRouting();
      break;
    case 'edge':
      tester.testEdgeCases();
      break;
    case 'conversation':
      tester.testConversationFlow();
      break;
    case 'stats':
      tester.displayStats();
      break;
    default:
      console.log('Usage: node scripts/test-sub-agents.js [command]');
      console.log('Commands:');
      console.log('  all          - Run all tests');
      console.log('  intent       - Test intent detection');
      console.log('  routing      - Test full routing');
      console.log('  edge         - Test edge cases');
      console.log('  conversation - Test conversation flow');
      console.log('  stats        - Display routing stats');
      console.log('\nExample: node scripts/test-sub-agents.js all');
      break;
  }
}

module.exports = SubAgentTester;

