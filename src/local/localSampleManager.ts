import { invoke } from '@tauri-apps/api/tauri';

/**
 * Represents a locally stored sample file.
 */
export interface LocalSample {
  /** Display name derived from the file name (without extension). */
  name: string;
  /** The pack folder name this sample belongs to. */
  pack: string;
  /** Full relative path from the sample directory root. */
  relativePath: string;
  /** File extension (e.g. ".wav"). */
  extension: string;
}

/**
 * Scans the configured sample directory and returns all local sample files
 * organized by pack folder.
 */
export async function scanLocalSamples(sampleDir: string): Promise<LocalSample[]> {
  if (!sampleDir || sampleDir.trim() === "") {
    return [];
  }

  try {
    const paths = await invoke<string[]>("scan_sample_files", {
      baseDir: sampleDir,
    });

    return paths.map(relPath => {
      const parts = relPath.split("/");
      const fileName = parts[parts.length - 1];
      const pack = parts.length > 1 ? parts[0] : "";

      return {
        name: fileName.replace(/\.wav$/i, ""),
        pack,
        relativePath: relPath,
        extension: ".wav",
      };
    });
  } catch {
    return [];
  }
}

/**
 * Deletes a local sample file from disk.
 */
export async function deleteLocalSample(sampleDir: string, relativePath: string): Promise<boolean> {
  try {
    await invoke("delete_sample_file", {
      baseDir: sampleDir,
      relativePath,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Groups local samples by their pack folder name.
 */
export function groupByPack(samples: LocalSample[]): Map<string, LocalSample[]> {
  const map = new Map<string, LocalSample[]>();
  for (const s of samples) {
    const key = s.pack || "(Unsorted)";
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(s);
  }
  return map;
}
