"use client"

import { useRef, useEffect } from "react"
import { Chart, registerables } from "chart.js"

Chart.register(...registerables)

interface PricePoint {
  timestamp: string
  price: number
}

interface Props {
  data: PricePoint[]
  label?: string
}

export default function PriceChart({ data, label = "Market Price" }: Props) {
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
            label,
            data: data.map((d) => d.price * 100),
            borderColor: "rgb(52, 211, 153)",
            backgroundColor: "rgba(52, 211, 153, 0.1)",
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
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
            min: 0,
            max: 100,
            ticks: { color: "#9ca3af", callback: (v) => `${v}%` },
            grid: { color: "rgba(75, 85, 99, 0.3)" },
          },
        },
      },
    })

    return () => {
      if (chartRef.current) chartRef.current.destroy()
    }
  }, [data, label])

  return <canvas ref={canvasRef} />
}
