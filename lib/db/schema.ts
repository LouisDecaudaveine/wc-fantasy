import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const matches = sqliteTable(
  "matches",
  {
    id: text("id").primaryKey(),
    externalFixtureId: integer("external_fixture_id").notNull().unique(),
    homeTeamName: text("home_team_name").notNull(),
    awayTeamName: text("away_team_name").notNull(),
    homeTeamLogo: text("home_team_logo"),
    awayTeamLogo: text("away_team_logo"),
    kickoffAt: integer("kickoff_at", { mode: "timestamp" }).notNull(),
    status: text("status").notNull(),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    stage: text("stage").notNull(),
    round: text("round"),
    predictionsLockedAt: integer("predictions_locked_at", {
      mode: "timestamp",
    }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("matches_kickoff_at_idx").on(table.kickoffAt),
    index("matches_status_idx").on(table.status),
  ],
);

export const predictions = sqliteTable(
  "predictions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    matchId: text("match_id")
      .notNull()
      .references(() => matches.id),
    homeScore: integer("home_score").notNull(),
    awayScore: integer("away_score").notNull(),
    pointsEarned: integer("points_earned").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    unique("predictions_user_match_unique").on(table.userId, table.matchId),
    index("predictions_user_id_idx").on(table.userId),
    index("predictions_match_id_idx").on(table.matchId),
  ],
);

export const syncLog = sqliteTable("sync_log", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  requestsUsed: integer("requests_used").notNull().default(0),
  status: text("status").notNull(),
  message: text("message"),
  ranAt: integer("ran_at", { mode: "timestamp" }).notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  predictions: many(predictions),
}));

export const matchesRelations = relations(matches, ({ many }) => ({
  predictions: many(predictions),
}));

export const predictionsRelations = relations(predictions, ({ one }) => ({
  user: one(users, {
    fields: [predictions.userId],
    references: [users.id],
  }),
  match: one(matches, {
    fields: [predictions.matchId],
    references: [matches.id],
  }),
}));
