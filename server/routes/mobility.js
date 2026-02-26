// import express from 'express';
// import MobilityLog from '../models/MobilityLog.js';
// import { spawn } from 'child_process';
// import path from 'path';
// import { OpenAI } from 'openai';

// const router = express.Router();

// // GET /api/mobility - Get all mobility logs
// router.get('/', async (req, res) => {
//     try {
//         const logs = await MobilityLog.find().sort({ timestamp: -1 });
//         res.json(logs);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// });

// // POST /api/mobility/calculate - Calculate Trip CO2
// router.post('/calculate', async (req, res) => {
//     console.log("Received calculation request:", req.body);
//     const data = { ...req.body, type: 'mobility' };
//     const scriptPath = path.join(process.cwd(), 'ai_model', 'predict.py'); // Check if this path is correct relative to where node is running
//     console.log("Script path:", scriptPath);

//     const pythonProcess = spawn('python3', [scriptPath]);

//     let result = '';
//     let errorOutput = '';

//     pythonProcess.stdin.write(JSON.stringify(data));
//     pythonProcess.stdin.end();

//     pythonProcess.stdout.on('data', (data) => {
//         console.log("Python stdout:", data.toString());
//         result += data.toString();
//     });

//     pythonProcess.stderr.on('data', (data) => {
//         console.error("Python stderr:", data.toString());
//         errorOutput += data.toString();
//     });

//     pythonProcess.on('close', (code) => {
//         console.log("Python process exited with code:", code);
//         if (code !== 0) {
//             console.error("Calculation failed. Stderr:", errorOutput);
//             return res.status(500).json({ message: 'Calculation failed', error: errorOutput });
//         }
//         try {
//             const parsed = JSON.parse(result);
//             console.log("Parsed result:", parsed);
//             res.json(parsed);
//         } catch (e) {
//             console.error("JSON parse error:", e, "Raw result:", result);
//             res.status(500).json({ message: 'Invalid AI output', raw: result });
//         }
//     });
// });

// // POST /api/mobility - Log a new trip
// router.post('/', async (req, res) => {
//     try {
//         const newLog = new MobilityLog(req.body);
//         const savedLog = await newLog.save();
//         res.status(201).json(savedLog);
//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// });

// // POST /api/mobility/suggestions - Get AI Travel Insights
// router.post('/suggestions', async (req, res) => {
//     try {
//         const { start, end, comparisons, bestOption } = req.body;

//         const client = new OpenAI({
//             apiKey: process.env.ASI_API_KEY,
//             baseURL: "https://inference.asicloud.cudos.org/v1"
//         });

//         const prompt = `
//         The user is planning a trip from "${start}" to "${end}".
        
//         Available options:
//         ${comparisons.map(c => `- ${c.label}: ${c.time}, ${c.cost}, ${c.co2}`).join('\n')}

//         Best green option identified: ${bestOption ? bestOption.label : 'N/A'}.

//         Provide 3 short, specific, and actionable travel insights or fun facts related to sustainable travel for this specific route. 
//         Focus on why the greenest option is better or provide a tip for the journey.
        
//         Format the response as a JSON array of objects with 'title', 'description', and 'type' (Tip/Fact/Insight) keys.
//         Do not include markdown formatting or code blocks, just raw JSON.
//         `;

//         const response = await client.chat.completions.create({
//             model: "asi1-mini",
//             messages: [
//                 { role: "user", content: prompt }
//             ]
//         });

//         const suggestionsText = response.choices[0].message.content;
//         let suggestions = [];
//         try {
//             const cleanJson = suggestionsText.replace(/```json/g, '').replace(/```/g, '').trim();
//             suggestions = JSON.parse(cleanJson);
//         } catch (e) {
//             console.error("Failed to parse AI mobility suggestions:", e);
//             suggestions = [
//                 { title: "Eco - Tip", description: "Carpooling can reduce your individual carbon footprint significantly.", type: "Tip" },
//                 { title: "Did you know?", description: "Metros are one of the most energy-efficient ways to travel in cities.", type: "Fact" },
//                 { title: "Health Benefit", description: "Walking to the bus stop adds to your daily steps!", type: "Insight" }
//             ];
//         }

