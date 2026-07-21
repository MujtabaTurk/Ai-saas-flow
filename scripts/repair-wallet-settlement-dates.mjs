import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const result = await prisma.$runCommandRaw({
    update: "WalletTransaction",
    updates: [{
      q: { settledAt: { $type: "string" } },
      u: [{
        $set: {
          settledAt: {
            $convert: { input: "$settledAt", to: "date", onError: null, onNull: null }
          }
        }
      }],
      multi: true
    }]
  });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await prisma.$disconnect();
}
