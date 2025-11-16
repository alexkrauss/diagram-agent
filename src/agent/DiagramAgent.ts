/**
 * Result of rendering D2 diagram content.
 */
export interface RenderResult {
  /**
   * The rendered PNG as base64 data URL, if successful.
   */
  png?: string;
  /**
   * Error message if rendering failed.
   */
  error?: string;
}

/**
 * Function that renders D2 diagram content and returns the result.
 * This function is called by the agent's tools to provide visual feedback.
 *
 * @param d2Content - The D2 diagram code to render
 * @param canvasUpdateId - Unique identifier for this canvas update, can be used by implementations to track render results
 */
export type RenderFunction = (d2Content: string, canvasUpdateId: string) => Promise<RenderResult>;

/**
 * Represents the configuration required to initialize the DiagramAgent.
 * This would typically be used in a factory function that creates an agent instance.
 */
export interface DiagramAgentConfig {
  /**
   * The API key for the OpenAI service.
   */
  apiKey: string;

  /**
   * The specific GPT model to be used by the agent.
   * @default 'gpt-4o'
   */
  model?: string;

  /**
   * Function to render D2 content to PNG.
   * The agent will call this function after updating the canvas
   * to provide visual feedback to the model.
   */
  renderFunction: RenderFunction;
}

// --- Conversation Message Types ---

/** Message from the user */
export interface UserMessage {
  role: "user";
  content: string;
  timestamp: Date;
}

/** Text response from the assistant */
export interface AssistantMessage {
  role: "assistant";
  content: string;
  timestamp: Date;
}

/** Assistant updates the canvas with new D2 content */
export interface CanvasUpdateMessage {
  role: "canvas_update";
  content: string;
  timestamp: Date;
}

/** All message types in the conversation */
export type ConversationMessage =
  | UserMessage
  | AssistantMessage
  | CanvasUpdateMessage;

// --- Agent State ---

export type AgentState =
  | { status: "idle" }
  | { status: "thinking" }
  | { status: "rendering" };

// --- Agent Events ---

/** Event fired when the agent starts processing a request. */
export interface StartEvent {
  type: "start";
}

/** Event for general informational messages from the agent for debugging or internal logging. */
export interface LogEvent {
  type: "log";
  message: string;
}

/** Event fired for each chunk of a streaming text response from the model. */
export interface ModelResponseEvent {
  type: "model_response";
  /** A single chunk of text from the language model's response stream. */
  chunk: string;
}

/** Event fired when model response streaming is complete. */
export interface ModelResponseCompleteEvent {
  type: "model_response_complete";
  /** The complete aggregated text response from the model. */
  content: string;
}

/** Event fired just before a tool is executed. */
export interface ToolStartEvent {
  type: "tool_start";
  /** The name of the tool being called. */
  name: string;
  /** The arguments passed to the tool. */
  args: any;
}

/** Event fired after a tool has finished executing. */
export interface ToolEndEvent {
  type: "tool_end";
  /** The name of the tool that was called. */
  name: string;
  /** The result returned by the tool. */
  result: any;
}

/** Event fired when the diagram's content is modified. */
export interface CanvasUpdateEvent {
  type: "canvas_update";
  /** The new, complete D2 diagram content. */
  content: string;
  /** Unique identifier for this canvas update, assigned by the agent. */
  canvasUpdateId: string;
}

/** Event fired when D2 rendering completes. */
export interface RenderCompleteEvent {
  type: "render_complete";
  /** The canvas update ID this render corresponds to */
  canvasUpdateId: string;
  /** Whether rendering succeeded */
  success: boolean;
  /** Error message if rendering failed */
  error?: string;
}

/** Event fired when an error occurs during agent execution. */
export interface ErrorEvent {
  type: "error";
  /** The error object that was thrown. */
  error: Error;
}

/** Event fired when the agent has successfully finished its run. */
export interface CompleteEvent {
  type: "complete";
}

/**
 * Represents all possible events emitted by the DiagramAgent.
 * This is a discriminated union, allowing for type-safe handling of events
 * based on the 'type' property.
 */
export type AgentEvent =
  | StartEvent
  | LogEvent
  | ModelResponseEvent
  | ModelResponseCompleteEvent
  | ToolStartEvent
  | ToolEndEvent
  | CanvasUpdateEvent
  | RenderCompleteEvent
  | ErrorEvent
  | CompleteEvent;

/**
 * Interface for the Diagramming Agent.
 * This contract defines the public API that the UI will use to interact with the agent.
 */
export interface DiagramAgent {
  /**
   * Sends a message to the agent and starts/continues execution.
   * The agent will process the request and may update the diagram canvas.
   * This process is asynchronous and will emit events to track progress.
   *
   * @param userMessage - The natural language instruction from the user.
   * @returns A promise that resolves when the agent has completed processing.
   */
  sendMessage(userMessage: string): Promise<void>;

  /**
   * Retrieves the current state of the diagram canvas.
   * @returns A string containing the D2 diagram source code.
   */
  getCanvasContent(): string;

  /**
   * Retrieves the full conversation history.
   * @returns An array of all messages exchanged with the agent.
   */
  getConversationHistory(): ConversationMessage[];

  /**
   * Gets the current state of the agent.
   * @returns The current agent state (idle, thinking, or running_tool).
   */
  getState(): AgentState;
}

/**
 * Factory interface for creating DiagramAgent instances.
 * Implementations of this interface will handle the creation and initialization
 * of agents with the provided configuration and event callback.
 */
export interface DiagramAgentFactory {
  /**
   * Creates a new DiagramAgent instance.
   * @param config - Configuration for the agent (API key, model, etc.)
   * @param callback - Function to receive events emitted by the agent
   * @returns A new DiagramAgent instance
   */
  createAgent(
    config: DiagramAgentConfig,
    callback: (event: AgentEvent) => void
  ): DiagramAgent;
}
