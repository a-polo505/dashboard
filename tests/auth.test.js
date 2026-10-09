import { isValidToken } from "../api/auth.js";

const testSecret = "a".repeat(64);

describe("cron authentication", () => {
  const originalSecret = process.env.CRON_AUTH_SECRET;
  const originalToken = process.env.API_TOKEN;

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.CRON_AUTH_SECRET;
    } else {
      process.env.CRON_AUTH_SECRET = originalSecret;
    }

    if (originalToken === undefined) {
      delete process.env.API_TOKEN;
    } else {
      process.env.API_TOKEN = originalToken;
    }
  });

  test("accepts the configured shared secret", () => {
    expect(isValidToken(`Bearer ${testSecret}`, testSecret)).toBe(true);
  });

  test.each(["bearer", "BEARER", "BeArEr"])(
    "accepts the case-insensitive %s scheme",
    (scheme) => {
      expect(isValidToken(`${scheme} ${testSecret}`, testSecret)).toBe(true);
    },
  );

  test.each(["b".repeat(64), "a".repeat(63), "a".repeat(65)])(
    "rejects incorrect secrets without throwing (%#)",
    (suppliedSecret) => {
      expect(isValidToken(`Bearer ${suppliedSecret}`, testSecret)).toBe(false);
    },
  );

  test("compares secret bytes without normalizing case", () => {
    expect(isValidToken(`Bearer ${testSecret.toUpperCase()}`, testSecret)).toBe(
      false,
    );
  });

  test("rejects different byte lengths even when string lengths match", () => {
    expect(isValidToken("Bearer é", "a")).toBe(false);
  });

  test.each([undefined, null, [], {}, 123])(
    "rejects non-string headers (%#)",
    (header) => {
      expect(isValidToken(header, testSecret)).toBe(false);
    },
  );

  test.each([
    "",
    "Bearer",
    "Bearer ",
    `Basic ${testSecret}`,
    `Bearer  ${testSecret}`,
    ` Bearer ${testSecret}`,
    `Bearer ${testSecret} `,
    `Bearer\t${testSecret}`,
    `Bearer ${testSecret}\n`,
    `Bearer ${testSecret}\r\n`,
    `Bearer ${testSecret} extra`,
    `Bearer ${testSecret}, Bearer ${testSecret}`,
  ])("rejects malformed headers (%#)", (header) => {
    expect(isValidToken(header, testSecret)).toBe(false);
  });

  test.each([null, 123, "", " ", "\t", "\n", " padded", "has space"])(
    "rejects invalid secret configuration (%#)",
    (secret) => {
      expect(isValidToken(`Bearer ${testSecret}`, secret)).toBe(false);
    },
  );

  test("fails closed when the environment secret is missing", () => {
    delete process.env.CRON_AUTH_SECRET;

    expect(isValidToken("Bearer undefined")).toBe(false);
    expect(isValidToken(`Bearer ${testSecret}`)).toBe(false);
  });

  test.each(["", " ", "\t"])(
    "fails closed when the environment secret is empty or whitespace (%#)",
    (secret) => {
      process.env.CRON_AUTH_SECRET = secret;

      expect(isValidToken(`Bearer ${secret}`)).toBe(false);
      expect(isValidToken(`Bearer ${testSecret}`)).toBe(false);
    },
  );

  test("uses the current environment value after a secret change", () => {
    process.env.CRON_AUTH_SECRET = testSecret;
    expect(isValidToken(`Bearer ${testSecret}`)).toBe(true);

    process.env.CRON_AUTH_SECRET = "b".repeat(64);
    expect(isValidToken(`Bearer ${testSecret}`)).toBe(false);
    expect(isValidToken(`Bearer ${"b".repeat(64)}`)).toBe(true);
  });

  test("does not fall back to the legacy API_TOKEN variable", () => {
    delete process.env.CRON_AUTH_SECRET;
    process.env.API_TOKEN = testSecret;

    expect(isValidToken(`Bearer ${testSecret}`)).toBe(false);
  });
});
