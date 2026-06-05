"use client";

import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getPredictionState } from "@/lib/matches/prediction-state";
import type { SerializedMatch } from "@/lib/matches/serialize";
import { cn } from "@/lib/utils";

function formatKickoff(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function statusLabel(status: string) {
  switch (status) {
    case "NS":
      return "Upcoming";
    case "FT":
      return "Full time";
    case "1H":
    case "2H":
    case "HT":
    case "ET":
    case "P":
    case "LIVE":
      return "Live";
    case "PST":
      return "Postponed";
    default:
      return status;
  }
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (["1H", "2H", "HT", "ET", "P", "LIVE"].includes(status)) {
    return "default";
  }
  if (status === "FT") {
    return "secondary";
  }
  return "outline";
}

type MatchCardProps = {
  match: SerializedMatch;
  onSelect?: (match: SerializedMatch) => void;
};

export function MatchCard({ match, onSelect }: MatchCardProps) {
  const showScore =
    match.homeScore !== null &&
    match.awayScore !== null &&
    ["FT", "AET", "PEN", "1H", "2H", "HT", "ET", "P", "LIVE"].includes(
      match.status,
    );

  const predictionState = getPredictionState(match);
  const interactive = Boolean(onSelect);

  return (
    <Card
      className={cn(
        interactive &&
          "cursor-pointer transition-colors hover:bg-muted/40 active:bg-muted/60",
      )}
      onClick={() => onSelect?.(match)}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onSelect) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(match);
        }
      }}
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {match.status === "PST"
              ? `Rescheduled: ${formatKickoff(match.kickoffAt)}`
              : formatKickoff(match.kickoffAt)}
          </p>
          <div className="flex items-center gap-1.5">
            {match.userPrediction ? (
              <Badge variant="secondary" className="tabular-nums">
                {predictionState === "scored"
                  ? `${match.userPrediction.pointsEarned} pts`
                  : `${match.userPrediction.homeScore}-${match.userPrediction.awayScore}`}
              </Badge>
            ) : predictionState === "open" ? (
              <Badge variant="outline">Predict</Badge>
            ) : null}
            <Badge variant={statusVariant(match.status)}>
              {statusLabel(match.status)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <TeamCell
            name={match.homeTeamName}
            logo={match.homeTeamLogo}
            align="left"
          />
          <div className="text-center">
            {showScore ? (
              <p className="text-lg font-semibold tabular-nums">
                {match.homeScore} - {match.awayScore}
              </p>
            ) : match.userPrediction ? (
              <p className="text-sm font-semibold tabular-nums text-muted-foreground">
                {match.userPrediction.homeScore} - {match.userPrediction.awayScore}
              </p>
            ) : (
              <p className="text-sm font-medium text-muted-foreground">vs</p>
            )}
          </div>
          <TeamCell
            name={match.awayTeamName}
            logo={match.awayTeamLogo}
            align="right"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function TeamCell({
  name,
  logo,
  align,
}: {
  name: string;
  logo: string | null;
  align: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        align === "right" && "flex-row-reverse text-right",
      )}
    >
      {logo ? (
        <Image
          src={logo}
          alt=""
          width={28}
          height={28}
          className="size-7 shrink-0 object-contain"
          unoptimized
        />
      ) : (
        <div className="size-7 shrink-0 rounded-full bg-muted" />
      )}
      <span className="text-sm font-medium leading-tight">{name}</span>
    </div>
  );
}
