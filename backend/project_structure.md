# Unreal Asset Explorer - Backend Scaffold

## 📁 Project Structure

```
unreal-asset-explorer/
├── Cargo.toml                 # Rust dependencies and project configuration
├── tauri.conf.json           # Tauri configuration (create this)
├── build.rs                  # Tauri build script (create this)
├── src/
│   ├── main.rs               # Main application entry point + API server
│   ├── pak_parser.rs         # .pak file parsing logic (placeholder)
│   ├── utoc_parser.rs        # .utoc/.ucas file parsing logic (placeholder)
│   ├── preview.rs            # Asset preview generation (placeholder)
│   └── dependency_map.rs     # Asset dependency mapping (placeholder)
└── README.md
```

## 🚀 Quick Start

1. **Create the project directory:**
```bash
mkdir unreal-asset-explorer
cd unreal-asset-explorer
```

2. **Copy the generated files:**
   - Place `Cargo.toml` in the root directory
   - Create the `src/` directory and place all `.rs` files inside
   
3. **Create additional Tauri config files:**

**`tauri.conf.json`:**
```json
{
  "build": {
    "distDir": "../dist",
    "devPath": "http://localhost:1420",
    "beforeDevCommand": "",
    "beforeBuildCommand": ""
  },
  "package": {
    "productName": "Unreal Asset Explorer",
    "version": "0.1.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "all": false,
        "open": true
      }
    },
    "windows": [
      {
        "fullscreen": false,
        "height": 800,
        "resizable": true,
        "title": "Unreal Asset Explorer",
        "width": 1200
      }
    ]
  }
}
```

**`build.rs`:**
```rust
fn main() {
    tauri_build::build()
}
```

4. **Build and run:**
```bash
# Install dependencies
cargo check

# Run in development mode (starts both API server and Tauri app)
cargo run
```

## 🔌 API Endpoints

The backend provides these REST endpoints on `http://localhost:3001`:

### Assets
- **GET** `/assets` - List all assets
  - Query params: `?type=mesh&search=player`
  - Returns: `{ assets: Asset[], total: number, filtered: number }`

### Preview
- **GET** `/preview/{asset_name}` - Get preview data for asset
  - Returns: `PreviewResponse` with base64 image, JSON data, or text

### Dependencies  
- **GET** `/dependencies` - Get dependency mapping
  - Returns: `{ dependencies: { [assetName]: string[] } }`

### Health
- **GET** `/health` - API health check

## 📋 Mock Data

The backend includes realistic mock data:

**Assets (5 examples):**
- PlayerCharacterMesh (mesh, 2.4MB)
- MainMenuBackground (texture, 4MB) 
- AmbientForestLoop (audio, 1MB)
- WeaponSwordMaterial (material, 512KB)
- ExplosionParticles (particle_system, 768KB)

**Dependencies:**
- PlayerCharacterMesh → [PlayerSkinTexture, PlayerClothesTexture, PlayerMaterial]
- WeaponSwordMaterial → [SwordDiffuseTexture, SwordNormalTexture, ...]

## 🔧 Frontend Integration

**From your React frontend, call:**

```typescript
// Get assets
const response = await fetch('http://localhost:3001/assets');
const data = await response.json();

// Get preview
const preview = await fetch(`http://localhost:3001/preview/${assetName}`);
const previewData = await preview.json();

// Get dependencies
const deps = await fetch('http://localhost:3001/dependencies');
const depData = await deps.json();
```

**Tauri Commands (optional):**
```typescript
import { invoke } from '@tauri-apps/api/tauri';

// Check API server status
const status = await invoke('get_server_status');

// Refresh asset list
await invoke('refresh_assets');

// Get app info
const info = await invoke('get_app_info');
```

## 🛠 Implementation Roadmap

### Phase 1: Core Parsing (TODO)
- [ ] Implement actual `.pak` file parsing in `pak_parser.rs`
- [ ] Implement `.utoc/.ucas` parsing in `utoc_parser.rs`
- [ ] Add binary file reading with `nom` or `memmap2`

### Phase 2: Preview Generation (TODO)
- [ ] Texture extraction and thumbnail generation
- [ ] Audio waveform visualization
- [ ] 3D model wireframe/preview rendering
- [ ] Blueprint node graph extraction

### Phase 3: Advanced Features (TODO)
- [ ] Real-time file system watching
- [ ] Asset search and filtering
- [ ] Dependency graph visualization
- [ ] Export functionality (JSON, CSV, etc.)

## 📦 Key Dependencies

- **tauri**: Desktop app framework
- **axum**: Fast async HTTP server
- **serde**: Serialization/deserialization
- **tokio**: Async runtime
- **base64**: Base64 encoding for previews
- **chrono**: Date/time handling

**Future dependencies (commented out):**
- **nom**: Binary parsing for `.pak`/`.utoc` files
- **memmap2**: Memory-mapped file access for large files

## 🎯 Architecture Notes

**Modular Design:**
- Each parser is in its own module with clear interfaces
- API handlers are separate from parsing logic
- Mock data can be easily swapped for real implementations

**Async-First:**
- All file operations are async
- Non-blocking API server
- Ready for heavy file I/O operations

**Tauri Integration:**
- API server runs in background thread
- Tauri commands provide additional integration points
- CORS configured for Tauri frontend

**Error Handling:**
- Uses `anyhow` for error management
- Proper HTTP status codes
- Graceful fallbacks for unsupported assets

## 🔍 Testing the Backend

1. Start the application: `cargo run`
2. Test endpoints with curl:

```bash
# Test health
curl http://localhost:3001/health

# Get assets
curl http://localhost:3001/assets

# Get preview
curl http://localhost:3001/preview/PlayerCharacterMesh

# Get dependencies
curl http://localhost:3001/dependencies
```

The backend is now ready to integrate with your React frontend and can be extended with real Unreal Engine file parsing logic!