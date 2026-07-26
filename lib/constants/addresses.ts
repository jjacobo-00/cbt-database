export type AddressPreset = {
  barangay: string
  city: string
  province: string
  zip_code: string
}

export const OLONGAPO_BARANGAYS: AddressPreset[] = [
  { barangay: "Gordon Heights", city: "Olongapo City", province: "Zambales", zip_code: "2200" },
  { barangay: "Barretto", city: "Olongapo City", province: "Zambales", zip_code: "2200" },
  { barangay: "East Bajac-Bajac", city: "Olongapo City", province: "Zambales", zip_code: "2200" },
  { barangay: "West Bajac-Bajac", city: "Olongapo City", province: "Zambales", zip_code: "2200" },
  { barangay: "East Tapinac", city: "Olongapo City", province: "Zambales", zip_code: "2200" },
  { barangay: "West Tapinac", city: "Olongapo City", province: "Zambales", zip_code: "2200" },
  { barangay: "Santa Rita", city: "Olongapo City", province: "Zambales", zip_code: "2200" },
  { barangay: "Kalaklan", city: "Olongapo City", province: "Zambales", zip_code: "2200" },
  { barangay: "Mabayuan", city: "Olongapo City", province: "Zambales", zip_code: "2200" },
  { barangay: "New Cabalan", city: "Olongapo City", province: "Zambales", zip_code: "2200" },
  { barangay: "Old Cabalan", city: "Olongapo City", province: "Zambales", zip_code: "2200" },
  { barangay: "Pag-asa", city: "Olongapo City", province: "Zambales", zip_code: "2200" },
  { barangay: "Asinan", city: "Olongapo City", province: "Zambales", zip_code: "2200" },
  { barangay: "Banicain", city: "Olongapo City", province: "Zambales", zip_code: "2200" },
  { barangay: "Kalayaan", city: "Olongapo City", province: "Zambales", zip_code: "2200" },
  { barangay: "Cabinet Hill", city: "Olongapo City", province: "Zambales", zip_code: "2200" },
  { barangay: "New Ilalim", city: "Olongapo City", province: "Zambales", zip_code: "2200" },
  { barangay: "New Kababae", city: "Olongapo City", province: "Zambales", zip_code: "2200" },
]

export const NEARBY_TOWNS: AddressPreset[] = [
  { barangay: "Calapacuan", city: "Subic", province: "Zambales", zip_code: "2209" },
  { barangay: "Matain", city: "Subic", province: "Zambales", zip_code: "2209" },
  { barangay: "Calapandayan", city: "Subic", province: "Zambales", zip_code: "2209" },
  { barangay: "Ilwas", city: "Subic", province: "Zambales", zip_code: "2209" },
  { barangay: "Cawag", city: "Subic", province: "Zambales", zip_code: "2209" },
  { barangay: "Santo Tomas", city: "Subic", province: "Zambales", zip_code: "2209" },
  { barangay: "Wawandue", city: "Subic", province: "Zambales", zip_code: "2209" },
  { barangay: "Barangay Poblacion", city: "Castillejos", province: "Zambales", zip_code: "2208" },
  { barangay: "Barangay San Nicolas", city: "Castillejos", province: "Zambales", zip_code: "2208" },
  { barangay: "Barangay Poblacion", city: "San Marcelino", province: "Zambales", zip_code: "2207" },
  { barangay: "Barangay Poblacion", city: "San Antonio", province: "Zambales", zip_code: "2206" },
  { barangay: "Barangay Poblacion", city: "San Narciso", province: "Zambales", zip_code: "2205" },
  { barangay: "Barangay Poblacion", city: "Botolan", province: "Zambales", zip_code: "2202" },
  { barangay: "Barangay Poblacion", city: "Iba", province: "Zambales", zip_code: "2201" },
  { barangay: "Barangay Poblacion", city: "Dinalupihan", province: "Bataan", zip_code: "2110" },
  { barangay: "Barangay Poblacion", city: "Hermosa", province: "Bataan", zip_code: "2111" },
]

export const ALL_ADDRESS_PRESETS: AddressPreset[] = [
  ...OLONGAPO_BARANGAYS,
  ...NEARBY_TOWNS,
]
