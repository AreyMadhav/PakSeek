use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use anyhow::Result;

/// Represents the dependency mapping between assets
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DependencyMap {
    pub dependencies: HashMap<String, Vec<String>>,
}

/// Response structure for dependency data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DependencyAnalysis {
    pub asset_name: String,
    pub direct_dependencies: Vec<String>,
    pub reverse_dependencies: Vec<String>,
    pub dependency_tree: DependencyTree,
    pub statistics: DependencyStatistics,
}

/// Tree structure representing asset dependencies
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DependencyTree {
    pub asset: String,
    pub depth: u32,
    pub dependencies: Vec<DependencyTree>,
    pub is_circular: bool,
}

/// Statistics about asset dependencies
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DependencyStatistics {
    pub total_dependencies: usize,
    pub max_depth: u32,
    pub circular_references: Vec<Vec<String>>,
    pub orphaned_assets: Vec<String>,
    pub most_referenced: Vec<(String, usize)>,
}

impl DependencyMap {
    /// Creates a new empty dependency map
    pub fn new() -> Self {
        Self {
            dependencies: HashMap::new(),
        }
    }

    /// Adds a dependency relationship
    pub fn add_dependency(&mut self, asset: &str, dependency: &str) {
        self.dependencies
            .entry(asset.to_string())
            .or_insert_with(Vec::new)
            .push(dependency.to_string());
    }

    /// Removes a dependency relationship
    pub fn remove_dependency(&mut self, asset: &str, dependency: &str) {
        if let Some(deps) = self.dependencies.get_mut(asset) {
            deps.retain(|d| d != dependency);
            if deps.is_empty() {
                self.dependencies.remove(asset);
            }
        }
    }

    /// Gets direct dependencies for an asset
    pub fn get_dependencies(&self, asset: &str) -> Vec<String> {
        self.dependencies
            .get(asset)
            .cloned()
            .unwrap_or_default()
    }

    /// Gets assets that depend on the given asset (reverse dependencies)
    pub fn get_reverse_dependencies(&self, asset: &str) -> Vec<String> {
        self.dependencies
            .iter()
            .filter_map(|(key, deps)| {
                if deps.contains(&asset.to_string()) {
                    Some(key.clone())
                } else {
                    None
                }
            })
            .collect()
    }

    /// Gets all dependencies recursively (dependency tree)
    pub fn get_all_dependencies(&self, asset: &str) -> Result<Vec<String>> {
        let mut visited = HashSet::new();
        let mut result = Vec::new();
        self.collect_dependencies_recursive(asset, &mut visited, &mut result)?;
        Ok(result)
    }

    /// Recursive helper for collecting all dependencies
    fn collect_dependencies_recursive(
        &self,
        asset: &str,
        visited: &mut HashSet<String>,
        result: &mut Vec<String>,
    ) -> Result<()> {
        if visited.contains(asset) {
            return Ok(()); // Avoid infinite loops
        }
        
        visited.insert(asset.to_string());
        
        if let Some(deps) = self.dependencies.get(asset) {
            for dep in deps {
                if !result.contains(dep) {
                    result.push(dep.clone());
                }
                self.collect_dependencies_recursive(dep, visited, result)?;
            }
        }
        
        Ok(())
    }

    /// Builds a dependency tree for visualization
    pub fn build_dependency_tree(&self, asset: &str, max_depth: u32) -> DependencyTree {
        let mut visited = HashSet::new();
        self.build_tree_recursive(asset, 0, max_depth, &mut visited)
    }

    /// Recursive helper for building dependency tree
    fn build_tree_recursive(
        &self,
        asset: &str,
        depth: u32,
        max_depth: u32,
        visited: &mut HashSet<String>,
    ) -> DependencyTree {
        let is_circular = visited.contains(asset);
        
        if is_circular || depth >= max_depth {
            return DependencyTree {
                asset: asset.to_string(),
                depth,
                dependencies: Vec::new(),
                is_circular,
            };
        }

        visited.insert(asset.to_string());

        let dependencies = self
            .dependencies
            .get(asset)
            .map(|deps| {
                deps.iter()
                    .map(|dep| self.build_tree_recursive(dep, depth + 1, max_depth, visited))
                    .collect()
            })
            .unwrap_or_default();

        visited.remove(asset);

        DependencyTree {
            asset: asset.to_string(),
            depth,
            dependencies,
            is_circular: false,
        }
    }

