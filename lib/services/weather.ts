export type WeatherConditionCategory = "good" | "rainy" | "stormy"

export interface WeatherData {
  date: string
  serviceTime: "AM" | "PM"
  condition: WeatherConditionCategory
  conditionLabel: string
  summary: string
  temperatureC: number | null
  precipitationMm: number
  weatherCode: number | null
  icon: "sun" | "cloud" | "cloud-rain" | "cloud-lightning"
}

// CBT Location Coordinates: Acacia corner Keith Streets, Gordon Heights, Olongapo City
export const CHURCH_WEATHER_LOCATION = {
  name: "Gordon Heights, Olongapo City",
  latitude: 14.8584,
  longitude: 120.2882,
  timezone: "Asia/Manila",
}

// 30-minute in-memory cache keyed by `${date}_${serviceTime}` to prevent duplicate external calls
const weatherCache: Record<string, { data: WeatherData; timestamp: number }> = {}
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

/**
 * Maps standard WMO Weather Codes to user-friendly conditions, labels, and icons.
 */
export function parseWmoWeather(
  code: number | null,
  tempC: number | null,
  rainMm: number = 0,
  timeWindowLabel?: string
): {
  condition: WeatherConditionCategory
  conditionLabel: string
  summary: string
  icon: "sun" | "cloud" | "cloud-rain" | "cloud-lightning"
} {
  const tempStr = tempC !== null ? `${Math.round(tempC)}°C` : ""
  const windowStr = timeWindowLabel ? ` • ${timeWindowLabel}` : ""

  if (code === null) {
    return {
      condition: "good",
      conditionLabel: "Good Weather",
      summary: tempStr ? `Fair Weather (${tempStr}${windowStr})` : "Fair Weather",
      icon: "sun",
    }
  }

  // Thunderstorms & Storms
  if (code >= 95 || rainMm >= 15) {
    const rainInfo = rainMm > 0 ? `, ${rainMm.toFixed(1)}mm rain` : ""
    return {
      condition: "stormy",
      conditionLabel: "Thunderstorm / Severe",
      summary: `Thunderstorm (${tempStr}${rainInfo}${windowStr})`,
      icon: "cloud-lightning",
    }
  }

  // Rain & Drizzle
  if ((code >= 51 && code <= 82) || rainMm > 0.3) {
    let rainType = "Rain Showers"
    if (code === 51 || code === 53 || code === 55) rainType = "Light Drizzle"
    else if (code === 65 || code === 82) rainType = "Heavy Rain"
    else if (code === 61 || code === 63 || code === 80 || code === 81) rainType = "Rain"

    const rainInfo = rainMm > 0 ? ` (${tempStr}, ${rainMm.toFixed(1)}mm${windowStr})` : ` (${tempStr}${windowStr})`
    return {
      condition: "rainy",
      conditionLabel: "Rainy / Wet",
      summary: `${rainType}${rainInfo}`,
      icon: "cloud-rain",
    }
  }

  // Overcast & Gloomy
  if (code === 3 || code === 45 || code === 48) {
    return {
      condition: "good",
      conditionLabel: "Cloudy",
      summary: `Overcast (${tempStr}${windowStr})`,
      icon: "cloud",
    }
  }

  // Partly Cloudy
  if (code === 1 || code === 2) {
    return {
      condition: "good",
      conditionLabel: "Partly Cloudy",
      summary: `Partly Cloudy (${tempStr}${windowStr})`,
      icon: "sun",
    }
  }

  // Clear / Sunny (code 0)
  return {
    condition: "good",
    conditionLabel: "Sunny / Clear",
    summary: `Sunny & Clear (${tempStr}${windowStr})`,
    icon: "sun",
  }
}

/**
 * Fetches slot-specific weather for Gordon Heights, Olongapo City.
 * - AM Slot: Samples 8:00 AM – 11:00 AM (hours 8, 9, 10, 11)
 * - PM Slot: Samples 2:00 PM – 5:00 PM (hours 14, 15, 16, 17)
 * Runs asynchronously with 30-minute caching and non-blocking safe fallbacks.
 */
