export const UPCOMING_STATUSES = ["NS", "TBD", "PST"] as const;
export const LIVE_STATUSES = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"] as const;
export const FINISHED_STATUSES = ["FT", "AET", "PEN"] as const;

export type MatchStatusFilter = "upcoming" | "live" | "finished" | "all";

export function statusesForFilter(filter: MatchStatusFilter): string[] | null {
  switch (filter) {
    case "upcoming":
      return [...UPCOMING_STATUSES];
    case "live":
      return [...LIVE_STATUSES];
    case "finished":
      return [...FINISHED_STATUSES];
    case "all":
      return null;
  }
}

export function parseStatusFilter(value: string | null): MatchStatusFilter {
  if (value === "live" || value === "finished" || value === "all") {
    return value;
  }
  return "upcoming";
}