    /// Detects circular dependencies in the map
    pub fn detect_circular_dependencies(&self) -> Vec<Vec<String>> {
        let mut circular_refs = Vec::new();
        let mut visited = HashSet::new();
        let mut recursion_stack = HashSet::new();

        for asset in self.dependencies.keys() {
            if !visited.contains(asset) {
                let mut path = Vec::new();
                self.detect_cycles_dfs(
                    asset,
                    &mut visited,
                    &mut recursion_stack,
                    &mut path,
                    &mut circular_refs,
                );
            }
        }

        circular_refs
    }

    /// DFS helper for cycle detection
    fn detect_cycles_dfs(
        &self,
        asset: &str,
        visited: &mut HashSet<String>,
        recursion_stack: &mut HashSet<String>,
        path: &mut Vec<String>,
        circular_refs: &mut Vec<Vec<String>>,
    ) {
        visited.insert(asset.to_string());
        recursion_stack.insert(asset.to_string());
        path.push(asset.to_string());

        if let Some(deps) = self.dependencies.get(asset) {
            for dep in deps {
                if !visited.contains(dep) {
                    self.detect_cycles_dfs(dep, visited, recursion_stack, path, circular_refs);
                } else if recursion_stack.contains(dep) {
                    // Found a cycle
                    let cycle_start = path.iter().position(|a| a == dep).unwrap();
                    let cycle = path[cycle_start..].to_vec();
                    circular_refs.push(cycle);
                }
            }
        }

        path.pop();
        recursion_stack.remove(asset);
    }

    /// Finds orphaned assets (assets with no dependencies and no reverse dependencies)
    pub fn find_orphaned_assets(&self, all_assets: &[String]) -> Vec<String> {
        let mut orphaned = Vec::new();
        let referenced_assets: HashSet<String> = self
            .dependencies
            .values()
            .flat_map(|deps| deps.iter().cloned())
            .collect();

        for asset in all_assets {
            // Asset is orphaned if it has no dependencies and is not referenced by others
            let has_dependencies = self.dependencies.contains_key(asset);
            let is_referenced = referenced_assets.contains(asset);

            if !has_dependencies && !is_referenced {
                orphaned.push(asset.clone());
            }
        }

        orphaned
    }

    /// Gets the most referenced assets (sorted by reference count)
    pub fn get_most_referenced_assets(&self, limit: usize) -> Vec<(String, usize)> {
        let mut reference_counts: HashMap<String, usize> = HashMap::new();

        // Count references for each asset
        for deps in self.dependencies.values() {
            for dep in deps {
                *reference_counts.entry(dep.clone()).or_insert(0) += 1;
            }
        }

        // Sort by reference count and take top N
        let mut sorted_refs: Vec<_> = reference_counts.into_iter().collect();
        sorted_refs.sort_by(|a, b| b.1.cmp(&a.1));
        sorted_refs.truncate(limit);

        sorted_refs
    }

    /// Generates comprehensive dependency analysis for an asset
    pub fn analyze_asset_dependencies(&self, asset: &str, all_assets: &[String]) -> DependencyAnalysis {
        let direct_dependencies = self.get_dependencies(asset);
        let reverse_dependencies = self.get_reverse_dependencies(asset);
        let dependency_tree = self.build_dependency_tree(asset, 5); // Max depth of 5
        let statistics = self.generate_statistics(all_assets);

        DependencyAnalysis {
            asset_name: asset.to_string(),
            direct_dependencies,
            reverse_dependencies,
            dependency_tree,
            statistics,
        }
    }

    /// Generates overall statistics for the dependency map
    pub fn generate_statistics(&self, all_assets: &[String]) -> DependencyStatistics {
        let circular_references = self.detect_circular_dependencies();
        let orphaned_assets = self.find_orphaned_assets(all_assets);
        let most_referenced = self.get_most_referenced_assets(10);
        
        // Calculate max depth by checking all assets
        let max_depth = all_assets
            .iter()
            .map(|asset| self.calculate_max_depth(asset))
            .max()
            .unwrap_or(0);

        let total_dependencies = self
            .dependencies
            .values()
            .map(|deps| deps.len())
            .sum();

        DependencyStatistics {
            total_dependencies,
            max_depth,
            circular_references,
            orphaned_assets,
            most_referenced,
        }
    }

