// import express from 'express';
// import mongoose from 'mongoose';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import path from 'path';
// import { spawn } from 'child_process';
// import energyRoutes from './routes/energy.js';
// import mobilityRoutes from './routes/mobility.js';
// import carbonRoutes from './routes/carbon.js';

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5001;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Database Connection
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-city-energy')
//   .then(() => console.log('MongoDB connected'))
//   .catch(err => console.error('MongoDB connection error:', err));

// // Routes
// app.use('/api/energy', energyRoutes);
// app.use('/api/mobility', mobilityRoutes);
// app.use('/api/carbon', carbonRoutes);

// app.get('/', (req, res) => {
//   res.send('AI Energy Optimization API is running');
// });

// // Start Server
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);

//   // start the Pathway pipeline for carbon simulations in the background
//   // it will monitor ai_model/carbon_inputs.csv and produce ai_model/carbon_output.csv
//   const pipelinePath = path.join(process.cwd(), 'ai_model', 'carbon_pipeline.py');
//   // prioritize environment variable or fallback to generic 'python'
//   const pythonCmd = process.env.PYTHON || 'python';
//   const pipelineProcess = spawn(pythonCmd, [pipelinePath], { stdio: 'ignore', detached: true });
//   pipelineProcess.unref();
//   console.log(`Launched Pathway pipeline (carbon_pipeline.py) using ${pythonCmd}`);
// });





// server/index.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { spawn } from 'child_process';
import energyRoutes from './routes/energy.js';
import mobilityRoutes from './routes/mobility.js';
import carbonRoutes from './routes/carbon.js';
import pathwayRoutes from './routes/pathway.js'; // default export
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import fs from 'fs';

// derive __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// --------------------
// Middleware
// --------------------
app.use(cors());
app.use(express.json());

// --------------------
// Database
// --------------------
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-city-energy')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// --------------------
// Routes
// --------------------
app.use('/api/energy', energyRoutes);
app.use('/api/mobility', mobilityRoutes);
app.use('/api/carbon', carbonRoutes);
app.use('/api/pathway', pathwayRoutes);

// Root
app.get('/', (req, res) => res.send('AI Energy Optimization API is running'));

// --------------------
// Start server + WebSocket
// --------------------

// we need to keep a handle to the server object so we can attach ws
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// create a WebSocket server on the same http listener
const wss = new WebSocketServer({ server });

// in-memory snapshots
let latestRiskData = {};
let latestEnergyData = null;

// maximum history points to keep per city
const HISTORY_LENGTH = 20;

// broadcast risk snapshot to every connected client
function broadcastRisk(payload) {
  const message = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // 1 = WebSocket.OPEN
      client.send(message);
    }
  });
}
// expose so route handlers can also broadcast
app.locals.broadcastRisk = broadcastRisk;

wss.on('connection', (ws) => {
  // send latest risk snapshot immediately on connection
  if (Object.keys(latestRiskData).length) {
    ws.send(JSON.stringify(Object.values(latestRiskData)));
  }
  // send latest energy snapshot immediately on connection
  if (latestEnergyData) {
    ws.send(JSON.stringify({ type: 'energy', data: latestEnergyData }));
  }
});


// ensure the CSV file exists and has at least one row per city so the
// pipeline emits something immediately.  if the file contains only a header we
// append a default measurement for each city.  this avoids the "showing nothing"
// complaint when the user first loads the page.
const riskCsv = path.join(__dirname, 'pathway_service', 'risk_inputs.csv');
function ensureSeededCsv() {
  if (!fs.existsSync(riskCsv)) {
    fs.writeFileSync(riskCsv, 'city,aqi,heat_index\n');
  }
  const content = fs.readFileSync(riskCsv, 'utf8');
  const lines = content.trim().split('\n');
  if (lines.length <= 1) {
    const defaults = [
      ['Delhi', 198, 38], ['Mumbai', 122, 34], ['Bangalore', 67, 27], ['Chennai', 145, 36],
      ['Kolkata', 210, 37], ['Hyderabad', 89, 33], ['Pune', 74, 29],
      ['Ahmedabad', 230, 42], ['Jaipur', 175, 40], ['Lucknow', 188, 37],
    ];
    for (const [city, aqi, heat] of defaults) {
      fs.appendFileSync(riskCsv, `${city},${aqi},${heat}\n`, 'utf8');
    }
  }
}
ensureSeededCsv();

