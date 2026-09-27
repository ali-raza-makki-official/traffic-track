import crypto from "crypto";

const SALT = process.env.JWT_SECRET || "visitor-hash-salt-2026";

export function hashVisitor(ip: string, userAgent: string): string {
  return crypto
    .createHash("sha256")
    .update(`${ip}::${userAgent}::${SALT}`)
    .digest("hex")
    .substring(0, 32);
}

export function hashIp(ip: string): string {
  return crypto
    .createHash("sha256")
    .update(`${ip}::${SALT}`)
    .digest("hex")
    .substring(0, 24);
}
