import { describe, it, expect } from 'vitest';
import { d2AgentFactory } from './index';
import type { AgentEvent } from './DiagramAgent';

describe('D2Agent Integration - Manual UI Scenario', () => {
  it('should maintain conversation history when sending multiple messages with the same agent instance', async () => {
    const events: AgentEvent[] = [];

    // Simulate what the UI does - create agent once
    const agent = d2AgentFactory.createAgent(
      { apiKey: 'test-key' },
      (event) => events.push(event)
    );

    // Send first message
    try {
      await agent.sendMessage('Create a diagram with A and B');
    } catch (err) {
      // Expected to fail without real API key, but history should still be tracked
    }

    const historyAfterFirst = agent.getConversationHistory();
    const userMessagesAfterFirst = historyAfterFirst.filter(m => m.role === 'user');

    console.log('After first message:', {
      totalMessages: historyAfterFirst.length,
      userMessages: userMessagesAfterFirst.length,
      userContent: userMessagesAfterFirst.map(m => m.content),
    });

    expect(userMessagesAfterFirst.length).toBe(1);

    // Send second message with SAME agent instance
    try {
      await agent.sendMessage('Now add C');
    } catch (err) {
      // Expected to fail without real API key
    }

    const historyAfterSecond = agent.getConversationHistory();
    const userMessagesAfterSecond = historyAfterSecond.filter(m => m.role === 'user');

    console.log('After second message:', {
      totalMessages: historyAfterSecond.length,
      userMessages: userMessagesAfterSecond.length,
      userContent: userMessagesAfterSecond.map(m => m.content),
    });

    // This should be 2, not 1 (proving conversation persists)
    expect(userMessagesAfterSecond.length).toBe(2);
    expect(userMessagesAfterSecond[0].content).toBe('Create a diagram with A and B');
    expect(userMessagesAfterSecond[1].content).toBe('Now add C');
  });

  it('should show the problem: creating new agent instance loses history', async () => {
    const events: AgentEvent[] = [];

    // Simulate WRONG behavior - creating new agent for each message
    const agent1 = d2AgentFactory.createAgent(
      { apiKey: 'test-key' },
      (event) => events.push(event)
    );

    try {
      await agent1.sendMessage('Create a diagram with A and B');
    } catch (err) {}

    const history1 = agent1.getConversationHistory();
    expect(history1.filter(m => m.role === 'user').length).toBe(1);

    // Create a NEW agent instance (this is the problem!)
    const agent2 = d2AgentFactory.createAgent(
      { apiKey: 'test-key' },
      (event) => events.push(event)
    );

    try {
      await agent2.sendMessage('Now add C');
    } catch (err) {}

    const history2 = agent2.getConversationHistory();

    // Agent2 has its own history, doesn't know about agent1's history
    expect(history2.filter(m => m.role === 'user').length).toBe(1); // Only the second message!
  });
});
