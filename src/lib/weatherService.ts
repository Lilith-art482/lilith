const USER_AGENT = process.env.USER_AGENT || "weather-polymarket-bot/1.0 (contact@example.com)"
const WEATHER_GOV_BASE = "https://api.weather.gov"

interface PointsResponse {
  properties: {
    gridId: string
    gridX: number
    gridY: number
    relativeLocation: {
      properties: {
        city: string
        state: string
      }
    }
  }
}

interface HourlyForecastPeriod {
  startTime: string
  temperature: number
  temperatureUnit: string
  humidity: { value: number | null }
  windSpeed: string
  probabilityOfPrecipitation: { value: number | null }
}

interface ForecastResponse {
  properties: {
    updated: string
    periods: HourlyForecastPeriod[]
  }
}

interface WeatherData {
  timestamp: Date
  temperature: number
  humidity: number | null
  windSpeed: number | null
  precipitationProbability: number | null
}

async function fetchWithRetry(url: string, retries = 3, delay = 5000): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    })

    if (response.ok) return response

    if (response.status === 429 && attempt < retries - 1) {
      await new Promise((resolve) => setTimeout(resolve, delay))
      continue
    }

    throw new Error(`weather.gov API error: ${response.status} ${response.statusText}`)
  }

  throw new Error(`weather.gov API failed after ${retries} retries`)
}

function parseWindSpeed(speed: string): number | null {
  const match = speed.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : null
}

export async function getForecast(lat: number, lon: number): Promise<WeatherData[]> {
  const pointsUrl = `${WEATHER_GOV_BASE}/points/${lat.toFixed(4)},${lon.toFixed(4)}`
  const pointsResp = await fetchWithRetry(pointsUrl)
  const pointsData: PointsResponse = await pointsResp.json()

  const { gridId, gridX, gridY } = pointsData.properties
  const forecastUrl = `${WEATHER_GOV_BASE}/gridpoints/${gridId}/${gridX},${gridY}/forecast/hourly`

  const forecastResp = await fetchWithRetry(forecastUrl)
  const forecastData: ForecastResponse = await forecastResp.json()

  return forecastData.properties.periods.map((period) => ({
    timestamp: new Date(period.startTime),
    temperature: period.temperature,
    humidity: period.humidity?.value ?? null,
    windSpeed: parseWindSpeed(period.windSpeed),
    precipitationProbability: period.probabilityOfPrecipitation?.value ?? null,
  }))
}

export async function getNwsStationId(lat: number, lon: number): Promise<string | null> {
  try {
    const pointsUrl = `${WEATHER_GOV_BASE}/points/${lat.toFixed(4)},${lon.toFixed(4)}`
    const pointsResp = await fetchWithRetry(pointsUrl)
    const pointsData: PointsResponse = await pointsResp.json()

    const { gridId, gridX, gridY } = pointsData.properties
    return `${gridId}/${gridX},${gridY}`
  } catch {
    return null
  }
}
