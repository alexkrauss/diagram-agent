/**
 * EvalReporter.rendering - HTML rendering logic with clear, testable interfaces
 *
 * This module handles converting test data into HTML strings.
 * It's separated from the reporter to make it easily testable.
 */

import type { RecordedEvent, UserMessageEvent, AssistantMessageEvent, ToolCallEvent, ToolResultEvent, CanvasUpdateEvent, AssertionEvent, ErrorEvent } from '../recording/types';

/**
 * Data required to render a single test conversation
 */
export interface TestConversationData {
  /** Unique index for this test */
  index: number;
  /** Full hierarchical name of the test (e.g., "Suite > Test Name") */
  name: string;
  /** Whether the test passed */
  passed: boolean;
  /** Duration in milliseconds */
  duration: number;
  /** Test summary statistics (optional) */
  summary?: {
    totalEvents: number;
    totalAssertions: number;
    passedAssertions: number;
    failedAssertions: number;
    duration: number;
  };
  /** Error message if test failed (optional) */
  error?: string;
  /** All recorded events from the test */
  events: RecordedEvent[];
}

/**
 * Data required to render the entire report
 */
export interface ReportData {
  /** All test conversations to display */
  conversations: TestConversationData[];
  /** Overall summary statistics */
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    totalAssertions: number;
    passedAssertions: number;
    failedAssertions: number;
  };
}

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(text: unknown): string {
  if (text === null || text === undefined) {
    return '';
  }
  const str = String(text);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Format milliseconds as a string with thousands separators
 * Examples: 1234 -> "1,234", 1000000 -> "1,000,000"
 */
export function formatMs(ms: number): string {
  return Math.round(ms).toLocaleString('en-US');
}

/**
 * Render a single event based on its type
 */
export function renderEvent(event: RecordedEvent, testIndex: number): string {
  const typeHtml = `<span class="event-type ${event.type}">${event.type.replace(/_/g, ' ')}</span>`;
  const timeHtml = `<span class="event-time">${formatMs(event.relativeTime || 0)} ms</span>`;

  if (event.type === 'user_message') {
    const e = event as UserMessageEvent;
    return `
      <div class="event ${event.type}">
        <div class="event-header">${typeHtml}${timeHtml}</div>
        <div class="event-content">${escapeHtml(e?.content || '')}</div>
      </div>
    `;
  }

  if (event.type === 'assistant_message') {
    const e = event as AssistantMessageEvent;
    return `
      <div class="event ${event.type}">
        <div class="event-header">${typeHtml}${timeHtml}</div>
        <div class="event-content">${escapeHtml(e?.content || '')}</div>
      </div>
    `;
  }

  if (event.type === 'tool_call') {
    const e = event as ToolCallEvent;
    return `
      <div class="event ${event.type}">
        <div class="event-header">${typeHtml} - ${escapeHtml(e?.toolName || 'unknown')}${timeHtml}</div>
        <div class="event-content">${escapeHtml(JSON.stringify(e?.arguments || {}, null, 2))}</div>
      </div>
    `;
  }

  if (event.type === 'tool_result') {
    const e = event as ToolResultEvent;
    return `
      <div class="event ${event.type}">
        <div class="event-header">${typeHtml} - ${escapeHtml(e?.toolName || 'unknown')}${timeHtml}</div>
        <div class="event-content">${escapeHtml(JSON.stringify(e?.result || {}, null, 2))}</div>
      </div>
    `;
  }

  if (event.type === 'canvas_update') {
    const e = event as CanvasUpdateEvent;
    const d2Content = e?.d2Content || '';
    const canvasUpdateId = e?.canvasUpdateId || 'unknown';

    // Build file paths based on testIndex and canvasUpdateId
    const pngPath = `./test-${testIndex}/${canvasUpdateId}.png`;

    return `
      <div class="event ${event.type}">
        <div class="event-header">${typeHtml}${timeHtml}</div>
        <div class="canvas-images">
          <div class="canvas-image">
            <img src="${pngPath}" alt="Canvas rendering" onerror="this.style.display='none'">
            <div class="canvas-label">Rendering</div>
          </div>
        </div>
        <details style="margin-top: 10px;">
          <summary style="cursor: pointer; font-size: 12px; color: #666; padding: 5px; user-select: none;">Show D2 Code</summary>
          <div class="event-content">${escapeHtml(d2Content)}</div>
        </details>
      </div>
    `;
  }

  if (event.type === 'assertion') {
    const e = event as AssertionEvent;
    const assertionClass = (e?.passed) ? 'pass' : 'fail';
    return `
      <div class="event ${event.type}">
        <div class="event-header">${typeHtml} - ${e?.passed ? 'PASS' : 'FAIL'}${timeHtml}</div>
        <div class="event-assertion ${assertionClass}">
          ${e?.description ? `<strong>Description:</strong> ${escapeHtml(e.description)}<br>` : ''}
          <strong>Matcher:</strong> ${escapeHtml(e?.matcher || 'unknown')}<br>
          <strong>Expected:</strong> <code>${escapeHtml(JSON.stringify(e?.expected))}</code><br>
          <strong>Actual:</strong> <code>${escapeHtml(JSON.stringify(e?.actual))}</code>
          ${e?.error ? `<br><strong>Error:</strong> ${escapeHtml(e.error)}` : ''}
        </div>
      </div>
    `;
  }

  if (event.type === 'error') {
    const e = event as ErrorEvent;
    return `
      <div class="event ${event.type}">
        <div class="event-header">${typeHtml}${timeHtml}</div>
        <div class="event-content">${escapeHtml(e?.error || 'Unknown error')}</div>
        ${e?.stack ? `<pre style="background: #fff; border: 1px solid #ddd; padding: 8px; margin-top: 8px; overflow-x: auto;">${escapeHtml(e.stack)}</pre>` : ''}
      </div>
    `;
  }

  // Fallback for unknown event types
  return `
    <div class="event" style="border-left-color: #999;">
      <div class="event-header">${typeHtml}${timeHtml}</div>
      <div class="event-content">${escapeHtml(JSON.stringify(event, null, 2))}</div>
    </div>
  `;
}

/**
 * Render all events for a test into HTML
 */
export function renderTestEvents(test: TestConversationData): string {
  return test.events.map((event) => renderEvent(event, test.index)).join('');
}

/**
 * Generate the complete HTML report
 */
export function generateHtml(data: ReportData): string {
  const testConversations = data.conversations.map(conv => ({
    ...conv,
    eventHtml: renderTestEvents(conv),
  }));

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Agent Evaluation Report</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; background: #f9f9f9; }
    h1 { color: #333; margin-top: 0; }

    .conversations-list { background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }

    details { border-bottom: 1px solid #e0e0e0; padding: 0; }
    details:last-child { border-bottom: none; }

    summary {
      cursor: pointer;
      padding: 15px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fafafa;
      user-select: none;
      transition: background 0.2s;
    }

    summary:hover {
      background: #f0f0f0;
    }

    details[open] > summary {
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
    }

    .conv-name {
      font-weight: 500;
      color: #333;
    }

    .conv-meta {
      display: flex;
      gap: 15px;
      align-items: center;
      font-size: 12px;
      color: #666;
    }

    .status-badge {
      font-size: 12px;
      font-weight: bold;
      padding: 3px 8px;
      border-radius: 3px;
      margin-left: 10px;
    }

    .status-badge.pass {
      color: #4caf50;
      background: #e8f5e9;
    }

    .status-badge.fail {
      color: #f44336;
      background: #ffebee;
    }

    .conv-content {
      padding: 20px;
      background: #fafafa;
    }

    .test-error {
      background: #ffebee;
      border: 1px solid #f44336;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 15px;
      color: #c62828;
    }

    .events-section { margin-top: 20px; }
    .events-section h4 { margin: 0 0 15px 0; color: #333; }

    .event { background: #fff; border: 1px solid #e0e0e0; padding: 12px; margin: 8px 0; border-radius: 4px; border-left: 3px solid #999; }
    .event.user_message { border-left-color: #2196f3; }
    .event.assistant_message { border-left-color: #4caf50; }
    .event.tool_call { border-left-color: #ff9800; }
    .event.tool_result { border-left-color: #ff9800; }
    .event.canvas_update { border-left-color: #9c27b0; }
    .event.assertion { border-left-color: #00bcd4; }
    .event.error { border-left-color: #f44336; background: #ffebee; }

    .event-header { font-weight: bold; font-size: 13px; margin-bottom: 8px; display: flex; justify-content: space-between; }
    .event-type { text-transform: uppercase; font-size: 11px; padding: 2px 6px; border-radius: 3px; background: #e0e0e0; }
    .event-type.user_message { background: #e3f2fd; color: #1976d2; }
    .event-type.assistant_message { background: #e8f5e9; color: #388e3c; }
    .event-type.tool_call { background: #fff3e0; color: #f57c00; }
    .event-type.tool_result { background: #fff3e0; color: #f57c00; }
    .event-type.canvas_update { background: #f3e5f5; color: #7b1fa2; }
    .event-type.assertion { background: #e0f2f1; color: #00796b; }
    .event-type.error { background: #ffebee; color: #d32f2f; }

    .event-time { font-size: 11px; color: #999; }
    .event-content { white-space: pre-wrap; word-break: break-word; font-family: 'Courier New', monospace; font-size: 13px; }
    .event-assertion { background: #e0f2f1; padding: 8px; border-radius: 3px; margin-top: 8px; }
    .event-assertion.fail { background: #ffebee; }

    .canvas-images {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 15px;
      margin-top: 10px;
    }

    .canvas-image {
      text-align: center;
    }

    .canvas-image img {
      max-width: 100%;
      height: auto;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .canvas-label {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }

    .report-footer {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      margin-top: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <h1>Agent Evaluation Report</h1>

  <div class="conversations-list">
    ${testConversations.map(conv => `
      <details>
        <summary>
          <div class="conv-name">${escapeHtml(conv.name)}</div>
          <div class="conv-meta">
            <span>${formatMs(conv.duration)} ms</span>
            ${conv.summary ? `<span>${conv.summary.passedAssertions}/${conv.summary.totalAssertions} assertions</span>` : ''}
            <span class="status-badge ${conv.passed ? 'pass' : 'fail'}">${conv.passed ? '✓ PASSED' : '✗ FAILED'}</span>
          </div>
        </summary>
        <div class="conv-content">
          ${conv.error ? `<div class="test-error"><strong>Error:</strong> ${escapeHtml(conv.error)}</div>` : ''}
          <div class="events-section">
            <h4>Conversation & Events</h4>
            ${conv.eventHtml}
          </div>
        </div>
      </details>
    `).join('')}
  </div>

  <div class="report-footer">
    <p><strong>Report Generated:</strong> ${new Date().toISOString()}</p>
    <p><strong>Total Conversations:</strong> ${testConversations.length}</p>
    <p><strong>Passed:</strong> ${testConversations.filter(c => c.passed).length} | <strong>Failed:</strong> ${testConversations.filter(c => !c.passed).length}</p>
  </div>

</body>
</html>
  `.trim();
}
