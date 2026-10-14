import {
  createDefaultLayout,
  DashboardLayout,
  normalizeLayout,
} from "../src/utils/dashboardLayout.js";

const ids = ["date", "currency", "coffee", "quote"];
const defaults = () => createDefaultLayout(ids);
const order = (model) => model.layout.map((widget) => widget.id);

describe("dashboard layout model without DOM or storage", () => {
  test("starts with all widgets in catalog order and exposes independent snapshots", () => {
    const catalog = [...ids];
    const model = new DashboardLayout(catalog);
    catalog.reverse();
    const exposed = model.layout;
    exposed.reverse();
    exposed[0].is_remove = true;
    model.savedLayout[0].is_remove = true;

    expect(model.layout).toEqual(defaults());
    expect(model.savedLayout).toEqual(defaults());
    expect(model.isEditing).toBe(false);
    expect(model.hasChanges).toBe(false);
  });

  test.each([null, [], "date", ["date", "date"], [""], ["  "], [1], Array(1)])(
    "rejects an invalid widget catalog (%j)",
    (catalog) => {
      expect(() => new DashboardLayout(catalog)).toThrow(
        "Widget IDs must be unique, nonempty strings",
      );
    },
  );

  test("inserts a moved widget and shifts every intermediate widget", () => {
    const model = new DashboardLayout(ids);
    model.beginEdit();

    expect(model.moveWidget("date", 2)).toBe(true);
    expect(order(model)).toEqual(["currency", "coffee", "date", "quote"]);
    expect(model.savedLayout).toEqual(defaults());
    expect(model.hasChanges).toBe(true);
    expect(model.moveWidget("quote", 0)).toBe(true);
    expect(order(model)).toEqual(["quote", "currency", "coffee", "date"]);
  });

  test("restores a hidden widget in its retained position without recreating its entry", () => {
    const model = new DashboardLayout(ids);
    model.beginEdit();
    model.moveWidget("quote", 1);
    const beforeRemoval = model.layout;

    expect(model.hideWidget("quote")).toBe(true);
    expect(model.layout[1]).toEqual({ id: "quote", is_remove: true });
    expect(model.restoreWidget("quote")).toBe(true);
    expect(model.layout).toEqual(beforeRemoval);
  });

  test("uses visible indices when moving and keeps hidden entries available for restoration", () => {
    const model = new DashboardLayout(ids);
    model.beginEdit();
    model.hideWidget("currency");

    expect(model.moveWidget("quote", 0)).toBe(true);
    expect(model.layout).toEqual([
      { id: "quote", is_remove: false },
      { id: "date", is_remove: false },
      { id: "currency", is_remove: true },
      { id: "coffee", is_remove: false },
    ]);
    expect(model.restoreWidget("currency")).toBe(true);
    expect(order(model)).toEqual(["quote", "date", "currency", "coffee"]);
    expect(model.moveWidget("quote", 3)).toBe(true);
    expect(order(model)).toEqual(["date", "currency", "coffee", "quote"]);
  });

  test("prevents hiding or moving the last visible widget and permits restoring another", () => {
    const model = new DashboardLayout(ids);
    model.beginEdit();
    model.hideWidget("date");
    model.hideWidget("currency");
    model.hideWidget("coffee");
    const before = model.layout;

    expect(model.hideWidget("quote")).toBe(false);
    expect(model.moveWidget("quote", 0)).toBe(false);
    expect(model.layout).toEqual(before);
    expect(model.restoreWidget("currency")).toBe(true);
    expect(model.moveWidget("quote", 0)).toBe(true);
  });

  test("supports a catalog containing just one widget", () => {
    const model = new DashboardLayout(["date"]);
    model.beginEdit();

    expect(model.hideWidget("date")).toBe(false);
    expect(model.moveWidget("date", 0)).toBe(false);
    expect(model.hasChanges).toBe(false);
  });

  test.each([-1, 4, 1.5, NaN, Infinity, "1", null])(
    "rejects an invalid destination (%s) without changing the draft",
    (destination) => {
      const model = new DashboardLayout(ids);
      model.beginEdit();

      expect(model.moveWidget("date", destination)).toBe(false);
      expect(model.layout).toEqual(defaults());
      expect(model.hasChanges).toBe(false);
    },
  );

  test("ignores unknown, hidden, and unchanged move targets and repeated visibility actions", () => {
    const model = new DashboardLayout(ids);
    model.beginEdit();

    expect(model.moveWidget("unknown", 0)).toBe(false);
    expect(model.moveWidget("date", 0)).toBe(false);
    expect(model.hideWidget("unknown")).toBe(false);
    expect(model.restoreWidget("unknown")).toBe(false);
    expect(model.restoreWidget("date")).toBe(false);
    model.hideWidget("currency");
    const before = model.layout;
    expect(model.hideWidget("currency")).toBe(false);
    expect(model.moveWidget("currency", 0)).toBe(false);
    expect(model.layout).toEqual(before);
  });

  test("a repeated beginEdit preserves the active draft", () => {
    const model = new DashboardLayout(ids);
    expect(model.beginEdit()).toBe(true);
    model.hideWidget("date");

    expect(model.beginEdit()).toBe(false);
    expect(model.layout[0].is_remove).toBe(true);
  });

  test("reset stays in edit mode and cancel restores the previously saved customization", () => {
    const saved = defaults().reverse();
    saved[1].is_remove = true;
    const model = new DashboardLayout(ids, saved);
    model.beginEdit();
    model.restoreWidget("coffee");
    model.moveWidget("date", 0);

    expect(model.reset()).toBe(true);
    expect(model.layout).toEqual(defaults());
    expect(model.isEditing).toBe(true);
    expect(model.savedLayout).toEqual(saved);
    expect(model.cancel()).toBe(true);
    expect(model.layout).toEqual(saved);
    expect(model.isEditing).toBe(false);
    expect(model.cancel()).toBe(false);
    model.beginEdit();
    expect(model.layout).toEqual(saved);
  });

  test("saving an unchanged layout or undoing all edits requires no persistence", () => {
    const persist = jest.fn();
    const model = new DashboardLayout(ids);
    model.beginEdit();
    model.moveWidget("date", 3);
    model.moveWidget("date", 0);
    model.hideWidget("coffee");
    model.restoreWidget("coffee");

    expect(model.hasChanges).toBe(false);
    expect(model.save(persist)).toBe(true);
    expect(model.isEditing).toBe(false);
    expect(persist).not.toHaveBeenCalled();
    const custom = new DashboardLayout(ids, defaults().reverse());
    custom.beginEdit();
    expect(custom.save(persist)).toBe(true);
    expect(persist).not.toHaveBeenCalled();
  });

  test.each([false, undefined, "true"])(
    "keeps the draft and saved layout when persistence does not confirm success (%s)",
    (result) => {
      const model = new DashboardLayout(ids);
      model.beginEdit();
      model.hideWidget("date");
      const draft = model.layout;

      expect(model.save(() => result)).toBe(false);
      expect(model.isEditing).toBe(true);
      expect(model.hasChanges).toBe(true);
      expect(model.layout).toEqual(draft);
      expect(model.savedLayout).toEqual(defaults());
    },
  );

  test("allows retrying save after an exception and commits only on confirmed success", () => {
    const model = new DashboardLayout(ids);
    model.beginEdit();
    model.moveWidget("date", 3);
    const draft = model.layout;
    const persist = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new Error("Synthetic persistence failure");
      })
      .mockReturnValueOnce(true);

    expect(model.save(persist)).toBe(false);
    expect(model.savedLayout).toEqual(defaults());
    expect(model.save(persist)).toBe(true);
    expect(persist).toHaveBeenLastCalledWith(draft);
    expect(model.savedLayout).toEqual(draft);
    expect(model.isEditing).toBe(false);
    expect(model.hasChanges).toBe(false);
  });

  test("draft and persistence snapshots cannot mutate internal state", () => {
    const model = new DashboardLayout(ids);
    model.beginEdit();
    model.hideWidget("date");
    model.layout[1].is_remove = true;
    const draft = model.layout;

    model.save((snapshot) => {
      snapshot.reverse();
      snapshot[0].is_remove = true;
      return true;
    });

    expect(model.savedLayout).toEqual(draft);
  });

  test.each([
    (model) => model.moveWidget("date", 1),
    (model) => model.hideWidget("date"),
    (model) => model.restoreWidget("date"),
    (model) => model.reset(),
    (model) => model.save(jest.fn()),
  ])("requires edit mode before changing or saving a layout (%#)", (action) => {
    const model = new DashboardLayout(ids);

    expect(() => action(model)).toThrow("Layout editing is not active");
    expect(model.layout).toEqual(defaults());
  });

  test("falls back to defaults for invalid initial data and copies valid initial data", () => {
    expect(
      new DashboardLayout(ids, [{ id: "date", is_remove: "false" }]).layout,
    ).toEqual(defaults());
    const saved = defaults().reverse();
    const model = new DashboardLayout(ids, saved);
    saved[0].is_remove = true;
    saved.reverse();

    expect(order(model)).toEqual([...ids].reverse());
    expect(model.layout.every((widget) => !widget.is_remove)).toBe(true);
  });
});

