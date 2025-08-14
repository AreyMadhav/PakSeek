import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Asset } from '../types';
import SearchBar from '../components/SearchBar';
import AssetTable from '../components/AssetTable';
import PreviewPanel from '../components/PreviewPanel';
import { ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';

interface AssetsResponse {
  assets: Asset[];
  total: number;
  filtered: number;
}

export default function AssetBrowser() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAssets, setTotalAssets] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const assetsPerPage = 50; // Increase per page since we're not paginating on backend yet

  useEffect(() => {
    loadAssets();
  }, [searchTerm]); // Load when search term changes

  const loadAssets = async () => {
    const savedFolder = localStorage.getItem('ue-mapper-target-folder');
    if (!savedFolder) {
      setError('No target folder configured. Please set one in Settings.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await invoke<AssetsResponse>('list_assets', {
        target_folder: savedFolder,
        asset_type: null, // No type filter for now
        search: searchTerm || null,
      });
      
      setAssets(result.assets);
      setTotalAssets(result.total);
      setCurrentPage(1); // Reset to first page on new search
    } catch (error) {
      console.error('Failed to load assets:', error);
      setError(`Failed to load assets: ${error}`);
      setAssets([]);
      setTotalAssets(0);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAssets();
  };

  // Calculate pagination for frontend display
  const startIndex = (currentPage - 1) * assetsPerPage;
  const endIndex = startIndex + assetsPerPage;
  const paginatedAssets = assets.slice(startIndex, endIndex);
  const actualTotalPages = Math.ceil(assets.length / assetsPerPage);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < actualTotalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Asset Browser</h1>
          <p className="text-gray-400">
            {totalAssets} assets total • Showing {paginatedAssets.length} on page {currentPage} of {actualTotalPages}
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Loading...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-300 p-4 rounded-lg flex items-center space-x-2">
          <AlertCircle size={16} />
          <div>
            <p>{error}</p>
            {error.includes('No target folder') && (
              <p className="mt-1 text-sm">
                Go to <strong>Settings</strong> to configure your game directory.
              </p>
            )}
          </div>
        </div>
      )}

      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onFilterClick={() => console.log('Filter clicked')}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400">Loading assets...</p>
            </div>
          ) : (
            <AssetTable
              assets={paginatedAssets}
              onAssetSelect={setSelectedAsset}
              selectedAsset={selectedAsset || undefined}
            />
          )}

          {/* Pagination */}
          {actualTotalPages > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-gray-400">
                Page {currentPage} of {actualTotalPages}
              </span>

              <button
                onClick={handleNextPage}
                disabled={currentPage === actualTotalPages}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div>
          <PreviewPanel asset={selectedAsset} />
        </div>
      </div>
    </div>
  );
}