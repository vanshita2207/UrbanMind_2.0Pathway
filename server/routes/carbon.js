import express from 'express';
import CarbonReport from '../models/CarbonReport.js';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { OpenAI } from 'openai';

const router = express.Router();

// GET /api/carbon/latest - Get latest carbon report
router.get('/latest', async (req, res) => {
    try {
        let report = await CarbonReport.findOne().sort({ generatedAt: -1 });

        // If no data exists, create a default "pre-fed" report
        if (!report) {
            const defaultReport = new CarbonReport({
                totalCarbonFootprint: 4500,
                breakdown: {
                    mobility: 1500,
                    energy: 2000,
                    other: 1000
                },
                sustainabilityScore: 65,
                period: 'monthly'
            });
            report = await defaultReport.save();
        }

        res.json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/carbon/simulate - Calculate Footprint
router.post('/simulate', async (req, res) => {
    // for calculator/estimation we still call the Python script directly
    const data = { ...req.body, type: 'carbon_simulate' };
    const scriptPath = path.join(process.cwd(), 'ai_model', 'predict.py');
    const pythonCmd = process.env.PYTHON || 'python';
    const pythonProcess = spawn(pythonCmd, [scriptPath]);

    let result = '';
    let errorOutput = '';

    pythonProcess.stdin.write(JSON.stringify(data));
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (chunk) => { result += chunk.toString(); });
    pythonProcess.stderr.on('data', (chunk) => { errorOutput += chunk.toString(); });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error('Carbon simulate script failed:', errorOutput);
            return res.status(500).json({ message: 'Simulation failed', error: errorOutput });
        }
        try {
            const parsed = JSON.parse(result);
            res.json(parsed);
        } catch (e) {
            console.error('Failed to parse simulate output:', e, 'raw:', result);
            res.status(500).json({ message: 'Invalid simulation output' });
        }
    });
});

// POST /api/carbon - Save a generated report
router.post('/', async (req, res) => {
    try {
        const newReport = new CarbonReport(req.body);
        const savedReport = await newReport.save();

        // also append to the Pathway CSV so the pipeline updates automatically
        const inputFile = path.join(process.cwd(), 'ai_model', 'carbon_inputs.csv');
        const header = 'transport,energy,diet,id\n';
        if (!fs.existsSync(inputFile)) {
            fs.writeFileSync(inputFile, header, 'utf8');
        }
        const { transport = '', energy = '', diet = '' } = req.body;
        let id = 1;
        try {
            const lines = fs.readFileSync(inputFile, 'utf8').trim().split('\n');
            if (lines.length > 1) id = lines.length;
        } catch {}
        const line = `${transport},${energy},${diet},${id}\n`;
        fs.appendFileSync(inputFile, line, 'utf8');

        res.status(201).json(savedReport);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// POST /api/carbon/suggestions - Get AI Suggestions
router.post('/suggestions', async (req, res) => {
    try {
        const { breakdown, totalCarbonFootprint, sustainabilityScore } = req.body;

        const client = new OpenAI({
            apiKey: process.env.ASI_API_KEY,
            baseURL: "https://inference.asicloud.cudos.org/v1"
        });

        const prompt = `
        Based on this user's carbon footprint data:
        - Total Annual Footprint: ${totalCarbonFootprint} kg CO2
        - Sustainability Score: ${sustainabilityScore}/100
        - Breakdown: Mobility (${breakdown.mobility} kg), Energy (${breakdown.energy} kg), Diet/Other (${breakdown.other} kg)

        Provide 3 specific, actionable suggestions to reduce their carbon footprint.
        Focus on the highest impacting areas.
        Format the response as a JSON array of objects with 'title', 'description', and 'impact' (High/Medium/Low) keys.
        Do not include markdown formatting or code blocks, just raw JSON.
        `;

        const response = await client.chat.completions.create({
            model: "asi1-mini",
            messages: [
                { role: "user", content: prompt }
            ]
        });

        const suggestionsText = response.choices[0].message.content;
        // Attempt to parse JSON from AI response, handling potential string wrapping
        let suggestions = [];
        try {
            // Remove markdown code blocks if present
            const cleanJson = suggestionsText.replace(/```json/g, '').replace(/```/g, '').trim();
            suggestions = JSON.parse(cleanJson);
        } catch (e) {
            console.error("Failed to parse AI suggestions:", e);
            // Fallback if parsing fails
            suggestions = [
                { title: "Review Mobility", description: "Consider switching to public transport or EV.", impact: "High" },
                { title: "Energy Audit", description: "Check your home insulation and appliances.", impact: "Medium" },
                { title: "Dietary Changes", description: "Trying a plant-based diet can reduce emissions.", impact: "Low" }
            ];
        }

        res.json(suggestions);

    } catch (error) {
        console.error("AI Suggestion Error:", error);
        res.status(500).json({ message: "Failed to generate suggestions" });
    }
});

export default router;