//         res.json(suggestions);

//     } catch (error) {
//         console.error("AI Mobility Suggestion Error:", error);
//         res.status(500).json({ message: "Failed to generate insights" });
//     }
// });

// export default router;

import express from 'express';
import MobilityLog from '../models/MobilityLog.js';
import { spawn } from 'child_process';
import path from 'path';
import { OpenAI } from 'openai';

const router = express.Router();

// Use environment variable for Python path (safe for GitHub)
const pythonPath = process.env.PYTHON_PATH || 'python';

// GET /api/mobility - Get all mobility logs
router.get('/', async (req, res) => {
    try {
        const logs = await MobilityLog.find().sort({ timestamp: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/mobility/calculate - Calculate Trip CO2
router.post('/calculate', async (req, res) => {
    console.log("Received calculation request:", req.body);

    const data = { ...req.body, type: 'mobility' };
    const scriptPath = path.join(process.cwd(), 'ai_model', 'predict.py');
    console.log("Script path:", scriptPath);

    const pythonCmd = process.env.PYTHON || pythonPath;
    const pythonProcess = spawn(pythonCmd, [scriptPath]);

    let result = '';
    let errorOutput = '';

    pythonProcess.stdin.write(JSON.stringify(data));
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (data) => {
        console.log("Python stdout:", data.toString());
        result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error("Python stderr:", data.toString());
        errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
        console.log("Python process exited with code:", code);

        if (code !== 0) {
            console.error("Calculation failed. Stderr:", errorOutput);
            return res.status(500).json({ message: 'Calculation failed', error: errorOutput });
        }

        try {
            const parsed = JSON.parse(result);
            console.log("Parsed result:", parsed);
            res.json(parsed);
        } catch (e) {
            console.error("JSON parse error:", e, "Raw result:", result);
            res.status(500).json({ message: 'Invalid AI output', raw: result });
        }
    });
});

// POST /api/mobility - Log a new trip
router.post('/', async (req, res) => {
    try {
        const newLog = new MobilityLog(req.body);
        const savedLog = await newLog.save();
        res.status(201).json(savedLog);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// POST /api/mobility/suggestions - Get AI Travel Insights
router.post('/suggestions', async (req, res) => {
    try {
        const { start, end, comparisons, bestOption } = req.body;

        const client = new OpenAI({
            apiKey: process.env.ASI_API_KEY,
            baseURL: "https://inference.asicloud.cudos.org/v1"
        });

        const prompt = `
        The user is planning a trip from "${start}" to "${end}".
        
        Available options:
        ${comparisons.map(c => `- ${c.label}: ${c.time}, ${c.cost}, ${c.co2}`).join('\n')}

        Best green option identified: ${bestOption ? bestOption.label : 'N/A'}.

        Provide 3 short, specific, and actionable travel insights or fun facts related to sustainable travel for this specific route. 
        Focus on why the greenest option is better or provide a tip for the journey.
        
        Format the response as a JSON array of objects with 'title', 'description', and 'type' (Tip/Fact/Insight) keys.
        Do not include markdown formatting or code blocks, just raw JSON.
        `;

        const response = await client.chat.completions.create({
            model: "asi1-mini",
            messages: [
                { role: "user", content: prompt }
            ]
        });

        const suggestionsText = response.choices[0].message.content;

        let suggestions = [];

        try {
            const cleanJson = suggestionsText
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();

            suggestions = JSON.parse(cleanJson);
        } catch (e) {
            console.error("Failed to parse AI mobility suggestions:", e);

            // Safe fallback suggestions
            suggestions = [
                {
                    title: "Eco Tip",
                    description: "Carpooling can reduce your individual carbon footprint significantly.",
                    type: "Tip"
                },
                {
                    title: "Did you know?",
                    description: "Metros are one of the most energy-efficient ways to travel in cities.",
                    type: "Fact"
                },
                {
                    title: "Health Benefit",
                    description: "Walking to the bus stop adds to your daily steps!",
                    type: "Insight"
                }
            ];
        }

        res.json(suggestions);

    } catch (error) {
        console.error("AI Mobility Suggestion Error:", error);
        res.status(500).json({ message: "Failed to generate insights" });
    }
});

export default router;