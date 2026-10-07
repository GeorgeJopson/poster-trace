import {
  boolean,
  customType,
  doublePrecision,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Table and column names match the tables Prisma created, so data can be
// copied across from the old database unchanged.

// Millisecond precision, matching JavaScript Dates.
const timestamps = {
  createdAt: timestamp({ precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp({ precision: 3 })
    .notNull()
    .$onUpdate(() => new Date()),
};

// Drizzle's built-in bytea column is sent through the Netlify serverless
// driver with String(), which mangles binary data. Postgres hex format
// ("\x" + hex digits) round-trips safely through every driver.
const bytea = customType<{ data: Uint8Array; driverData: string | Buffer }>({
  dataType() {
    return "bytea";
  },
  toDriver(value) {
    return `\\x${Buffer.from(value).toString("hex")}`;
  },
  fromDriver(value) {
    if (typeof value === "string") {
      return Buffer.from(value.replace(/^\\x/, ""), "hex");
    }
    return value;
  },
});

// Better Auth tables. Better Auth's Drizzle adapter finds these by their
// export names, so keep them as user/session/account/verification.

export const user = pgTable(
  "user",
  {
    id: text().primaryKey(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean().notNull().default(false),
    image: text(),
    ...timestamps,
  },
  (table) => [uniqueIndex("user_email_key").on(table.email)],
);

export const session = pgTable(
  "session",
  {
    id: text().primaryKey(),
    expiresAt: timestamp({ precision: 3 }).notNull(),
    token: text().notNull(),
    ...timestamps,
    ipAddress: text(),
    userAgent: text(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (table) => [
    uniqueIndex("session_token_key").on(table.token),
    index("session_userId_idx").on(table.userId),
  ],
);

export const account = pgTable(
  "account",
  {
    id: text().primaryKey(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ precision: 3 }),
    refreshTokenExpiresAt: timestamp({ precision: 3 }),
    scope: text(),
    password: text(),
    ...timestamps,
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ precision: 3 }).notNull(),
    ...timestamps,
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

// Poster tables

export const posterCampaign = pgTable(
  "PosterCampaign",
  {
    id: serial().primaryKey(),
    name: text().notNull(),
    target: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (table) => [index("PosterCampaign_userId_idx").on(table.userId)],
);

export const posterDesign = pgTable("PosterDesign", {
  id: serial().primaryKey(),
  design: bytea().notNull(),
  designMimeType: text().notNull(),
  qr_x_position: doublePrecision().notNull(),
  qr_y_position: doublePrecision().notNull(),
  qr_size: doublePrecision().notNull(),
  qr_rotation: doublePrecision().notNull(),
  posterCampaignId: integer()
    .notNull()
    .references(() => posterCampaign.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
});

export const poster = pgTable("Poster", {
  id: serial().primaryKey(),
  activated: boolean().notNull(),
  latitude: doublePrecision().notNull(),
  longitude: doublePrecision().notNull(),
  posterDesignId: integer()
    .notNull()
    .references(() => posterDesign.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
});

export const scan = pgTable("Scan", {
  id: serial().primaryKey(),
  time: timestamp({ precision: 3 }).notNull().defaultNow(),
  posterId: integer()
    .notNull()
    .references(() => poster.id, { onDelete: "restrict", onUpdate: "cascade" }),
});

export type PosterCampaign = typeof posterCampaign.$inferSelect;
export type PosterDesign = typeof posterDesign.$inferSelect;
