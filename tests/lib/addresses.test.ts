import { describe, expect, it } from "vitest"
import {
  ALL_ADDRESS_PRESETS,
  NEARBY_TOWNS,
  OLONGAPO_BARANGAYS,
  type AddressPreset,
} from "@/lib/constants/addresses"

const key = (p: AddressPreset) => `${p.barangay}|${p.city}`

describe("address presets", () => {
  it("concatenates Olongapo barangays and nearby towns without loss", () => {
    expect(ALL_ADDRESS_PRESETS).toHaveLength(
      OLONGAPO_BARANGAYS.length + NEARBY_TOWNS.length
    )
    expect(ALL_ADDRESS_PRESETS.slice(0, OLONGAPO_BARANGAYS.length)).toEqual(OLONGAPO_BARANGAYS)
    expect(ALL_ADDRESS_PRESETS.slice(OLONGAPO_BARANGAYS.length)).toEqual(NEARBY_TOWNS)
  })

  it("has no duplicate barangay/city pairs", () => {
    const keys = ALL_ADDRESS_PRESETS.map(key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it("populates every field of every preset", () => {
    for (const preset of ALL_ADDRESS_PRESETS) {
      expect(preset.barangay.trim()).not.toBe("")
      expect(preset.city.trim()).not.toBe("")
      expect(preset.province.trim()).not.toBe("")
      expect(preset.zip_code).toMatch(/^\d{4}$/)
    }
  })

  it("keeps all Olongapo barangays in Olongapo City, Zambales with zip 2200", () => {
    for (const preset of OLONGAPO_BARANGAYS) {
      expect(preset.city).toBe("Olongapo City")
      expect(preset.province).toBe("Zambales")
      expect(preset.zip_code).toBe("2200")
    }
  })

  it("keeps nearby towns outside Olongapo City", () => {
    for (const preset of NEARBY_TOWNS) {
      expect(preset.city).not.toBe("Olongapo City")
      expect(["Zambales", "Bataan"]).toContain(preset.province)
    }
  })

  it("assigns one consistent zip code per city", () => {
    const zipsByCity = new Map<string, Set<string>>()
    for (const preset of ALL_ADDRESS_PRESETS) {
      const zips = zipsByCity.get(preset.city) ?? new Set<string>()
      zips.add(preset.zip_code)
      zipsByCity.set(preset.city, zips)
    }
    for (const [, zips] of zipsByCity) {
      expect(zips.size).toBe(1)
    }
  })
})
