import { describe, expect, it } from "vitest";

import { dailyScans } from "@/app/(app)/dashboard/campaign/[campaignId]/analytics/_components/ScansOverTime/dailyScans";

describe("dailyScans", () => {
  it("has just the day the campaign began when it began today, with no scans", () => {
    expect(
      dailyScans(
        {
          createdAt: new Date("2026-11-02T09:00:00.000Z"),
          designCount: 1,
          slots: [],
        },
        new Date("2026-11-02T17:00:00.000Z"),
        "UTC",
        8,
      ),
    ).toEqual({
      days: ["2026-11-02"],
      series: [{ label: "Poster design 1", values: [0] }],
    });
  });

  it("counts each design's scans on each day from when the campaign began through today, with 0 on days without scans", () => {
    expect(
      dailyScans(
        {
          createdAt: new Date("2026-11-02T09:00:00.000Z"),
          designCount: 2,
          slots: [
            {
              position: 0,
              slotStart: new Date("2026-11-02T10:00:00.000Z"),
              scanCount: 2,
            },
            {
              position: 0,
              slotStart: new Date("2026-11-02T23:45:00.000Z"),
              scanCount: 1,
            },
            {
              position: 1,
              slotStart: new Date("2026-11-04T00:00:00.000Z"),
              scanCount: 4,
            },
          ],
        },
        new Date("2026-11-05T08:00:00.000Z"),
        "UTC",
        8,
      ),
    ).toEqual({
      days: ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05"],
      series: [
        { label: "Poster design 1", values: [3, 0, 0, 0] },
        { label: "Poster design 2", values: [0, 0, 4, 0] },
      ],
    });
  });

  it("splits days at midnight in the time zone, even on a half-hour offset", () => {
    // India is 5:30 ahead of UTC: 18:15 UTC is 23:45 and 18:30 UTC is midnight.
    expect(
      dailyScans(
        {
          createdAt: new Date("2026-11-03T00:00:00.000Z"),
          designCount: 1,
          slots: [
            {
              position: 0,
              slotStart: new Date("2026-11-03T18:15:00.000Z"),
              scanCount: 1,
            },
            {
              position: 0,
              slotStart: new Date("2026-11-03T18:30:00.000Z"),
              scanCount: 2,
            },
          ],
        },
        new Date("2026-11-04T12:00:00.000Z"),
        "Asia/Kolkata",
        8,
      ),
    ).toEqual({
      days: ["2026-11-03", "2026-11-04"],
      series: [{ label: "Poster design 1", values: [1, 2] }],
    });
  });

  it("follows the time zone's daylight saving changes", () => {
    // London leaves BST at 01:00 UTC on 25 Oct 2026, so 23:00 UTC on the 24th
    // (BST) and on the 25th (GMT) are both on the 25th.
    expect(
      dailyScans(
        {
          createdAt: new Date("2026-10-24T12:00:00.000Z"),
          designCount: 1,
          slots: [
            {
              position: 0,
              slotStart: new Date("2026-10-24T23:00:00.000Z"),
              scanCount: 1,
            },
            {
              position: 0,
              slotStart: new Date("2026-10-25T23:00:00.000Z"),
              scanCount: 1,
            },
          ],
        },
        new Date("2026-10-26T12:00:00.000Z"),
        "Europe/London",
        8,
      ),
    ).toEqual({
      days: ["2026-10-24", "2026-10-25", "2026-10-26"],
      series: [{ label: "Poster design 1", values: [0, 2, 0] }],
    });
  });

  it("begins on the day the campaign was created in the time zone", () => {
    // 20:00 UTC on the 2nd is 05:00 on the 3rd in Tokyo.
    expect(
      dailyScans(
        {
          createdAt: new Date("2026-11-02T20:00:00.000Z"),
          designCount: 1,
          slots: [],
        },
        new Date("2026-11-03T20:00:00.000Z"),
        "Asia/Tokyo",
        8,
      ).days,
    ).toEqual(["2026-11-03", "2026-11-04"]);
  });

  it("combines the last designs into one series when there are more than fit", () => {
    expect(
      dailyScans(
        {
          createdAt: new Date("2026-11-02T09:00:00.000Z"),
          designCount: 4,
          slots: [
            {
              position: 1,
              slotStart: new Date("2026-11-02T10:00:00.000Z"),
              scanCount: 1,
            },
            {
              position: 2,
              slotStart: new Date("2026-11-02T10:00:00.000Z"),
              scanCount: 2,
            },
            {
              position: 3,
              slotStart: new Date("2026-11-03T10:00:00.000Z"),
              scanCount: 5,
            },
          ],
        },
        new Date("2026-11-03T12:00:00.000Z"),
        "UTC",
        3,
      ),
    ).toEqual({
      days: ["2026-11-02", "2026-11-03"],
      series: [
        { label: "Poster design 1", values: [0, 0] },
        { label: "Poster design 2", values: [1, 0] },
        { label: "Other poster designs", values: [2, 5] },
      ],
    });
  });
});
