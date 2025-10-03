import { useState, useEffect } from 'react';
import { d2AgentFactory, AgentEvent, DiagramAgent } from './agent';
import { D2RendererImpl } from './render';

interface LogEntry {
  message: string;
  type: string;
}

function App() {
  const [apiKey, setApiKey] = useState('');
  const [userInput, setUserInput] = useState('');
  const [canvas, setCanvas] = useState('');
  const [svg, setSvg] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [renderer] = useState(() => new D2RendererImpl());
  const [agent, setAgent] = useState<DiagramAgent | null>(null);
  const [, setUpdateTrigger] = useState(0);

  // Create agent when API key is provided
  useEffect(() => {
    if (apiKey.trim() && !agent) {
      const newAgent: DiagramAgent = d2AgentFactory.createAgent(
        { apiKey },
        (event: AgentEvent) => {
          // Handle agent events
          let message = '';
          switch (event.type) {
            case 'start':
              message = 'Starting agent...';
              break;
            case 'log':
              message = event.message;
              break;
            case 'model_response':
              message = `Assistant: ${event.chunk}`;
              break;
            case 'tool_start':
              message = `Executing tool: ${event.name}`;
              break;
            case 'tool_end':
              message = `Tool completed: ${event.name}`;
              break;
            case 'canvas_update':
              message = 'Canvas updated';
              setCanvas(event.content);
              break;
            case 'error':
              message = `Error: ${event.error.message}`;
              break;
            case 'complete':
              message = 'Agent completed successfully';
              break;
          }

          setLogs((prev) => [...prev, { message, type: event.type }]);

          // Trigger re-render to update conversation history and state displays
          setUpdateTrigger(prev => prev + 1);
        }
      );

      setAgent(newAgent);
    }
  }, [apiKey, agent]);

  // Render D2 code to SVG whenever canvas changes
  useEffect(() => {
    const renderDiagram = async () => {
      if (canvas) {
        const result = await renderer.render(canvas);
        if (result.error) {
          console.error('Render error:', result.error);
          setSvg('');
        } else {
          setSvg(result.svg);
        }
      } else {
        setSvg('');
      }
    };
    renderDiagram();
  }, [canvas, renderer]);

  const handleSendMessage = async () => {
    if (!apiKey.trim()) {
      alert('Please enter your OpenAI API key');
      return;
    }

    if (!userInput.trim()) {
      alert('Please enter a message');
      return;
    }

    if (!agent) {
      alert('Agent is not initialized. Please wait...');
      return;
    }

    const currentMessage = userInput;
    setUserInput('');

    // Add user message to logs
    setLogs((prev) => [...prev, { message: `User: ${currentMessage}`, type: 'user_message' }]);

    try {
      await agent.sendMessage(currentMessage);
    } catch (error) {
      console.error('Agent error:', error);
    }
  };

  const handleClearChat = () => {
    setLogs([]);
    setCanvas('');
    setSvg('');
    setAgent(null);
    setUserInput('');
  };

  // Query agent state directly (no duplication)
  const agentState = agent?.getState() ?? { status: 'idle' };
  const conversationHistory = agent?.getConversationHistory() ?? [];

  const getStateDisplay = () => {
    switch (agentState.status) {
      case 'idle':
        return 'Idle';
      case 'thinking':
        return 'Thinking...';
      case 'running_tool':
        return `Running tool: ${agentState.toolName}`;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">D2 Diagram Agent</h1>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">Settings</h2>
          <div className="text-sm font-medium">
            Agent Status: <span className={agentState.status === 'idle' ? 'text-gray-600' : 'text-blue-600'}>{getStateDisplay()}</span>
          </div>
        </div>
        <input
          type="password"
          placeholder="OpenAI API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', height: 'calc(100vh - 280px)' }}>
        <div className="bg-white p-6 rounded-lg shadow flex flex-col">
          <h2 className="text-xl font-semibold mb-4">User Input</h2>
          <textarea
            placeholder="Enter your request for modifying the D2 diagram..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="p-2 border border-gray-300 rounded mb-4 font-mono text-sm"
            style={{ height: '300px', width: '100%', boxSizing: 'border-box' }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSendMessage}
              disabled={agentState.status !== 'idle'}
              className="flex-1 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {agentState.status !== 'idle' ? 'Sending...' : 'Send'}
            </button>
            <button
              onClick={handleClearChat}
              disabled={agentState.status !== 'idle'}
              className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Clear Chat
            </button>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">Conversation History</h3>
            <div className="bg-gray-50 p-3 rounded overflow-y-auto text-xs" style={{ height: '150px' }}>
              {conversationHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`mb-2 p-2 rounded ${
                    msg.role === 'user'
                      ? 'bg-blue-100 border-l-2 border-blue-500'
                      : msg.role === 'assistant'
                      ? 'bg-gray-100 border-l-2 border-gray-500'
                      : 'bg-purple-100 border-l-2 border-purple-500'
                  }`}
                >
                  <div className="font-semibold text-xs mb-1">
                    {msg.role === 'user' ? 'User' : msg.role === 'assistant' ? 'Assistant' : 'Canvas Update'}
                  </div>
                  <div className="text-xs whitespace-pre-wrap break-words">
                    {msg.content.length > 200 ? msg.content.substring(0, 200) + '...' : msg.content}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">Agent Event Log</h3>
            <div className="bg-gray-50 p-3 rounded overflow-y-auto font-mono text-xs" style={{ height: '150px' }}>
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`mb-1 p-1 border-l-2 pl-2 ${
                    log.type === 'error'
                      ? 'border-red-500'
                      : log.type === 'tool_start' || log.type === 'tool_end'
                      ? 'border-green-500'
                      : log.type === 'canvas_update'
                      ? 'border-purple-500'
                      : log.type === 'user_message'
                      ? 'border-orange-500 font-semibold'
                      : 'border-blue-500'
                  }`}
                >
                  {log.message}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow flex flex-col">
          <h2 className="text-xl font-semibold mb-4">D2 Canvas</h2>
          <textarea
            value={canvas}
            readOnly
            placeholder="D2 diagram content will appear here..."
            className="p-2 border border-gray-300 rounded font-mono text-sm bg-gray-50"
            style={{ height: 'calc(100% - 50px)', width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow flex flex-col">
          <h2 className="text-xl font-semibold mb-4">Rendered Diagram</h2>
          <div className="flex-1 border border-gray-300 rounded overflow-auto bg-gray-50 p-4">
            {svg ? (
              <div dangerouslySetInnerHTML={{ __html: svg }} />
            ) : (
              <div className="text-gray-400 text-center mt-8">Rendered diagram will appear here...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
