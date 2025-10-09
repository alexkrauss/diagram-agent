import { Code2, Copy, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface CanvasPanelProps {
  code: string;
  onCollapse?: () => void;
}

export function CanvasPanel({ code, onCollapse }: CanvasPanelProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  return (
    <div className="panel-container flex flex-col h-full">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-accent" />
          <h2 className="font-semibold text-sm">Canvas (D2 DSL)</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2 gap-2"
            disabled={!code}
          >
            <Copy className="h-4 w-4" />
            <span className="text-xs">Copy</span>
          </Button>
          {onCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCollapse}
              className="h-7 px-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Textarea
          value={code}
          readOnly
          className="editor-panel h-full w-full border-0 rounded-none focus-visible:ring-0 resize-none"
          placeholder="D2 diagram code will appear here..."
        />
      </div>
    </div>
  );
}
