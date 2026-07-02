import { afterEach, beforeEach, describe, expect, it } from "vitest";

// Importing the module runs its UMD wrapper, which attaches buildJoinMailto and
// mgJoin onto globalThis (since `window` is absent under the node environment).
import "../assets/join.js";

const { buildJoinMailto, mgJoin } = globalThis;

describe("buildJoinMailto", () => {
  it("produces a well-formed mailto: URL for the fixed recipient", () => {
    const url = buildJoinMailto("reader@example.com", "reader");
    expect(url.startsWith("mailto:idoghostwriting@gmail.com?")).toBe(true);
    expect(url).toContain("subject=");
    expect(url).toContain("&body=");
  });

  it("percent-encodes the subject", () => {
    const url = buildJoinMailto("a@b.com", "note");
    // "Mental Gymnasium — count me in" -> spaces and em dash encoded
    expect(url).toContain(
      "subject=Mental%20Gymnasium%20%E2%80%94%20count%20me%20in"
    );
  });

  it("encodes ampersands so they don't corrupt the query string", () => {
    const url = buildJoinMailto("a&b@example.com", "writer & binder");
    // A raw & would prematurely terminate the body param; it must be encoded.
    expect(url).toContain("a%26b%40example.com");
    expect(url).toContain("writer%20%26%20binder");
    // Exactly one unencoded & (the subject/body separator).
    expect(url.split("&").length).toBe(2);
  });

  it("encodes newlines in the composed body", () => {
    const url = buildJoinMailto("a@b.com", "hello");
    expect(url).toContain("%0A"); // the \n between the labelled lines
  });

  it("preserves non-ASCII input (the zine is bilingual EN/TH)", () => {
    const url = buildJoinMailto("a@b.com", "นักเขียน"); // "writer" in Thai
    expect(url).toContain(encodeURIComponent("นักเขียน"));
  });

  it("tolerates empty / missing fields without throwing", () => {
    expect(() => buildJoinMailto("", "")).not.toThrow();
    expect(() => buildJoinMailto(undefined, undefined)).not.toThrow();
    const url = buildJoinMailto(undefined, undefined);
    expect(url).toContain("Email%3A%20%0A"); // "Email: \n" with empty value
  });
});

describe("mgJoin (DOM handler)", () => {
  let originalLocation;
  let originalDocument;
  let msgEl;

  beforeEach(() => {
    originalLocation = globalThis.location;
    originalDocument = globalThis.document;
    msgEl = { textContent: "original note" };
    globalThis.location = { href: "" };
    globalThis.document = {
      getElementById: (id) => (id === "mgmsg" ? msgEl : null),
    };
  });

  afterEach(() => {
    globalThis.location = originalLocation;
    globalThis.document = originalDocument;
  });

  function fakeEvent(email, note) {
    let prevented = false;
    return {
      get prevented() {
        return prevented;
      },
      preventDefault() {
        prevented = true;
      },
      target: {
        email: { value: email },
        note: { value: note },
      },
    };
  }

  it("prevents the native form submission and returns false", () => {
    const e = fakeEvent("a@b.com", "reader");
    const result = mgJoin(e);
    expect(e.prevented).toBe(true);
    expect(result).toBe(false);
  });

  it("navigates to a mailto: URL built from the form values", () => {
    const e = fakeEvent("reader@example.com", "collaborator");
    mgJoin(e);
    expect(globalThis.location.href).toBe(
      buildJoinMailto("reader@example.com", "collaborator")
    );
  });

  it("swaps the helper note for a confirmation message", () => {
    mgJoin(fakeEvent("a@b.com", "patron"));
    expect(msgEl.textContent).toMatch(/opening your email app/i);
  });

  it("does not throw when the confirmation element is missing", () => {
    globalThis.document.getElementById = () => null;
    expect(() => mgJoin(fakeEvent("a@b.com", "reader"))).not.toThrow();
  });
});
