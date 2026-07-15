import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const paymentResult = await prisma.$runCommandRaw({
    update: "BookingPayment",
    updates: [
      {
        q: { method: "BANK_TRANSFER" },
        u: { $set: { method: "BUSINESS_LOCATION" } },
        multi: true
      }
    ]
  });

  const auditResult = await prisma.$runCommandRaw({
    update: "BookingPaymentAudit",
    updates: [
      {
        q: { paymentMethod: "BANK_TRANSFER" },
        u: { $set: { paymentMethod: "BUSINESS_LOCATION" } },
        multi: true
      }
    ]
  });

  console.log(JSON.stringify({ paymentResult, auditResult }, null, 2));
} finally {
  await prisma.$disconnect();
}
