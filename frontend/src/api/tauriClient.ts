import { invoke } from "@tauri-apps/api/core";
import type { 
  BackendAsset, 
  AssetsResponse, 
  PreviewResponse, 
  DependencyResponse, 
  AppInfo,
  Asset 
} from '../types';

// Re-export types for convenience
export type { AppInfo, PreviewResponse };

// ============================================================================
// TAURI API CLIENT FUNCTIONS
// ============================================================================

/**
 * Lists assets with optional filtering
 * @param assetType - Filter by asset type (e.g., "texture", "mesh", "audio")
 * @param search - Search term to filter assets by name or path
 * @param targetFolder - Path to folder to scan for .pak files
 * @returns Promise with assets response
 */
export async function listAssets(
  assetType?: string,
  search?: string,
  targetFolder?: string
): Promise<AssetsResponse> {
  try {
    const response = await invoke<AssetsResponse>("list_assets", {
      asset_type: assetType,
      search,
      target_folder: targetFolder,
    });
    return response;
  } catch (error) {
    console.error("Failed to list assets:", error);
    throw new Error(`Failed to list assets: ${error}`);
  }
}

/**
 * Gets preview data for a specific asset
 * @param assetName - Name of the asset to preview
 * @returns Promise with preview response
 */
export async function getPreview(assetName: string): Promise<PreviewResponse> {
  try {
    const response = await invoke<PreviewResponse>("get_preview", {
      assetName,
    });
    return response;
  } catch (error) {
    console.error(`Failed to get preview for ${assetName}:`, error);
    throw new Error(`Failed to get preview for ${assetName}: ${error}`);
  }
}

/**
 * Gets dependency information for an asset or all dependencies
 * @param assetName - Optional asset name to get dependencies for. If not provided, returns all dependencies
 * @returns Promise with dependency response
 */
export async function getDependencies(
  assetName?: string
): Promise<DependencyResponse> {
  try {
    const response = await invoke<DependencyResponse>("get_dependencies", {
      assetName,
    });
    return response;
  } catch (error) {
    console.error("Failed to get dependencies:", error);
    throw new Error(`Failed to get dependencies: ${error}`);
  }
}

/**
 * Gets application information
 * @returns Promise with app info
 */
export async function getAppInfo(): Promise<AppInfo> {
  try {
    const response = await invoke<AppInfo>("get_app_info");
    return response;
  } catch (error) {
    console.error("Failed to get app info:", error);
    throw new Error(`Failed to get app info: ${error}`);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Formats file size in bytes to human readable format
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Converts backend asset to frontend asset format
 * @param backendAsset - Asset from backend
 * @returns Frontend-compatible asset
 */
export function convertAssetToFrontend(backendAsset: BackendAsset): Asset {
  return {
    id: backendAsset.name, // Use name as ID for now
    name: backendAsset.name,
    type: mapAssetType(backendAsset.asset_type),
    size: backendAsset.size,
    path: backendAsset.path,
    thumbnail: extractThumbnail(backendAsset),
    dependencies: [], // Will be populated from dependency map
  };
}

/**
 * Maps backend asset types to frontend asset types
 * @param backendType - Asset type from backend
 * @returns Frontend asset type
 */
function mapAssetType(backendType: string): Asset['type'] {
  switch (backendType.toLowerCase()) {
    case 'texture':
    case 'image':
      return 'Texture';
    case 'audio':
    case 'sound':
      return 'Audio';
    case 'mesh':
    case 'static_mesh':
    case 'skeletal_mesh':
      return 'Mesh';
    case 'material':
      return 'Material';
    case 'blueprint':
      return 'Blueprint';
    case 'animation':
      return 'Animation';
    default:
      return 'Texture'; // Default fallback
  }
}

/**
 * Extracts thumbnail URL from asset metadata or preview data
 * @param asset - Asset to extract thumbnail from
 * @returns Thumbnail URL or undefined
 */
function extractThumbnail(asset: BackendAsset): string | undefined {
  // Check if metadata contains thumbnail info
  if (asset.metadata?.thumbnail) {
    return asset.metadata.thumbnail;
  }
  
  // For now, return undefined - thumbnails will be generated via preview API
  return undefined;
}

/**
 * Handles API errors consistently
 * @param error - Error from API call
 * @param operation - Description of the operation that failed
 * @returns Formatted error message
 */
export function handleApiError(error: unknown, operation: string): string {
  if (typeof error === 'string') {
    return `${operation} failed: ${error}`;
  }
  
  if (error instanceof Error) {
    return `${operation} failed: ${error.message}`;
  }
  
  return `${operation} failed: Unknown error`;
}

/**
 * Checks if the app is running in Tauri environment
 * @returns True if running in Tauri, false otherwise
 */
export function isTauriApp(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Gets the asset type color for UI display
 * @param assetType - Asset type from backend
 * @returns CSS color class
 */
export function getAssetTypeColor(assetType: string): string {
  switch (assetType.toLowerCase()) {
    case 'texture':
    case 'image':
      return 'text-green-400';
    case 'audio':
    case 'sound':
      return 'text-purple-400';
    case 'mesh':
    case 'static_mesh':
    case 'skeletal_mesh':
      return 'text-blue-400';
    case 'material':
      return 'text-orange-400';
    case 'blueprint':
      return 'text-red-400';
    case 'animation':
      return 'text-yellow-400';
    default:
      return 'text-gray-400';
  }
}
