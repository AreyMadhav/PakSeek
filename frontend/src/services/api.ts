import { Asset } from '../types';
import { 
  listAssets as tauriListAssets, 
  convertAssetToFrontend, 
  formatFileSize,
  isTauriApp 
} from '../api/tauriClient';

// Mock data for development (when not running in Tauri)
const mockAssets: Asset[] = [
  {
    id: '1',
    name: 'PlayerTexture_001',
    type: 'Texture',
    size: 2048576,
    path: '/Game/Characters/Player/Textures/',
    thumbnail: 'https://images.pexels.com/photos/1029604/pexels-photo-1029604.jpeg?w=100',
    dependencies: ['2', '3']
  },
  {
    id: '2',
    name: 'WeaponSound_Fire',
    type: 'Audio',
    size: 1024000,
    path: '/Game/Audio/Weapons/',
    dependencies: []
  },
  {
    id: '3',
    name: 'PlayerMesh_Body',
    type: 'Mesh',
    size: 5120000,
    path: '/Game/Characters/Player/Meshes/',
    dependencies: ['1']
  },
  {
    id: '4',
    name: 'WoodMaterial_01',
    type: 'Material',
    size: 512000,
    path: '/Game/Materials/Wood/',
    dependencies: ['5']
  },
  {
    id: '5',
    name: 'WoodTexture_Diffuse',
    type: 'Texture',
    size: 4096000,
    path: '/Game/Textures/Materials/Wood/',
    thumbnail: 'https://images.pexels.com/photos/129731/pexels-photo-129731.jpeg?w=100',
    dependencies: []
  }
];

export async function fetchAssets(
  page: number = 1, 
  limit: number = 20,
  searchTerm?: string,
  assetType?: string
): Promise<{ assets: Asset[], total: number }> {
  try {
    if (isTauriApp()) {
      // Use Tauri API when running in Tauri environment
      const response = await tauriListAssets(assetType, searchTerm);
      
      // Convert backend assets to frontend format
      const frontendAssets = response.assets.map(convertAssetToFrontend);
      
      // Apply pagination (since backend doesn't handle it yet)
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedAssets = frontendAssets.slice(start, end);
      
      return {
        assets: paginatedAssets,
        total: response.total
      };
    } else {
      // Fallback to mock data when not in Tauri (e.g., web development)
      console.warn('Not running in Tauri environment, using mock data');
      
      let filteredAssets = mockAssets;
      
      // Apply filters
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredAssets = filteredAssets.filter(asset =>
          asset.name.toLowerCase().includes(searchLower) ||
          asset.path.toLowerCase().includes(searchLower)
        );
      }
      
      if (assetType) {
        filteredAssets = filteredAssets.filter(asset => 
          asset.type.toLowerCase() === assetType.toLowerCase()
        );
      }
      
      // Apply pagination
      const start = (page - 1) * limit;
      const end = start + limit;
      
      return {
        assets: filteredAssets.slice(start, end),
        total: filteredAssets.length
      };
    }
  } catch (error) {
    console.error('Failed to fetch assets:', error);
    
    // Fallback to mock data on error
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
      assets: mockAssets.slice(start, end),
      total: mockAssets.length
    };
  }
}

// Re-export formatFileSize for backward compatibility
export { formatFileSize };