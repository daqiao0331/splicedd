use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;

use serde::Serialize;

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

/// Describes a single downloaded sample found in the local sample directory.
#[derive(Serialize)]
pub struct LocalSampleFile {
    /// Path relative to the sample directory, using forward slashes (e.g. "Pack/kick.wav").
    pub relative_path: String,
    /// The bare file name, including the extension (e.g. "kick.wav").
    pub name: String,
    /// The name of the immediate parent folder, treated as the "pack" (e.g. "Pack").
    /// Empty when the file sits directly in the sample directory.
    pub pack: String,
    /// File size in bytes.
    pub size: u64,
}

/// Recursively collects every `.wav` file found under `base_dir`, returning each one
/// with its path (relative to `base_dir`), name, parent-folder ("pack"), and size.
#[tauri::command]
pub async fn scan_sample_files(base_dir: String) -> Result<Vec<LocalSampleFile>, String> {
    let root = PathBuf::from(&base_dir);
    if !root.exists() {
        return Ok(Vec::new());
    }

    let mut out = Vec::new();
    let mut stack = vec![root.clone()];

    while let Some(dir) = stack.pop() {
        // Skip directories we can't read instead of failing the whole scan.
        let Ok(entries) = fs::read_dir(&dir) else { continue };

        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                stack.push(path);
                continue;
            }

            let is_wav = path
                .extension()
                .and_then(|x| x.to_str())
                .map(|x| x.eq_ignore_ascii_case("wav"))
                .unwrap_or(false);
            if !is_wav {
                continue;
            }

            let relative = match path.strip_prefix(&root) {
                Ok(r) => r.to_string_lossy().replace('\\', "/"),
                Err(_) => continue,
            };

            let name = path
                .file_name()
                .map(|x| x.to_string_lossy().into_owned())
                .unwrap_or_default();

            // The "pack" is the immediate parent folder, relative to the sample dir.
            let pack = path
                .parent()
                .and_then(|p| p.strip_prefix(&root).ok())
                .map(|p| p.to_string_lossy().replace('\\', "/"))
                .unwrap_or_default();

            let size = entry.metadata().map(|m| m.len()).unwrap_or(0);

            out.push(LocalSampleFile { relative_path: relative, name, pack, size });
        }
    }

    Ok(out)
}

/// Resolves `base_dir` + `relative_path` to a canonical path, requiring it to be a `.wav`
/// file that stays inside `base_dir` (guarding against "../" path traversal).
/// Returns `(canonical_root, canonical_target)`.
fn resolve_wav_inside(base_dir: &str, relative_path: &str) -> Result<(PathBuf, PathBuf), String> {
    if !relative_path.ends_with(".wav") {
        return Err("The relative path must end with .wav".into());
    }

    let root = PathBuf::from(base_dir);
    let mut full_path = root.clone();
    full_path.push(relative_path);

    let canonical_root = root.canonicalize().map_err(|e| format!("Invalid base directory: {e}"))?;
    let canonical_target = full_path.canonicalize().map_err(|e| format!("File not found: {e}"))?;
    if !canonical_target.starts_with(&canonical_root) {
        return Err("The path escapes the sample directory".into());
    }

    Ok((canonical_root, canonical_target))
}

/// Reads the raw bytes of a local sample at `base_dir` + `relative_path`, for in-app
/// preview playback. Constrained to `.wav` files inside `base_dir`.
#[tauri::command]
pub async fn read_sample_file(base_dir: String, relative_path: String) -> Result<Vec<u8>, String> {
    let (_, target) = resolve_wav_inside(&base_dir, &relative_path)?;
    fs::read(&target).map_err(|e| format!("Failed to read file: {e}"))
}

/// Deletes a single sample file located at `base_dir` + `relative_path`. The deletion is
/// constrained to paths inside `base_dir` and to `.wav` files, as a safety measure.
#[tauri::command]
pub async fn delete_sample_file(base_dir: String, relative_path: String) -> Result<(), String> {
    let (canonical_root, canonical_target) = resolve_wav_inside(&base_dir, &relative_path)?;

    fs::remove_file(&canonical_target).map_err(|e| format!("Failed to delete file: {e}"))?;

    // Clean up the pack folder if it's now empty.
    if let Some(parent) = canonical_target.parent() {
        if parent != canonical_root.as_path() && fs::read_dir(parent).map(|mut d| d.next().is_none()).unwrap_or(false) {
            let _ = fs::remove_dir(parent);
        }
    }

    Ok(())
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