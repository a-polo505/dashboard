import { timingSafeEqual } from "node:crypto";

export function isValidToken(
  requestToken,
  secret = process.env.CRON_AUTH_SECRET,
) {
  if (typeof secret !== "string" || !secret || /\s/.test(secret)) {
    return false;
  }

  if (typeof requestToken !== "string") {
    return false;
  }

  const parts = requestToken.split(" ");
  if (
    parts.length !== 2 ||
    parts[0].toLowerCase() !== "bearer" ||
    !parts[1] ||
    /\s/.test(parts[1])
  ) {
    return false;
  }

  const suppliedSecret = Buffer.from(parts[1], "utf8");
  const expectedSecret = Buffer.from(secret, "utf8");

  if (suppliedSecret.length !== expectedSecret.length) {
    return false;
  }

  return timingSafeEqual(suppliedSecret, expectedSecret);
}
