import { describe, expect, it } from "vitest"
import { cn } from "@/lib/utils/utils"

describe("cn", () => {
  it("joins plain class names", () => {
    expect(cn("a", "b")).toBe("a b")
  })

  it("drops falsy values", () => {
    expect(cn("a", false, undefined, null, "", "b")).toBe("a b")
  })

  it("resolves conditional object and array syntax", () => {
    expect(cn(["a", { b: true, c: false }], "d")).toBe("a b d")
  })

  it("lets later tailwind classes win over conflicting earlier ones", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4")
    expect(cn("text-sm text-red-500", "text-blue-500")).toBe("text-sm text-blue-500")
  })

  it("returns an empty string with no usable input", () => {
    expect(cn()).toBe("")
    expect(cn(undefined, false)).toBe("")
  })
})