// initial in-memory snapshot (before Pathway pipeline emits)
const CITY_DEFAULTS = [
  { city: 'Delhi', aqi: 198, heat_index: 38 },
  { city: 'Mumbai', aqi: 122, heat_index: 34 },
  { city: 'Bangalore', aqi: 67, heat_index: 27 },
  { city: 'Chennai', aqi: 145, heat_index: 36 },
  { city: 'Kolkata', aqi: 210, heat_index: 37 },
  { city: 'Hyderabad', aqi: 89, heat_index: 33 },
  { city: 'Pune', aqi: 74, heat_index: 29 },
  { city: 'Ahmedabad', aqi: 230, heat_index: 42 },
  { city: 'Jaipur', aqi: 175, heat_index: 40 },
  { city: 'Lucknow', aqi: 188, heat_index: 37 },
];
CITY_DEFAULTS.forEach(({ city, aqi, heat_index }) => {
  if (!latestRiskData[city]) {
    const a = aqi > 200 || heat_index > 40 ? 'HIGH' : aqi > 150 || heat_index > 35 ? 'MEDIUM' : 'LOW';
    latestRiskData[city] = {
      city, aqi, heat_index,
      asthma_risk: a,
      hospital_surge: a,
      energy_demand_spike: parseFloat((Math.random() * 20 + 5).toFixed(1)),
      advisory: a === 'HIGH' ? 'Issue health advisory for children and elderly.' : a === 'MEDIUM' ? 'Monitor health conditions.' : 'Normal conditions',
      heatwave_alert: heat_index > 40,
      history: [{ time: new Date().toISOString(), aqi }],
    };
  }
});
app.locals.latestRiskData = Object.values(latestRiskData);


// start the pipelines after the HTTP server is ready
const pythonCmd = process.env.PYTHON || 'python';

// Launch Carbon Pathway pipeline (stderr/stdout not needed)
const carbonPipelinePath = path.join(process.cwd(), 'ai_model', 'carbon_pipeline.py');
const carbonProc = spawn(pythonCmd, [carbonPipelinePath], { stdio: 'ignore', detached: true });
carbonProc.unref();
console.log(`Launched Pathway pipeline (carbon_pipeline.py)`);

// Launch Risk Pathway pipeline and wire its stdout to our broadcast logic
// __dirname refers to the server directory so we don't accidentally double-up 'server'
const riskPipelinePath = path.join(__dirname, 'pathway_service', 'pathway_streams.py');
const riskProc = spawn(pythonCmd, [riskPipelinePath], { stdio: ['ignore', 'pipe', 'pipe'], detached: true });
riskProc.unref();

let riskBuffer = '';
riskProc.stdout.on('data', (chunk) => {
  riskBuffer += chunk.toString();
  const lines = riskBuffer.split('\n');
  riskBuffer = lines.pop();
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const record = JSON.parse(line);
      const now = new Date().toISOString();
      const existing = latestRiskData[record.city];
      const history = existing ? existing.history.slice(-HISTORY_LENGTH + 1) : [];
      record.history = [...history, { time: now, aqi: record.aqi }];
      latestRiskData[record.city] = record;
      const snapshot = Object.values(latestRiskData);
      app.locals.latestRiskData = snapshot;
      broadcastRisk(snapshot);
    } catch (err) {
      console.error('Error parsing risk pipeline output:', err, line);
    }
  }
});

riskProc.stderr.on('data', (data) => {
  console.error('Risk pipeline stderr:', data.toString());
});

riskProc.on('close', (code) => {
  console.log(`Risk pipeline exited with code ${code}`);
});

console.log(`Launched Pathway Risk pipeline (pathway_streams.py)`);

// previously we had an interval that injected random "synthetic" rows into the CSV every few
// seconds.  it was handy to keep the dashboard moving while the user wasn't interacting, but the
// constant writes meant a manual change could be immediately overridden and made it look like
// updates were ignored.  for clarity in the hackathon we disable that behaviour; you can re-enable
// a similar loop below if you want automatic motion again.
/*
const riskCsv = path.join(__dirname, 'pathway_service', 'risk_inputs.csv');
function appendRow(city, aqi, heat) {
  const line = `${city},${aqi.toFixed(0)},${heat.toFixed(1)}\n`;
  fs.appendFile(riskCsv, line, () => {});
}
setInterval(() => {
  for (const city of ['Delhi', 'Mumbai', 'Bangalore', 'Chennai']) {
    const prev = latestRiskData[city] || {};
    const aqi = Math.max(0, Math.min(500, (prev.aqi || 100) + (Math.random() * 40 - 20)));
    const heat = Math.max(10, Math.min(60, (prev.heat_index || 30) + (Math.random() * 6 - 3)));
    appendRow(city, aqi, heat);
  }
}, 5000);
*/