/**
 * Example Usage: Context Manager with Automatic Summarization
 * 
 * This demonstrates how to use the context manager to:
 * 1. Record conversation messages
 * 2. Generate automatic summaries
 * 3. Route to sub-agents with context
 */

const contextManager = require('../src/services/context-manager');

// ═══════════════════════════════════════════════════════
// EXAMPLE 1: Basic Message Recording
// ═══════════════════════════════════════════════════════

async function example1_BasicRecording() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📝 EXAMPLE 1: Basic Message Recording');
  console.log('═══════════════════════════════════════════════════════\n');

  const conversationId = 'conv_12345';

  // Simulate a conversation
  contextManager.addMessage(conversationId, 'assistant', 
    "Hi! This is Sarah from CaseBoost. May I know your name?",
    { agentName: 'Sarah' }
  );

  contextManager.addMessage(conversationId, 'user',
    "Yes, I'm Dr. Chen from Chen Medical",
    { source: 'phone-call' }
  );

  contextManager.addMessage(conversationId, 'assistant',
    "Great to meet you Dr. Chen! What brings you to CaseBoost today?",
    { agentName: 'Sarah' }
  );

  contextManager.addMessage(conversationId, 'user',
    "We're a medical malpractice firm in Los Angeles and we need immediate qualified leads",
    { source: 'phone-call' }
  );

  // Get conversation history
  const history = contextManager.getConversationHistory(conversationId);
  
  console.log(`\n✅ Recorded ${history.length} messages`);
  console.log('Last message:', history[history.length - 1].content.substring(0, 50) + '...');
}

// ═══════════════════════════════════════════════════════
// EXAMPLE 2: Generate Conversation Summary
// ═══════════════════════════════════════════════════════

async function example2_GenerateSummary() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🤖 EXAMPLE 2: Generate Conversation Summary');
  console.log('═══════════════════════════════════════════════════════\n');

  const conversationId = 'conv_67890';

  // Simulate a more detailed conversation
  const messages = [
    { role: 'assistant', content: "Hi! I'm Sarah from CaseBoost. How can I help you today?", agentName: 'Sarah' },
    { role: 'user', content: "Hi Sarah, I'm Maria Rodriguez from Rodriguez & Associates" },
    { role: 'assistant', content: "Welcome Maria! Tell me about your firm.", agentName: 'Sarah' },
    { role: 'user', content: "We're a personal injury firm in Miami, specializing in car accidents and slip-and-falls" },
    { role: 'assistant', content: "Great! What's your biggest challenge right now?", agentName: 'Sarah' },
    { role: 'user', content: "We're missing calls after 5pm and losing potential clients. We need 24/7 coverage" },
    { role: 'assistant', content: "That's a perfect use case for our AI intake system. Let me connect you with Alex, our AI specialist", agentName: 'Sarah' }
  ];

  messages.forEach(msg => {
    contextManager.addMessage(conversationId, msg.role, msg.content, { agentName: msg.agentName });
  });

  // Generate summary
  const history = contextManager.getConversationHistory(conversationId);
  const summary = await contextManager.generateSummary(history);

  console.log('\n📋 Generated Summary:');
  console.log(`"${summary}"`);
  console.log('\n✅ Summary generated successfully!');
}

// ═══════════════════════════════════════════════════════
// EXAMPLE 3: Route to Sub-Agent with Context
// ═══════════════════════════════════════════════════════

async function example3_RouteToSubAgent() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🔄 EXAMPLE 3: Route to Sub-Agent with Context');
  console.log('═══════════════════════════════════════════════════════\n');

  const conversationId = 'conv_transfer_demo';

  // Simulate conversation
  contextManager.addMessage(conversationId, 'assistant', 
    "Hi! I'm Sarah. What's your name and firm?",
    { agentName: 'Sarah' }
  );

  contextManager.addMessage(conversationId, 'user',
    "I'm Dr. James Wilson from Wilson Law Group"
  );

  contextManager.addMessage(conversationId, 'assistant',
    "Nice to meet you Dr. Wilson! What can I help you with?",
    { agentName: 'Sarah' }
  );

  contextManager.addMessage(conversationId, 'user',
    "We're a medical malpractice firm and we need immediate qualified leads. Can you deliver 20-30 leads per month?"
  );

  // Route to Paula with automatic context
  console.log('\n🎯 Routing to Paula (Performance Leads Specialist)...\n');
  
  const result = await contextManager.routeToSubAgent(
    'paula',
    conversationId,
    {
      firmType: 'medical malpractice',
      monthlyLeadGoal: 30,
      urgency: 'immediate'
    }
  );

  if (result.success) {
    console.log('✅ Transfer successful!');
    console.log('\n📦 Transfer Payload:');
    console.log(JSON.stringify(result.payload, null, 2));
    console.log('\n💬 Context Summary:');
    console.log(`"${result.contextSummary}"`);
  } else {
    console.log('❌ Transfer failed:', result.error);
  }
}

