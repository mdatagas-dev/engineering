import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { ManufactureScene } from "/home/lutvi/Engineering-Performance/src/components/manufacture-scene";

describe("scene render", () => {
  it("renders tanpa throw", () => {
    let html = "";
    expect(() => { html = renderToString(<ManufactureScene />); }).not.toThrow();
    expect(html.length).toBeGreaterThan(100);
  });
});
