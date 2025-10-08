import { useState, useEffect } from 'react';
import { ChatSection } from '@llamaindex/chat-ui';
import { useDiagramAgentHandler } from './hooks/useDiagramAgentHandler';
import { D2RendererImpl } from './render';
import { useConfig } from './config/useConfig';

function App() {
  const [config, setConfig] = useConfig();
  const [svg, setSvg] = useState('');
  const [renderer] = useState(() => new D2RendererImpl());

  // Use the custom hook that bridges DiagramAgent with chat-ui
  const handler = useDiagramAgentHandler({ apiKey: config.apiKey });

  // Render D2 code to SVG whenever canvas changes
  useEffect(() => {
    const renderDiagram = async () => {
      if (handler.canvasContent) {
        const result = await renderer.render(handler.canvasContent);
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
  }, [handler.canvasContent, renderer]);

  const handleClearChat = () => {
    handler.clearChat();
    setSvg('');
  };

  const getStatusDisplay = () => {
    switch (handler.status) {
      case 'ready':
        return 'Ready';
      case 'streaming':
        return 'Thinking...';
      case 'error':
        return 'Error';
      default:
        return 'Idle';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">D2 Diagram Agent</h1>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">Settings</h2>
          <div className="text-sm font-medium">
            Agent Status: <span className={handler.status === 'ready' ? 'text-gray-600' : handler.status === 'streaming' ? 'text-blue-600' : handler.status === 'error' ? 'text-red-600' : 'text-gray-600'}>{getStatusDisplay()}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="password"
            placeholder="OpenAI API Key"
            value={config.apiKey}
            onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          <button
            onClick={handleClearChat}
            disabled={handler.status === 'streaming'}
            className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Clear Chat
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', height: 'calc(100vh - 280px)' }}>
        <div className="bg-white rounded-lg shadow flex flex-col overflow-hidden">
          <ChatSection handler={handler} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow flex flex-col">
          <h2 className="text-xl font-semibold mb-4">D2 Canvas</h2>
          <textarea
            value={handler.canvasContent}
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
