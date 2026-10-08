import {
  boolean,
  doublePrecision,
  index,
  integer,
  serial,
  snakeCase,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// snakeCase.table maps camelCase fields to snake_case columns, so
// `userId` is stored as "user_id".
const pgTable = snakeCase.table;

const timestamps = {
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .$onUpdate(() => new Date()),
};

// Better Auth tables. Better Auth's Drizzle adapter finds these by their
// export names, so keep them as user/session/account/verification.

export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  ...timestamps,
});

export const session = pgTable(
  "session",
  {
    id: text().primaryKey(),
    expiresAt: timestamp().notNull(),
    token: text().notNull().unique(),
    ...timestamps,
    ipAddress: text(),
    userAgent: text(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index().on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text().primaryKey(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp(),
    refreshTokenExpiresAt: timestamp(),
    scope: text(),
    password: text(),
    ...timestamps,
  },
  (table) => [index().on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp().notNull(),
    ...timestamps,
  },
  (table) => [index().on(table.identifier)],
);

// Poster tables. Deleting a campaign deletes its designs, their posters and
// those posters' scans.

export const posterCampaign = pgTable(
  "poster_campaign",
  {
    id: serial().primaryKey(),
    name: text().notNull(),
    target: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index().on(table.userId)],
);

export const posterDesign = pgTable(
  "poster_design",
  {
    id: serial().primaryKey(),
    // Key of the design image in imageStorage.
    designImageKey: text().notNull(),
    qrXPosition: doublePrecision().notNull(),
    qrYPosition: doublePrecision().notNull(),
    qrSize: doublePrecision().notNull(),
    qrRotation: doublePrecision().notNull(),
    posterCampaignId: integer()
      .notNull()
      .references(() => posterCampaign.id, { onDelete: "cascade" }),
  },
  (table) => [index().on(table.posterCampaignId)],
);

export const poster = pgTable(
  "poster",
  {
    id: serial().primaryKey(),
    activated: boolean().notNull(),
    latitude: doublePrecision().notNull(),
    longitude: doublePrecision().notNull(),
    posterDesignId: integer()
      .notNull()
      .references(() => posterDesign.id, { onDelete: "cascade" }),
  },
  (table) => [index().on(table.posterDesignId)],
);

export const scan = pgTable(
  "scan",
  {
    id: serial().primaryKey(),
    time: timestamp().notNull().defaultNow(),
    posterId: integer()
      .notNull()
      .references(() => poster.id, { onDelete: "cascade" }),
  },
  (table) => [index().on(table.posterId)],
);

export type PosterCampaign = typeof posterCampaign.$inferSelect;
export type PosterDesign = typeof posterDesign.$inferSelect;
