import { useState, useEffect } from 'react';
import { Asset, PreviewResponse } from '../types';
import { getPreview, formatFileSize, isTauriApp } from '../api/tauriClient';
import { Play, Image, FileText, Loader2, AlertCircle } from 'lucide-react';

interface PreviewPanelProps {
  asset: Asset | null;
}

export default function PreviewPanel({ asset }: PreviewPanelProps) {
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!asset) {
      setPreviewData(null);
      setError(null);
      return;
    }

    const loadPreview = async () => {
      if (!isTauriApp()) {
        // In web dev mode, don't try to load preview
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const preview = await getPreview(asset.name);
        setPreviewData(preview);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preview');
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [asset]);

  if (!asset) {
    return (
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select an asset to preview</p>
        </div>
      </div>
    );
  }

  const renderPreviewContent = () => {
    if (loading) {
      return (
        <div className="bg-gray-900/50 rounded-lg p-8 text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-400 text-sm">Loading preview...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-gray-900/50 rounded-lg p-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      );
    }

    if (!previewData) {
      // Fallback to basic preview for web dev or when no preview data
      return renderBasicPreview();
    }

    // Render preview based on type
    switch (previewData.preview_type.type) {
      case 'image':
        return renderImagePreview();
      case 'audio':
        return renderAudioPreview();
      case 'model':
        return renderModelPreview();
      case 'text':
        return renderTextPreview();
      default:
        return renderUnsupportedPreview();
    }
  };

  const renderBasicPreview = () => {
    // Texture Preview
    if (asset.type === 'Texture' && asset.thumbnail) {
      return (
        <div className="aspect-square bg-gray-900/50 rounded-lg overflow-hidden max-w-xs mx-auto">
          <img
            src={asset.thumbnail}
            alt={asset.name}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    // Audio Preview
    if (asset.type === 'Audio') {
      return (
        <div className="bg-gray-900/50 rounded-lg p-6 text-center">
          <button className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-indigo-700 transition-colors">
            <Play className="w-6 h-6 text-white ml-1" />
          </button>
          <p className="text-gray-400 text-sm">Click to play audio preview</p>
        </div>
      );
    }

    // Generic Preview
    return (
      <div className="bg-gray-900/50 rounded-lg p-8 text-center">
        <Image className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400 text-sm">No preview available for {asset.type}</p>
      </div>
    );
  };

  const renderImagePreview = () => {
    if (previewData?.data.format === 'base64') {
      return (
        <div className="aspect-square bg-gray-900/50 rounded-lg overflow-hidden max-w-xs mx-auto">
          <img
            src={previewData.data.content as string}
            alt={asset.name}
            className="w-full h-full object-contain"
          />
        </div>
      );
    }
    return renderBasicPreview();
  };

  const renderAudioPreview = () => {
    return (
      <div className="bg-gray-900/50 rounded-lg p-6 text-center">
        <button className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-indigo-700 transition-colors">
          <Play className="w-6 h-6 text-white ml-1" />
        </button>
        <p className="text-gray-400 text-sm">Audio preview</p>
        {previewData?.data.format === 'json' && (
          <div className="mt-4 text-xs text-gray-500">
            <p>Duration: {(previewData.data.content as any)?.duration || 'Unknown'}</p>
            <p>Sample Rate: {(previewData.data.content as any)?.sample_rate || 'Unknown'}</p>
          </div>
        )}
      </div>
    );
  };

  const renderModelPreview = () => {
    return (
      <div className="bg-gray-900/50 rounded-lg p-6 text-center">
        <div className="w-32 h-32 bg-gray-800 rounded-lg mx-auto mb-4 flex items-center justify-center">
          <div className="text-gray-400 text-4xl">📦</div>
        </div>
        <p className="text-gray-400 text-sm">3D Model Preview</p>
        {previewData?.data.format === 'json' && (
          <div className="mt-4 text-xs text-gray-500">
            <p>Vertices: {(previewData.data.content as any)?.geometry?.vertices || 'Unknown'}</p>
            <p>Triangles: {(previewData.data.content as any)?.geometry?.triangles || 'Unknown'}</p>
          </div>
        )}
      </div>
    );
  };

  const renderTextPreview = () => {
    return (
      <div className="bg-gray-900/50 rounded-lg p-6">
        <div className="text-xs text-gray-300 font-mono max-h-48 overflow-y-auto">
          {previewData?.data.format === 'text' ? 
            (previewData.data.content as string).split('\n').slice(0, 10).join('\n') + 
            (((previewData.data.content as string).split('\n').length > 10) ? '\n...' : '')
            : 'Text preview not available'
          }
        </div>
      </div>
    );
  };

  const renderUnsupportedPreview = () => {
    return (
      <div className="bg-gray-900/50 rounded-lg p-8 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-gray-400 text-sm">
          Preview not supported for this asset type
        </p>
        {previewData?.preview_type.type === 'unsupported' && previewData.preview_type.reason && (
          <p className="text-xs text-gray-500 mt-2">{previewData.preview_type.reason}</p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">{asset.name}</h3>
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <span>{asset.type}</span>
          <span>•</span>
          <span className="font-mono">{asset.path}</span>
        </div>
      </div>

      <div className="space-y-4">
        {renderPreviewContent()}

        {/* Asset Info */}
        <div className="pt-4 border-t border-gray-700/50">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-400">Type:</dt>
              <dd className="text-white">{asset.type}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">Size:</dt>
              <dd className="text-white">{formatFileSize(asset.size)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">Dependencies:</dt>
              <dd className="text-white">{asset.dependencies?.length || 0}</dd>
            </div>
            {previewData && (
              <div className="flex justify-between">
                <dt className="text-gray-400">Preview:</dt>
                <dd className="text-white capitalize">{previewData.preview_type.type}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}