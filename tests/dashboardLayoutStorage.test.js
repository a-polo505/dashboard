import {
  createDefaultLayout,
  DashboardLayout,
} from "../src/utils/dashboardLayout.js";
import {
  readDashboardLayout,
  saveDashboardLayout,
} from "../src/utils/dashboardLayoutStorage.js";

const ids = ["date", "currency", "coffee"];
const key = "dashboardLayout";
const defaults = () => createDefaultLayout(ids);
const custom = () => [
  { id: "coffee", is_remove: false },
  { id: "date", is_remove: true },
  { id: "currency", is_remove: false },
];
const snapshot = (widgets) => JSON.stringify({ version: 1, widgets });

describe("dashboard layout persistence", () => {
  const originalStorage = Object.getOwnPropertyDescriptor(
    global,
    "localStorage",
  );
  let values;
  let storage;

  beforeEach(() => {
    values = new Map([
      ["theme", "dark"],
      ["userCurrency", "EUR"],
    ]);
    storage = {
      getItem: jest.fn((name) => values.get(name) ?? null),
      setItem: jest.fn((name, value) => values.set(name, String(value))),
      removeItem: jest.fn((name) => values.delete(name)),
    };
    Object.defineProperty(global, "localStorage", {
      configurable: true,
      writable: true,
      value: storage,
    });
  });

  afterEach(() => {
    if (originalStorage)
      Object.defineProperty(global, "localStorage", originalStorage);
    else delete global.localStorage;
  });

  test("uses absent preferences as defaults without writing or removing anything", () => {
    expect(readDashboardLayout(ids)).toEqual(defaults());
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
    expect(values.has(key)).toBe(false);
  });

  test("saves and restores one versioned snapshot containing only order and visibility", () => {
    const layout = custom();
    layout[0].name = "Do not persist display metadata";

    expect(saveDashboardLayout(layout, ids)).toBe(true);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(storage.setItem).toHaveBeenCalledWith(key, snapshot(custom()));
    expect(readDashboardLayout(ids)).toEqual(custom());
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(values.get("theme")).toBe("dark");
    expect(values.get("userCurrency")).toBe("EUR");
  });

  test("represents the default by removing only the layout snapshot", () => {
    values.set(key, snapshot(custom()));

    expect(saveDashboardLayout(defaults(), ids)).toBe(true);
    expect(values.has(key)).toBe(false);
    expect(values.size).toBe(2);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).toHaveBeenCalledWith(key);
  });

  test("removes a redundant stored default on read", () => {
    values.set(key, snapshot(defaults()));

    expect(readDashboardLayout(ids)).toEqual(defaults());
    expect(values.has(key)).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  test.each([
    "",
    "not JSON",
    "null",
    "[]",
    '"layout"',
    "true",
    "{}",
    JSON.stringify({ version: "1", widgets: custom() }),
    JSON.stringify({ version: 0, widgets: custom() }),
    JSON.stringify({ version: 1.5, widgets: custom() }),
    JSON.stringify({ version: 1 }),
    snapshot([]),
    snapshot([null]),
    snapshot([{ id: "date", is_remove: "false" }]),
    snapshot([
      { id: "date", is_remove: false },
      { id: "date", is_remove: true },
    ]),
    snapshot(defaults().map((widget) => ({ ...widget, is_remove: true }))),
  ])("recovers from invalid data and clears only its key (%s)", (raw) => {
    values.set(key, raw);

    expect(readDashboardLayout(ids)).toEqual(defaults());
    expect(values.has(key)).toBe(false);
    expect(values.size).toBe(2);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).toHaveBeenCalledWith(key);
  });

  test("keeps future-version data untouched while falling back to the default", () => {
    const raw = JSON.stringify({ version: 2, futureFormat: ["coffee"] });
    values.set(key, raw);

    expect(readDashboardLayout(ids)).toEqual(defaults());
    expect(values.get(key)).toBe(raw);
    expect(storage.removeItem).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  test("reconciles catalog changes without rewriting a custom snapshot during reading", () => {
    const raw = snapshot([
      { id: "coffee", is_remove: true },
      { id: "retired", is_remove: false },
      { id: "date", is_remove: false },
    ]);
    values.set(key, raw);

    expect(readDashboardLayout(ids)).toEqual([
      { id: "coffee", is_remove: true },
      { id: "date", is_remove: false },
      { id: "currency", is_remove: false },
    ]);
    expect(values.get(key)).toBe(raw);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  test.each([
    null,
    [],
    {},
    [{ id: "date", is_remove: false }],
    [...defaults(), { id: "unknown", is_remove: false }],
    [...defaults(), { id: "date", is_remove: false }],
    defaults().map((widget) => ({ ...widget, is_remove: true })),
    [{ id: "date", is_remove: 0 }, ...defaults().slice(1)],
  ])(
    "refuses invalid or incomplete writes and preserves saved data (%j)",
    (layout) => {
      const raw = snapshot(custom());
      values.set(key, raw);

      expect(saveDashboardLayout(layout, ids)).toBe(false);
      expect(values.get(key)).toBe(raw);
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(storage.removeItem).not.toHaveBeenCalled();
    },
  );

  test("read failures preserve existing data and use defaults", () => {
    const raw = snapshot(custom());
    values.set(key, raw);
    storage.getItem.mockImplementation(() => {
      throw new Error("Synthetic blocked read");
    });

    expect(readDashboardLayout(ids)).toEqual(defaults());
    expect(values.get(key)).toBe(raw);
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  test("cleanup failure does not prevent using the default layout", () => {
    values.set(key, "invalid");
    storage.removeItem.mockImplementation(() => {
      throw new Error("Synthetic blocked removal");
    });

    expect(readDashboardLayout(ids)).toEqual(defaults());
    expect(values.get(key)).toBe("invalid");
  });

  test("failed custom writes report failure and preserve the previous snapshot", () => {
    const raw = snapshot(custom());
    values.set(key, raw);
    storage.setItem.mockImplementation(() => {
      throw new Error("Synthetic quota failure");
    });

    expect(saveDashboardLayout([...custom()].reverse(), ids)).toBe(false);
    expect(values.get(key)).toBe(raw);
  });

  test("failed removal reports failure and preserves the previous snapshot", () => {
    const raw = snapshot(custom());
    values.set(key, raw);
    storage.removeItem.mockImplementation(() => {
      throw new Error("Synthetic blocked removal");
    });

    expect(saveDashboardLayout(defaults(), ids)).toBe(false);
    expect(values.get(key)).toBe(raw);
  });

  test("supports a missing storage backend", () => {
    delete global.localStorage;

    expect(readDashboardLayout(ids)).toEqual(defaults());
    expect(saveDashboardLayout(custom(), ids)).toBe(false);
    expect(saveDashboardLayout(defaults(), ids)).toBe(false);
  });

  test("supports a storage backend whose getter throws", () => {
    Object.defineProperty(global, "localStorage", {
      configurable: true,
      get() {
        throw new Error("Synthetic blocked storage");
      },
    });

    expect(readDashboardLayout(ids)).toEqual(defaults());
    expect(saveDashboardLayout(custom(), ids)).toBe(false);
    expect(saveDashboardLayout(defaults(), ids)).toBe(false);
  });

  test("edits and cancellation leave storage unchanged; a saved customization survives reload", () => {
    const model = new DashboardLayout(ids, readDashboardLayout(ids));
    const persist = (layout) => saveDashboardLayout(layout, ids);
    model.beginEdit();
    model.moveWidget("coffee", 0);
    model.hideWidget("date");
    const edited = model.layout;
    model.cancel();

    expect(values.has(key)).toBe(false);
    model.beginEdit();
    model.moveWidget("coffee", 0);
    model.hideWidget("date");
    expect(model.save(persist)).toBe(true);
    expect(new DashboardLayout(ids, readDashboardLayout(ids)).layout).toEqual(
      edited,
    );
    expect(storage.setItem).toHaveBeenCalledTimes(1);

    model.beginEdit();
    expect(model.save(persist)).toBe(true);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    model.beginEdit();
    model.reset();
    model.cancel();
    expect(readDashboardLayout(ids)).toEqual(edited);
    expect(storage.removeItem).not.toHaveBeenCalled();

    model.beginEdit();
    model.reset();
    expect(model.save(persist)).toBe(true);
    expect(values.has(key)).toBe(false);
    expect(new DashboardLayout(ids, readDashboardLayout(ids)).layout).toEqual(
      defaults(),
    );
  });

  test.each(["setItem", "removeItem"])(
    "a failed %s leaves the editor open and can be retried without losing its draft",
    (method) => {
      values.set(key, snapshot(custom()));
      const model = new DashboardLayout(ids, readDashboardLayout(ids));
      const persist = (layout) => saveDashboardLayout(layout, ids);
      model.beginEdit();
      model.reset();
      const moveToCustom = method === "setItem";
      if (moveToCustom) model.moveWidget("date", 1);
      const draft = model.layout;
      const saved = model.savedLayout;
      const original = storage[method].getMockImplementation();
      storage[method].mockImplementation(() => {
        throw new Error("Synthetic persistence failure");
      });

      expect(model.save(persist)).toBe(false);
      expect(model.isEditing).toBe(true);
      expect(model.layout).toEqual(draft);
      expect(model.savedLayout).toEqual(saved);
      expect(readDashboardLayout(ids)).toEqual(saved);

      storage[method].mockImplementation(original);
      expect(model.save(persist)).toBe(true);
      expect(model.isEditing).toBe(false);
      expect(readDashboardLayout(ids)).toEqual(draft);
    },
  );
});
