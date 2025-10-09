import { RotateCcw, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "ready" | "streaming" | "submitted" | "error";

interface StatusBarProps {
  status: Status;
  onReset: () => void;
}

export function StatusBar({ status, onReset }: StatusBarProps) {
  const statusConfig = {
    ready: { label: "Ready", className: "status-ready" },
    submitted: { label: "Submitted", className: "status-running" },
    streaming: { label: "Running", className: "status-running" },
    error: { label: "Error", className: "status-error" },
  };

  const currentStatus = statusConfig[status];

  return (
    <div className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Diagram Agent
        </h1>
        <div className={`status-indicator ${currentStatus.className}`}>
          <Circle className="h-2 w-2 fill-current" />
          <span>{currentStatus.label}</span>
        </div>
      </div>

      <Button
        onClick={onReset}
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={status === "streaming" || status === "submitted"}
      >
        <RotateCcw className="h-4 w-4" />
        Reset
      </Button>
    </div>
  );
}
