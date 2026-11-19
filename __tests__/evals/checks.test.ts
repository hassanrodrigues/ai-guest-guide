import { describe, expect, it } from "vitest";

import { CASES, RULES } from "../../evals/cases";
import {
  followsPetRule,
  mentionsCheckIn,
  mentionsWifi,
  noUnknownNumbers,
  refersToHost,
  timePattern,
} from "../../evals/checks";
import { adcProperty, maoProperty, sampleGuide } from "../fixtures/property";

const ctx = (answer: string, property = maoProperty) => ({ property, guide: sampleGuide, answer });

describe("eval suite", () => {
  it("has at least 3 cases for each of the 9 rules", () => {
    expect(Object.keys(RULES)).toHaveLength(9);
    for (const rule of Object.keys(RULES)) {
      expect(CASES.filter((c) => c.rule === rule).length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("eval checks", () => {
  it("requires both the Wi-Fi network and the exact password", () => {
    expect(mentionsWifi(ctx("Rede Igapo_Centro, senha largo1896."))).toBeNull();
    expect(mentionsWifi(ctx("Rede Igapo_Centro, senha LARGO1896."))).toMatch(/password/);
  });

  it("matches the check-in time however it is written", () => {
    expect(timePattern("14:00").test("a partir das 14h")).toBe(true);
    expect(timePattern("14:00").test("às 14:00")).toBe(true);
    expect(timePattern("14:00").test("às 4h")).toBe(false);
    expect(timePattern("12:30").test("12h30")).toBe(true);
    expect(mentionsCheckIn(ctx("O check-in é às 15h."))).toMatch(/14:00/);
  });

  it("expects a refusal only where pets are not allowed", () => {
    expect(followsPetRule(ctx("Infelizmente o imóvel não aceita pets."))).toBeNull();
    expect(followsPetRule(ctx("Pode trazer sim!"))).toMatch(/did not refuse/);
    expect(followsPetRule(ctx("Sim, pets são bem-vindos.", adcProperty))).toBeNull();
    expect(followsPetRule(ctx("Infelizmente não são permitidos.", adcProperty))).toMatch(/refused/);
  });

  it("flags numbers the data doesn't contain, but not the host phone or codes it does", () => {
    expect(noUnknownNumbers(ctx("Ligue para Lúcia: +55 92 90000-0001. Código 2718."))).toBeNull();
    expect(noUnknownNumbers(ctx("A senha do cofre é 4512."))).toMatch(/4512/);
  });

  it("requires the host's name in a fallback answer", () => {
    expect(refersToHost(ctx("Fale com Lúcia."))).toBeNull();
    expect(refersToHost(ctx("Não sei."))).toMatch(/host/);
  });
});
