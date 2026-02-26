import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { spawn } from 'child_process';
import energyRoutes from './routes/energy.js';
import mobilityRoutes from './routes/mobility.js';
import carbonRoutes from './routes/carbon.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-city-energy')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/energy', energyRoutes);
app.use('/api/mobility', mobilityRoutes);
app.use('/api/carbon', carbonRoutes);

app.get('/', (req, res) => {
  res.send('AI Energy Optimization API is running');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  // start the Pathway pipeline for carbon simulations in the background
  // it will monitor ai_model/carbon_inputs.csv and produce ai_model/carbon_output.csv
  const pipelinePath = path.join(process.cwd(), 'ai_model', 'carbon_pipeline.py');
  // prioritize environment variable or fallback to generic 'python'
  const pythonCmd = process.env.PYTHON || 'python';
  const pipelineProcess = spawn(pythonCmd, [pipelinePath], { stdio: 'ignore', detached: true });
  pipelineProcess.unref();
  console.log(`Launched Pathway pipeline (carbon_pipeline.py) using ${pythonCmd}`);
});
