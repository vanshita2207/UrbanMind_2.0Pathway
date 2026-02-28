// import { useState } from 'react';
// import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
// import { Leaf, LayoutDashboard, Car, Zap, BarChart3, Info } from 'lucide-react';

// // Components
// import LandingPage from './LandingPage';
// import Dashboard from './components/Dashboard'; // Keeping the old one for now, will refactor later
// import MobilityPage from './components/Mobility/MobilityPage';
// import EnergyPage from './components/Energy/EnergyPage';
// import CarbonPage from './components/Carbon/CarbonPage';
// import OptimizationPanel from './components/OptimizationPanel';

// function AppContent() {
//   const navigate = useNavigate();
//   const location = useLocation();

//   // Mapping paths to active tabs for styling
//   const getActiveTab = (path) => {
//     if (path === '/app/mobility') return 'mobility';
//     if (path === '/app/energy') return 'energy';
//     if (path === '/app/carbon') return 'carbon';
//     return 'dashboard';
//   };

//   const activeTab = getActiveTab(location.pathname);

//   // If on landing page, don't show navbar
//   if (location.pathname === '/') {
//     return <LandingPage onGetStarted={() => navigate('/app')} />;
//   }

//   return (
//     <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-200 selection:text-emerald-900">
//       {/* Navbar */}
//       <nav className="border-b border-emerald-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between h-16">
//             <div className="flex items-center cursor-pointer" onClick={() => navigate('/')} role="button">
//               <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent flex items-center gap-2">
//                 <Leaf className="w-6 h-6 text-emerald-500" />
//                 UrbanMind
//               </span>
//             </div>

//             {/* Desktop Navigation */}
//             <div className="hidden md:flex space-x-1">
//               <NavItem
//                 label="Dashboard"
//                 icon={LayoutDashboard}
//                 isActive={activeTab === 'dashboard'}
//                 onClick={() => navigate('/app')}
//               />
//               <NavItem
//                 label="Mobility"
//                 icon={Car}
//                 isActive={activeTab === 'mobility'}
//                 onClick={() => navigate('/app/mobility')}
//               />
//               <NavItem
//                 label="Energy"
//                 icon={Zap}
//                 isActive={activeTab === 'energy'}
//                 onClick={() => navigate('/app/energy')}
//               />
//               <NavItem
//                 label="Carbon"
//                 icon={BarChart3}
//                 isActive={activeTab === 'carbon'}
//                 onClick={() => navigate('/app/carbon')}
//               />
//               <div className="w-px h-6 bg-slate-200 mx-2 self-center"></div>
//               <NavItem
//                 label="Home"
//                 icon={Info}
//                 isActive={location.pathname === '/'}
//                 onClick={() => navigate('/')}
//               />
//             </div>
//           </div>
//         </div>
//       </nav>

//       {/* Main Content */}
//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <Routes>
//           <Route path="/app" element={<Dashboard />} />
//           <Route path="/app/mobility" element={<MobilityPage />} />
//           <Route path="/app/energy" element={<EnergyPage />} />
//           <Route path="/app/carbon" element={<CarbonPage />} />
//         </Routes>
//       </main>
//     </div>
//   );
// }

// // Helper Component for Nav Items
// const NavItem = ({ label, icon: Icon, isActive, onClick }) => (
//   <button
//     onClick={onClick}
//     className={`flex items-center px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${isActive
//       ? 'bg-emerald-100 text-emerald-700 shadow-sm'
//       : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-100'
//       }`}
//   >
//     <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
//     {label}
//   </button>
// );

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/*" element={<AppContent />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;








import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Leaf, LayoutDashboard, Car, Zap, BarChart3, Info, ThermometerSun } from 'lucide-react';

// Components
import LandingPage from './LandingPage';
import Dashboard from './components/Dashboard'; // Keeping the old one for now
import MobilityPage from './components/Mobility/MobilityPage';
import EnergyPage from './components/Energy/EnergyPage';
import CarbonPage from './components/Carbon/CarbonPage';
import OptimizationPanel from './components/OptimizationPanel';
import PathwayRisk from './pages/PathwayRisk'; // <-- NEW import

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // Mapping paths to active tabs for styling
  const getActiveTab = (path) => {
    if (path === '/app/mobility') return 'mobility';
    if (path === '/app/energy') return 'energy';
    if (path === '/app/carbon') return 'carbon';
    if (path === '/app/pathway-risk') return 'pathway-risk';
    return 'dashboard';
  };

  const activeTab = getActiveTab(location.pathname);

  // If on landing page, don't show navbar
  if (location.pathname === '/') {
    return <LandingPage onGetStarted={() => navigate('/app')} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-200 selection:text-emerald-900">
      {/* Navbar */}
      <nav className="border-b border-emerald-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')} role="button">
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent flex items-center gap-2">
                <Leaf className="w-6 h-6 text-emerald-500" />
                UrbanMind
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-1">
              <NavItem
                label="Dashboard"
                icon={LayoutDashboard}
                isActive={activeTab === 'dashboard'}
                onClick={() => navigate('/app')}
              />
              <NavItem
                label="Mobility"
                icon={Car}
                isActive={activeTab === 'mobility'}
                onClick={() => navigate('/app/mobility')}
              />
              <NavItem
                label="Energy"
                icon={Zap}
                isActive={activeTab === 'energy'}
                onClick={() => navigate('/app/energy')}
              />
              <NavItem
                label="Carbon"
                icon={BarChart3}
                isActive={activeTab === 'carbon'}
                onClick={() => navigate('/app/carbon')}
              />
              <NavItem
                label="Live AQI"
                icon={ThermometerSun} // Optional icon for Pathway Risk
                isActive={activeTab === 'pathway-risk'}
                onClick={() => navigate('/app/pathway-risk')}
              />
              <div className="w-px h-6 bg-slate-200 mx-2 self-center"></div>
              <NavItem
                label="Home"
                icon={Info}
                isActive={location.pathname === '/'}
                onClick={() => navigate('/')}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/app" element={<Dashboard />} />
          <Route path="/app/mobility" element={<MobilityPage />} />
          <Route path="/app/energy" element={<EnergyPage />} />
          <Route path="/app/carbon" element={<CarbonPage />} />
          <Route path="/app/pathway-risk" element={<PathwayRisk />} /> {/* NEW ROUTE */}
        </Routes>
      </main>
    </div>
  );
}

// Helper Component for Nav Items
const NavItem = ({ label, icon: Icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
      isActive
        ? 'bg-emerald-100 text-emerald-700 shadow-sm'
        : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-100'
    }`}
  >
    <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
    {label}
  </button>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </Router>
  );
}

export default App;
