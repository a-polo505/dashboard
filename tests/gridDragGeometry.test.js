import {
  containCard,
  edgeScrollSpeed,
  nearestSlot,
} from "../src/components/ui/gridEditor/gridDragGeometry.js";

describe("grid drag geometry", () => {
  const size = { width: 175, height: 175 };
  const offset = { x: 80, y: 80 };
  const bounds = { left: 24, top: 100, right: 645, bottom: 721 };

  test.each([
    [
      { x: 200, y: 250 },
      { left: 120, top: 170 },
    ],
    [
      { x: -900, y: -900 },
      { left: 24, top: 100 },
    ],
    [
      { x: 9000, y: 9000 },
      { left: 470, top: 546 },
    ],
  ])("contains the entire card at %j", (pointer, expected) => {
    expect(containCard(pointer, offset, size, bounds)).toEqual(expected);
  });

  test("handles a grid temporarily smaller than a card without negative bounds", () => {
    expect(
      containCard({ x: 900, y: 900 }, offset, size, {
        left: 24,
        top: 100,
        right: 100,
        bottom: 150,
      }),
    ).toEqual({ left: 24, top: 100 });
  });

  test("selects slots across wrapped rows and a centered incomplete final row", () => {
    const slots = [
      { left: 24, top: 100, ...size },
      { left: 247, top: 100, ...size },
      { left: 470, top: 100, ...size },
      { left: 135.5, top: 323, ...size },
      { left: 358.5, top: 323, ...size },
    ];
    expect(nearestSlot({ left: 490, top: 104 }, size, slots)).toBe(2);
    expect(nearestSlot({ left: 140, top: 330 }, size, slots)).toBe(3);
    expect(nearestSlot({ left: 350, top: 350 }, size, slots)).toBe(4);
  });

  test("selects by actual dimensions and vertical position in a single column", () => {
    const slots = [
      { left: 24, top: 100, width: 380, height: 175 },
      { left: 24, top: 323, width: 380, height: 175 },
    ];
    expect(nearestSlot({ left: 24, top: 360 }, size, slots)).toBe(1);
  });

  test("scrolls only near viewport edges, with bounded speed", () => {
    expect(edgeScrollSpeed({ y: 400 }, 800)).toBe(0);
    expect(edgeScrollSpeed({ y: 32 }, 800)).toBe(-300);
    expect(edgeScrollSpeed({ y: 768 }, 800)).toBe(300);
    expect(edgeScrollSpeed({ y: -1000 }, 800)).toBe(-600);
    expect(edgeScrollSpeed({ y: 3000 }, 800)).toBe(600);
  });
});
