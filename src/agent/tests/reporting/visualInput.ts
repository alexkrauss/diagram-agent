import type { RecordedEvent, CriteriaEvent, TurnCompleteEvent } from '../recording/types';

export interface TurnRecord {
  turnIndex: number;
  prompt: string;
  promptMessages: Array<{ role: string; content: string }>;
  answer: string;
  criteria: string[];
  pngPath: string | null;
  d2Content: string | null;
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

function formatPrompt(messages: Array<{ role: string; content: string }>): string {
  const userMessages = messages.filter((message) => message.role === 'user');
  const source = userMessages.length > 0 ? userMessages : messages;

  return source
    .map((message) => {
      const role = message.role.toUpperCase();
      return `${role}: ${message.content}`;
    })
    .join('\n\n');
}

export function buildTurnRecords(
  events: RecordedEvent[],
  fileId: string,
  testIndex: number,
): TurnRecord[] {
  const criteriaByTurn = new Map<number, string[]>();

  for (const event of events) {
    if (event.type === 'criteria') {
      const criteriaEvent = event as CriteriaEvent;
      const existing = criteriaByTurn.get(criteriaEvent.turnIndex) || [];
      criteriaByTurn.set(criteriaEvent.turnIndex, existing.concat(criteriaEvent.criteria));
    }
  }

  return events
    .filter((event): event is TurnCompleteEvent => event.type === 'turn_complete')
    .map((event) => {
      const promptMessages = event.conversation || [];
      const prompt = formatPrompt(promptMessages);
      const criteria = criteriaByTurn.get(event.turnIndex) || [];
      const canvasUpdateId = event.canvasUpdateId || null;
      const pngPath = canvasUpdateId
        ? `./${fileId}/test-${testIndex}/${canvasUpdateId}.png`
        : null;

      return {
        turnIndex: event.turnIndex,
        prompt,
        promptMessages,
        answer: event.d2Content || '',
        criteria,
        pngPath,
        d2Content: event.d2Content || null,
        canvasUpdateId,
      };
    });
}