describe("saved layout reconciliation", () => {
  test("retains known order and visibility, drops retired IDs, and appends new IDs in catalog order", () => {
    const saved = [
      { id: "coffee", is_remove: true, name: "Ignored display name" },
      { id: "retired", is_remove: false },
      { id: "date", is_remove: false },
    ];

    expect(normalizeLayout(saved, ids)).toEqual([
      { id: "coffee", is_remove: true },
      { id: "date", is_remove: false },
      { id: "currency", is_remove: false },
      { id: "quote", is_remove: false },
    ]);
    expect(saved[1].id).toBe("retired");
  });

  test.each([
    null,
    {},
    [],
    [null],
    ["date"],
    [{ id: "date" }],
    [{ id: "date", is_remove: 0 }],
    [{ id: "", is_remove: false }],
    [
      { id: "date", is_remove: false },
      { id: "date", is_remove: false },
    ],
    [
      { id: "retired", is_remove: false },
      { id: "retired", is_remove: true },
    ],
    [{ id: "date", is_remove: true }],
    [
      ...defaults().map((widget) => ({ ...widget, is_remove: true })),
      { id: "retired", is_remove: false },
    ],
  ])("rejects malformed or empty visible layouts (%j)", (saved) => {
    expect(normalizeLayout(saved, ids)).toBeNull();
  });
});