// ═══════════════════════════════════════════════════════
// EXAMPLE 4: Full Workflow - Sarah → Patricia
// ═══════════════════════════════════════════════════════

async function example4_FullWorkflow() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🎭 EXAMPLE 4: Full Workflow - Sarah → Patricia');
  console.log('═══════════════════════════════════════════════════════\n');

  const conversationId = 'conv_full_workflow';

  // Stage 1: Initial conversation with Sarah
  console.log('📞 Stage 1: Conversation with Sarah...\n');
  
  contextManager.addMessage(conversationId, 'assistant',
    "Hi! This is Sarah from CaseBoost calling about growing your legal practice.",
    { agentName: 'Sarah' }
  );

  contextManager.addMessage(conversationId, 'user',
    "Hi Sarah. I'm Linda Martinez from Martinez Family Law in San Diego."
  );

  contextManager.addMessage(conversationId, 'assistant',
    "Great to connect Linda! Tell me about your practice.",
    { agentName: 'Sarah' }
  );

  contextManager.addMessage(conversationId, 'user',
    "We handle divorce and custody cases. I want to understand the average case value for divorce cases and how other firms acquire clients in this space."
  );

  // Stage 2: Sarah decides to transfer to Patricia
  console.log('🔄 Stage 2: Transferring to Patricia (Practice Area Specialist)...\n');
  
  const transferResult = await contextManager.routeToSubAgent(
    'patricia',
    conversationId,
    {
      practiceArea: 'divorce-family-law',
      location: 'San Diego',
      specificQuestions: ['average case value', 'client acquisition strategies']
    }
  );

  if (transferResult.success) {
    console.log('✅ Transfer to Patricia successful!\n');

    // Stage 3: Patricia takes over with context
    console.log('👩 Stage 3: Patricia responds with context...\n');
    
    contextManager.addMessage(conversationId, 'assistant',
      `Hi Linda! Sarah mentioned you're from Martinez Family Law in San Diego and you're interested in divorce case values and acquisition strategies. I'd be happy to help with that!`,
      { agentName: 'Patricia' }
    );

    // Get final conversation history
    const finalHistory = contextManager.getConversationHistory(conversationId);
    const finalSummary = await contextManager.generateSummary(finalHistory);

    console.log('📊 Final Conversation Summary:');
    console.log(`"${finalSummary}"`);
    console.log(`\n✅ Workflow complete! Total messages: ${finalHistory.length}`);
  }
}

// ═══════════════════════════════════════════════════════
// EXAMPLE 5: Memory Statistics
// ═══════════════════════════════════════════════════════

function example5_MemoryStats() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 EXAMPLE 5: Memory Statistics');
  console.log('═══════════════════════════════════════════════════════\n');

  const stats = contextManager.getMemoryStats();
  
  console.log('Memory Stats:');
  console.log(`  Total Conversations: ${stats.totalConversations}`);
  console.log(`  Total Messages: ${stats.totalMessages}`);
  console.log(`  Avg Messages/Conversation: ${stats.averageMessagesPerConversation}`);
  console.log(`  Max Messages/Conversation: ${stats.maxMessagesPerConversation}`);
  console.log('\n✅ Memory stats retrieved!');
}

// ═══════════════════════════════════════════════════════
// RUN ALL EXAMPLES
// ═══════════════════════════════════════════════════════

async function runAllExamples() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║   CONTEXT MANAGER - EXAMPLE USAGE DEMONSTRATIONS      ║');
  console.log('╚═══════════════════════════════════════════════════════╝');

  try {
    await example1_BasicRecording();
    await example2_GenerateSummary();
    await example3_RouteToSubAgent();
    await example4_FullWorkflow();
    example5_MemoryStats();

    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║              ✅ ALL EXAMPLES COMPLETED                ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Error running examples:', error.message);
    console.error('\nMake sure you have OPENAI_API_KEY or GROQ_API_KEY set in your .env file!');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runAllExamples();
}

module.exports = {
  example1_BasicRecording,
  example2_GenerateSummary,
  example3_RouteToSubAgent,
  example4_FullWorkflow,
  example5_MemoryStats
};