    /// Calculates the maximum dependency depth for an asset
    fn calculate_max_depth(&self, asset: &str) -> u32 {
        let mut visited = HashSet::new();
        self.calculate_depth_recursive(asset, &mut visited)
    }

    /// Recursive helper for calculating dependency depth
    fn calculate_depth_recursive(&self, asset: &str, visited: &mut HashSet<String>) -> u32 {
        if visited.contains(asset) {
            return 0; // Avoid infinite loops
        }

        visited.insert(asset.to_string());

        let max_child_depth = self
            .dependencies
            .get(asset)
            .map(|deps| {
                deps.iter()
                    .map(|dep| self.calculate_depth_recursive(dep, visited))
                    .max()
                    .unwrap_or(0)
            })
            .unwrap_or(0);

        visited.remove(asset);
        max_child_depth + 1
    }

    /// Exports dependency map to various formats
    pub fn export_to_format(&self, format: &str) -> Result<String> {
        match format.to_lowercase().as_str() {
            "json" => Ok(serde_json::to_string_pretty(self)?),
            "dot" => Ok(self.export_to_dot()),
            "csv" => Ok(self.export_to_csv()),
            "yaml" => {
                // Note: Would need serde_yaml crate for actual YAML support
                Ok("YAML export not implemented yet".to_string())
            }
            _ => Err(anyhow::anyhow!("Unsupported export format: {}", format)),
        }
    }

    /// Exports to DOT format for GraphViz visualization
    fn export_to_dot(&self) -> String {
        let mut dot = String::from("digraph AssetDependencies {\n");
        dot.push_str("    rankdir=LR;\n");
        dot.push_str("    node [shape=box, style=rounded];\n\n");

        // Add nodes
        let all_assets: HashSet<String> = self
            .dependencies
            .keys()
            .cloned()
            .chain(
                self.dependencies
                    .values()
                    .flat_map(|deps| deps.iter().cloned()),
            )
            .collect();

        for asset in &all_assets {
            dot.push_str(&format!("    \"{}\";\n", asset));
        }

        dot.push('\n');

        // Add edges
        for (asset, deps) in &self.dependencies {
            for dep in deps {
                dot.push_str(&format!("    \"{}\" -> \"{}\";\n", asset, dep));
            }
        }

        dot.push_str("}\n");
        dot
    }

    /// Exports to CSV format
    fn export_to_csv(&self) -> String {
        let mut csv = String::from("Asset,Dependency\n");
        
        for (asset, deps) in &self.dependencies {
            for dep in deps {
                csv.push_str(&format!("{},{}\n", asset, dep));
            }
        }

        csv
    }

    /// Validates the dependency map for consistency
    pub fn validate(&self) -> Vec<String> {
        let mut issues = Vec::new();

        // Check for self-references
        for (asset, deps) in &self.dependencies {
            if deps.contains(asset) {
                issues.push(format!("Self-reference detected: {} depends on itself", asset));
            }
        }

        // Check for circular dependencies
        let circular_deps = self.detect_circular_dependencies();
        for cycle in circular_deps {
            issues.push(format!("Circular dependency detected: {}", cycle.join(" -> ")));
        }

        // Check for empty dependency lists
        for (asset, deps) in &self.dependencies {
            if deps.is_empty() {
                issues.push(format!("Asset {} has empty dependency list", asset));
            }
        }

        issues
    }

    /// Optimizes the dependency map by removing redundant dependencies
    pub fn optimize(&mut self) -> usize {
        let mut removed_count = 0;

        // Remove duplicate dependencies
        for (_, deps) in self.dependencies.iter_mut() {
            let original_len = deps.len();
            deps.sort();
            deps.dedup();
            removed_count += original_len - deps.len();
        }

        // Remove empty dependency lists
        let keys_to_remove: Vec<String> = self
            .dependencies
            .iter()
            .filter(|(_, deps)| deps.is_empty())
            .map(|(key, _)| key.clone())
            .collect();

        for key in keys_to_remove {
            self.dependencies.remove(&key);
        }

        removed_count
    }
}

impl Default for DependencyMap {
    fn default() -> Self {
        Self::new()
    }
}

/// Utility functions for working with dependencies
pub mod utils {
    use super::*;

