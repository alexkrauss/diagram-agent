import { useState, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Toaster } from '@/components/ui/sonner';
import { StatusBar } from '@/components/StatusBar';
import { ConfigPanel } from '@/components/ConfigPanel';
import { ChatPanel } from '@/components/ChatPanel';
import { CanvasPanel } from '@/components/CanvasPanel';
import { RenderPanel } from '@/components/RenderPanel';
import { useDiagramAgentHandler } from '@/hooks/useDiagramAgentHandler';
import { D2RendererImpl } from '@/render';
import { useConfig } from '@/config/useConfig';

function App() {
  const [config, setConfig] = useConfig();
  const [svg, setSvg] = useState('');
  const [renderError, setRenderError] = useState<string>('');
  const [renderer] = useState(() => new D2RendererImpl());
  const [isCanvasCollapsed, setIsCanvasCollapsed] = useState(false);

  // Use the custom hook that manages the agent and chat state
  const handler = useDiagramAgentHandler({ apiKey: config.apiKey });

  // Render D2 code to SVG whenever canvas changes
  useEffect(() => {
    const renderDiagram = async () => {
      if (handler.canvasContent) {
        const result = await renderer.render(handler.canvasContent);
        if (result.error) {
          console.error('Render error:', result.error);
          setRenderError(result.error);
          setSvg('');
        } else {
          setRenderError('');
          setSvg(result.svg);
        }
      } else {
        setSvg('');
        setRenderError('');
      }
    };
    renderDiagram();
  }, [handler.canvasContent, renderer]);

  const handleReset = () => {
    handler.clearChat();
    setSvg('');
    setRenderError('');
  };

  const handleApiKeyChange = (newApiKey: string) => {
    setConfig({ ...config, apiKey: newApiKey });
  };

  const isProcessing = handler.status === 'streaming' || handler.status === 'submitted';

  return (
    <div className="h-screen flex flex-col">
      <StatusBar status={handler.status} onReset={handleReset} />

      <div className="flex-1 overflow-hidden p-4 gap-4 flex flex-col">
        <ConfigPanel apiKey={config.apiKey} onApiKeyChange={handleApiKeyChange} />

        <div className="flex-1 min-h-0">
          <ResizablePanelGroup direction="horizontal" className="h-full gap-4">
            <ResizablePanel defaultSize={25} minSize={20}>
              <ChatPanel
                messages={handler.messages}
                onSendMessage={handler.sendMessage}
                disabled={isProcessing}
              />
            </ResizablePanel>

            <ResizableHandle className="w-1 bg-border hover:bg-primary transition-colors" />

            {!isCanvasCollapsed && (
              <>
                <ResizablePanel defaultSize={35} minSize={25}>
                  <CanvasPanel
                    code={handler.canvasContent}
                    onCollapse={() => setIsCanvasCollapsed(true)}
                  />
                </ResizablePanel>

                <ResizableHandle className="w-1 bg-border hover:bg-primary transition-colors" />
              </>
            )}

            <ResizablePanel defaultSize={40} minSize={30}>
              <RenderPanel
                svg={svg}
                error={renderError}
                onExpand={isCanvasCollapsed ? () => setIsCanvasCollapsed(false) : undefined}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      <Toaster />
    </div>
  );
}

export default App;
