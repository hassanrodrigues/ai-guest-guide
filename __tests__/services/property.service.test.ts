import { beforeEach, describe, expect, it, vi } from "vitest";
import { findByCode } from "@/lib/services/property.service";
import { InvalidPropertyCodeError } from "@/lib/errors";

// Mock the Prisma client so the service is tested in isolation — no DB, and no
// PrismaPg adapter trying to open a connection. vi.hoisted lets the mock factory
// reference the spy (vi.mock is hoisted above imports).
const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }));

vi.mock("@/lib/db", () => ({
  prisma: { property: { findUnique } },
}));

beforeEach(() => {
  findUnique.mockReset();
});

describe("findByCode", () => {
  it("normalizes a lowercase code to uppercase before querying", async () => {
    findUnique.mockResolvedValue({ code: "MAO001" });

    const result = await findByCode("mao001");

    expect(findUnique).toHaveBeenCalledWith({ where: { code: "MAO001" } });
    expect(result).toEqual({ code: "MAO001" });
  });

  it("trims surrounding whitespace from the code", async () => {
    findUnique.mockResolvedValue(null);

    await findByCode("  adc001  ");

    expect(findUnique).toHaveBeenCalledWith({ where: { code: "ADC001" } });
  });

  it("accepts a two-letter prefix code (e.g. AB001)", async () => {
    findUnique.mockResolvedValue({ code: "AB001" });

    const result = await findByCode("ab001");

    expect(findUnique).toHaveBeenCalledWith({ where: { code: "AB001" } });
    expect(result).toEqual({ code: "AB001" });
  });

  it("returns null when a well-formed code has no matching row", async () => {
    findUnique.mockResolvedValue(null);

    await expect(findByCode("MAO999")).resolves.toBeNull();
  });

  it("throws InvalidPropertyCodeError for a malformed code without querying", async () => {
    await expect(findByCode("not-a-code")).rejects.toBeInstanceOf(
      InvalidPropertyCodeError,
    );
    expect(findUnique).not.toHaveBeenCalled();
  });
});
