import { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Toaster } from '@/components/ui/sonner';
import { StatusBar } from '@/components/StatusBar';
import { ConfigPanel } from '@/components/ConfigPanel';
import { ChatPanel } from '@/components/ChatPanel';
import { CanvasPanel } from '@/components/CanvasPanel';
import { RenderPanel } from '@/components/RenderPanel';
import { useDiagramAgentHandler } from '@/hooks/useDiagramAgentHandler';
import { D2RendererImpl, createImageConverter } from '@/render';
import { useConfig } from '@/config/useConfig';

function App() {
  const [config, setConfig] = useConfig();
  const [renderer] = useState(() => new D2RendererImpl());
  const [imageConverter] = useState(() => createImageConverter());
  const [isCanvasCollapsed, setIsCanvasCollapsed] = useState(false);

  // Use the custom hook that manages the agent, chat state, and feedback loop
  const handler = useDiagramAgentHandler({
    apiKey: config.apiKey,
    renderer,
    imageConverter
  });

  const handleReset = () => {
    handler.clearChat();
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
                svg={handler.svg}
                error={handler.renderError}
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
