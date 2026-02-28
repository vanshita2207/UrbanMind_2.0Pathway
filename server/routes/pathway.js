// server/routes/pathway.js
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ESM doesn't have __dirname — derive it from import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// return the cached snapshot produced by the risk pipeline
router.get("/risk", (req, res) => {
  const snapshot = req.app.locals.latestRiskData || [];
  res.json(snapshot);
});

// append a manual measurement and update snapshot
router.post("/risk/update", (req, res) => {
  const { city, aqi, heat_index } = req.body;
  if (!city || typeof aqi !== "number" || typeof heat_index !== "number") {
    return res.status(400).json({ error: "city, aqi and heat_index required" });
  }

  const csvPath = path.join(__dirname, "..", "pathway_service", "risk_inputs.csv");
  const line = `${city},${aqi.toFixed(0)},${heat_index.toFixed(1)}\n`;

  try {
    fs.appendFileSync(csvPath, line, "utf8");
  } catch (err) {
    console.error('failed to append risk input', err);
    return res.status(500).json({ error: 'append failed' });
  }

  // duplicate pipeline logic to keep in-memory snapshot fresh
  let snapshot = req.app.locals.latestRiskData || [];
  const idx = snapshot.findIndex(r => r.city === city);
  let asthma = 'LOW';
  if (aqi > 200 || heat_index > 40) asthma = 'HIGH';
  else if (aqi > 150 || heat_index > 35) asthma = 'MEDIUM';
  let hospital = 'LOW';
  if (asthma === 'HIGH') hospital = 'HIGH';
  else if (asthma === 'MEDIUM') hospital = 'MEDIUM';
  const energy_spike = Math.random() * 20 + 5;
  let advisory = 'Normal conditions';
  if (asthma === 'HIGH')
    advisory = 'Issue health advisory for children and elderly. Shift industrial load to off-peak.';
  else if (asthma === 'MEDIUM')
    advisory = 'Monitor health advisory. Reduce non-essential energy consumption.';
  const now = new Date().toISOString();
  const heatwave = heat_index > 40;
  const prevHistory = (snapshot[idx]?.history || []).slice(-19);
  const record = {
    city,
    aqi,
    heat_index,
    asthma_risk: asthma,
    hospital_surge: hospital,
    energy_demand_spike: energy_spike,
    advisory,
    heatwave_alert: heatwave,
    history: [...prevHistory, { time: now, aqi }]  // ← append new point
  };
  if (idx >= 0) snapshot[idx] = record;
  else snapshot.push(record);
  req.app.locals.latestRiskData = snapshot;

  // broadcast to all WebSocket clients so UI updates live
  if (typeof req.app.locals.broadcastRisk === 'function') {
    req.app.locals.broadcastRisk(snapshot);
  }

  res.json(snapshot);
});


// ✅ Default export for ES Module import
export default router;