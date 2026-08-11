import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";

describe("login render", () => {
  it("ManufactureScene output mengandung elemen", async () => {
    const { ManufactureScene } = await import("./src/components/manufacture-scene");
    const html = renderToString(<ManufactureScene />);
    expect(html).toContain("anime-stage");
    expect(html).toContain("anime-drone");
    expect(html).toContain("anime-ember");
  });
});