export async function fetchOlongapoWeather(
  dateStr: string,
  serviceTime: "AM" | "PM" = "AM"
): Promise<WeatherData> {
  const targetDate = dateStr || new Date().toISOString().split("T")[0]
  const normalizedServiceTime: "AM" | "PM" = serviceTime === "PM" ? "PM" : "AM"
  const cacheKey = `${targetDate}_${normalizedServiceTime}`

  // 1. Check cache
  const cached = weatherCache[cacheKey]
  const now = Date.now()
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  try {
    const { latitude, longitude, timezone } = CHURCH_WEATHER_LOCATION

    // Open-Meteo hourly endpoint provides hourly precision across the entire 24h day
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&start_date=${targetDate}&end_date=${targetDate}&hourly=temperature_2m,precipitation,weather_code&timezone=${encodeURIComponent(timezone)}`

    const res = await fetch(url, {
      next: { revalidate: 1800 }, // 30 minutes
      signal: AbortSignal.timeout(3500), // 3.5s timeout max
    })

    if (!res.ok) {
      throw new Error(`Open-Meteo returned status ${res.status}`)
    }

    const json = await res.json()
    const hourly = json.hourly

    if (hourly && hourly.time && hourly.time.length > 0) {
      // Define target hourly indices
      // AM window: 8am - 11am -> hours 8, 9, 10, 11
      // PM window: 2pm - 5pm  -> hours 14, 15, 16, 17
      const targetHours = normalizedServiceTime === "AM" ? [8, 9, 10, 11] : [14, 15, 16, 17]
      const windowLabel = normalizedServiceTime === "AM" ? "8am-11am" : "2pm-5pm"

      const temps: number[] = []
      let totalRainMm = 0
      const weatherCodes: number[] = []

      targetHours.forEach((hour) => {
        if (hourly.temperature_2m && hourly.temperature_2m[hour] !== undefined) {
          temps.push(hourly.temperature_2m[hour])
        }
        if (hourly.precipitation && hourly.precipitation[hour] !== undefined) {
          totalRainMm += Number(hourly.precipitation[hour]) || 0
        }
        if (hourly.weather_code && hourly.weather_code[hour] !== undefined) {
          weatherCodes.push(hourly.weather_code[hour])
        }
      })

      // Calculate slot averages and highest severity weather code in the service window
      const avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 28
      // Pick peak weather code (favoring storms/rain over clear if present during service)
      const peakWeatherCode =
        weatherCodes.length > 0
          ? weatherCodes.reduce((prev, curr) => (curr > prev ? curr : prev), 0)
          : 0

      const parsed = parseWmoWeather(peakWeatherCode, avgTemp, totalRainMm, windowLabel)

      const weatherData: WeatherData = {
        date: targetDate,
        serviceTime: normalizedServiceTime,
        condition: parsed.condition,
        conditionLabel: parsed.conditionLabel,
        summary: parsed.summary,
        temperatureC: Number(avgTemp.toFixed(1)),
        precipitationMm: Number(totalRainMm.toFixed(1)),
        weatherCode: peakWeatherCode,
        icon: parsed.icon,
      }

      weatherCache[cacheKey] = { data: weatherData, timestamp: now }
      return weatherData
    }

    throw new Error("No hourly weather data returned")
  } catch (err) {
    console.warn("Weather fetch fallback for", cacheKey, err)

    // Non-blocking graceful fallback
    const fallback: WeatherData = {
      date: targetDate,
      serviceTime: normalizedServiceTime,
      condition: "good",
      conditionLabel: "Fair Weather",
      summary: normalizedServiceTime === "AM" ? "Fair Weather (8am-11am)" : "Fair Weather (2pm-5pm)",
      temperatureC: normalizedServiceTime === "AM" ? 27 : 29,
      precipitationMm: 0,
      weatherCode: 0,
      icon: "sun",
    }
    return fallback
  }
}
