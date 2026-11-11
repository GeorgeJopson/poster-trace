import { describe, expect, it } from "vitest";

import { RegistrationLocation } from "@domain/poster/RegistrationLocation";
import { ValidationError } from "@domain/shared/ValidationError";

const location = { latitude: 51.5, longitude: -0.12, accuracy: 8 };

describe("RegistrationLocation", () => {
  it.each([
    ["an ordinary location", location],
    ["the edges of the ranges", { latitude: -90, longitude: 180, accuracy: 0 }],
    ["the other edges", { latitude: 90, longitude: -180, accuracy: 10_000 }],
  ])("accepts %s", (_case, value) => {
    const created = RegistrationLocation.create(value);
    expect({
      latitude: created.latitude,
      longitude: created.longitude,
      accuracy: created.accuracy,
    }).toEqual(value);
  });

  it.each([
    ["latitude below -90", { ...location, latitude: -90.01 }],
    ["latitude above 90", { ...location, latitude: 90.01 }],
    ["longitude below -180", { ...location, longitude: -180.01 }],
    ["longitude above 180", { ...location, longitude: 180.01 }],
    ["negative accuracy", { ...location, accuracy: -1 }],
    ["a NaN latitude", { ...location, latitude: NaN }],
    ["an infinite longitude", { ...location, longitude: -Infinity }],
    ["an infinite accuracy", { ...location, accuracy: Infinity }],
  ])("rejects %s", (_case, value) => {
    expect(() => RegistrationLocation.create(value)).toThrow(ValidationError);
  });
});