    /// Parses dependencies from Unreal Engine asset files
    /// 
    /// TODO: Implement actual asset file parsing
    /// This should extract dependency information from:
    /// 1. .uasset files (serialized object references)
    /// 2. Blueprint files (node connections and references)
    /// 3. Material files (texture and shader references)
    /// 4. Level files (actor and component references)
    pub async fn extract_dependencies_from_asset(asset_path: &str) -> Result<Vec<String>> {
        tracing::info!("Extracting dependencies from: {}", asset_path);

        // PLACEHOLDER: Return mock dependencies based on asset type
        // TODO: Implement actual asset file parsing
        
        let asset_name = std::path::Path::new(asset_path)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("Unknown");

        // Mock dependencies based on common patterns
        let dependencies = match asset_path {
            path if path.contains("Character") => vec![
                "CharacterMaterial".to_string(),
                "CharacterSkeleton".to_string(),
                "CharacterAnimBlueprint".to_string(),
            ],
            path if path.contains("Material") => vec![
                "BaseTexture".to_string(),
                "NormalMap".to_string(),
                "MaterialShader".to_string(),
            ],
            path if path.contains("Audio") => vec![
                "AudioMixer".to_string(),
                "SoundCue".to_string(),
            ],
            _ => vec![format!("{}_DefaultDependency", asset_name)],
        };

        Ok(dependencies)
    }

    /// Scans a directory for asset files and builds a dependency map
    pub async fn scan_directory_for_dependencies(dir: &str) -> Result<DependencyMap> {
        use std::fs;

        let mut dependency_map = DependencyMap::new();
        
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries {
                if let Ok(entry) = entry {
                    let path = entry.path();
                    if let Some(extension) = path.extension() {
                        if extension == "uasset" {
                            if let Some(path_str) = path.to_str() {
                                let asset_name = path
                                    .file_stem()
                                    .and_then(|s| s.to_str())
                                    .unwrap_or("Unknown")
                                    .to_string();

                                let dependencies = extract_dependencies_from_asset(path_str).await?;
                                
                                for dep in dependencies {
                                    dependency_map.add_dependency(&asset_name, &dep);
                                }
                            }
                        }
                    }
                }
            }
        }

        Ok(dependency_map)
    }

    /// Merges multiple dependency maps
    pub fn merge_dependency_maps(maps: Vec<DependencyMap>) -> DependencyMap {
        let mut merged = DependencyMap::new();

        for map in maps {
            for (asset, deps) in map.dependencies {
                for dep in deps {
                    merged.add_dependency(&asset, &dep);
                }
            }
        }

        merged.optimize();
        merged
    }

    /// Filters dependency map to only include specific asset types
    pub fn filter_by_asset_type(
        map: &DependencyMap,
        asset_types: &[&str],
    ) -> DependencyMap {
        let mut filtered = DependencyMap::new();

        for (asset, deps) in &map.dependencies {
            // Simple heuristic: check if asset name contains type keywords
            let asset_matches = asset_types.iter().any(|&asset_type| {
                asset.to_lowercase().contains(&asset_type.to_lowercase())
            });

            if asset_matches {
                for dep in deps {
                    filtered.add_dependency(asset, dep);
                }
            }
        }

        filtered
    }

    /// Generates a dependency report in markdown format
    pub fn generate_markdown_report(
        map: &DependencyMap,
        all_assets: &[String],
    ) -> String {
        let stats = map.generate_statistics(all_assets);
        
        let mut report = String::from("# Asset Dependency Report\n\n");
        
        report.push_str(&format!("- **Total Dependencies**: {}\n", stats.total_dependencies));
        report.push_str(&format!("- **Maximum Depth**: {}\n", stats.max_depth));
        report.push_str(&format!("- **Circular References**: {}\n", stats.circular_references.len()));
        report.push_str(&format!("- **Orphaned Assets**: {}\n\n", stats.orphaned_assets.len()));

        if !stats.most_referenced.is_empty() {
            report.push_str("## Most Referenced Assets\n\n");
            for (asset, count) in &stats.most_referenced {
                report.push_str(&format!("- **{}**: {} references\n", asset, count));
            }
            report.push('\n');
        }

        if !stats.circular_references.is_empty() {
            report.push_str("## Circular Dependencies\n\n");
            for cycle in &stats.circular_references {
                report.push_str(&format!("- {}\n", cycle.join(" → ")));
            }
            report.push('\n');
        }

        if !stats.orphaned_assets.is_empty() {
            report.push_str("## Orphaned Assets\n\n");
            for asset in &stats.orphaned_assets {
                report.push_str(&format!("- {}\n", asset));
            }
        }

        report
    }
}