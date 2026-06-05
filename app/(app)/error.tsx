"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <p className="text-sm font-medium">Something went wrong</p>
        <p className="text-sm text-muted-foreground">
          Try again. If the problem persists, sign out and back in.
        </p>
        <Button className="min-h-11 w-full" onClick={reset}>
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}
