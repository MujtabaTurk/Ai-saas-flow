import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const PASSWORD_PREFIX = "scrypt";

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, KEY_LENGTH);

  return `${PASSWORD_PREFIX}$${salt}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password, storedPasswordHash) {
  if (!storedPasswordHash) {
    return false;
  }

  const [prefix, salt, storedKey] = storedPasswordHash.split("$");

  if (prefix !== PASSWORD_PREFIX || !salt || !storedKey) {
    return false;
  }

  const storedBuffer = Buffer.from(storedKey, "hex");
  const derivedKey = await scrypt(password, salt, storedBuffer.length);

  if (storedBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(storedBuffer, derivedKey);
}

export function createPasswordResetToken() {
  const token = randomBytes(32).toString("hex");

  return {
    token,
    tokenHash: hashToken(token)
  };
}

export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function unusedPasswordResetTokenWhere() {
  return {
    OR: [
      {
        usedAt: null
      },
      {
        usedAt: {
          isSet: false
        }
      }
    ]
  };
}
