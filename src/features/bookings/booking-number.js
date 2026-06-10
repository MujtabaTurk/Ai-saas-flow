import { randomBytes } from "crypto";

export function createBookingNumber() {
  const date = new Date();
  const datePart = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0")
  ].join("");
  const randomPart = randomBytes(4).toString("hex").toUpperCase();

  return `SF-${datePart}-${randomPart}`;
}

