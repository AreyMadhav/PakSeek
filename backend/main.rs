// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
// Suppress dead code warnings for unused utility functions
#![allow(dead_code)]

use axum::{
    extract::{Path, Query},
    http::{HeaderValue, Method, StatusCode},
    response::Json,
    routing::get,
    Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::Mutex;
use tower_http::cors::{Any, CorsLayer};
use tracing::{info, warn};

// Import our modules
mod pak_parser;
mod utoc_parser;
mod preview;
mod dependency_map;

// Re-export specific types from modules to avoid naming conflicts
pub use pak_parser::{PakParser, PakFile, PakEntry, CompressionMethod};
pub use utoc_parser::{UtocUcasParser, UtocFile};
pub use preview::{Asset, PreviewResponse, PreviewType, PreviewData, generate_preview_data};
pub use dependency_map::{DependencyMap};

/// Application state shared between handlers
#[derive(Clone)]
pub struct AppState {
    pub assets: Arc<Mutex<Vec<Asset>>>,
    pub dependencies: Arc<Mutex<DependencyMap>>,
}

/// Main entry point for the Tauri application
fn main() {
    // Initialize tracing for logging
    tracing_subscriber::fmt::init();

    println!("=== TAURI DEBUG: Starting Tauri application...");
    println!("=== TAURI DEBUG: Current working directory: {:?}", std::env::current_dir());

    // Start Tauri application
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            test_command,
            list_assets,
            get_preview,
            get_dependencies,
            get_app_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Starts the API server on localhost:3001
async fn start_api_server() -> anyhow::Result<()> {
    info!("Starting API server...");

    // Initialize application state with mock data
    let state = AppState {
        assets: Arc::new(Mutex::new(create_mock_assets())),
        dependencies: Arc::new(Mutex::new(create_mock_dependencies())),
    };

    // Configure CORS for Tauri frontend
    let cors = CorsLayer::new()
        .allow_origin("tauri://localhost".parse::<HeaderValue>().unwrap())
        .allow_origin("http://localhost:1420".parse::<HeaderValue>().unwrap()) // Tauri dev server
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers(Any);

    // Build the router with all endpoints
    let app = Router::new()
        .route("/assets", get(get_assets))
        .route("/preview/:asset_name", get(get_preview_http))
        .route("/dependencies", get(get_dependencies_http))
        .route("/health", get(health_check))
        .layer(cors)
        .with_state(state);

    // Start server on localhost:3001
    let addr = SocketAddr::from(([127, 0, 0, 1], 3001));
    info!("API server listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    match axum::serve(listener, app.into_make_service()).await {
        Ok(_) => {
            info!("API server shut down gracefully");
            Ok(())
        }
        Err(e) => {
            warn!("API server error: {}", e);
            Err(e.into())
        }
    }
}

// ============================================================================
// API HANDLERS
// ============================================================================

/// GET /assets - Returns list of all assets
async fn get_assets(
    axum::extract::State(state): axum::extract::State<AppState>,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<AssetsResponse>, StatusCode> {
    let assets = state.assets.lock().await;
    let mut filtered_assets = assets.clone();

    // Apply filters if provided
    if let Some(asset_type) = params.get("type") {
        filtered_assets.retain(|asset| asset.asset_type == *asset_type);
    }

    if let Some(search) = params.get("search") {
        let search_lower = search.to_lowercase();
        filtered_assets.retain(|asset| {
            asset.name.to_lowercase().contains(&search_lower) ||
            asset.path.to_lowercase().contains(&search_lower)
        });
    }

    Ok(Json(AssetsResponse {
        assets: filtered_assets.clone(),
        total: assets.len(),
        filtered: filtered_assets.len(),
    }))
}

/// GET /preview/{asset_name} - Returns preview data for an asset
async fn get_preview_http(
    Path(asset_name): Path<String>,
    axum::extract::State(state): axum::extract::State<AppState>,
) -> Result<Json<PreviewResponse>, StatusCode> {
    let assets = state.assets.lock().await;
    
    if let Some(asset) = assets.iter().find(|a| a.name == asset_name) {
        let preview_data = generate_preview_data(asset).await;
        Ok(Json(preview_data))
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}

/// GET /dependencies - Returns asset dependency mapping
async fn get_dependencies_http(
    axum::extract::State(state): axum::extract::State<AppState>,
) -> Result<Json<DependencyResponse>, StatusCode> {
    let dependencies = state.dependencies.lock().await;
    Ok(Json(DependencyResponse {
        dependencies: dependencies.clone(),
    }))
}

/// GET /health - Health check endpoint
async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now(),
        "version": env!("CARGO_PKG_VERSION")
    }))
}

