/**
 * Type definitions for the event recording system.
 */

/**
 * Base event structure with timestamp
 */
export interface BaseEvent {
  type: string;
  time: number;
  relativeTime?: number;
}

/**
 * User message event
 */
export interface UserMessageEvent extends BaseEvent {
  type: 'user_message';
  content: string;
}

/**
 * Assistant message event
 */
export interface AssistantMessageEvent extends BaseEvent {
  type: 'assistant_message';
  content: string;
}

/**
 * Tool call event
 */
export interface ToolCallEvent extends BaseEvent {
  type: 'tool_call';
  toolName: string;
  arguments: any;
}

/**
 * Tool result event
 */
export interface ToolResultEvent extends BaseEvent {
  type: 'tool_result';
  toolName: string;
  result: any;
}

/**
 * Canvas update event
 */
export interface CanvasUpdateEvent extends BaseEvent {
  type: 'canvas_update';
  d2Content: string;
}

/**
 * Assertion event (both pass and fail)
 */
export interface AssertionEvent extends BaseEvent {
  type: 'assertion';
  passed: boolean;
  matcher: string;
  actual: any;
  expected: any;
  description?: string;
  error?: string;
  stack?: string;
}

/**
 * Error event
 */
export interface ErrorEvent extends BaseEvent {
  type: 'error';
  error: string;
  stack?: string;
}

/**
 * All possible event types
 */
export type RecordedEvent =
  | UserMessageEvent
  | AssistantMessageEvent
  | ToolCallEvent
  | ToolResultEvent
  | CanvasUpdateEvent
  | AssertionEvent
  | ErrorEvent;
