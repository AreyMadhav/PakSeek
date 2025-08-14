import React from 'react';
import { Asset } from '../types';
import { formatFileSize } from '../services/api';
import { File, Music, Image, Box, Palette, Zap } from 'lucide-react';

interface AssetTableProps {
  assets: Asset[];
  onAssetSelect: (asset: Asset) => void;
  selectedAsset?: Asset;
}

const getAssetIcon = (type: Asset['type']) => {
  switch (type) {
    case 'Texture': return Image;
    case 'Audio': return Music;
    case 'Mesh': return Box;
    case 'Material': return Palette;
    case 'Blueprint': return Zap;
    default: return File;
  }
};

const getTypeColor = (type: Asset['type']) => {
  switch (type) {
    case 'Texture': return 'text-green-400';
    case 'Audio': return 'text-purple-400';
    case 'Mesh': return 'text-blue-400';
    case 'Material': return 'text-orange-400';
    case 'Blueprint': return 'text-red-400';
    default: return 'text-gray-400';
  }
};

export default function AssetTable({ assets, onAssetSelect, selectedAsset }: AssetTableProps) {
  return (
    <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-900/50">
            <tr>
              <th className="text-left p-4 text-gray-300 font-medium">Name</th>
              <th className="text-left p-4 text-gray-300 font-medium">Type</th>
              <th className="text-left p-4 text-gray-300 font-medium">Size</th>
              <th className="text-left p-4 text-gray-300 font-medium">Path</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => {
              const Icon = getAssetIcon(asset.type);
              const isSelected = selectedAsset?.id === asset.id;
              
              return (
                <tr
                  key={asset.id}
                  onClick={() => onAssetSelect(asset)}
                  className={`border-t border-gray-700/30 hover:bg-gray-700/30 cursor-pointer transition-colors ${
                    isSelected ? 'bg-indigo-500/20 border-indigo-500/30' : ''
                  }`}
                >
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${getTypeColor(asset.type)}`} />
                      <span className="text-white font-medium">{asset.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gray-700/50 ${getTypeColor(asset.type)}`}>
                      {asset.type}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300">{formatFileSize(asset.size)}</td>
                  <td className="p-4 text-gray-400 text-sm font-mono">{asset.path}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}