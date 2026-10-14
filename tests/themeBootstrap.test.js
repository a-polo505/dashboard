/** @jest-environment jsdom */

import { readFileSync } from "node:fs";
import path from "node:path";
import { runInNewContext } from "node:vm";
import { readThemePreference } from "../src/utils/themePreferenceStorage.js";
import { initializeThemeToggle } from "../src/components/ui/themeToggle/themeToggle.js";

const template = readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
const parsedTemplate = new window.DOMParser().parseFromString(
  template,
  "text/html",
);
const bootstrap = parsedTemplate.getElementById("theme-bootstrap");

describe("theme restoration before the application bundle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = "light";
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.body.replaceChildren();
  });

  function runBootstrap() {
    // During head parsing only the root exists; the body and button are absent.
    const earlyDocument = {
      documentElement: { dataset: { theme: "light" } },
      body: null,
    };
    const context = { document: earlyDocument };
    Object.defineProperty(context, "localStorage", {
      get: () => window.localStorage,
    });
    runInNewContext(bootstrap.textContent, context);
    return earlyDocument.documentElement.dataset.theme;
  }

  test("runs inline and synchronously in head before other scripts and links", () => {
    expect(parsedTemplate.documentElement.dataset.theme).toBe("light");
    expect(bootstrap.parentElement).toBe(parsedTemplate.head);
    expect(bootstrap.hasAttribute("src")).toBe(false);
    expect(bootstrap.hasAttribute("async")).toBe(false);
    expect(bootstrap.hasAttribute("defer")).toBe(false);
    expect(bootstrap.type).not.toBe("module");
    expect(parsedTemplate.querySelector("script")).toBe(bootstrap);
    expect(
      bootstrap.compareDocumentPosition(parsedTemplate.querySelector("link")) &
        window.Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  test.each([
    [null, "light"],
    ["dark", "dark"],
    ["light", "light"],
    ["", "light"],
    ["system", "light"],
    ["DARK", "light"],
    [" dark ", "light"],
    ['"dark"', "light"],
    ["null", "light"],
    ["{}", "light"],
  ])(
    "applies saved %s as %s before body parsing without changing storage",
    (saved, expected) => {
      if (saved !== null) localStorage.setItem("theme", saved);
      localStorage.setItem("userCurrency", "UAH");
      const write = jest.spyOn(window.Storage.prototype, "setItem");
      const remove = jest.spyOn(window.Storage.prototype, "removeItem");

      const theme = runBootstrap();

      expect(theme).toBe(expected);
      expect(localStorage.getItem("theme")).toBe(saved);
      expect(localStorage.getItem("userCurrency")).toBe("UAH");
      expect(write).not.toHaveBeenCalled();
      expect(remove).not.toHaveBeenCalled();
      // Catch drift between the HTML bootstrap and the app's storage rules.
      expect(theme).toBe(readThemePreference());
    },
  );

  test("uses light when reading fails without changing the saved preference", () => {
    localStorage.setItem("theme", "dark");
    const read = jest
      .spyOn(window.Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("Synthetic storage failure");
      });

    expect(runBootstrap()).toBe("light");
    expect(readThemePreference()).toBe("light");
    read.mockRestore();
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  test("uses light when accessing localStorage itself throws", () => {
    jest.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new Error("Synthetic blocked storage");
    });

    expect(runBootstrap()).toBe("light");
    expect(readThemePreference()).toBe("light");
  });

  test("reads only localStorage without accessing sessionStorage", () => {
    const session = jest
      .spyOn(window, "sessionStorage", "get")
      .mockImplementation(() => {
        throw new Error("Synthetic unavailable sessionStorage");
      });
    localStorage.setItem("theme", "dark");

    expect(runBootstrap()).toBe("dark");
    expect(session).not.toHaveBeenCalled();
  });

  test.each(["dark", "light", "invalid"])(
    "keeps the early theme consistent when the app initializes saved %s",
    (saved) => {
      localStorage.setItem("theme", saved);
      const earlyTheme = runBootstrap();
      document.documentElement.dataset.theme = earlyTheme;
      const button = parsedTemplate
        .getElementById("themeToggle")
        .cloneNode(true);
      document.body.appendChild(button);

      initializeThemeToggle(button);

      expect(document.documentElement.dataset.theme).toBe(earlyTheme);
      expect(button.getAttribute("aria-pressed")).toBe(
        String(earlyTheme === "dark"),
      );
      button.click();
      const nextTheme = earlyTheme === "dark" ? "light" : "dark";
      expect(document.documentElement.dataset.theme).toBe(nextTheme);
      expect(localStorage.getItem("theme")).toBe(
        nextTheme === "dark" ? "dark" : null,
      );
    },
  );
});
