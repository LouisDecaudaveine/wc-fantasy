"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type LeaderboardEntry = {
  rank: number;
  userId: string;
  name: string;
  totalPoints: number;
  predictionsMade: number;
};

type LeaderboardResponse = {
  entries: LeaderboardEntry[];
  currentUserRank: number | null;
};

async function fetchLeaderboard() {
  const response = await fetch("/api/leaderboard");

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    throw new Error("Failed to load leaderboard");
  }

  return response.json() as Promise<LeaderboardResponse>;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function rankLabel(rank: number) {
  if (rank === 1) return "1st";
  if (rank === 2) return "2nd";
  if (rank === 3) return "3rd";
  return `${rank}th`;
}

export function LeaderboardList() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
    enabled: sessionStatus === "authenticated",
  });

  if (sessionStatus === "loading") {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Loading...
        </CardContent>
      </Card>
    );
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm text-muted-foreground">
            Sign in to see how you rank against your friends.
          </p>
          <Button
            className="min-h-11 w-full"
            onClick={() => router.push("/login")}
          >
            Sign in
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Leaderboard</h2>
        <p className="text-sm text-muted-foreground">
          Rankings update after each finished match.
        </p>
      </div>

      {data?.currentUserRank ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Your rank
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {rankLabel(data.currentUserRank)}
              </p>
            </div>
            <Badge variant="secondary" className="tabular-nums">
              {data.entries.find((entry) => entry.userId === session?.user?.id)
                ?.totalPoints ?? 0}{" "}
              pts
            </Badge>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Loading leaderboard...
          </CardContent>
        </Card>
      ) : null}

      {error instanceof Error && error.message === "UNAUTHORIZED" ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm text-muted-foreground">
              Your session expired. Sign in again to continue.
            </p>
            <Button
              className="min-h-11 w-full"
              onClick={() => router.push("/login")}
            >
              Sign in
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {error && error.message !== "UNAUTHORIZED" ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm text-destructive">
              Could not load leaderboard.
            </p>
            <Button
              variant="outline"
              className="min-h-11 w-full"
              onClick={() => refetch()}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !error && data?.entries.length === 0 ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            No players yet. Register friends to start competing.
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !error && data && data.entries.length > 0 ? (
        <div className="space-y-2">
          {data.entries.map((entry) => {
            const isCurrentUser = entry.userId === session?.user?.id;

            return (
              <Card
                key={entry.userId}
                className={cn(
                  isCurrentUser && "border-primary bg-primary/5 ring-1 ring-primary/20",
                )}
              >
                <CardContent className="flex min-h-11 items-center gap-3 p-3">
                  <span
                    className={cn(
                      "w-8 shrink-0 text-center text-sm font-semibold tabular-nums",
                      entry.rank <= 3 && "text-primary",
                    )}
                  >
                    {entry.rank}
                  </span>

                  <Avatar size="sm">
                    <AvatarFallback>{initials(entry.name)}</AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {entry.name}
                      {isCurrentUser ? (
                        <span className="ml-1 text-xs text-muted-foreground">
                          (you)
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.predictionsMade} prediction
                      {entry.predictionsMade === 1 ? "" : "s"}
                    </p>
                  </div>

                  <Badge
                    variant={isCurrentUser ? "default" : "secondary"}
                    className="shrink-0 tabular-nums"
                  >
                    {entry.totalPoints} pts
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
