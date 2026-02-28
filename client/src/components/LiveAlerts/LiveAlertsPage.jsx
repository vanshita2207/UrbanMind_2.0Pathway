import { useEffect, useState } from 'react';
import { AlertTriangle, Thermometer, Wind } from 'lucide-react';

function LiveAlertsPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:5001");

    ws.onmessage = (event) => {
      let parsed = JSON.parse(event.data);
      // server now sends an array snapshot; pick first city if so
      if (Array.isArray(parsed)) {
        parsed = parsed[0] || null;
      }
      setData(parsed);
    };

    ws.onopen = () => {
      console.log("Connected to Live Pathway Stream");
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    return () => ws.close();
  }, []);

  if (!data) {
    return (
      <div className="text-center text-gray-500 mt-10">
        Waiting for live climate stream...
      </div>
    );
  }

  const aqi = parseInt(data.aqi);
  const heatIndex = parseInt(data.temperature);
  const asthmaRisk = aqi > 300 ? "HIGH" : aqi > 150 ? "MEDIUM" : "LOW";
  const energySpike = heatIndex > 40 ? "18%" : "5%";

  return (
    <div className="space-y-6">

      <h2 className="text-2xl font-bold text-emerald-700">
        Live Climate Risk Monitor
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

        <Card
          icon={Wind}
          title="AQI"
          value={`${aqi}`}
          subtitle="Air Quality Index"
          danger={aqi > 200}
        />

        <Card
          icon={Thermometer}
          title="Heat Index"
          value={`${heatIndex} °C`}
          subtitle="City Temperature"
          danger={heatIndex > 40}
        />

        <Card
          icon={AlertTriangle}
          title="Asthma Surge Risk"
          value={asthmaRisk}
          subtitle="Health Risk Score"
          danger={asthmaRisk === "HIGH"}
        />

        <Card
          icon={AlertTriangle}
          title="Energy Demand Forecast"
          value={energySpike}
          subtitle="Predicted Spike"
          danger={heatIndex > 40}
        />

      </div>
    </div>
  );
}

const Card = ({ icon: Icon, title, value, subtitle, danger }) => (
  <div className={`p-6 rounded-xl shadow-md border ${danger
      ? "bg-red-50 border-red-200"
      : "bg-white border-gray-100"
    }`}>
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold text-gray-700">{title}</h3>
      <Icon className={`w-5 h-5 ${danger ? "text-red-500" : "text-emerald-500"}`} />
    </div>
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-sm text-gray-500 mt-1">{subtitle}</div>
  </div>
);

export default LiveAlertsPage;