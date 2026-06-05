"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { MatchCard } from "@/components/app/match-card";
import { MatchPredictionSheet } from "@/components/app/match-prediction-sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MatchStatusFilter } from "@/lib/matches/filters";
import type { SerializedMatch } from "@/lib/matches/serialize";

async function fetchMatches(status: MatchStatusFilter) {
  const response = await fetch(`/api/matches?status=${status}`);

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    throw new Error("Failed to load matches");
  }

  const data = (await response.json()) as { matches: SerializedMatch[] };
  return data.matches;
}

function groupMatches(matches: SerializedMatch[]) {
  const groups = new Map<string, SerializedMatch[]>();

  for (const match of matches) {
    const key = match.round ?? match.stage;
    const existing = groups.get(key) ?? [];
    existing.push(match);
    groups.set(key, existing);
  }

  return Array.from(groups.entries());
}

export function MatchesList() {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const [statusFilter, setStatusFilter] =
    useState<MatchStatusFilter>("upcoming");
  const [selectedMatch, setSelectedMatch] = useState<SerializedMatch | null>(
    null,
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["matches", statusFilter],
    queryFn: () => fetchMatches(statusFilter),
    enabled: sessionStatus === "authenticated",
  });

  const groupedMatches = useMemo(() => groupMatches(data ?? []), [data]);

  function handleSelectMatch(match: SerializedMatch) {
    setSelectedMatch(match);
    setSheetOpen(true);
  }

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
            Sign in to view World Cup fixtures and submit predictions.
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
    <>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Matches</h2>
          <p className="text-sm text-muted-foreground">
            Tap a match to predict the score before kickoff.
          </p>
        </div>

        <Tabs
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as MatchStatusFilter)}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="live">Live</TabsTrigger>
            <TabsTrigger value="finished">Finished</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Loading matches...
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
              <p className="text-sm text-destructive">Could not load matches.</p>
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

        {!isLoading && !error && groupedMatches.length === 0 ? (
          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="text-sm text-muted-foreground">
                No {statusFilter} matches yet. Run a fixture sync to pull World
                Cup 2026 data.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {groupedMatches.map(([group, groupMatches]) => (
          <section key={group} className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {group}
            </h3>
            <div className="space-y-3">
              {groupMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onSelect={handleSelectMatch}
                />
              ))}
            </div>
          </section>
        ))}

        {isFetching && !isLoading ? (
          <p className="text-center text-xs text-muted-foreground">
            Refreshing...
          </p>
        ) : null}
      </div>

      <MatchPredictionSheet
        match={selectedMatch}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        statusFilter={statusFilter}
      />
    </>
  );
}
