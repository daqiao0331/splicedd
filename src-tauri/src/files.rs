use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;

#[tauri::command]
pub async fn write_sample_file(base_dir: String, relative_path: String, buffer: Vec<u8>) -> Result<(), String> {
    if !relative_path.ends_with(".wav") {
        return Err("The relative path must end with .wav".into());
    }

    let mut full_path = PathBuf::from(base_dir);
    full_path.push(relative_path);

    if let Some(parent_dir) = full_path.parent() {
        if let Err(e) = fs::create_dir_all(parent_dir) {
            return Err(format!("Failed to create directories for {full_path:#?}: {e}"));
        }
    } else {
        return Err("Failed to determine parent directory".into());
    }

    match File::create(&full_path) {
        Ok(mut file) => {
            if let Err(e) = file.write_all(&buffer) {
                return Err(format!("Failed to write to file: {}", e));
            }
        },
        Err(e) => {
            return Err(format!("Failed to create file: {}", e));
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn file_exists(base_dir: String, relative_path: String) -> Result<bool, String> {
    let mut full_path = PathBuf::from(base_dir);
    full_path.push(relative_path);

    Ok(full_path.exists())
}

#[tauri::command]
pub async fn create_placeholder_file(base_dir: String, relative_path: String) -> Result<(), String> {
    let mut full_path = PathBuf::from(base_dir);
    full_path.push(relative_path);

    if let Some(parent_dir) = full_path.parent() {
        if let Err(e) = fs::create_dir_all(parent_dir) {
            return Err(format!("Failed to create directories for {full_path:#?}: {e}"));
        }
    } else {
        return Err("Failed to determine parent directory".into());
    }

    match File::create(&full_path) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to create file: {}", e)),
    }
}

#[tauri::command]
pub async fn delete_sample_file(base_dir: String, relative_path: String) -> Result<(), String> {
    let mut full_path = PathBuf::from(&base_dir);
    full_path.push(&relative_path);

    // Ensure the resolved path stays within the base directory
    let canonical_base = fs::canonicalize(&base_dir)
        .map_err(|e| format!("Invalid base directory: {e}"))?;
    let canonical_path = fs::canonicalize(&full_path)
        .map_err(|e| format!("File not found: {e}"))?;

    if !canonical_path.starts_with(&canonical_base) {
        return Err("Path traversal is not allowed".into());
    }

    fs::remove_file(&canonical_path)
        .map_err(|e| format!("Failed to delete file: {e}"))
}

#[tauri::command]
pub async fn scan_sample_files(base_dir: String) -> Result<Vec<String>, String> {
    let base = PathBuf::from(&base_dir);
    if !base.is_dir() {
        return Err("Sample directory does not exist".into());
    }

    let mut results = Vec::new();
    scan_dir_recursive(&base, &base, &mut results)?;
    Ok(results)
}

fn scan_dir_recursive(base: &PathBuf, current: &PathBuf, results: &mut Vec<String>) -> Result<(), String> {
    let entries = fs::read_dir(current)
        .map_err(|e| format!("Failed to read directory: {e}"))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {e}"))?;
        let path = entry.path();

        if path.is_dir() {
            scan_dir_recursive(base, &path, results)?;
        } else if let Some(ext) = path.extension() {
            if ext.eq_ignore_ascii_case("wav") {
                if let Ok(rel) = path.strip_prefix(base) {
                    // Normalize to forward slashes for cross-platform consistency
                    let rel_str = rel.to_string_lossy().replace('\\', "/");
                    results.push(rel_str);
                }
            }
        }
    }

    Ok(())
}