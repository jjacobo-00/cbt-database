export type WeatherConditionCategory = "good" | "rainy" | "stormy"

export interface WeatherData {
  date: string
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

// 30-minute in-memory cache to prevent duplicate external calls
const weatherCache: Record<string, { data: WeatherData; timestamp: number }> = {}
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

/**
 * Maps standard WMO Weather Codes to user-friendly conditions, labels, and icons.
 */
export function parseWmoWeather(
  code: number | null,
  tempC: number | null,
  rainMm: number = 0
): {
  condition: WeatherConditionCategory
  conditionLabel: string
  summary: string
  icon: "sun" | "cloud" | "cloud-rain" | "cloud-lightning"
} {
  const tempStr = tempC !== null ? `${Math.round(tempC)}°C` : ""

  if (code === null) {
    return {
      condition: "good",
      conditionLabel: "Good Weather",
      summary: tempStr ? `Fair Weather (${tempStr})` : "Fair Weather",
      icon: "sun",
    }
  }

  // Thunderstorms & Storms
  if (code >= 95 || rainMm >= 30) {
    const rainInfo = rainMm > 0 ? `, ${Math.round(rainMm)}mm rain` : ""
    return {
      condition: "stormy",
      conditionLabel: "Stormy / Severe",
      summary: `Thunderstorm (${tempStr}${rainInfo})`,
      icon: "cloud-lightning",
    }
  }

  // Rain & Drizzle
  if ((code >= 51 && code <= 82) || rainMm > 0.5) {
    let rainType = "Rain Showers"
    if (code === 51 || code === 53 || code === 55) rainType = "Light Drizzle"
    else if (code === 65 || code === 82) rainType = "Heavy Rain"
    else if (code === 61 || code === 63 || code === 80 || code === 81) rainType = "Rain"

    const rainInfo = rainMm > 0 ? ` (${tempStr}, ${Math.round(rainMm)}mm)` : ` (${tempStr})`
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
      summary: `Overcast / Cloudy (${tempStr})`,
      icon: "cloud",
    }
  }

  // Partly Cloudy
  if (code === 1 || code === 2) {
    return {
      condition: "good",
      conditionLabel: "Partly Cloudy",
      summary: `Partly Cloudy (${tempStr})`,
      icon: "sun",
    }
  }

  // Clear / Sunny (code 0)
  return {
    condition: "good",
    conditionLabel: "Sunny / Clear",
    summary: `Sunny & Clear (${tempStr})`,
    icon: "sun",
  }
}

/**
 * Fetches real-time, forecast, or historical weather for Gordon Heights, Olongapo City.
 * Runs asynchronously with 30-minute caching and non-blocking safe fallbacks.
 */
export async function fetchOlongapoWeather(dateStr: string): Promise<WeatherData> {
  const targetDate = dateStr || new Date().toISOString().split("T")[0]

  // 1. Check cache
  const cached = weatherCache[targetDate]
  const now = Date.now()
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  try {
    const { latitude, longitude, timezone } = CHURCH_WEATHER_LOCATION

    // Open-Meteo daily endpoint supports today, upcoming forecast, and past dates seamlessly
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&start_date=${targetDate}&end_date=${targetDate}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=${encodeURIComponent(timezone)}`

    const res = await fetch(url, {
      next: { revalidate: 1800 }, // 30 minutes
      signal: AbortSignal.timeout(3500), // 3.5s timeout max
    })

    if (!res.ok) {
      throw new Error(`Open-Meteo returned status ${res.status}`)
    }

    const json = await res.json()
    const daily = json.daily

    if (daily && daily.weather_code && daily.weather_code.length > 0) {
      const weatherCode = daily.weather_code[0]
      const maxTemp = daily.temperature_2m_max?.[0]
      const minTemp = daily.temperature_2m_min?.[0]
      const avgTemp = maxTemp !== undefined && minTemp !== undefined ? (maxTemp + minTemp) / 2 : maxTemp ?? null
      const rainMm = daily.precipitation_sum?.[0] || 0

      const parsed = parseWmoWeather(weatherCode, avgTemp, rainMm)

      const weatherData: WeatherData = {
        date: targetDate,
        condition: parsed.condition,
        conditionLabel: parsed.conditionLabel,
        summary: parsed.summary,
        temperatureC: avgTemp !== null ? Number(avgTemp.toFixed(1)) : null,
        precipitationMm: rainMm,
        weatherCode,
        icon: parsed.icon,
      }

      weatherCache[targetDate] = { data: weatherData, timestamp: now }
      return weatherData
    }

    throw new Error("No daily weather data returned")
  } catch (err) {
    console.warn("Weather fetch fallback for date", targetDate, err)

    // Non-blocking graceful fallback
    const fallback: WeatherData = {
      date: targetDate,
      condition: "good",
      conditionLabel: "Fair Weather",
      summary: "Fair Weather (Gordon Heights)",
      temperatureC: 28,
      precipitationMm: 0,
      weatherCode: 0,
      icon: "sun",
    }
    return fallback
  }
}
