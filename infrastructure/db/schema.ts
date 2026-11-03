import {
  bigint,
  boolean,
  doublePrecision,
  index,
  integer,
  serial,
  snakeCase,
  text,
  timestamp,
  uuid,
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

// Better Auth's rate limit counters. They're kept in the database because each
// Netlify Function instance has its own memory.
export const rateLimit = pgTable("rate_limit", {
  id: text().primaryKey(),
  key: text().notNull().unique(),
  count: integer().notNull(),
  // Milliseconds since the epoch.
  lastRequest: bigint({ mode: "number" }).notNull(),
});

// When each user was last sent a password reset email, to send at most one per
// cooldown (see infrastructure/email/resetEmailCooldown.ts).
export const passwordResetEmail = pgTable("password_reset_email", {
  userId: text()
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  sentAt: timestamp().notNull(),
});

// Poster tables. Deleting a campaign deletes its designs, their posters and
// those posters' scans.

// Campaigns and designs are keyed by UUIDs the domain generates, so their ids
// have no default: an insert without one fails rather than getting an id the
// domain doesn't know about. Lists are ordered by created_at, as random UUIDs
// don't sort by age.

export const campaign = pgTable(
  "campaign",
  {
    id: uuid().primaryKey(),
    name: text().notNull(),
    target: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => [index().on(table.userId)],
);

export const posterDesign = pgTable(
  "poster_design",
  {
    id: uuid().primaryKey(),
    // Key of the design image in the blob store.
    designImageKey: text().notNull(),
    // Where the QR code goes on the image (see the domain's QrPlacement).
    x: doublePrecision().notNull(),
    y: doublePrecision().notNull(),
    size: doublePrecision().notNull(),
    rotation: doublePrecision().notNull(),
    campaignId: uuid()
      .notNull()
      .references(() => campaign.id, { onDelete: "cascade" }),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => [index().on(table.campaignId)],
);

// Posters and scans aren't modelled in the domain yet, so they keep
// database-assigned ids.

export const poster = pgTable(
  "poster",
  {
    id: serial().primaryKey(),
    activated: boolean().notNull(),
    latitude: doublePrecision().notNull(),
    longitude: doublePrecision().notNull(),
    posterDesignId: uuid()
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
