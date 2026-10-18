/**
 * Idempotent seed from ../src/data/indicators.json
 * Does NOT mutate the JSON file.
 */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient();
const __dirname = dirname(fileURLToPath(import.meta.url));

interface RawValue {
  period: string;
  value: number | null;
  display: string | null;
  status?: string;
}

interface RawIndicator {
  id: string;
  name: string;
  category: string;
  unit: string | null;
  source: string;
  description: string | null;
  values: RawValue[];
}

async function upsertUser(
  username: string,
  password: string,
  name: string,
  role: Role
) {
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { username },
    update: { name, role, passwordHash, isActive: true },
    create: { username, name, role, passwordHash, isActive: true },
  });
}

async function main() {
  const jsonPath = resolve(__dirname, "../../src/data/indicators.json");
  const raw = JSON.parse(readFileSync(jsonPath, "utf8")) as {
    indicators: RawIndicator[];
  };

  if (raw.indicators.length !== 58) {
    throw new Error(`Expected 58 indicators, got ${raw.indicators.length}`);
  }

  await upsertUser("admin", "dev-admin-only", "Administrator BPS", Role.ADMIN);
  await upsertUser("operator", "dev-operator-only", "Operator Data", Role.OPERATOR);

  for (const ind of raw.indicators) {
    await prisma.indicator.upsert({
      where: { id: ind.id },
      update: {
        name: ind.name,
        category: ind.category,
        unit: ind.unit,
        description: ind.description,
        source: ind.source,
      },
      create: {
        id: ind.id,
        name: ind.name,
        category: ind.category,
        unit: ind.unit,
        description: ind.description,
        source: ind.source,
      },
    });

    for (const v of ind.values) {
      await prisma.observation.upsert({
        where: {
          indicatorId_period: {
            indicatorId: ind.id,
            period: v.period,
          },
        },
        update: {
          value: v.value,
          display: v.display,
        },
        create: {
          indicatorId: ind.id,
          period: v.period,
          value: v.value,
          display: v.display,
        },
      });
    }
  }

  const count = await prisma.indicator.count();
  const sosial = await prisma.indicator.count({ where: { category: "Sosial" } });
  const ekonomi = await prisma.indicator.count({ where: { category: "Ekonomi" } });
  const penduduk = await prisma.observation.findFirst({
    where: {
      period: "2020",
      indicator: { name: { contains: "Jumlah Penduduk" } },
    },
  });

  console.log(
    JSON.stringify(
      {
        indicators: count,
        Sosial: sosial,
        Ekonomi: ekonomi,
        penduduk2020: penduduk?.value,
        users: ["admin", "operator"],
      },
      null,
      2
    )
  );

  if (count !== 58 || sosial !== 51 || ekonomi !== 7) {
    throw new Error("Seed integrity check failed (counts).");
  }
  if (penduduk?.value !== 1029.03) {
    throw new Error(`Penduduk 2020 expected 1029.03, got ${penduduk?.value}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
