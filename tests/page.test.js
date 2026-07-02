import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { JSDOM } from "jsdom";
import { beforeAll, describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");

let doc;
beforeAll(() => {
  doc = new JSDOM(html).window.document;
});

describe("in-page navigation integrity", () => {
  it("every #anchor link points to an element that exists", () => {
    const anchors = [...doc.querySelectorAll('a[href^="#"]')];
    expect(anchors.length).toBeGreaterThan(0);
    const broken = anchors
      .map((a) => a.getAttribute("href"))
      .filter((href) => href.length > 1) // skip a bare "#"
      .filter((href) => !doc.getElementById(href.slice(1)));
    expect(broken).toEqual([]);
  });
});

describe("external link safety", () => {
  it('every target="_blank" link sets rel="noopener"', () => {
    const external = [...doc.querySelectorAll('a[target="_blank"]')];
    expect(external.length).toBeGreaterThan(0);
    const unsafe = external
      .filter((a) => !(a.getAttribute("rel") || "").includes("noopener"))
      .map((a) => a.getAttribute("href"));
    expect(unsafe).toEqual([]);
  });

  it("primary CTAs link to the Buy Me a Coffee page", () => {
    const bmc = [...doc.querySelectorAll("a")].filter((a) =>
      (a.getAttribute("href") || "").includes("buymeacoffee.com/suwinc")
    );
    expect(bmc.length).toBeGreaterThan(0);
  });

  it("contact points to the expected mailto: address", () => {
    const mail = [...doc.querySelectorAll('a[href^="mailto:"]')];
    expect(mail.length).toBeGreaterThan(0);
    expect(
      mail.every((a) =>
        a.getAttribute("href").startsWith("mailto:idoghostwriting@gmail.com")
      )
    ).toBe(true);
  });
});

describe("SEO / social meta", () => {
  it("has a non-empty title and description", () => {
    expect(doc.title.trim().length).toBeGreaterThan(0);
    const desc = doc.querySelector('meta[name="description"]');
    expect(desc?.getAttribute("content")?.trim().length).toBeGreaterThan(0);
  });

  it("declares a canonical URL", () => {
    const canonical = doc.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute("href")).toMatch(/^https?:\/\//);
  });

  it("carries the core Open Graph tags", () => {
    for (const prop of ["og:type", "og:url", "og:title", "og:description"]) {
      const tag = doc.querySelector(`meta[property="${prop}"]`);
      expect(
        tag?.getAttribute("content")?.trim().length,
        `missing/empty ${prop}`
      ).toBeGreaterThan(0);
    }
  });
});

describe("page structure smoke test", () => {
  it("renders a single hero <h1>", () => {
    const h1s = doc.querySelectorAll("h1");
    expect(h1s.length).toBe(1);
    expect(h1s[0].textContent.trim().length).toBeGreaterThan(0);
  });

  it("exposes the four content sections referenced by the nav", () => {
    for (const id of ["work", "who", "hire", "join"]) {
      expect(doc.getElementById(id), `missing section #${id}`).toBeTruthy();
    }
  });

  it("shows three support tiers", () => {
    expect(doc.querySelectorAll(".tiers .tier").length).toBe(3);
  });

  it("has a join form with email + note inputs and a status element", () => {
    const form = doc.querySelector("form.capture");
    expect(form).toBeTruthy();
    expect(form.querySelector('input[name="email"]')).toBeTruthy();
    expect(form.querySelector('input[name="note"]')).toBeTruthy();
    expect(doc.getElementById("mgmsg")).toBeTruthy();
  });

  it("loads the external join script (extracted for testability)", () => {
    const script = doc.querySelector('script[src="assets/join.js"]');
    expect(script).toBeTruthy();
    expect(existsSync(resolve(root, "assets/join.js"))).toBe(true);
  });
});

describe("basic accessibility hygiene", () => {
  it("declares a page language", () => {
    expect(doc.documentElement.getAttribute("lang")).toBeTruthy();
  });

  it("labels every form control", () => {
    const controls = [...doc.querySelectorAll("input, textarea, select")];
    expect(controls.length).toBeGreaterThan(0);
    const unlabelled = controls.filter((el) => {
      if (el.getAttribute("aria-label")?.trim()) return false;
      if (el.getAttribute("aria-labelledby")?.trim()) return false;
      const id = el.getAttribute("id");
      if (id && doc.querySelector(`label[for="${id}"]`)) return false;
      if (el.closest("label")) return false;
      return true;
    });
    expect(unlabelled.map((el) => el.getAttribute("name") || el.tagName)).toEqual(
      []
    );
  });

  it("marks purely decorative elements as aria-hidden", () => {
    expect(doc.querySelector(".rings")?.getAttribute("aria-hidden")).toBe(
      "true"
    );
  });
});
