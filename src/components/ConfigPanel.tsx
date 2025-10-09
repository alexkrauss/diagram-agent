import { Settings, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface ConfigPanelProps {
  apiKey: string;
  onApiKeyChange: (apiKey: string) => void;
}

export function ConfigPanel({ apiKey, onApiKeyChange }: ConfigPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="panel-container">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="panel-header w-full hover:bg-panel-header/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Configuration</h2>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4 border-t border-panel-border">
          <div className="space-y-2">
            <Label htmlFor="api-key" className="text-xs font-medium">
              OpenAI API Key
            </Label>
            <Input
              id="api-key"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              className="bg-input font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Your API key is stored locally and never sent to our servers
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