// ============================================================================
// TAURI COMMANDS (for frontend integration)
// ============================================================================

/// Simple test command to verify frontend-backend communication
#[tauri::command]
async fn test_command(message: String) -> Result<String, String> {
    eprintln!("=== DEBUG: test_command called with message: {}", message);
    Ok(format!("Backend received: {}", message))
}

/// Tauri command to list assets with optional filtering
#[tauri::command]
async fn list_assets(
    asset_type: Option<String>,
    search: Option<String>,
    target_folder: Option<String>,
) -> Result<AssetsResponse, String> {
    eprintln!("=== DEBUG: list_assets command called!");
    eprintln!("=== DEBUG: target_folder parameter: {:?}", target_folder);
    eprintln!("=== DEBUG: asset_type parameter: {:?}", asset_type);
    eprintln!("=== DEBUG: search parameter: {:?}", search);
    
    // Use provided folder or default to current directory
    let folder = target_folder.unwrap_or_else(|| ".".to_string());
    
    eprintln!("=== DEBUG: Starting asset scan for path: {}", folder);
    eprintln!("=== DEBUG: Current working directory: {:?}", std::env::current_dir());
    
    // Check if the path exists first
    let path = std::path::Path::new(&folder);
    eprintln!("=== DEBUG: Path exists: {}", path.exists());
    eprintln!("=== DEBUG: Path is file: {}", path.is_file());
    eprintln!("=== DEBUG: Path is dir: {}", path.is_dir());
    
    if !path.exists() {
        let error_msg = format!("Path does not exist: {}", folder);
        eprintln!("=== ERROR: {}", error_msg);
        return Err(error_msg);
    }
    
    let pak_files = if path.is_file() && folder.to_lowercase().ends_with(".pak") {
        // Single .pak file provided
        eprintln!("=== DEBUG: Processing single .pak file: {}", folder);
        vec![folder.clone()]
    } else if path.is_dir() {
        // Directory provided - scan for .pak files
        eprintln!("=== DEBUG: Scanning directory for .pak files...");
        eprintln!("=== DEBUG: Directory exists: {}", path.exists());
        eprintln!("=== DEBUG: Directory readable: {:?}", std::fs::read_dir(&folder));
        
        match pak_parser::utils::find_pak_files(&folder).await {
            Ok(files) => {
                eprintln!("=== DEBUG: Successfully found {} .pak files", files.len());
                files
            },
            Err(e) => {
                let error_msg = format!("Failed to scan directory '{}': {}", folder, e);
                eprintln!("=== ERROR: {}", error_msg);
                eprintln!("=== DEBUG: Attempting manual directory scan...");
                
                // Fallback: try manual directory scan
                match std::fs::read_dir(&folder) {
                    Ok(entries) => {
                        let mut manual_pak_files = Vec::new();
                        for entry in entries {
                            if let Ok(entry) = entry {
                                let entry_path = entry.path();
                                eprintln!("=== DEBUG: Found file: {:?}", entry_path);
                                if let Some(ext) = entry_path.extension() {
                                    if ext == "pak" {
                                        if let Some(path_str) = entry_path.to_str() {
                                            manual_pak_files.push(path_str.to_string());
                                        }
                                    }
                                }
                            }
                        }
                        eprintln!("=== DEBUG: Manual scan found {} .pak files", manual_pak_files.len());
                        manual_pak_files
                    },
                    Err(dir_err) => {
                        let final_error = format!("Failed to read directory '{}': {}", folder, dir_err);
                        eprintln!("=== ERROR: {}", final_error);
                        return Err(final_error);
                    }
                }
            }
        }
    } else {
        let error_msg = format!("Path is neither a .pak file nor a directory: {}", folder);
        eprintln!("=== ERROR: {}", error_msg);
        return Err(error_msg);
    };
    
    eprintln!("=== DEBUG: Found {} .pak files: {:?}", pak_files.len(), pak_files);
    
    if pak_files.is_empty() {
        eprintln!("=== DEBUG: No .pak files found, returning mock data for development");
        // Return mock data if no pak files found (for development)
        let mock_assets = create_mock_assets();
        return Ok(AssetsResponse {
            assets: mock_assets.clone(),
            total: mock_assets.len(),
            filtered: mock_assets.len(),
        });
    }
    
    let mut all_assets = Vec::new();
    
    // Parse each .pak file and extract asset information (without size limits)
    for pak_path in &pak_files {
        eprintln!("=== DEBUG: Processing .pak file: {}", pak_path);
        
        // Check file size for logging but don't limit it
        if let Ok(metadata) = std::fs::metadata(pak_path) {
            let file_size_mb = metadata.len() as f64 / (1024.0 * 1024.0);
            eprintln!("=== DEBUG: .pak file size: {:.2} MB", file_size_mb);
        }
        
        let parser = pak_parser::PakParser::new(pak_path);
        match parser.parse().await {
            Ok(pak_file) => {
                eprintln!("=== DEBUG: Successfully parsed {} with {} entries", pak_path, pak_file.entries.len());
                // Convert pak entries to our Asset format
                for entry in pak_file.entries {
                    // Determine asset type from file extension
                    let determined_type = determine_asset_type(&entry.filename);
                    
                    let asset = Asset {
                        name: extract_asset_name(&entry.filename),
                        path: entry.filename.clone(),
                        asset_type: determined_type,
                        size: entry.uncompressed_size,
                        pak_file: Some(pak_path.clone()),
                        compressed_size: Some(entry.compressed_size),
                        compression_method: Some(format!("{:?}", entry.compression_method)),
                        is_encrypted: Some(entry.is_encrypted),
                        hash: entry.sha1_hash.map(|h| h.into_bytes()),
                        last_modified: chrono::Utc::now(), // Default since pak files don't store modification times
                        metadata: None, // Will be populated later if needed
                    };
                    
                    all_assets.push(asset);
                }
            },
            Err(e) => {
                eprintln!("=== DEBUG: Failed to parse .pak file {}: {}", pak_path, e);
                // Continue processing other pak files instead of failing completely
            }
        }
    }
    
    let mut filtered_assets = all_assets.clone();

    // Apply filters if provided
    if let Some(asset_type) = asset_type {
        filtered_assets.retain(|asset| asset.asset_type == asset_type);
    }

    if let Some(search) = search {
        let search_lower = search.to_lowercase();
        filtered_assets.retain(|asset| {
            asset.name.to_lowercase().contains(&search_lower) ||
            asset.path.to_lowercase().contains(&search_lower)
        });
    }

    eprintln!("=== DEBUG: Returning {} total assets, {} filtered", all_assets.len(), filtered_assets.len());
    Ok(AssetsResponse {
        assets: filtered_assets.clone(),
        total: all_assets.len(),
        filtered: filtered_assets.len(),
    })
}

