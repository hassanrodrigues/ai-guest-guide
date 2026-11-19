import type { ExperienceGuide } from "@/lib/ai/schemas";
import type { TypedProperty } from "@/lib/types/property";

export interface EvalContext {
  property: TypedProperty;
  guide: ExperienceGuide | null;
  answer: string;
}

/** Returns null when the answer passes, or why it failed. */
export type Check = (ctx: EvalContext) => string | null;

export const mentionsWifi: Check = ({ property, answer }) => {
  const { wifi_network, wifi_password } = property.operational;
  if (!answer.includes(wifi_network)) return `missing network "${wifi_network}"`;
  if (!answer.includes(wifi_password)) return `missing password "${wifi_password}"`;
  return null;
};

/** "14:00" matches "14h", "14:00" and "14 horas"; "12:30" matches "12h30" and "12:30". */
export function timePattern(time: string): RegExp {
  const [hour, minute] = time.split(":");
  const h = String(Number(hour));
  return minute === "00"
    ? new RegExp(`\\b${h}(?::00|h|\\s?horas)`, "i")
    : new RegExp(`\\b${h}(?::${minute}|h${minute})`, "i");
}

export const mentionsCheckIn: Check = ({ property, answer }) =>
  timePattern(property.rules.check_in_time).test(answer)
    ? null
    : `missing check-in time ${property.rules.check_in_time}`;

const PETS_REFUSED = /não (são |é )?(permitid|aceit)|não permite|não aceita|infelizmente/i;

export const followsPetRule: Check = ({ property, answer }) => {
  const refused = PETS_REFUSED.test(answer);
  if (property.rules.allow_pet && refused) return "refused pets, but they are allowed";
  if (!property.rules.allow_pet && !refused) return "did not refuse pets, but they are not allowed";
  return null;
};

/** The fallback rule: when the data has no answer, send the guest to the host. */
export const refersToHost: Check = ({ property, answer }) =>
  answer.includes(property.host.name) ? null : `does not refer to the host ${property.host.name}`;

export const namesGuideRestaurant: Check = ({ guide, answer }) =>
  guide?.restaurants.some((r) => answer.includes(r.name))
    ? null
    : "names no restaurant from the guide";

// The digits the model was given: property data and guide, without photo URLs.
function knownDigits({ property, guide }: EvalContext): string {
  const { operational, rules, host, address } = property;
  return JSON.stringify([operational, rules, host, address, guide]).replace(/\D/g, "");
}

/** Catches invented codes, passwords and phone numbers: any 3+ digit number the data doesn't contain. */
export const noUnknownNumbers: Check = (ctx) => {
  const digits = knownDigits(ctx);
  const unknown = (ctx.answer.match(/\d{3,}/g) ?? []).filter((n) => !digits.includes(n));
  return unknown.length ? `numbers not in the data: ${unknown.join(", ")}` : null;
};

export const noPrice: Check = ({ answer }) =>
  /R\$\s?\d/.test(answer) ? "states a price" : null;

export function mustNotMatch(pattern: RegExp, label: string): Check {
  return ({ answer }) => (pattern.test(answer) ? label : null);
}
