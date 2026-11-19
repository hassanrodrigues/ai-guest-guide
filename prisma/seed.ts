import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../app/generated/prisma/client";
import { properties, type SeedProperty } from "./properties";

// Standalone client for the seed script (run via tsx, outside Next.js). Uses
// the same pg adapter as lib/db.ts; DATABASE_URL comes from dotenv above.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// The typed interfaces in ./properties give us authoring safety (typos in the seed data
// are caught at compile time), but Prisma's Json input type requires an index
// signature that named interfaces don't have — so cast the Json fields only at
// this boundary, where the shape has already been validated.
type PropertyData = Omit<Prisma.PropertyCreateInput, "code">;

function toData(property: SeedProperty): PropertyData {
  const { code: _code, address, operational, rules, amenities, host, ...rest } =
    property;
  void _code;
  return {
    ...rest,
    address: address as unknown as Prisma.InputJsonValue,
    operational: operational as unknown as Prisma.InputJsonValue,
    rules: rules as unknown as Prisma.InputJsonValue,
    amenities: amenities as unknown as Prisma.InputJsonValue,
    host: host as unknown as Prisma.InputJsonValue,
  };
}

async function main() {
  for (const property of properties) {
    const data = toData(property);
    // Upsert keeps the seed idempotent: re-running refreshes data without
    // duplicating rows or failing on existing codes.
    await prisma.property.upsert({
      where: { code: property.code },
      create: { code: property.code, ...data },
      update: data,
    });
    console.log(`Seeded ${property.code} — ${property.name}`);
  }
  console.log(`\nDone. ${properties.length} properties seeded.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
