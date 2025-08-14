import { useState } from 'react';
import { Save, Monitor, Palette, RefreshCw, Eye, HardDrive } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function Settings() {
  const { settings, updateSettings, getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  
  const [autoScan, setAutoScan] = useState<boolean>(() => {
    return localStorage.getItem('ue-mapper-auto-scan') !== 'false';
  });
  const [showHidden, setShowHidden] = useState<boolean>(() => {
    return localStorage.getItem('ue-mapper-show-hidden') === 'true';
  });
  const [cacheEnabled, setCacheEnabled] = useState<boolean>(() => {
    return localStorage.getItem('ue-mapper-cache-enabled') !== 'false';
  });
  const [autoRefresh, setAutoRefresh] = useState<boolean>(() => {
    return localStorage.getItem('ue-mapper-auto-refresh') === 'true';
  });
  const [maxFileSize, setMaxFileSize] = useState<string>(() => {
    return localStorage.getItem('ue-mapper-max-file-size') || '100';
  });

  const themePresets = {
    default: { primary: '#6366f1', secondary: '#8b5cf6', accent: '#06b6d4', name: 'Default' },
    purple: { primary: '#8b5cf6', secondary: '#a855f7', accent: '#d946ef', name: 'Purple' },
    blue: { primary: '#3b82f6', secondary: '#06b6d4', accent: '#0ea5e9', name: 'Blue' },
    green: { primary: '#10b981', secondary: '#059669', accent: '#06b6d4', name: 'Green' }
  };

  const handleThemeChange = (themeKey: 'default' | 'purple' | 'blue' | 'green') => {
    updateSettings({ themePreset: themeKey });
  };

  const handleSave = () => {
    // Save all settings to localStorage
    localStorage.setItem('ue-mapper-auto-scan', autoScan.toString());
    localStorage.setItem('ue-mapper-show-hidden', showHidden.toString());
    localStorage.setItem('ue-mapper-cache-enabled', cacheEnabled.toString());
    localStorage.setItem('ue-mapper-auto-refresh', autoRefresh.toString());
    localStorage.setItem('ue-mapper-max-file-size', maxFileSize);
    
    // Simple alert for now
    alert('Settings saved successfully!');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Configure your Unreal Engine Mapper preferences</p>
      </div>

      {/* Theme Settings */}
      <div 
        className="backdrop-blur-sm border rounded-xl p-6"
        style={{ 
          backgroundColor: `${themeColors.surface}30`,
          borderColor: `${themeColors.border}50`
        }}
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Palette className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Appearance</h2>
            <p className="text-gray-400 text-sm">Customize the visual theme</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Color Theme
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(themePresets).map(([key, themeData]) => (
                <button
                  key={key}
                  onClick={() => handleThemeChange(key as 'default' | 'purple' | 'blue' | 'green')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    settings.themePreset === key
                      ? 'border-white bg-gray-700/50'
                      : 'border-gray-600/50 bg-gray-800/30 hover:border-gray-500/50'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: themeData.primary }}
                    />
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: themeData.secondary }}
                    />
                  </div>
                  <div className="text-white text-sm font-medium">
                    {themeData.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scanning Settings */}
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Scanning</h2>
            <p className="text-gray-400 text-sm">Configure asset scanning behavior</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Auto-scan on startup</label>
              <p className="text-gray-400 text-sm">Automatically scan for .pak files when the app starts</p>
            </div>
            <button
              onClick={() => setAutoScan(!autoScan)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                autoScan ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                  autoScan ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Show hidden files</label>
              <p className="text-gray-400 text-sm">Include hidden .pak files in the scan results</p>
            </div>
            <button
              onClick={() => setShowHidden(!showHidden)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                showHidden ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                  showHidden ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Maximum file size to scan (MB)
            </label>
            <input
              type="number"
              value={maxFileSize}
              onChange={(e) => setMaxFileSize(e.target.value)}
              min="1"
              max="1000"
              className="w-32 px-3 py-2 bg-gray-700/50 text-white rounded-md border border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-400 mt-1">
              Skip .pak files larger than this size to improve performance
            </p>
          </div>
        </div>
      </div>

      {/* Performance Settings */}
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
            <Monitor className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Performance</h2>
            <p className="text-gray-400 text-sm">Optimize scanning and caching</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Enable caching</label>
              <p className="text-gray-400 text-sm">Cache parsed .pak file data for faster subsequent loads</p>
            </div>
            <button
              onClick={() => setCacheEnabled(!cacheEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                cacheEnabled ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                  cacheEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Auto-refresh assets</label>
              <p className="text-gray-400 text-sm">Automatically refresh asset list when files change</p>
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                autoRefresh ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                  autoRefresh ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Display Settings */}
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
            <Eye className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Display</h2>
            <p className="text-gray-400 text-sm">Configure how assets are displayed</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Assets per page
            </label>
            <select className="px-3 py-2 bg-gray-700/50 text-white rounded-md border border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Default sort order
            </label>
            <select className="px-3 py-2 bg-gray-700/50 text-white rounded-md border border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="name">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="size">Size (Small to Large)</option>
              <option value="size-desc">Size (Large to Small)</option>
              <option value="type">Type</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <HardDrive className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-400">Settings are saved locally</span>
        </div>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <Save size={16} />
          <span>Save Settings</span>
        </button>
      </div>

      {/* About */}
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 text-center">
        <h3 className="text-lg font-semibold text-white mb-2">UE Asset Mapper</h3>
        <p className="text-gray-400 mb-4">Version 1.0.0 • Built with React & Tauri</p>
        <div className="flex justify-center space-x-4 text-sm text-gray-500">
          <span>Made for modders</span>
          <span>•</span>
          <span>Open source</span>
          <span>•</span>
          <span>Offline capable</span>
        </div>
      </div>
    </div>
  );
}