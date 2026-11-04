import { describe, expect, it } from "vitest";
import { shouldRegisterSw } from "@/lib/pwa/register-sw";

const base = {
  hostname: "rudiments-drumlab.lovable.app",
  isProd: true,
  inIframe: false,
  swDisabled: false,
};

describe("shouldRegisterSw", () => {
  it("registers on the published production hostname", () => {
    expect(shouldRegisterSw(base)).toBe(true);
  });

  it("registers on a custom domain", () => {
    expect(shouldRegisterSw({ ...base, hostname: "app.meusite.com.br" })).toBe(true);
  });

  it("refuses in dev (non-production build)", () => {
    expect(shouldRegisterSw({ ...base, isProd: false })).toBe(false);
  });

  it("refuses inside an iframe", () => {
    expect(shouldRegisterSw({ ...base, inIframe: true })).toBe(false);
  });

  it("refuses with the ?sw=off kill switch", () => {
    expect(shouldRegisterSw({ ...base, swDisabled: true })).toBe(false);
  });

  it("refuses on the Lovable id-preview hostname", () => {
    expect(
      shouldRegisterSw({
        ...base,
        hostname: "id-preview--643d9bcf-ab02-4c92-90ca-7be458b70eef.lovable.app",
      }),
    ).toBe(false);
  });

  it("refuses on numbered draft preview hostnames", () => {
    expect(shouldRegisterSw({ ...base, hostname: "preview-3--643d9bcf.lovable.app" })).toBe(false);
    expect(shouldRegisterSw({ ...base, hostname: "preview--abc123.gpt-eng.com" })).toBe(false);
  });

  it("refuses on lovableproject.com and its subdomains", () => {
    expect(shouldRegisterSw({ ...base, hostname: "lovableproject.com" })).toBe(false);
    expect(shouldRegisterSw({ ...base, hostname: "abc.lovableproject.com" })).toBe(false);
    expect(shouldRegisterSw({ ...base, hostname: "abc.lovableproject-dev.com" })).toBe(false);
  });

  it("refuses on beta.lovable.dev", () => {
    expect(shouldRegisterSw({ ...base, hostname: "beta.lovable.dev" })).toBe(false);
    expect(shouldRegisterSw({ ...base, hostname: "x.beta.lovable.dev" })).toBe(false);
  });

  it("is case-insensitive on hostnames", () => {
    expect(shouldRegisterSw({ ...base, hostname: "ID-PREVIEW--643D9BCF.LOVABLE.APP" })).toBe(false);
  });
});
