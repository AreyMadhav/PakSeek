import React, { useState } from 'react';
import { Home as HomeIcon, Folder, Link, Settings as SettingsIcon } from 'lucide-react';
import { useTheme } from './hooks/useTheme';
import Home from './pages/Home';
import AssetBrowser from './pages/AssetBrowser';
import GraphView from './pages/GraphView';
import Settings from './pages/Settings';

// Working version with native title bar
function SafeApp() {
  const [currentPage, setCurrentPage] = useState('home');
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home />;
      case 'assets':
        return <AssetBrowser />;
      case 'graph':
        return <GraphView />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <div className="text-white">
            <h1>Page not found</h1>
          </div>
        );
    }
  };

  return (
    <div 
      className="flex h-screen text-white overflow-hidden"
      style={{ backgroundColor: themeColors.background }}
    >
      <div className="flex flex-1">
        {/* Enhanced sidebar with better styling */}
        <div 
          className="w-64 backdrop-blur-xl border-r flex flex-col"
          style={{ 
            backgroundColor: `${themeColors.surface}80`,
            borderColor: `${themeColors.border}50`
          }}
        >
          <div 
            className="p-4 border-b"
            style={{ borderColor: `${themeColors.border}50` }}
          >
            <div className="flex items-center space-x-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`
                }}
              >
                <span className="text-white text-sm font-bold">UE</span>
              </div>
              <h1 className="text-white font-semibold">Asset Mapper</h1>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {[
              { id: 'home', label: 'Home', icon: HomeIcon },
              { id: 'assets', label: 'Asset Browser', icon: Folder },
              { id: 'graph', label: 'Dependency Graph', icon: Link },
              { id: 'settings', label: 'Settings', icon: SettingsIcon }
            ].map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    currentPage === item.id
                      ? 'text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  style={currentPage === item.id ? {
                    background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`
                  } : {}}
                  onMouseEnter={(e) => {
                    if (currentPage !== item.id) {
                      e.currentTarget.style.backgroundColor = `${themeColors.surface}80`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== item.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <IconComponent size={18} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div 
            className="p-4 border-t"
            style={{ borderColor: `${themeColors.border}50` }}
          >
            <div className="text-xs text-gray-500 text-center">
              UE Asset Mapper v1.0
            </div>
          </div>
        </div>

        {/* Main content */}
        <main 
          className="flex-1 overflow-auto"
          style={{ backgroundColor: themeColors.background }}
        >
          <div className="p-6 min-h-full">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return <SafeApp />;
}

export default App;