import { useState, useEffect } from 'react';
import { DependencyNode } from '../types';
import DependencyGraph from '../components/DependencyGraph';
import { getDependencies, isTauriApp } from '../api/tauriClient';
import { RefreshCw } from 'lucide-react';

// Mock dependency data
const mockNodes: DependencyNode[] = [
  { id: '1', name: 'PlayerTexture', type: 'Texture', x: 200, y: 150, connections: ['2'] },
  { id: '2', name: 'PlayerMesh', type: 'Mesh', x: 400, y: 150, connections: ['3', '4'] },
  { id: '3', name: 'PlayerMaterial', type: 'Material', x: 600, y: 100, connections: ['1'] },
  { id: '4', name: 'WeaponBlueprint', type: 'Blueprint', x: 600, y: 200, connections: ['5'] },
  { id: '5', name: 'WeaponAudio', type: 'Audio', x: 800, y: 200, connections: [] },
];

export default function GraphView() {
  const [nodes, setNodes] = useState<DependencyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDependencies();
  }, []);

  const loadDependencies = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!isTauriApp()) {
        // Fallback to mock data in web dev
        setTimeout(() => {
          setNodes(mockNodes);
          setLoading(false);
        }, 1000);
        return;
      }

      const response = await getDependencies();
      const dependencyNodes = convertDependenciesToNodes(response.dependencies.dependencies);
      setNodes(dependencyNodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dependencies');
      // Fallback to mock data on error
      setNodes(mockNodes);
    } finally {
      setLoading(false);
    }
  };

  const convertDependenciesToNodes = (dependencies: Record<string, string[]>): DependencyNode[] => {
    const nodes: DependencyNode[] = [];
    const nodeMap = new Map<string, DependencyNode>();
    
    // Create nodes for all assets (both sources and dependencies)
    const allAssets = new Set<string>();
    Object.keys(dependencies).forEach(asset => allAssets.add(asset));
    Object.values(dependencies).forEach(deps => deps.forEach(dep => allAssets.add(dep)));
    
    // Position nodes in a circular layout
    const radius = 200;
    const angleStep = (2 * Math.PI) / allAssets.size;
    let index = 0;
    
    allAssets.forEach(assetName => {
      const angle = index * angleStep;
      const x = 400 + radius * Math.cos(angle);
      const y = 300 + radius * Math.sin(angle);
      
      const node: DependencyNode = {
        id: assetName,
        name: assetName,
        type: inferAssetType(assetName),
        x,
        y,
        connections: dependencies[assetName] || []
      };
      
      nodes.push(node);
      nodeMap.set(assetName, node);
      index++;
    });
    
    return nodes;
  };

  const inferAssetType = (assetName: string): string => {
    const name = assetName.toLowerCase();
    if (name.includes('texture') || name.includes('diffuse') || name.includes('normal')) return 'Texture';
    if (name.includes('audio') || name.includes('sound') || name.includes('music')) return 'Audio';
    if (name.includes('mesh') || name.includes('model')) return 'Mesh';
    if (name.includes('material') || name.includes('shader')) return 'Material';
    if (name.includes('blueprint') || name.includes('bp')) return 'Blueprint';
    return 'Other';
  };

  const refreshGraph = () => {
    loadDependencies();
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Dependency Graph</h1>
          <p className="text-gray-400">
            Interactive visualization of asset dependencies
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={refreshGraph}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400">Loading dependency graph...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={refreshGraph}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <DependencyGraph nodes={nodes} />
        )}
      </div>

      {/* Graph Legend */}
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-2">Asset Types</h3>
        <div className="flex flex-wrap items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-300">Texture</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-gray-300">Audio</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-300">Mesh</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-300">Material</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-300">Blueprint</span>
          </div>
        </div>
      </div>
    </div>
  );
}