/// Tauri command to get preview data for a specific asset
#[tauri::command]
async fn get_preview(asset_name: String) -> Result<PreviewResponse, String> {
    info!("Getting preview for asset: {}", asset_name);
    
    let assets = create_mock_assets();
    
    if let Some(asset) = assets.iter().find(|a| a.name == asset_name) {
        let preview_data = generate_preview_data(asset).await;
        Ok(preview_data)
    } else {
        Err(format!("Asset not found: {}", asset_name))
    }
}

/// Tauri command to get dependency information
#[tauri::command]
async fn get_dependencies(asset_name: Option<String>) -> Result<DependencyResponse, String> {
    info!("Getting dependencies for asset: {:?}", asset_name);
    
    let dependencies = create_mock_dependencies();
    
    match asset_name {
        Some(name) => {
            // Return dependencies for specific asset
            let asset_deps = dependencies.dependencies.get(&name).cloned().unwrap_or_default();
            let mut filtered_deps = HashMap::new();
            filtered_deps.insert(name, asset_deps);
            
            Ok(DependencyResponse {
                dependencies: DependencyMap { dependencies: filtered_deps },
            })
        },
        None => {
            // Return all dependencies
            Ok(DependencyResponse {
                dependencies,
            })
        }
    }
}

/// Tauri command to get application information
#[tauri::command]
async fn get_app_info() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "name": env!("CARGO_PKG_NAME"),
        "version": env!("CARGO_PKG_VERSION"),
        "description": "Unreal Engine Asset Explorer and Dependency Mapper"
    }))
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

