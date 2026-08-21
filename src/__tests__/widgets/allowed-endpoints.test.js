import { describe, expect, it } from "vitest";

import widgets from "widgets/widgets";

// `allowedEndpoints` is the allowlist that lets a raw, client-supplied endpoint string reach a
// proxy handler (see src/pages/api/services/proxy.js). An unanchored pattern like /status/ is a
// substring match, so `../../admin?x=status` passes it. That is harmless only while the widget's
// `api` template has no {endpoint} placeholder — the moment one is added, the request walks the
// upstream path with the stored credentials. Requiring anchors removes that latent trapdoor.
describe("widget allowedEndpoints", () => {
  const withRegex = Object.entries(widgets).filter(([, widget]) => widget?.allowedEndpoints instanceof RegExp);

  it("covers every widget that declares one", () => {
    expect(withRegex.length).toBeGreaterThan(0);
  });

  it.each(withRegex)("%s anchors its pattern at both ends", (name, widget) => {
    const { source } = widget.allowedEndpoints;
    expect(source.startsWith("^"), `${name}: /${source}/ is not anchored at the start`).toBe(true);
    expect(source.endsWith("$"), `${name}: /${source}/ is not anchored at the end`).toBe(true);
  });
});
