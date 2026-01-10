import type { RecordedEvent, CriteriaEvent, TurnCompleteEvent, ToolCallEvent, UserMessageEvent, AssistantMessageEvent } from '../recording/types';

/**
 * Events that can occur within a turn, in chronological order
 */
export type TurnEvent =
  | { type: 'user_message'; content: string }
  | { type: 'assistant_message'; content: string }
  | { type: 'tool_call'; toolName: string; arguments: any };

export interface TurnRecord {
  turnIndex: number;
  /** All events in this turn, in chronological order */
  turnEvents: TurnEvent[];
  /** Criteria to evaluate for this turn */
  criteria: string[];
  /** Path to the PNG screenshot for this turn */
  pngPath: string | null;
  /** D2 diagram content at end of turn */
  d2Content: string | null;
  /** Canvas update ID for linking to screenshot */
  canvasUpdateId: string | null;
}

export interface TestRecord {
  fileId: string;
  testIndex: number;
  name: string;
  fullName: string;
  hierarchy: string[];
  passed: boolean;
  duration: number;
  events: RecordedEvent[];
  summary?: {
    totalEvents: number;
    totalAssertions: number;
    passedAssertions: number;
    failedAssertions: number;
    duration: number;
  };
  error?: string;
  turns: TurnRecord[];
}

export interface VisualEvalInput {
  generatedAt: string;
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    totalAssertions: number;
    passedAssertions: number;
    failedAssertions: number;
  };
  tests: TestRecord[];
}

export function buildTurnRecords(
  events: RecordedEvent[],
  fileId: string,
  testIndex: number,
): TurnRecord[] {
  const criteriaByTurn = new Map<number, string[]>();
  const eventsByTurn = new Map<number, TurnEvent[]>();
  let currentTurnIndex = -1;

  for (const event of events) {
    if (event.type === 'criteria') {
      const criteriaEvent = event as CriteriaEvent;
      const existing = criteriaByTurn.get(criteriaEvent.turnIndex) || [];
      criteriaByTurn.set(criteriaEvent.turnIndex, existing.concat(criteriaEvent.criteria));
    } else if (event.type === 'user_message') {
      currentTurnIndex++;
      const userEvent = event as UserMessageEvent;
      eventsByTurn.set(currentTurnIndex, [
        { type: 'user_message', content: userEvent.content },
      ]);
    } else if (event.type === 'assistant_message' && currentTurnIndex >= 0) {
      const assistantEvent = event as AssistantMessageEvent;
      const turnEvents = eventsByTurn.get(currentTurnIndex) || [];
      turnEvents.push({ type: 'assistant_message', content: assistantEvent.content });
      eventsByTurn.set(currentTurnIndex, turnEvents);
    } else if (event.type === 'tool_call' && currentTurnIndex >= 0) {
      const toolCallEvent = event as ToolCallEvent;
      const turnEvents = eventsByTurn.get(currentTurnIndex) || [];
      turnEvents.push({ type: 'tool_call', toolName: toolCallEvent.toolName, arguments: toolCallEvent.arguments });
      eventsByTurn.set(currentTurnIndex, turnEvents);
    }
  }

  return events
    .filter((event): event is TurnCompleteEvent => event.type === 'turn_complete')
    .map((event) => {
      const criteria = criteriaByTurn.get(event.turnIndex) || [];
      const turnEvents = eventsByTurn.get(event.turnIndex) || [];
      const canvasUpdateId = event.canvasUpdateId || null;
      const pngPath = canvasUpdateId
        ? `./${fileId}/test-${testIndex}/${canvasUpdateId}.png`
        : null;

      return {
        turnIndex: event.turnIndex,
        turnEvents,
        criteria,
        pngPath,
        d2Content: event.d2Content || null,
        canvasUpdateId,
      };
    });
}
