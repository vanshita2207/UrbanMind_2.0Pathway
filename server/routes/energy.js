// import express from 'express';
// import EnergyUsage from '../models/EnergyUsage.js';
// // import { getPredictions } from '../services/aiService.js'; // To be implemented


// const router = express.Router();

// // Get all energy data
// router.get('/data', async (req, res) => {
//     try {
//         const data = await EnergyUsage.find().sort({ timestamp: -1 }).limit(100);
//         res.json(data);
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// });

// // Ingest new energy data
// router.post('/data', async (req, res) => {
//     const energyData = new EnergyUsage({
//         sector: req.body.sector,
//         loadType: req.body.loadType,
//         consumption: req.body.consumption,
//         source: req.body.source,
//         region: req.body.region
//     });

//     try {
//         const newData = await energyData.save();
//         res.status(201).json(newData);
//     } catch (err) {
//         res.status(400).json({ message: err.message });
//     }
// });

// import { spawn } from 'child_process';
// import path from 'path';

// // POST /api/energy/simulate - Simulate building energy
// router.post('/simulate', async (req, res) => {
//     const data = { ...req.body, type: 'energy_simulate' };
//     const scriptPath = path.join(process.cwd(), 'ai_model', 'predict.py');
//        const pythonCmd = process.env.PYTHON || 'python';
//        const pythonProcess = spawn(pythonCmd, [scriptPath]);

//     let result = '';

//     pythonProcess.stdin.write(JSON.stringify(data));
//     pythonProcess.stdin.end();

//     pythonProcess.stdout.on('data', (data) => { result += data.toString(); });

//     pythonProcess.on('close', (code) => {
//         if (code !== 0) return res.status(500).json({ message: 'Simulation failed' });
//         try {
//             res.json(JSON.parse(result));
//         } catch (e) {
//             res.status(500).json({ message: 'Invalid AI output' });
//         }
//     });
// });

// // AI Analysis Endpoint
// router.post('/analyze', async (req, res) => {
//     const data = { ...req.body, type: 'energy_optimize' }; // Force type

//     // Path to the Python script
//     const scriptPath = path.join(process.cwd(), 'ai_model', 'predict.py');

//     const pythonProcess = spawn('python3', [scriptPath]);

//     let result = '';
//     let error = '';

//     // Send data to Python script via stdin
//     pythonProcess.stdin.write(JSON.stringify(data));
//     pythonProcess.stdin.end();

//     pythonProcess.stdout.on('data', (data) => {
//         result += data.toString();
//     });

//     pythonProcess.stderr.on('data', (data) => {
//         error += data.toString();
//     });

//     pythonProcess.on('close', (code) => {
//         if (code !== 0) {
//             console.error(`Python script exited with code ${code}: ${error}`);
//             return res.status(500).json({ message: 'AI Analysis failed', error });
//         }
//         try {
//             const parsed = JSON.parse(result);
//             res.json(parsed); // parsed now contains { "suggestions": [...] } directly from python
//         } catch (e) {
//             console.error('Failed to parse Python output:', e);
//             res.status(500).json({ message: 'Invalid output from AI model' });
//         }
//     });
// });

// // POST /api/energy/predict - Predict Energy Consumption using XGBoost
// router.post('/predict', async (req, res) => {
//     const data = { ...req.body, type: 'energy_predict' };
//     const scriptPath = path.join(process.cwd(), 'ai_model', 'predict.py');

//     const pythonProcess = spawn('python3', [scriptPath]);

//     let result = '';
//     let errorOutput = '';

//     pythonProcess.stdin.write(JSON.stringify(data));
//     pythonProcess.stdin.end();

//     pythonProcess.stdout.on('data', (data) => {
//         result += data.toString();
//     });

//     pythonProcess.stderr.on('data', (data) => {
//         console.error("Python stderr:", data.toString());
//         errorOutput += data.toString();
//     });

//     pythonProcess.on('close', (code) => {
//         if (code !== 0) {
//             console.error("Prediction failed. Stderr:", errorOutput);
//             return res.status(500).json({ message: 'Prediction failed', error: errorOutput });
//         }
//         try {
//             const parsed = JSON.parse(result);
//             res.json(parsed);
//         } catch (e) {
//             console.error("JSON parse error:", e);
//             res.status(500).json({ message: 'Invalid AI output', raw: result });
//         }
//     });
// });

// export default router;






import express from 'express';
import EnergyUsage from '../models/EnergyUsage.js';
import { spawn } from 'child_process';
import path from 'path';

const router = express.Router();

// Use environment variable for Python path (safe for GitHub)
const pythonPath = process.env.PYTHON_PATH || 'python';

// Get all energy data
router.get('/data', async (req, res) => {
    try {
        const data = await EnergyUsage.find().sort({ timestamp: -1 }).limit(100);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Ingest new energy data
router.post('/data', async (req, res) => {
    const energyData = new EnergyUsage({
        sector: req.body.sector,
        loadType: req.body.loadType,
        consumption: req.body.consumption,
        source: req.body.source,
        region: req.body.region
    });

    try {
        const newData = await energyData.save();
        res.status(201).json(newData);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// POST /api/energy/simulate - Simulate building energy
router.post('/simulate', async (req, res) => {
    const data = { ...req.body, type: 'energy_simulate' };
    const scriptPath = path.join(process.cwd(), 'ai_model', 'predict.py');

    const pythonProcess = spawn(pythonPath, [scriptPath]);

    let result = '';

    pythonProcess.stdin.write(JSON.stringify(data));
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
    });

    pythonProcess.stderr.on('data', (err) => {
        console.error('Python stderr:', err.toString());
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            return res.status(500).json({ message: 'Simulation failed' });
        }
        try {
            res.json(JSON.parse(result));
        } catch (e) {
            res.status(500).json({ message: 'Invalid AI output' });
        }
    });
});

// AI Analysis Endpoint
router.post('/analyze', async (req, res) => {
    const data = { ...req.body, type: 'energy_optimize' };
    const scriptPath = path.join(process.cwd(), 'ai_model', 'predict.py');

    const pythonProcess = spawn(pythonPath, [scriptPath]);

    let result = '';
    let error = '';

    pythonProcess.stdin.write(JSON.stringify(data));
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`Python script exited with code ${code}: ${error}`);
            return res.status(500).json({ message: 'AI Analysis failed', error });
        }
        try {
            const parsed = JSON.parse(result);
            res.json(parsed);
        } catch (e) {
            console.error('Failed to parse Python output:', e);
            res.status(500).json({ message: 'Invalid output from AI model' });
        }
    });
});

// POST /api/energy/predict - Predict Energy Consumption
router.post('/predict', async (req, res) => {
    const data = { ...req.body, type: 'energy_predict' };
    const scriptPath = path.join(process.cwd(), 'ai_model', 'predict.py');

    const pythonProcess = spawn(pythonPath, [scriptPath]);

    let result = '';
    let errorOutput = '';

    pythonProcess.stdin.write(JSON.stringify(data));
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error("Python stderr:", data.toString());
        errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error("Prediction failed. Stderr:", errorOutput);
            return res.status(500).json({ message: 'Prediction failed', error: errorOutput });
        }
        try {
            const parsed = JSON.parse(result);
            res.json(parsed);
        } catch (e) {
            console.error("JSON parse error:", e);
            res.status(500).json({ message: 'Invalid AI output', raw: result });
        }
    });
});

export default router;

