import { Copy, Image as ImageIcon, AlertCircle, Download, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RenderPanelProps {
  svg: string;
  error?: string;
  onExpand?: () => void;
}

export function RenderPanel({ svg, error, onExpand }: RenderPanelProps) {
  const handleCopy = () => {
    if (svg) {
      navigator.clipboard.writeText(svg);
      toast.success("SVG copied to clipboard");
    }
  };

  const handleExport = (format: string) => {
    toast.success(`Exported as ${format.toUpperCase()}`);
    // TODO: Implement actual export functionality
  };

  return (
    <div className="panel-container flex flex-col h-full">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          {onExpand && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onExpand}
              className="h-7 px-2 -ml-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          <ImageIcon className="h-4 w-4 text-secondary" />
          <h2 className="font-semibold text-sm">Rendered Output</h2>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 gap-2"
              disabled={!svg && !error}
            >
              <Copy className="h-4 w-4" />
              <span className="text-xs">Copy / Export</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleCopy} disabled={!svg}>
              <Copy className="h-4 w-4 mr-2" />
              Copy to Clipboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("svg")} disabled={!svg}>
              <Download className="h-4 w-4 mr-2" />
              Export as SVG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("png")} disabled={!svg}>
              <Download className="h-4 w-4 mr-2" />
              Export as PNG (1x)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("png-2x")} disabled={!svg}>
              <Download className="h-4 w-4 mr-2" />
              Export as PNG (2x)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("png-4x")} disabled={!svg}>
              <Download className="h-4 w-4 mr-2" />
              Export as PNG (4x)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-muted/30 flex items-center justify-center">
        {error ? (
          <div className="text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <div>
              <p className="font-semibold text-destructive">Rendering Error</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        ) : svg ? (
          <div className="w-full max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />
        ) : (
          <div className="text-center text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Rendered diagram will appear here...</p>
          </div>
        )}
      </div>
    </div>
  );
}
