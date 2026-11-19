import { describe, expect, it } from "vitest";

import { buildMapsUrl, parseDistanceKm, travelModeForDistance } from "@/lib/maps";

const BASE = "https://www.google.com/maps/dir/?";

describe("buildMapsUrl", () => {
  it("builds a walking directions URL", () => {
    const url = buildMapsUrl({
      originAddress: "Centro Histórico, Manaus/AM",
      destinationName: "Teatro Amazonas",
      destinationCity: "Manaus",
    });
    expect(url.startsWith(BASE)).toBe(true);
    const params = new URL(url).searchParams;
    expect(params.get("api")).toBe("1");
    expect(params.get("travelmode")).toBe("walking");
    expect(params.get("destination")).toBe("Teatro Amazonas Manaus");
  });

  it("builds a driving directions URL when requested", () => {
    const url = buildMapsUrl({
      originAddress: "Centro, Alter do Chão/PA",
      destinationName: "Ilha do Amor",
      destinationCity: "Alter do Chão",
      travelMode: "driving",
    });
    expect(new URL(url).searchParams.get("travelmode")).toBe("driving");
  });

  it("encodes accents correctly (round-trips through URLSearchParams)", () => {
    const url = buildMapsUrl({
      originAddress: "Centro Histórico, Manaus/AM",
      destinationName: "Praça São Sebastião",
      destinationCity: "Alter do Chão",
    });
    // Raw string must be percent-encoded, not contain the literal accented text.
    expect(url).not.toContain("Praça");
    expect(url).not.toContain("Sebastião");
    // But it decodes back to the original.
    expect(new URL(url).searchParams.get("destination")).toBe(
      "Praça São Sebastião Alter do Chão",
    );
    expect(new URL(url).searchParams.get("origin")).toBe(
      "Centro Histórico, Manaus/AM",
    );
  });

  it("encodes ampersands and special characters", () => {
    const url = buildMapsUrl({
      originAddress: "Orla & Centro",
      destinationName: "Bar & Grill",
      destinationCity: "Novo Airão",
    });
    expect(url).toContain("%26"); // literal & never leaks into the query
    expect(new URL(url).searchParams.get("origin")).toBe("Orla & Centro");
    expect(new URL(url).searchParams.get("destination")).toBe(
      "Bar & Grill Novo Airão",
    );
  });

  it("defaults to walking when travelMode is omitted", () => {
    const url = buildMapsUrl({
      originAddress: "Centro, Presidente Figueiredo/AM",
      destinationName: "Café",
      destinationCity: "Presidente Figueiredo",
    });
    expect(new URL(url).searchParams.get("travelmode")).toBe("walking");
  });
});

describe("parseDistanceKm", () => {
  it.each([
    ["500 m", 0.5],
    ["1,2 km", 1.2],
    ["Aprox. 1,2 km", 1.2],
    ["2,5 km", 2.5],
  ])("parses %s -> %s km", (input, expected) => {
    expect(parseDistanceKm(input)).toBe(expected);
  });

  it("returns undefined for an absent distance", () => {
    expect(parseDistanceKm(undefined)).toBeUndefined();
  });

  it("returns undefined for an unparseable distance", () => {
    expect(parseDistanceKm("perto")).toBeUndefined();
  });
});

describe("travelModeForDistance", () => {
  it("walks when near, drives when far, walks when unknown", () => {
    expect(travelModeForDistance("1,2 km")).toBe("walking");
    expect(travelModeForDistance("8 km")).toBe("driving");
    expect(travelModeForDistance("5 km")).toBe("driving");
    expect(travelModeForDistance(undefined)).toBe("walking");
  });
});
