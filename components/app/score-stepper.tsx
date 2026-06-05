"use client";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ScoreStepperProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function ScoreStepper({
  label,
  value,
  onChange,
  disabled = false,
}: ScoreStepperProps) {
  function decrement() {
    onChange(Math.max(0, value - 1));
  }

  function increment() {
    onChange(Math.min(20, value + 1));
  }

  return (
    <div className="space-y-2">
      <p className="text-center text-sm font-medium">{label}</p>
      <div className="flex items-center justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11"
          onClick={decrement}
          disabled={disabled || value <= 0}
          aria-label={`Decrease ${label} score`}
        >
          <Minus />
        </Button>
        <span
          className={cn(
            "min-w-12 text-center text-3xl font-semibold tabular-nums",
            disabled && "text-muted-foreground",
          )}
        >
          {value}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11"
          onClick={increment}
          disabled={disabled || value >= 20}
          aria-label={`Increase ${label} score`}
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}
