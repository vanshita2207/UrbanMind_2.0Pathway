Smart City Sustainability Brain 🌱

Smart City Sustainability Brain is an AI-powered full-stack web platform that helps cities, campuses, and organizations make smarter environmental decisions by combining Mobility Optimization, Energy Analysis, and Carbon Footprint Tracking into a single intelligent dashboard.

The system integrates a React frontend, Node/Express backend, and a Python AI model to transform scattered urban data into actionable sustainability insights.

🚀 Project Overview

Modern cities generate massive mobility and energy data, but it often exists in silos.
Smart City Sustainability Brain acts as a unified intelligence layer that:

Visualizes environmental metrics

Predicts energy and carbon impact

Suggests data-driven sustainability actions

🎯 Core Objectives

Optimize eco-friendly travel routes

Predict peak energy waste periods

Calculate daily and weekly carbon footprints

Provide actionable AI sustainability recommendations

✨ Key Features
AI Mobility Optimizer

Fastest / Cheapest / Greenest route comparison

Public transport, EV, and shared mobility analysis

Estimated CO₂ savings

Energy Waste Predictor

Detects peak energy usage hours

Building and infrastructure insights

Renewable energy suggestion windows

Carbon Score Engine

Daily / Weekly emission tracking

Scenario simulation (EV vs Petrol, WFH vs Office)

Sustainability score meter

Actionable AI Insights

Policy-grade recommendations

“What-If” environmental impact predictions

Smart sustainability tips

🧠 Unique Selling Points

Integrated Intelligence – Mobility + Energy + Carbon in one platform

Actionable AI – Not just dashboards, but decision support

Scalable Design – Suitable for cities, campuses, and businesses

Low-Cost Implementation – Uses open datasets and lightweight ML

🏗 Architecture
AI-for-sustainability
 ├── client  → React + Vite Frontend
 └── server  → Node.js + Express Backend
      └── ai_model → Python ML Prediction Scripts

🛠 Tech Stack
Frontend (Client)

React + Vite

Tailwind CSS / CSS Modules

Recharts (Data Visualization)

Framer Motion (Animations)

Axios (API Calls)

Backend (Server)

Node.js

Express.js

MongoDB / Mongoose

dotenv

AI / ML

Python

scikit-learn / pandas / numpy

Regression Models

Tools & APIs

OpenStreetMap

Public Emission Factor Datasets

📂 Project Structure
client/
 ├─ public/
 ├─ src/
 │   ├─ assets/
 │   ├─ components/
 │   ├─ lib/
 │   ├─ pages/
 │   ├─ services/
 │   ├─ App.jsx
 │   ├─ main.jsx
 │   └─ index.css
 ├─ package.json
 └─ vite.config.js

server/
 ├─ ai_model/
 │   └─ predict.py
 ├─ models/
 ├─ routes/
 ├─ index.js
 ├─ .env
 └─ package.json

⚙️ Installation & Setup
1. Clone Repository
git clone <repo-url>
cd AI-for-sustainability

2. Setup Client
cd client
npm install
npm run dev


Frontend runs on:
http://localhost:5173

3. Setup Server
cd server
npm install
node index.js


Backend runs on:
http://localhost:5000

> **Note:** the risk pipeline watches `server/pathway_service/risk_inputs.csv`; the
> server will automatically seed this file with a default reading for each city if it
> is empty, so the dashboard has something to display on first load.  If you ever see
> "Waiting for live AQI" even after the page has loaded, make sure the CSV contains
> data (not just a header) and that the Python process is running – editing the file
> manually or using the in‑page form will immediately push new values.

4. Python AI Model (Optional Standalone)
cd server/ai_model
python predict.py

📊 Expected Outcomes

Increased environmental awareness

Optimized commuting decisions

---

## Pathway Integration ✅

The project now uses the **Pathway** streaming library in the Python backend to power
live AQI/health‑risk data.  A small pipeline (`server/pathway_service/pathway_streams.py`)
**watches a CSV file** for new measurements and automatically recomputes derived risk
scores whenever the file is updated.  This fulfils the hackathon requirement that the
app reacts *without manual intervention* once data enters the system.

Two pipelines are running side‑by‑side:

* **Carbon pipeline** – watches `server/ai_model/carbon_inputs.csv` and writes
  results to `carbon_output.csv`.  (Used elsewhere in the app.)
* **AQI & health‑risk pipeline** – watches `server/pathway_service/risk_inputs.csv` and
  prints a JSON record per row to stdout; the Node server reads these lines, maintains a
  rolling history, and broadcasts the current snapshot to clients over a WebSocket
  at `ws://localhost:5001`.

> **Important:** the PyPI `pathway` package is sometimes just a stub that prints
> "This is not the real Pathway package".  To qualify for the Pathway track you must
> install the real library using the instructions at https://pathway.com/developers/.
> A lightweight fallback shim is included in the pipeline script so the app will still
> run without it, but the stream will not then update in response to CSV changes.

### Interactive data entry

The dashboard page contains a city selector and a small form pre‑filled with the
latest AQI/heat-index reading.  Typing into either field automatically sends a POST
request to `/api/pathway/risk/update`, which appends the new values to
`risk_inputs.csv`.  Because the Pathway pipeline is watching that file, **any row
– whether added by the UI or by editing the file directly – triggers an immediate
recomputation and broadcast**.  No refresh or submit button is required.

To see it in action:

1. run `node server/index.js` (after installing Python deps via
   `pip install -r server/requirements.txt`).
2. open the React app at `http://localhost:5173/app/pathway-risk`.
3. alter the AQI/heat values using the form or by editing
   `server/pathway_service/risk_inputs.csv`.  The numbers update instantly on the
   page.

This setup ensures the dataflow is driven by Pathway and updates automatically when
new inputs arrive, so it fully satisfies the Pathway track criteria.


Reduced energy waste

Data-driven sustainability planning

---

## Pathway Integration ✅

The project now uses the **Pathway** streaming library in the Python backend. A small pipeline (`server/ai_model/carbon_pipeline.py`) watches incoming carbon simulation requests written to a CSV file and automatically recomputes results when new data arrives. The Node server appends each request to `carbon_inputs.csv`; Pathway observes the file and writes updated outputs to `carbon_output.csv`, which the API reads and returns.

This continuous dataflow ensures the system *updates automatically when new data arrives*, satisfying the hackathon requirement for a true Pathway project. See `server/routes/carbon.js` for how requests are handled and `server/ai_model/carbon_pipeline.py` for the pipeline code.

To run the pipeline, install dependencies from `server/requirements.txt` and start the Node server; the pipeline is spawned automatically.


Frontend Development

Backend Development

AI / ML Modeling

Carbon Analysis

Documentation & Research

📚 References

International Energy Agency (IEA) Reports

UN World Cities Report

Smart Mobility & Decarbonization Papers

Public Climate & Sustainability Datasets

🔮 Future Scope

Real-time IoT integration

Government policy dashboards

Mobile application version

Advanced predictive analytics

🌍 Vision

“One Brain. One City. One Sustainable Future.”

License

For academic / hackathon use.
