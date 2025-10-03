import { DiagramAgentFactory, DiagramAgent, DiagramAgentConfig, AgentEvent } from './DiagramAgent';
import { D2Agent } from './D2Agent';

/**
 * Factory for creating D2Agent instances.
 * Implements the DiagramAgentFactory interface.
 */
export const d2AgentFactory: DiagramAgentFactory = {
  createAgent(
    config: DiagramAgentConfig,
    callback: (event: AgentEvent) => void
  ): DiagramAgent {
    return new D2Agent(config, callback);
  }
};
