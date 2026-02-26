import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Award, Download, TrendingDown, ArrowRight, RefreshCw, Leaf, Plus, Save, X } from 'lucide-react';
import { simulateCarbon, getLatestCarbonReport, logCarbonData, getCarbonSuggestions } from '../../services/api';

const CarbonPage = () => {
    // Simulator/Calculator State
    const [transportMode, setTransportMode] = useState('car');
    const [dietType, setDietType] = useState('average');
    const [energySource, setEnergySource] = useState('grid');
    const [simulatedResults, setSimulatedResults] = useState({ total_footprint: 0, score: 0, breakdown: [] });

    // Real Data State
    const [realData, setRealData] = useState(null);
    const [loading, setLoading] = useState(true);

    // AI Suggestions State
    const [suggestions, setSuggestions] = useState([]);
    const [aiLoading, setAiLoading] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        mobility: 0,
        energy: 0,
        diet: 0,
        period: 'daily'
    });

    // Fetch Real Data
    const fetchRealData = async () => {
        setLoading(true);
        try {
            const data = await getLatestCarbonReport();
            
            // Check if data is valid and has expected fields (legacy/empty check)
            if (data && data.totalCarbonFootprint !== undefined) {
                setRealData(data);
            } else {
                setRealData(null);
            }
        } catch (err) {
            console.error("Failed to fetch data", err);
            setRealData(null);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRealData();
    }, []);

    // Run Simulation (Calculator)
    useEffect(() => {
        const fetchSimulation = async () => {
            const data = await simulateCarbon({
                transport: transportMode,
                energy: energySource,
                diet: dietType
            });
            if (data) {
                setSimulatedResults(data);
            }
        };
        fetchSimulation();
    }, [transportMode, dietType, energySource]);

    // Fetch AI Suggestions
    const fetchSuggestions = async () => {
        setAiLoading(true);
        // Use real data if available, otherwise simulated
        const sourceData = realData || {
            totalCarbonFootprint: simulatedResults.total_footprint,
            sustainabilityScore: simulatedResults.score,
            breakdown: {
                mobility: simulatedResults.breakdown.find(i => i.name === 'Mobility')?.value || 0,
                energy: simulatedResults.breakdown.find(i => i.name === 'Energy')?.value || 0,
                other: simulatedResults.breakdown.find(i => i.name === 'Diet')?.value || 0
            }
        };

        const result = await getCarbonSuggestions({
            totalCarbonFootprint: sourceData.totalCarbonFootprint,
            sustainabilityScore: sourceData.sustainabilityScore,
            breakdown: sourceData.breakdown
        });

        if (result) {
            setSuggestions(result);
        }
        setAiLoading(false);
    };

    // Initial fetch of suggestions if real data exists
    useEffect(() => {
        if (realData) {
            fetchSuggestions();
        }
    }, [realData]);

    // Handle Log Data Submit
    const handleLogSubmit = async (e) => {
        e.preventDefault();
        console.log("Submitting log data:", formData); // Debug log

        const total = parseFloat(formData.mobility) + parseFloat(formData.energy) + parseFloat(formData.diet);
        const score = Math.max(0, 100 - (total / 50));

        const payload = {
            totalCarbonFootprint: total,
            breakdown: {
                mobility: parseFloat(formData.mobility),
                energy: parseFloat(formData.energy),
                other: parseFloat(formData.diet)
            },
            sustainabilityScore: Math.round(score),
            period: formData.period
        };

        try {
            console.log("Payload:", payload); // Debug log
            const result = await logCarbonData(payload);
            console.log("API Result:", result); // Debug log

            if (result) {
                setIsModalOpen(false);
                // reset form
                setFormData({ mobility: 0, energy: 0, diet: 0, period: 'daily' });
                // Force a small delay to ensure DB update is reflected
                setTimeout(() => fetchRealData(), 500);
            } else {
                alert("Failed to save data. check console.");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("Error saving data");
        }
    };

    // Use usage data (Real -> Simulated fallback)
    // We favor realData if it exists, otherwise we show the storage of "What-If" (Simulated)
    const displayData = realData || simulatedResults;
    const isRealData = !!realData;

   const { total_footprint, score, breakdown } = isRealData
  ? {
      total_footprint: realData.totalCarbonFootprint,
      score: realData.sustainabilityScore,
      breakdown: [
        { name: 'Mobility', value: realData.breakdown.mobility, color: '#3b82f6' },
        { name: 'Energy', value: realData.breakdown.energy, color: '#fbbf24' },
        { name: 'Diet/Other', value: realData.breakdown.other, color: '#10b981' }
      ]
    }
  : simulatedResults;

    const breakdownData = (breakdown && breakdown.length > 0) ? breakdown : [{ name: 'No Data', value: 100, color: '#e2e8f0' }];

    const Recommendation = ({ priority, title, desc, color }) => (
        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200/50 hover:border-slate-300 hover:shadow-md transition-all bg-white/50 backdrop-blur-sm">
            <div className="flex items-start gap-4">
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${color} bg-opacity-20`}>
                    {priority}
                </span>
                <div>
                    <h4 className="font-bold text-slate-800">{title}</h4>
                    <p className="text-sm text-slate-600">{desc}</p>
                </div>
            </div>
            <button className="text-emerald-600 hover:text-emerald-700 p-2 transform hover:translate-x-1 transition-transform">
                <ArrowRight className="w-5 h-5" />
            </button>
        </div>
    );

    return (
        <div
            className="w-screen min-h-screen relative left-[calc(-50vw+50%)] -mt-8 -mb-8 bg-cover bg-center bg-fixed overflow-x-hidden"
            style={{ backgroundImage: "url('/images/carbon.jpeg')" }}
        >
            {/* Floating Leaves Animation - Left Side */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={`leaf-left-${i}`}
                        initial={{ y: "110vh", x: Math.random() * (window.innerWidth * 0.2), opacity: 0 }}
                        animate={{
                            y: "-10vh",
                            x: Math.random() * (window.innerWidth * 0.2),
                            opacity: [0, 0.8, 0],
                            rotate: 360
                        }}
                        transition={{
                            duration: 15 + Math.random() * 20,
                            repeat: Infinity,
                            delay: -1 * Math.random() * 35,
                            ease: "linear"
                        }}
                        className="absolute w-8 h-8 text-emerald-600/40 drop-shadow-sm"
                        style={{
                            left: `${Math.random() * 20}%`,
                            scale: Math.random() * 0.6 + 0.9
                        }}
                    >
                        <Leaf className="w-full h-full" />
                    </motion.div>
                ))}

                {/* Floating Leaves Animation - Right Side */}
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={`leaf-right-${i}`}
                        initial={{ y: "110vh", x: window.innerWidth - (Math.random() * (window.innerWidth * 0.2)), opacity: 0 }}
                        animate={{
                            y: "-10vh",
                            x: window.innerWidth - (Math.random() * (window.innerWidth * 0.2)),
                            opacity: [0, 0.8, 0],
                            rotate: -360
                        }}
                        transition={{
                            duration: 15 + Math.random() * 20,
                            repeat: Infinity,
                            delay: -1 * Math.random() * 35,
                            ease: "linear"
                        }}
                        className="absolute w-8 h-8 text-emerald-600/40 drop-shadow-sm"
                        style={{
                            left: `${80 + Math.random() * 20}%`,
                            scale: Math.random() * 0.6 + 0.9
                        }}
                    >
                        <Leaf className="w-full h-full" />
                    </motion.div>
                ))}
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-900/10 pb-4">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 drop-shadow-sm">Carbon Footprint</h2>
                        <p className="text-slate-700 font-medium">Analyze your impact and plan for a greener future.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all font-bold shadow-lg shadow-emerald-900/20"
                        >
                            <Plus className="w-4 h-4" /> Log Data
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white/60 hover:bg-white/80 text-slate-700 rounded-lg transition-all font-bold backdrop-blur-sm border border-white/40 shadow-sm">
                            <Download className="w-4 h-4" /> Report
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Score & Breakdown (Left Col) */}
                    <div className="space-y-6">
                        {/* Score Card */}
                        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-xl text-center relative overflow-hidden border border-emerald-500/30">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                            <div className="relative z-10">
                                <p className="text-emerald-100 font-medium uppercase tracking-wider text-sm mb-2">
                                    {realData ? "Current Score" : "Simulated Score"}
                                </p>
                                <div className="flex items-center justify-center mb-2">
                                    <span className="text-6xl font-bold drop-shadow-md">{score}</span>
                                    <span className="text-2xl text-emerald-200 font-light">/100</span>
                                </div>
                                <div className="w-full bg-black/20 h-3 rounded-full overflow-hidden mb-4 border border-white/10">
                                    <div
                                        className="h-full bg-white transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                        style={{ width: `${score}%` }}
                                    />
                                </div>
                                <p className="text-sm text-emerald-50 font-medium">
                                    {score > 80 ? "Excellent! You are a green leader." : score > 60 ? "Good job, but room for improvement." : "Time to take action!"}
                                </p>
                            </div>
                        </div>

                        {/* Breakdown Chart */}
                        <div className="bg-white/70 backdrop-blur-md p-6 rounded-xl border border-white/40 shadow-xl">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Emission Breakdown</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={breakdownData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {breakdownData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color || '#ccc'} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(226, 232, 240, 0.8)',
                                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                                color: '#1e293b'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                {breakdownData.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color || '#ccc' }} />
                                        <span>{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Simulation & Recommendations (Right Col - 2 spans) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Calculator (Previously Simulator) */}
                        <div className="bg-white/70 backdrop-blur-md p-8 rounded-xl border border-white/40 shadow-xl">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shadow-sm">
                                        <RefreshCw className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800">Carbon Footprint Calculator</h3>
                                        <p className="text-slate-600 text-sm">Estimate impact and save to your profile.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={async () => {
                                        // Save simulated results as real data
                                        const payload = {
                                            totalCarbonFootprint: simulatedResults.total_footprint,
                                            breakdown: {
                                                mobility: simulatedResults.breakdown.find(i => i.name === 'Mobility')?.value || 0,
                                                energy: simulatedResults.breakdown.find(i => i.name === 'Energy')?.value || 0,
                                                other: simulatedResults.breakdown.find(i => i.name === 'Diet')?.value || 0
                                            },
                                            sustainabilityScore: simulatedResults.score,
                                            period: 'daily'
                                        };
                                        try {
                                            const result = await logCarbonData(payload);
                                            if (result) {
                                                alert("Estimate saved to your profile!");
                                                setTimeout(() => fetchRealData(), 500);
                                            } else {
                                                alert("Failed to save estimate.");
                                            }
                                        } catch (e) {
                                            console.error("Save error:", e);
                                            alert("Error saving estimate.");
                                        }
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-md transition-all"
                                >
                                    <Save className="w-4 h-4" /> Save Estimate
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Transport Mode</label>
                                    <div className="relative">
                                        <select
                                            value={transportMode}
                                            onChange={(e) => setTransportMode(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white/80 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm appearance-none cursor-pointer hover:bg-white"
                                        >
                                            <option value="car">Petrol Car</option>
                                            <option value="ev">Electric Vehicle</option>
                                            <option value="metro">Public Metro</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ArrowRight className="w-4 h-4 rotate-90" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Home Energy</label>
                                    <div className="relative">
                                        <select
                                            value={energySource}
                                            onChange={(e) => setEnergySource(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white/80 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm appearance-none cursor-pointer hover:bg-white"
                                        >
                                            <option value="grid">Standard Grid</option>
                                            <option value="hybrid">Hybrid</option>
                                            <option value="solar">Solar Panels</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ArrowRight className="w-4 h-4 rotate-90" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Diet Impact</label>
                                    <div className="relative">
                                        <select
                                            value={dietType}
                                            onChange={(e) => setDietType(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white/80 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm appearance-none cursor-pointer hover:bg-white"
                                        >
                                            <option value="average">Average Diet</option>
                                            <option value="vegetarian">Vegetarian</option>
                                            <option value="vegan">Vegan</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ArrowRight className="w-4 h-4 rotate-90" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/50 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-200/50 shadow-inner backdrop-blur-sm">
                                <div className="text-center md:text-left">
                                    <p className="text-slate-600 font-medium">Estimated Annual Footprint</p>
                                    <p className="text-4xl font-bold text-slate-800 mt-1">{simulatedResults.total_footprint} <span className="text-lg font-normal text-slate-600">kg CO₂</span></p>
                                </div>
                                <div className="flex items-center gap-4">
                                    {simulatedResults.total_footprint < 8000 && (
                                        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-100/80 px-4 py-2 rounded-full font-bold shadow-sm border border-emerald-200">
                                            <TrendingDown className="w-5 h-5" />
                                            <span>{Math.round(((8000 - simulatedResults.total_footprint) / 8000) * 100)}% Better than Avg</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div className="bg-white/70 backdrop-blur-md p-6 rounded-xl border border-white/40 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Award className="w-5 h-5 text-amber-500" /> Improvement Plan
                                </h3>
                                <button
                                    onClick={fetchSuggestions}
                                    disabled={aiLoading}
                                    className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 disabled:opacity-50"
                                >
                                    {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                    {aiLoading ? "Analyzing..." : "Refresh Insights"}
                                </button>
                            </div>

                            <div className="space-y-4">
                                {suggestions.length > 0 ? (
                                    suggestions.map((suggestion, index) => (
                                        <Recommendation
                                            key={index}
                                            priority={suggestion.impact}
                                            title={suggestion.title}
                                            desc={suggestion.description}
                                            color={
                                                suggestion.impact === 'High' ? 'text-red-600 bg-red-100' :
                                                    suggestion.impact === 'Medium' ? 'text-orange-600 bg-orange-100' :
                                                        'text-emerald-600 bg-emerald-100'
                                            }
                                        />
                                    ))
                                ) : (
                                    <div className="text-center p-8 text-slate-500">
                                        <p>Click refresh to get AI-powered suggestions!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Log Data Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-200"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Log Carbon Data</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleLogSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mobility Impact (kg CO₂)</label>
                                <input
                                    type="number"
                                    value={formData.mobility}
                                    onChange={(e) => setFormData({ ...formData, mobility: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Energy Impact (kg CO₂)</label>
                                <input
                                    type="number"
                                    value={formData.energy}
                                    onChange={(e) => setFormData({ ...formData, energy: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Diet/Other Impact (kg CO₂)</label>
                                <input
                                    type="number"
                                    value={formData.diet}
                                    onChange={(e) => setFormData({ ...formData, diet: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md transition-all mt-4"
                            >
                                Save Data
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default CarbonPage;
