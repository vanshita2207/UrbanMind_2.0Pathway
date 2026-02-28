// const API_BASE_URL = 'http://localhost:5001/api';

// // Energy API
// export const getEnergyData = async () => {
//     try {
//         const response = await fetch(`${API_BASE_URL}/energy/data`);
//         if (!response.ok) throw new Error('Failed to fetch energy data');
//         return await response.json();
//     } catch (error) {
//         console.error('Error fetching energy data:', error);
//         return [];
//     }
// };

// export const ingestEnergyData = async (data) => {
//     try {
//         const response = await fetch(`${API_BASE_URL}/energy/data`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(data),
//         });
//         if (!response.ok) throw new Error('Failed to ingest data');
//         return await response.json();
//     } catch (error) {
//         console.error('Error ingesting data:', error);
//         return null;
//     }
// };

// export const getOptimizationSuggestions = async (currentData) => {
//     try {
//         const response = await fetch(`${API_BASE_URL}/energy/analyze`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(currentData),
//         });
//         if (!response.ok) throw new Error('Failed to analyze data');
//         const result = await response.json();
//         return result.suggestions || [];
//     } catch (error) {
//         console.error('Error analyzing data:', error);
//         return [];
//     }
// };

// export const simulateEnergy = async (params) => {
//     try {
//         const response = await fetch(`${API_BASE_URL}/energy/simulate`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(params),
//         });
//         if (!response.ok) throw new Error('Failed to simulate energy');
//         return await response.json();
//     } catch (error) {
//         console.error('Error simulating energy:', error);
//         return null;
//     }
// };

// export const predictEnergyConsumption = async (data) => {
//     try {
//         const response = await fetch(`${API_BASE_URL}/energy/predict`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(data),
//         });
//         if (!response.ok) throw new Error('Failed to predict energy');
//         return await response.json();
//     } catch (error) {
//         console.error('Error predicting energy:', error);
//         return null;
//     }
// };

// // Mobility API
// export const getMobilityLogs = async () => {
//     try {
//         const response = await fetch(`${API_BASE_URL}/mobility`);
//         if (!response.ok) throw new Error('Failed to fetch mobility logs');
//         return await response.json();
//     } catch (error) {
//         console.error("Error fetching mobility logs:", error);
//         return [];
//     }
// };

// export const logTrip = async (tripData) => {
//     try {
//         const response = await fetch(`${API_BASE_URL}/mobility`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(tripData),
//         });
//         if (!response.ok) throw new Error('Failed to log trip');
//         return await response.json();
//     } catch (error) {
//         console.error("Error logging trip:", error);
//         return null;
//     }
// };

// export const calculateMobility = async (params) => {
//     try {
//         const response = await fetch(`${API_BASE_URL}/mobility/calculate`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(params),
//         });
//         if (!response.ok) throw new Error('Failed to calculate mobility');
//         return await response.json();
//     } catch (error) {
//         console.error("Error calculating mobility:", error);
//         return null;
//     }
// };

// // Carbon API
// export const getLatestCarbonReport = async () => {
//     try {
//         const response = await fetch(`${API_BASE_URL}/carbon/latest`);
//         if (!response.ok) throw new Error('Failed to fetch carbon report');
//         return await response.json();
//     } catch (error) {
//         console.error("Error fetching carbon report:", error);
//         return null;
//     }
// };

// export const simulateCarbon = async (params) => {
//     try {
//         const response = await fetch(`${API_BASE_URL}/carbon/simulate`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(params),
//         });
//         if (!response.ok) throw new Error('Failed to simulate carbon');
//         return await response.json();
//     } catch (error) {
//         console.error("Error simulating carbon:", error);
//         return null;
//     }
// };

// export const logCarbonData = async (data) => {
//     try {
//         const response = await fetch(`${API_BASE_URL}/carbon`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(data),
//         });
//         if (!response.ok) throw new Error('Failed to log carbon data');
//         return await response.json();
//     } catch (error) {
//         console.error("Error logging carbon data:", error);
//         return null;
//     }
// };

// export const getCarbonSuggestions = async (data) => {
//     try {
//         const response = await fetch(`${API_BASE_URL}/carbon/suggestions`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(data),
//         });
//         if (!response.ok) throw new Error('Failed to get suggestions');
//         return await response.json();
//     } catch (error) {
//         console.error("Error getting carbon suggestions:", error);
//         return null;
//     }
// };

// export const getMobilitySuggestions = async (data) => {
//     try {
//         const response = await fetch(`${API_BASE_URL}/mobility/suggestions`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(data),
//         });
//         if (!response.ok) throw new Error('Failed to get mobility suggestions');
//         return await response.json();
//     } catch (error) {
//         console.error("Error getting mobility suggestions:", error);
//         return null;
//     }
// };
// ==========================================
// Base URL (uses Vite env variable)
// ==========================================









const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001";

const API_BASE_URL = `${BASE_URL}/api`;

// ==========================================
// Generic Request Helper
// ==========================================

const request = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Something went wrong");
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error.message);
    throw error;
  }
};

// ==========================================
// ENERGY API
// ==========================================

export const getEnergyData = () =>
  request("/energy/data");

export const ingestEnergyData = (data) =>
  request("/energy/data", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getOptimizationSuggestions = (data) =>
  request("/energy/analyze", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const simulateEnergy = (params) =>
  request("/energy/simulate", {
    method: "POST",
    body: JSON.stringify(params),
  });

export const predictEnergyConsumption = (data) =>
  request("/energy/predict", {
    method: "POST",
    body: JSON.stringify(data),
  });

// ==========================================
// MOBILITY API
// ==========================================

export const getMobilityLogs = () =>
  request("/mobility");

export const logTrip = (tripData) =>
  request("/mobility", {
    method: "POST",
    body: JSON.stringify(tripData),
  });

export const calculateMobility = (params) =>
  request("/mobility/calculate", {
    method: "POST",
    body: JSON.stringify(params),
  });

export const getMobilitySuggestions = (data) =>
  request("/mobility/suggestions", {
    method: "POST",
    body: JSON.stringify(data),
  });

// ==========================================
// CARBON API
// ==========================================

export const getLatestCarbonReport = () =>
  request("/carbon/latest");

export const logCarbonData = (data) =>
  request("/carbon", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const simulateCarbon = (params) =>
  request("/carbon/simulate", {
    method: "POST",
    body: JSON.stringify(params),
  });

export const getCarbonSuggestions = (data) =>
  request("/carbon/suggestions", {
    method: "POST",
    body: JSON.stringify(data),
  });










