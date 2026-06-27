import { invoke } from '@tauri-apps/api/tauri';

/**
 * Writes a file to the path retriveved by combining `baseDir` and `relativePath`.
 * The path is required to end with ".wav".
 */
// /src-tauri/src/files.rs
export async function writeSampleFile(baseDir: string, relativePath: string, buffer: Buffer) {
  await invoke("write_sample_file", {
    baseDir,
    relativePath,
    buffer: Array.from(buffer)
  });
}

/**
 * Checks if a file exists on the path retriveved by combining `baseDir` and `relativePath`.
 */
// /src-tauri/src/files.rs
export async function checkFileExists(baseDir: string, relativePath: string) {
  return await invoke<boolean>("file_exists", {
    baseDir,
    relativePath
  });
}

/**
 * Creates an empty placeholder file on the path retriveved by combining "baseDir" and "relativePath".
 */
// /src-tauri/src/files.rs
export async function createPlaceholder(baseDir: string, relativePath: string) {
  await invoke("create_placeholder_file", {
    baseDir,
    relativePath
  });
}

/**
 * Describes a single downloaded sample found in the local sample directory.
 */
export interface LocalSampleFile {
  /** Path relative to the sample directory, using forward slashes (e.g. "Pack/kick.wav"). */
  relativePath: string;
  /** The bare file name, including the extension (e.g. "kick.wav"). */
  name: string;
  /** The immediate parent folder, treated as the "pack". Empty when at the root. */
  pack: string;
  /** File size in bytes. */
  size: number;
}

/**
 * Recursively scans `baseDir` for downloaded `.wav` samples, returning each one with its
 * relative path, name, pack folder, and size. Returns an empty array if the directory
 * does not exist.
 */
// /src-tauri/src/files.rs
export async function scanSampleFiles(baseDir: string) {
  // Rust serializes struct fields in snake_case; map them to our camelCase shape.
  const raw = await invoke<{
    relative_path: string,
    name: string,
    pack: string,
    size: number
  }[]>("scan_sample_files", { baseDir });

  return raw.map<LocalSampleFile>(x => ({
    relativePath: x.relative_path,
    name: x.name,
    pack: x.pack,
    size: x.size
  }));
}

/**
 * Reads the raw bytes of a local `.wav` sample for in-app preview playback.
 */
// /src-tauri/src/files.rs
export async function readSampleFile(baseDir: string, relativePath: string) {
  const bytes = await invoke<number[]>("read_sample_file", {
    baseDir,
    relativePath
  });
  return new Uint8Array(bytes);
}

/**
 * Deletes the local sample at the path obtained by combining `baseDir` and `relativePath`.
 * The deletion is constrained to `.wav` files inside `baseDir`.
 */
// /src-tauri/src/files.rs
export async function deleteSampleFile(baseDir: string, relativePath: string) {
  await invoke("delete_sample_file", {
    baseDir,
    relativePath
  });
}

