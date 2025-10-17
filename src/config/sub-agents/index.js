/**
 * Sub-Agent Registry
 * Central registry for all sub-agents with routing logic
 */

const paula = require('./paula-performance-leads');
const alex = require('./alex-ai-intake');
const peter = require('./peter-ppc');
const patricia = require('./patricia-practice-areas');

// Registry of all active sub-agents
const subAgents = {
  paula,
  alex,
  peter,
  patricia
};

// Get sub-agent by ID
function getSubAgent(id) {
  return subAgents[id] || null;
}

// Get all sub-agents
function getAllSubAgents() {
  return Object.values(subAgents);
}

// Get sub-agent IDs
function getSubAgentIds() {
  return Object.keys(subAgents);
}

// Find sub-agent by expertise keywords
function findByExpertise(keywords) {
  const matches = [];
  
  for (const agent of getAllSubAgents()) {
    const expertiseString = agent.expertise.join(' ').toLowerCase();
    const matchCount = keywords.filter(keyword => 
      expertiseString.includes(keyword.toLowerCase())
    ).length;
    
    if (matchCount > 0) {
      matches.push({
        agent,
        matchCount,
        confidence: matchCount / keywords.length
      });
    }
  }
  
  // Sort by match count (descending)
  return matches.sort((a, b) => b.matchCount - a.matchCount);
}

module.exports = {
  subAgents,
  getSubAgent,
  getAllSubAgents,
  getSubAgentIds,
  findByExpertise
};

