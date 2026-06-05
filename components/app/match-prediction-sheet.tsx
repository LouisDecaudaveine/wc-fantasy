"use client";

import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { ScoreStepper } from "@/components/app/score-stepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { MatchStatusFilter } from "@/lib/matches/filters";
import { getPredictionState } from "@/lib/matches/prediction-state";
import type { SerializedMatch } from "@/lib/matches/serialize";

type MatchPredictionSheetProps = {
  match: SerializedMatch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statusFilter: MatchStatusFilter;
};

type PredictionResponse = {
  id: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  pointsEarned: number;
  updatedAt: string;
};

async function savePrediction(
  matchId: string,
  homeScore: number,
  awayScore: number,
) {
  const response = await fetch(`/api/predictions/${matchId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ homeScore, awayScore }),
  });

  const data = (await response.json()) as PredictionResponse & {
    error?: string;
    code?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to save prediction");
  }

  return data;
}

function formatKickoff(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function predictionStateLabel(state: ReturnType<typeof getPredictionState>) {
  switch (state) {
    case "open":
      return "Open";
    case "locked":
      return "Locked";
    case "scored":
      return "Scored";
  }
}

export function MatchPredictionSheet({
  match,
  open,
  onOpenChange,
  statusFilter,
}: MatchPredictionSheetProps) {
  if (!match) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] rounded-t-2xl">
        <PredictionSheetBody
          key={match.id}
          match={match}
          onOpenChange={onOpenChange}
          statusFilter={statusFilter}
        />
      </SheetContent>
    </Sheet>
  );
}

function PredictionSheetBody({
  match,
  onOpenChange,
  statusFilter,
}: {
  match: SerializedMatch;
  onOpenChange: (open: boolean) => void;
  statusFilter: MatchStatusFilter;
}) {
  const queryClient = useQueryClient();
  const [homeScore, setHomeScore] = useState(
    match.userPrediction?.homeScore ?? 0,
  );
  const [awayScore, setAwayScore] = useState(
    match.userPrediction?.awayScore ?? 0,
  );
  const [error, setError] = useState<string | null>(null);

  const predictionState = getPredictionState(match);
  const editable = predictionState === "open";

  const mutation = useMutation({
    mutationFn: () => savePrediction(match.id, homeScore, awayScore),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["matches", statusFilter] });

      const previous = queryClient.getQueryData<SerializedMatch[]>([
        "matches",
        statusFilter,
      ]);

      queryClient.setQueryData<SerializedMatch[]>(
        ["matches", statusFilter],
        (old) =>
          old?.map((item) =>
            item.id === match.id
              ? {
                  ...item,
                  userPrediction: {
                    id: item.userPrediction?.id ?? "optimistic",
                    homeScore,
                    awayScore,
                    pointsEarned: item.userPrediction?.pointsEarned ?? 0,
                    updatedAt: new Date().toISOString(),
                  },
                }
              : item,
          ),
      );

      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["matches", statusFilter], context.previous);
      }
      setError(err instanceof Error ? err.message : "Failed to save prediction");
    },
    onSuccess: () => {
      onOpenChange(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });

  return (
    <>
      <SheetHeader>
        <div className="flex items-center justify-between gap-2">
          <SheetTitle>Predict score</SheetTitle>
          <Badge variant={editable ? "outline" : "secondary"}>
            {predictionStateLabel(predictionState)}
          </Badge>
        </div>
        <SheetDescription>
          {match.status === "PST"
            ? `Rescheduled to ${formatKickoff(match.kickoffAt)}`
            : formatKickoff(match.kickoffAt)}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-6 px-4">
        {match.status === "PST" ? (
          <p className="rounded-md bg-muted px-3 py-2 text-center text-sm text-muted-foreground">
            This match was postponed. Predictions stay open until the new
            kickoff.
          </p>
        ) : null}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <TeamLabel name={match.homeTeamName} logo={match.homeTeamLogo} />
          <span className="text-sm font-medium text-muted-foreground">vs</span>
          <TeamLabel
            name={match.awayTeamName}
            logo={match.awayTeamLogo}
            align="right"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ScoreStepper
            label={match.homeTeamName}
            value={homeScore}
            onChange={setHomeScore}
            disabled={!editable || mutation.isPending}
          />
          <ScoreStepper
            label={match.awayTeamName}
            value={awayScore}
            onChange={setAwayScore}
            disabled={!editable || mutation.isPending}
          />
        </div>

        {match.userPrediction && predictionState === "scored" ? (
          <p className="rounded-md bg-muted px-3 py-2 text-center text-sm">
            You earned{" "}
            <span className="font-semibold">
              {match.userPrediction.pointsEarned} pts
            </span>{" "}
            on this match
          </p>
        ) : null}

        {predictionState === "locked" && !match.userPrediction ? (
          <p className="text-center text-sm text-muted-foreground">
            Kickoff has passed — no prediction saved.
          </p>
        ) : null}

        {predictionState === "locked" && match.userPrediction ? (
          <p className="text-center text-sm text-muted-foreground">
            Your prediction is locked at {match.userPrediction.homeScore}-
            {match.userPrediction.awayScore}.
          </p>
        ) : null}

        {error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <SheetFooter>
        {editable ? (
          <Button
            className="min-h-11 w-full"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending
              ? "Saving..."
              : match.userPrediction
                ? "Update prediction"
                : "Save prediction"}
          </Button>
        ) : (
          <Button
            variant="outline"
            className="min-h-11 w-full"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        )}
      </SheetFooter>
    </>
  );
}

function TeamLabel({
  name,
  logo,
  align = "left",
}: {
  name: string;
  logo: string | null;
  align?: "left" | "right";
}) {
  return (
    <div
      className={
        align === "right"
          ? "flex flex-col items-end gap-1 text-right"
          : "flex flex-col items-start gap-1"
      }
    >
      {logo ? (
        <Image
          src={logo}
          alt=""
          width={32}
          height={32}
          className="size-8 object-contain"
          unoptimized
        />
      ) : (
        <div className="size-8 rounded-full bg-muted" />
      )}
      <span className="text-sm font-medium leading-tight">{name}</span>
    </div>
  );
}
