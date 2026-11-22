import { describe, expect, it } from "vitest";

import { scanSeries } from "@/app/(app)/dashboard/campaign/[campaignId]/analytics/_components/ScansOverTime/scanSeries";

describe("scanSeries", () => {
  it("gives each design its own labelled series, in campaign order", () => {
    expect(
      scanSeries(
        new Map([
          [0, [3, 0, 1]],
          [1, [0, 4, 0]],
        ]),
        8,
      ),
    ).toEqual([
      { label: "Poster design 1", values: [3, 0, 1] },
      { label: "Poster design 2", values: [0, 4, 0] },
    ]);
  });

  it("combines the last designs into one series when there are more than fit", () => {
    expect(
      scanSeries(
        new Map([
          [0, [0, 0]],
          [1, [1, 0]],
          [2, [2, 0]],
          [3, [0, 5]],
        ]),
        3,
      ),
    ).toEqual([
      { label: "Poster design 1", values: [0, 0] },
      { label: "Poster design 2", values: [1, 0] },
      { label: "Other poster designs", values: [2, 5] },
    ]);
  });
});
