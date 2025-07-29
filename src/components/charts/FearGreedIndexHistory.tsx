import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

export default function FearGreedIndexHistory() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://api.alternative.me/fng/?limit=30")
      .then((res) => res.json())
      .then((d) => {
        setData(d.data.reverse());
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="border rounded-xl p-6 bg-black text-white flex flex-col items-center shadow-lg w-full">
        Carregando histórico...
      </div>
    );
  }

  const chartData = {
    labels: data.map((d) =>
      new Date(Number(d.timestamp) * 1000).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    ),
    datasets: [
      {
        label: "Fear & Greed",
        data: data.map((d) => Number(d.value)),
        borderColor: "#8bc34a",
        backgroundColor: "rgba(139,195,74,0.2)",
        fill: true,
        tension: 0.4,
        pointRadius: 2
      }
    ]
  };

  const options = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: { intersect: false }
  },
  interaction: { mode: 'index' as const },
  scales: {
    y: { min: 0, max: 100, ticks: { color: "#ccc" }, grid: { color: "#333" } },
    x: { ticks: { color: "#ccc" }, grid: { color: "#333" } }
  }
};

  // Valor atual destacado:
  const atual = data[data.length - 1];

  return (
    <div className="border rounded-xl p-6 bg-black text-white flex flex-col items-center shadow-lg w-full">
      <h2 className="text-2xl font-bold mb-2">Histórico 30 dias</h2>
      <div className="flex items-center gap-4 mb-4">
        <span className="text-5xl font-extrabold">{atual.value}</span>
        <span
          className="uppercase font-semibold rounded px-3 py-1 text-sm"
          style={{
            background: atual.value_classification === "Extreme Fear"
              ? "#d32f2f"
              : atual.value_classification === "Fear"
              ? "#fbc02d"
              : atual.value_classification === "Greed"
              ? "#8bc34a"
              : "#388e3c"
          }}
        >
          {atual.value_classification}
        </span>
      </div>
      <div className="w-full" style={{ maxWidth: 420 }}>
        <Line data={chartData} options={options} />
      </div>
      <div className="text-xs text-muted-foreground mt-2 text-center">
        Fonte:{" "}
        <a
          href="https://alternative.me/crypto/fear-and-greed-index/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80"
        >
          alternative.me
        </a>
      </div>
    </div>
  );
}