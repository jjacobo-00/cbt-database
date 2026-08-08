export const DEMOGRAPHIC_MINISTRY_NAMES = [
  "Men of Faith",
  "Ladies for Christ",
  "Kids for Jesus",
  "Youth Christian",
] as const

export const DEMOGRAPHIC_MINISTRIES_CONFIG = [
  { name: "Men of Faith", description: "Men's Fellowship & Demographic Ministry" },
  { name: "Ladies for Christ", description: "Women's Fellowship & Demographic Ministry" },
  { name: "Kids for Jesus", description: "Children's Sunday School & Demographic Ministry" },
  { name: "Youth Christian", description: "Youth & Student Demographic Ministry" },
] as const

export type DemographicMinistryName = (typeof DEMOGRAPHIC_MINISTRY_NAMES)[number]
