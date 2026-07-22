import { getOpenMeteoForecast } from "./openMeteoService"

const USER_AGENT = process.env.USER_AGENT || "weather-polymarket-bot/1.0 (contact@example.com)"
const WEATHER_GOV_BASE = "https://api.weather.gov"

export interface WeatherData {
  timestamp: Date
  temperature: number
  humidity: number | null
  windSpeed: number | null
  precipitationProbability: number | null
}

// ---------- Open-Meteo (primary, works anywhere) ----------

function toWeatherData(
  f: { time: string; temperature: number; humidity: number | null; precipitationProbability: number | null; windSpeed: number | null }
): WeatherData {
  return {
    timestamp: new Date(f.time),
    temperature: f.temperature,
    humidity: f.humidity,
    windSpeed: f.windSpeed,
    precipitationProbability: f.precipitationProbability,
  }
}

export async function getForecast(lat: number, lon: number): Promise<WeatherData[]> {
  const forecast = await getOpenMeteoForecast(lat, lon, 7)
  return forecast.map(toWeatherData)
}

// ---------- NWS (fallback for US cities, more precise) ----------

interface PointsResponse {
  properties: {
    gridId: string
    gridX: number
    gridY: number
  }
}

interface Period {
  startTime: string
  temperature: number
  temperatureUnit: string
  humidity: { value: number | null }
  windSpeed: string
  probabilityOfPrecipitation: { value: number | null }
}

interface ForecastResponse {
  properties: { updated: string; periods: Period[] }
}

async function fetchNws(url: string, retries = 3, delay = 5000): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    })
    if (response.ok) return response
    if (response.status === 429 && attempt < retries - 1) {
      await new Promise((r) => setTimeout(r, delay))
      continue
    }
    throw new Error(`weather.gov error: ${response.status}`)
  }
  throw new Error(`weather.gov failed after ${retries} retries`)
}

function parseWind(speed: string): number | null {
  const m = speed.match(/(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

export async function getNwsForecast(lat: number, lon: number): Promise<WeatherData[] | null> {
  try {
    const pointsResp = await fetchNws(`${WEATHER_GOV_BASE}/points/${lat.toFixed(4)},${lon.toFixed(4)}`)
    const pointsData: PointsResponse = await pointsResp.json()
    const { gridId, gridX, gridY } = pointsData.properties

    const forecastResp = await fetchNws(`${WEATHER_GOV_BASE}/gridpoints/${gridId}/${gridX},${gridY}/forecast/hourly`)
    const forecastData: ForecastResponse = await forecastResp.json()

    return forecastData.properties.periods.map((period) => ({
      timestamp: new Date(period.startTime),
      temperature: period.temperature,
      humidity: period.humidity?.value ?? null,
      windSpeed: parseWind(period.windSpeed),
      precipitationProbability: period.probabilityOfPrecipitation?.value ?? null,
    }))
  } catch {
    return null
  }
}