#[derive(Serialize, Deserialize, Clone)]
pub struct AssetsResponse {
    pub assets: Vec<Asset>,
    pub total: usize,
    pub filtered: usize,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct DependencyResponse {
    pub dependencies: DependencyMap,
}

// ============================================================================
// MOCK DATA GENERATION
// ============================================================================

/// Creates mock asset data for development and testing
fn create_mock_assets() -> Vec<Asset> {
    vec![
        Asset {
            name: "PlayerCharacterMesh".to_string(),
            asset_type: "mesh".to_string(),
            size: 2_457_600, // ~2.4MB
            path: "/Game/Characters/Player/PlayerCharacterMesh.uasset".to_string(),
            last_modified: chrono::Utc::now() - chrono::Duration::days(5),
            metadata: Some(serde_json::json!({
                "vertices": 15420,
                "triangles": 8932,
                "materials": ["PlayerSkin", "PlayerClothes"]
            })),
            pak_file: None,
            compressed_size: None,
            compression_method: None,
            is_encrypted: None,
            hash: None,
        },
        Asset {
            name: "MainMenuBackground".to_string(),
            asset_type: "texture".to_string(),
            size: 4_194_304, // 4MB
            path: "/Game/UI/Textures/MainMenuBackground.uasset".to_string(),
            last_modified: chrono::Utc::now() - chrono::Duration::days(2),
            metadata: Some(serde_json::json!({
                "resolution": "1920x1080",
                "format": "DXT5",
                "mip_levels": 11
            })),
            pak_file: None,
            compressed_size: None,
            compression_method: None,
            is_encrypted: None,
            hash: None,
        },
        Asset {
            name: "AmbientForestLoop".to_string(),
            asset_type: "audio".to_string(),
            size: 1_048_576, // 1MB
            path: "/Game/Audio/Ambient/AmbientForestLoop.uasset".to_string(),
            last_modified: chrono::Utc::now() - chrono::Duration::days(1),
            metadata: Some(serde_json::json!({
                "duration": "00:02:30",
                "sample_rate": 44100,
                "channels": 2,
                "compression": "Vorbis"
            })),
            pak_file: None,
            compressed_size: None,
            compression_method: None,
            is_encrypted: None,
            hash: None,
        },
        Asset {
            name: "WeaponSwordMaterial".to_string(),
            asset_type: "material".to_string(),
            size: 512_000, // 512KB
            path: "/Game/Weapons/Materials/WeaponSwordMaterial.uasset".to_string(),
            last_modified: chrono::Utc::now() - chrono::Duration::days(3),
            metadata: Some(serde_json::json!({
                "shader": "DefaultLit",
                "textures": ["SwordDiffuse", "SwordNormal", "SwordRoughness"]
            })),
            pak_file: None,
            compressed_size: None,
            compression_method: None,
            is_encrypted: None,
            hash: None,
        },
        Asset {
            name: "ExplosionParticles".to_string(),
            asset_type: "particle_system".to_string(),
            size: 768_000, // 768KB
            path: "/Game/VFX/Particles/ExplosionParticles.uasset".to_string(),
            last_modified: chrono::Utc::now() - chrono::Duration::hours(12),
            metadata: Some(serde_json::json!({
                "max_particles": 500,
                "duration": 2.5,
                "emitters": 3
            })),
            pak_file: None,
            compressed_size: None,
            compression_method: None,
            is_encrypted: None,
            hash: None,
        },
    ]
}

/// Creates mock dependency mapping for development
fn create_mock_dependencies() -> DependencyMap {
    let mut deps = HashMap::new();
    
    deps.insert("PlayerCharacterMesh".to_string(), vec![
        "PlayerSkinTexture".to_string(),
        "PlayerClothesTexture".to_string(),
        "PlayerMaterial".to_string(),
    ]);
    
    deps.insert("MainMenuBackground".to_string(), vec![
        "UIShader".to_string(),
    ]);
    
    deps.insert("WeaponSwordMaterial".to_string(), vec![
        "SwordDiffuseTexture".to_string(),
        "SwordNormalTexture".to_string(),
        "SwordRoughnessTexture".to_string(),
        "DefaultLitShader".to_string(),
    ]);
    
    deps.insert("ExplosionParticles".to_string(), vec![
        "ExplosionTexture".to_string(),
        "ParticleShader".to_string(),
        "ExplosionSound".to_string(),
    ]);
    
    DependencyMap { dependencies: deps }
}

/// Determines the asset type based on file extension and path patterns
fn determine_asset_type(filename: &str) -> String {
    let path = std::path::Path::new(filename);
    
    // Get file extension
    if let Some(extension) = path.extension().and_then(|s| s.to_str()) {
        match extension.to_lowercase().as_str() {
            "umap" => "Map".to_string(),
            "uasset" => {
                // For .uasset files, try to determine type from path patterns
                let filename_lower = filename.to_lowercase();
                if filename_lower.contains("/textures/") || filename_lower.contains("_diffuse") 
                   || filename_lower.contains("_normal") || filename_lower.contains("_roughness") {
                    "Texture2D".to_string()
                } else if filename_lower.contains("/materials/") || filename_lower.contains("_mat") {
                    "Material".to_string()
                } else if filename_lower.contains("/meshes/") || filename_lower.contains("_mesh") 
                          || filename_lower.contains("/models/") {
                    "Static Mesh".to_string()
                } else if filename_lower.contains("/blueprints/") || filename_lower.contains("bp_") {
                    "Blueprint".to_string()
                } else if filename_lower.contains("/ui/") || filename_lower.contains("wbp_") {
                    "Widget Blueprint".to_string()
                } else if filename_lower.contains("/sounds/") || filename_lower.contains("/audio/") {
                    "Sound Wave".to_string()
                } else if filename_lower.contains("/animations/") || filename_lower.contains("_anim") {
                    "Animation".to_string()
                } else if filename_lower.contains("/particles/") || filename_lower.contains("_particles") {
                    "Particle System".to_string()
                } else {
                    "Asset".to_string() // Generic asset type
                }
            },
            "uexp" => "Asset Data".to_string(),
            "ubulk" => "Asset Bulk Data".to_string(),
            "pak" => "Package".to_string(),
            _ => "Unknown".to_string(),
        }
    } else {
        "Unknown".to_string()
    }
}

/// Extracts a clean asset name from the full file path
fn extract_asset_name(filename: &str) -> String {
    let path = std::path::Path::new(filename);
    
    // Get the file stem (filename without extension)
    if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
        // Remove common Unreal Engine prefixes
        let cleaned = stem
            .strip_prefix("BP_").unwrap_or(stem)
            .strip_prefix("WBP_").unwrap_or(stem)
            .strip_prefix("T_").unwrap_or(stem)
            .strip_prefix("M_").unwrap_or(stem)
            .strip_prefix("SM_").unwrap_or(stem)
            .strip_prefix("SK_").unwrap_or(stem)
            .strip_prefix("A_").unwrap_or(stem)
            .strip_prefix("S_").unwrap_or(stem);
        
        // Convert underscores to spaces and title case
        cleaned
            .replace('_', " ")
            .split_whitespace()
            .map(|word| {
                let mut chars = word.chars();
                match chars.next() {
                    None => String::new(),
                    Some(first) => first.to_uppercase().collect::<String>() + &chars.as_str().to_lowercase(),
                }
            })
            .collect::<Vec<_>>()
            .join(" ")
    } else {
        // Fallback to the filename itself
        filename.to_string()
    }
}