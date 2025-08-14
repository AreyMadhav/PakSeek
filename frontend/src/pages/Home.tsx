import { useState, useEffect } from 'react';
import { FolderOpen, Info, RefreshCw, AlertCircle, Package, Database, FileText } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useTheme } from '../hooks/useTheme';

interface AssetsResponse {
  assets: any[];
  total: number;
  filtered: number;
}

export default function Home() {
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  
  const [targetFolder, setTargetFolder] = useState<string>(() => {
    return localStorage.getItem('ue-mapper-target-folder') || '';
  });
  const [scanResults, setScanResults] = useState<AssetsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  const testConnection = async () => {
    try {
      console.log('=== FRONTEND DEBUG: Testing backend connection...');
      const result = await invoke<string>('test_command', { message: 'Hello from frontend!' });
      console.log('=== FRONTEND DEBUG: Test result:', result);
      showMessage('success', `Connection test successful: ${result}`);
    } catch (error) {
      console.error('=== FRONTEND DEBUG: Test failed:', error);
      showMessage('error', `Connection test failed: ${error}`);
    }
  };

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleFolderSelect = async () => {
    showMessage('info', 'Dialog functionality is temporarily disabled due to Tauri configuration. Please enter the path manually below.');
  };

  const handleFileSelect = async () => {
    showMessage('info', 'Dialog functionality is temporarily disabled due to Tauri configuration. Please enter the .pak file path manually below.');
  };

  const scanDirectory = async (folderToScan?: string) => {
    const folder = folderToScan || targetFolder.trim();
    if (!folder) {
      showMessage('error', 'Please select a directory first');
      return;
    }

    console.log('=== FRONTEND DEBUG: Starting scan for folder:', folder);

    try {
      setIsLoading(true);
      console.log('=== FRONTEND DEBUG: About to invoke list_assets command...');
      
      const result = await invoke<AssetsResponse>('list_assets', {
        target_folder: folder,
      });
      
      console.log('=== FRONTEND DEBUG: Received result:', result);
      setScanResults(result);
      if (result.total > 0) {
        showMessage('success', `Found ${result.total} assets in ${result.assets.length} .pak files`);
        localStorage.setItem('ue-mapper-target-folder', folder);
      } else {
        showMessage('error', 'No .pak files found in the selected directory');
      }
    } catch (error) {
      console.error('=== FRONTEND DEBUG: Error during invoke:', error);
      showMessage('error', 'Failed to scan directory. Make sure it contains .pak files and the path is correct.');
      setScanResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-load on startup if folder is saved
  useEffect(() => {
    const savedFolder = localStorage.getItem('ue-mapper-target-folder');
    if (savedFolder && savedFolder.trim()) {
      setTargetFolder(savedFolder);
      // Auto-scan on startup (could be made optional in settings)
      const autoScan = localStorage.getItem('ue-mapper-auto-scan');
      if (autoScan === 'true' || autoScan === null) {
        // Delay the scan slightly to allow the component to mount
        setTimeout(() => {
          scanDirectory(savedFolder);
        }, 500);
      }
    }
  }, []);

  const getAssetTypeBreakdown = () => {
    if (!scanResults?.assets) return {};
    
    const breakdown: { [key: string]: number } = {};
    scanResults.assets.forEach(asset => {
      const type = asset.asset_type || 'Unknown';
      breakdown[type] = (breakdown[type] || 0) + 1;
    });
    
    return breakdown;
  };

  const assetTypeBreakdown = getAssetTypeBreakdown();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div 
        className="backdrop-blur-sm border rounded-xl p-8"
        style={{ 
          background: `linear-gradient(135deg, ${themeColors.surface}40, ${themeColors.surface}20)`,
          borderColor: `${themeColors.border}50`
        }}
      >
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-4">
            UE Asset Mapper
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Explore, analyze, and manage your Unreal Engine assets with ease
          </p>
          
          {/* Folder Selection */}
          <div className="space-y-4">
            <div className="text-center space-y-3">
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleFolderSelect}
                  disabled={isLoading}
                  className="px-6 py-3 text-white rounded-lg transition-colors flex items-center space-x-2"
                  style={{
                    backgroundColor: themeColors.primary,
                    opacity: isLoading ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = themeColors.secondary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = themeColors.primary;
                    }
                  }}
                >
                  <FolderOpen size={20} />
                  <span>Browse Folder</span>
                </button>
                
                <button
                  onClick={handleFileSelect}
                  disabled={isLoading}
                  className="px-6 py-3 text-white rounded-lg transition-colors flex items-center space-x-2"
                  style={{
                    backgroundColor: themeColors.accent,
                    opacity: isLoading ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = themeColors.secondary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = themeColors.accent;
                    }
                  }}
                >
                  <Package size={20} />
                  <span>Select .pak File</span>
                </button>
              </div>
              <p className="text-gray-400 text-sm">Browse buttons temporarily disabled - please enter path manually below</p>
              <p className="text-gray-300 text-sm font-medium">Supports both folders and direct .pak file paths</p>
            </div>
            
            <div className="flex space-x-2 max-w-2xl mx-auto">
              <input
                type="text"
                value={targetFolder}
                onChange={(e) => setTargetFolder(e.target.value)}
                placeholder="C:\Games\YourGame\Content\Paks or C:\Path\To\File.pak"
                className="flex-1 px-4 py-3 bg-gray-700/50 text-white rounded-lg border border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {targetFolder && (
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={() => scanDirectory()}
                  disabled={isLoading}
                  className="px-8 py-3 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
                  style={{
                    background: `linear-gradient(135deg, ${themeColors.accent}, ${themeColors.secondary})`,
                    opacity: isLoading ? 0.6 : 1
                  }}
                >
                  <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                  <span>{isLoading ? 'Scanning...' : targetFolder.endsWith('.pak') ? 'Analyze .pak File' : 'Scan Directory'}</span>
                </button>
                
                <button
                  onClick={testConnection}
                  className="px-6 py-3 text-white font-medium rounded-lg border border-gray-500 hover:border-gray-400 transition-colors flex items-center space-x-2"
                  style={{ backgroundColor: `${themeColors.surface}80` }}
                >
                  <span>Test Connection</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-300'
            : message.type === 'error'
            ? 'bg-red-900/20 border-red-500/30 text-red-300'
            : 'bg-blue-900/20 border-blue-500/30 text-blue-300'
        }`}>
          <div className="flex items-center space-x-2">
            <AlertCircle size={16} />
            <span className="text-sm">{message.text}</span>
          </div>
        </div>
      )}

      {/* Scan Results */}
      {scanResults && (
        <div 
          className="backdrop-blur-sm border rounded-xl p-6"
          style={{ 
            backgroundColor: `${themeColors.surface}30`,
            borderColor: `${themeColors.border}50`
          }}
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Scan Results</span>
          </h3>
          
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div 
                className="rounded-lg p-4 text-center"
                style={{ backgroundColor: `${themeColors.surface}30` }}
              >
                <div className="text-2xl font-bold" style={{ color: themeColors.primary }}>{scanResults.total}</div>
                <div className="text-sm text-gray-400">Total Assets</div>
              </div>
              <div 
                className="rounded-lg p-4 text-center"
                style={{ backgroundColor: `${themeColors.surface}30` }}
              >
                <div className="text-2xl font-bold" style={{ color: themeColors.accent }}>{Object.keys(assetTypeBreakdown).length}</div>
                <div className="text-sm text-gray-400">Asset Types</div>
              </div>
              <div 
                className="rounded-lg p-4 text-center"
                style={{ backgroundColor: `${themeColors.surface}30` }}
              >
                <div className="text-2xl font-bold" style={{ color: themeColors.secondary }}>
                  {scanResults.assets.filter(a => a.pak_file).map(a => a.pak_file).filter((v, i, arr) => arr.indexOf(v) === i).length}
                </div>
                <div className="text-sm text-gray-400">.pak Files</div>
              </div>
            </div>          {/* Asset Type Breakdown */}
          {Object.keys(assetTypeBreakdown).length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-white mb-3">Asset Types</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(assetTypeBreakdown).map(([type, count]) => (
                  <div key={type} className="bg-gray-700/30 rounded p-3 text-center">
                    <div className="text-lg font-bold text-white">{count}</div>
                    <div className="text-xs text-gray-400 capitalize">{type}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:bg-gray-700/30 transition-colors">
          <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4">
            <FolderOpen className="w-6 h-6 text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Browse Assets</h3>
          <p className="text-gray-400">
            Search, filter, and preview your game assets with an intuitive browser interface.
          </p>
        </div>

        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:bg-gray-700/30 transition-colors">
          <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
            <Info className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Dependency Graph</h3>
          <p className="text-gray-400">
            Visualize asset relationships and dependencies with interactive graphs.
          </p>
        </div>

        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:bg-gray-700/30 transition-colors md:col-span-2 lg:col-span-1">
          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Asset Details</h3>
          <p className="text-gray-400">
            View detailed information about individual assets and their properties.
          </p>
        </div>
      </div>

      {/* Instructions */}
      {!scanResults && (
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Getting Started</h3>
          <div className="space-y-3 text-gray-300">
            <div className="flex items-start space-x-3">
              <span className="w-6 h-6 bg-indigo-500 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <p>Click "Browse" to select your Unreal Engine project directory containing .pak files</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-6 h-6 bg-indigo-500 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <p>Click "Scan Directory" to analyze and load your game assets</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-6 h-6 bg-indigo-500 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <p>Navigate to the Asset Browser to explore your game files</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-6 h-6 bg-indigo-500 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
              <p>Use the Dependency Graph to understand asset relationships</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}