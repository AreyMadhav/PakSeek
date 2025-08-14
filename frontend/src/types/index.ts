export interface Asset {
  id: string;
  name: string;
  type: 'Texture' | 'Audio' | 'Mesh' | 'Material' | 'Blueprint' | 'Animation';
  size: number;
  path: string;
  thumbnail?: string;
  dependencies?: string[];
}

export interface AssetFilters {
  type: string;
  sizeMin: number;
  sizeMax: number;
  searchTerm: string;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface Settings {
  darkMode: boolean;
  accentColor: string;
  themePreset: 'default' | 'purple' | 'blue' | 'green';
}

export interface DependencyNode {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  connections: string[];
}

// ============================================================================
// BACKEND TYPES - Keep in sync with Rust structs
// ============================================================================

export interface BackendAsset {
  name: string;
  asset_type: string;
  size: number;
  path: string;
  last_modified: string; // ISO datetime string
  metadata?: Record<string, any>;
}

export interface AssetsResponse {
  assets: BackendAsset[];
  total: number;
  filtered: number;
}

export interface PreviewData {
  format: 'base64' | 'json' | 'text' | 'url';
  content: string | Record<string, any>;
}

export interface PreviewType {
  type: 'image' | 'audio' | 'text' | 'model' | 'unsupported';
  // Additional properties based on type
  format?: string;
  width?: number;
  height?: number;
  duration?: number;
  sample_rate?: number;
  encoding?: string;
  lines?: number;
  vertices?: number;
  triangles?: number;
  materials?: string[];
  reason?: string;
}

export interface PreviewResponse {
  asset_name: string;
  preview_type: PreviewType;
  data: PreviewData;
  metadata?: Record<string, any>;
  generated_at: string; // ISO datetime string
}

export interface DependencyMap {
  dependencies: Record<string, string[]>;
}

export interface DependencyResponse {
  dependencies: DependencyMap;
}

export interface AppInfo {
  name: string;
  version: string;
  description: string;
}