import { Agent, run as runAgent, setDefaultOpenAIClient, user, AgentInputItem } from "@openai/agents";
import { OpenAI } from "openai";
import { DiagramAgent, DiagramAgentConfig, AgentEvent, ConversationMessage, AgentState } from "./DiagramAgent";
import { createReplaceCanvasTool } from "./tools/replaceCanvasTool";
import systemPrompt from "./system_prompt.md?raw";

export class D2Agent implements DiagramAgent {
  private canvas: string = "";
  private eventCallback: (event: AgentEvent) => void;
  private agent: Agent;
  private internalHistory: AgentInputItem[] = [];
  private conversationMessages: ConversationMessage[] = [];
  private currentState: AgentState = { status: "idle" };

  constructor(
    config: DiagramAgentConfig,
    callback: (event: AgentEvent) => void
  ) {
    this.eventCallback = callback;

    // Configure OpenAI client with API key
    const client = new OpenAI({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true,
    });
    setDefaultOpenAIClient(client as any);

    // Create tool with canvas state management
    const replaceCanvasTool = createReplaceCanvasTool((content) => {
      this.canvas = content;

      // Add canvas update message to conversation history
      this.conversationMessages.push({
        role: "canvas_update",
        content: content,
        timestamp: new Date(),
      });

      this.emit({
        type: "canvas_update",
        content: this.canvas,
      });
    });

    // Create agent with instructions and tools
    this.agent = new Agent({
      name: "D2 Diagram Agent",
      instructions: systemPrompt,
      model: config.model || "gpt-4o",
      tools: [replaceCanvasTool],
    });
  }

  getCanvasContent(): string {
    return this.canvas;
  }

  getConversationHistory(): ConversationMessage[] {
    return [...this.conversationMessages];
  }

  getState(): AgentState {
    return this.currentState;
  }

  private emit(event: AgentEvent): void {
    this.eventCallback(event);
  }

  async sendMessage(userMessage: string): Promise<void> {
    this.emit({ type: "start" });
    this.currentState = { status: "thinking" };

    // Add user message to both internal and conversation history
    const userMsg = user(userMessage);
    this.internalHistory.push(userMsg);
    this.conversationMessages.push({
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    });

    try {
      // Pass full conversation history to maintain context
      const result = await runAgent(this.agent, this.internalHistory, { stream: true });

      let currentAssistantMessage = "";

      for await (const event of result) {
        if (event.type === "raw_model_stream_event") {
          // Handle text streaming
          const data = event.data;
          if (data && typeof data === "object" && "choices" in data) {
            const choices = data.choices as any[];
            if (choices && choices[0]?.delta?.content) {
              const chunk = choices[0].delta.content;
              currentAssistantMessage += chunk;
              this.emit({
                type: "model_response",
                chunk: chunk,
              });
            }
          }
        } else if (event.type === "run_item_stream_event") {
          // Handle tool calls
          const itemData = (event as any).data;
          if (itemData && typeof itemData === "object" && "type" in itemData) {
            if (
              itemData.type === "function_call" ||
              itemData.type === "tool_call"
            ) {
              const toolName =
                (itemData as any).function?.name || "replace_canvas";
              const toolArgs =
                (itemData as any).function?.arguments || itemData;

              this.currentState = { status: "running_tool", toolName };

              this.emit({
                type: "tool_start",
                name: toolName,
                args: toolArgs,
              });

              // Note: tool_end would be emitted after execution, but the SDK doesn't provide
              // a clear hook for this. Canvas updates serve as implicit tool completion signals.
            }
          }
        }
      }

      // Save assistant message if there was any text content
      if (currentAssistantMessage.trim()) {
        this.conversationMessages.push({
          role: "assistant",
          content: currentAssistantMessage,
          timestamp: new Date(),
        });
      }

      // Wait for stream to complete
      await result.completed;

      // Add all new output items (assistant responses, tool calls, etc.) to internal history
      // Use `output` instead of `newItems` as it contains AgentInputItem types
      this.internalHistory.push(...result.output);

      this.currentState = { status: "idle" };
      this.emit({ type: "complete" });
    } catch (error) {
      this.currentState = { status: "idle" };
      this.emit({
        type: "error",
        error: error instanceof Error ? error : new Error("Unknown error"),
      });
      throw error;
    }
  }
}
