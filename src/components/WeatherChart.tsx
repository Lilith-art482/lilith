"use client"

import { useRef, useEffect } from "react"
import { Chart, registerables } from "chart.js"

Chart.register(...registerables)

interface WeatherDataPoint {
  timestamp: string
  temperature: number
  humidity: number | null
  precipitationProbability: number | null
}

interface Props {
  data: WeatherDataPoint[]
}

export default function WeatherChart({ data }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    if (chartRef.current) {
      chartRef.current.destroy()
    }

    const labels = data.map((d) => {
      const date = new Date(d.timestamp)
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit" })
    })

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Temperature (°C)",
            data: data.map((d) => d.temperature),
            borderColor: "rgb(251, 191, 36)",
            backgroundColor: "rgba(251, 191, 36, 0.1)",
            fill: true,
            tension: 0.3,
            yAxisID: "y",
          },
          {
            label: "Precipitation (%)",
            data: data.map((d) => d.precipitationProbability),
            borderColor: "rgb(96, 165, 250)",
            backgroundColor: "rgba(96, 165, 250, 0.1)",
            fill: true,
            tension: 0.3,
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            labels: { color: "#9ca3af" },
          },
        },
        scales: {
          x: {
            ticks: { color: "#9ca3af", maxTicksLimit: 10 },
            grid: { color: "rgba(75, 85, 99, 0.3)" },
          },
          y: {
            type: "linear",
            position: "left",
            ticks: { color: "#9ca3af" },
            grid: { color: "rgba(75, 85, 99, 0.3)" },
            title: { display: true, text: "°C", color: "#9ca3af" },
          },
          y1: {
            type: "linear",
            position: "right",
            min: 0,
            max: 100,
            ticks: { color: "#9ca3af" },
            grid: { display: false },
            title: { display: true, text: "%", color: "#9ca3af" },
          },
        },
      },
    })

    return () => {
      if (chartRef.current) chartRef.current.destroy()
    }
  }, [data])

  return <canvas ref={canvasRef} />
}
