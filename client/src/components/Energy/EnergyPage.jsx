import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, Sun, Wind, AlertTriangle, Building, Clock, Lightbulb, ArrowDown, Leaf } from 'lucide-react';
import { simulateEnergy, predictEnergyConsumption } from '../../services/api';

const EnergyPage = () => {
    const [buildingType, setBuildingType] = useState('office');
    const [operatingHours, setOperatingHours] = useState(10); // Hours per day
    const [lightingLevel, setLightingLevel] = useState(80); // %
    const [data, setData] = useState([]);
    const [metrics, setMetrics] = useState({ total_daily_kwh: 0, solar_potential: 0, peak_warning: false });

    // AI Prediction State
    const [predictInput, setPredictInput] = useState({
        timestamp: new Date().toISOString().slice(0, 16),
        Temperature: 25,
        Humidity: 50,
        SquareFootage: 1500,
        Occupancy: 5,
        RenewableEnergy: 0,
        HVACUsage: 'Off',
        LightingUsage: 'Off',
        Holiday: 'No'
    });
    const [prediction, setPrediction] = useState(null);
    const [predictLoading, setPredictLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const result = await simulateEnergy({
                building_type: buildingType,
                hours: operatingHours,
                lighting: lightingLevel
            });

            if (result) {
                setData(result.hourly_usage);
                setMetrics({
                    total_daily_kwh: result.total_daily_kwh,
                    solar_potential: result.solar_potential,
                    peak_warning: result.peak_warning
                });
            }
        };

        const timeoutId = setTimeout(fetchData, 300); // Debounce
        return () => clearTimeout(timeoutId);
    }, [buildingType, operatingHours, lightingLevel]);

    const handlePredict = async () => {
        setPredictLoading(true);
        const result = await predictEnergyConsumption(predictInput);
        if (result && result.predicted_consumption) {
            setPrediction(result.predicted_consumption);
        }
        setPredictLoading(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPredictInput(prev => ({ ...prev, [name]: value }));
    };

    const savings = metrics.total_daily_kwh ? Math.round((metrics.solar_potential / metrics.total_daily_kwh) * 100) : 0;

    return (
        <div
            className="w-screen min-h-screen relative left-[calc(-50vw+50%)] -mt-8 -mb-8 bg-cover bg-center bg-fixed overflow-x-hidden"
            style={{ backgroundImage: "url('/images/energy.jpg')" }}
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
                <h2 className="text-3xl font-bold text-slate-900 drop-shadow-sm border-b border-slate-900/10 pb-4">Energy Management</h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Visuals Column (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Usage Graph */}
                        <div className="bg-white/70 backdrop-blur-md p-6 rounded-xl border border-white/40 shadow-xl relative overflow-hidden">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-800">Hourly Consumption Profile</h3>
                                <div className="flex items-center gap-2 text-sm bg-white/50 px-3 py-1 rounded-full border border-white/60 shadow-sm">
                                    <span className="flex items-center gap-1 text-slate-600"><div className="w-3 h-3 bg-emerald-500 rounded-full shadow-sm"></div> Grid Usage</span>
                                    <span className="flex items-center gap-1 text-slate-600"><div className="w-3 h-3 bg-amber-400 rounded-full shadow-sm"></div> Solar Potential</span>
                                </div>
                            </div>

                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data}>
                                        <defs>
                                            <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(226, 232, 240, 0.8)',
                                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                                color: '#1e293b'
                                            }}
                                            itemStyle={{ color: '#334155' }}
                                        />
                                        <Area type="monotone" dataKey="usage" stroke="#10b981" fillOpacity={1} fill="url(#colorUsage)" strokeWidth={3} />
                                        <Area type="monotone" dataKey="solar" stroke="#fbbf24" fillOpacity={1} fill="url(#colorSolar)" strokeWidth={2} strokeDasharray="5 5" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                       {/* Peak Waste Alert Box */}
{metrics.peak_warning && (
    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" />
        High energy usage detected during peak hours!
    </div>
)}

                        {/* AI Prediction Card */}
                        <div className="bg-white/70 backdrop-blur-md p-6 rounded-xl border border-white/40 shadow-xl">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-purple-600" /> AI Energy Predictor
                            </h3>

                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-500 font-medium">Temp (°C)</label>
                                        <input type="number" name="Temperature" value={predictInput.Temperature} onChange={handleInputChange} className="w-full px-2 py-1.5 rounded text-sm border border-slate-200" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-medium">Humidity (%)</label>
                                        <input type="number" name="Humidity" value={predictInput.Humidity} onChange={handleInputChange} className="w-full px-2 py-1.5 rounded text-sm border border-slate-200" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-500 font-medium">Sq Footage</label>
                                        <input type="number" name="SquareFootage" value={predictInput.SquareFootage} onChange={handleInputChange} className="w-full px-2 py-1.5 rounded text-sm border border-slate-200" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-medium">Occupancy</label>
                                        <input type="number" name="Occupancy" value={predictInput.Occupancy} onChange={handleInputChange} className="w-full px-2 py-1.5 rounded text-sm border border-slate-200" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <select name="HVACUsage" value={predictInput.HVACUsage} onChange={handleInputChange} className="px-2 py-1.5 rounded text-xs border border-slate-200">
                                        <option value="Off">HVAC Off</option>
                                        <option value="On">HVAC On</option>
                                    </select>
                                    <select name="LightingUsage" value={predictInput.LightingUsage} onChange={handleInputChange} className="px-2 py-1.5 rounded text-xs border border-slate-200">
                                        <option value="Off">Lights Off</option>
                                        <option value="On">Lights On</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs text-slate-500 font-medium">Timestamp</label>
                                    <input type="datetime-local" name="timestamp" value={predictInput.timestamp} onChange={handleInputChange} className="w-full px-2 py-1.5 rounded text-sm border border-slate-200" />
                                </div>

                                <button
                                    onClick={handlePredict}
                                    disabled={predictLoading}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg transition-colors text-sm"
                                >
                                    {predictLoading ? 'Calculating...' : 'Predict Consumption'}
                                </button>

                                {prediction !== null && (
                                    <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-100 text-center animate-fade-in">
                                        <p className="text-xs text-purple-600 uppercase font-bold tracking-wider mb-1">Predicted Usage</p>
                                        <p className="text-2xl font-bold text-slate-800">{prediction} <span className="text-sm font-normal text-slate-500">kWh</span></p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Controls Column (1/3 width) */}
                    <div className="space-y-6">
                        {/* Controls Card */}
                        <div className="bg-white/70 backdrop-blur-md p-6 rounded-xl border border-white/40 shadow-xl">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Building className="w-5 h-5 text-emerald-600" /> Building Parameters
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2">Building Type</label>
                                    <div className="relative">
                                        <select
                                            value={buildingType}
                                            onChange={(e) => setBuildingType(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white/80 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none cursor-pointer hover:bg-white transition-colors shadow-sm"
                                        >
                                            <option value="office">Corporate Office</option>
                                            <option value="campus">University Campus</option>
                                            <option value="home">Residential Home</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ArrowDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-medium text-slate-600">Operating Hours</label>
                                        <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{operatingHours} hrs</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="4" max="24"
                                        value={operatingHours}
                                        onChange={(e) => setOperatingHours(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-600"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-medium text-slate-600">Lighting Intensity</label>
                                        <span className="text-sm font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">{lightingLevel}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10" max="100"
                                        value={lightingLevel}
                                        onChange={(e) => setLightingLevel(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-600"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Renewable Suggestion Panel */}
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-xl shadow-emerald-900/20 border border-emerald-400/30">
                            <h3 className="font-bold mb-4 flex items-center gap-2 drop-shadow-sm">
                                <Sun className="w-5 h-5 text-yellow-300" /> Renewable Potential
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors shadow-inner">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-yellow-400/20 rounded-full ring-1 ring-yellow-400/30 shadow-[0_0_10px_rgba(250,204,21,0.3)]">
                                            <Sun className="w-6 h-6 text-yellow-300" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Solar Window</p>
                                            <p className="text-xs text-emerald-100">Peak: 11 AM - 3 PM</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-xl drop-shadow-sm">{metrics.solar_potential} kWh</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Impact Card */}
                        <div className="bg-white/70 backdrop-blur-md p-6 rounded-xl border border-white/40 shadow-xl text-center group hover:bg-white/80 transition-all duration-300">
                            <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Optimization Potential</p>
                            <div className="flex items-center justify-center gap-2 mt-2 transition-transform group-hover:scale-105">
                                <ArrowDown className="w-6 h-6 text-emerald-500 animate-bounce" />
                                <span className="text-4xl font-bold text-slate-800">{savings}%</span>
                            </div>
                            <p className="text-emerald-600 font-medium text-sm mt-1">Reduction in grid dependency</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnergyPage;
