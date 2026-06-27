import type { LocalSampleFile } from "../native";

/**
 * A group of local samples that share the same parent ("pack") folder.
 */
export interface LocalSamplePack {
  /** The pack (parent folder) name. Falls back to a friendly label for root-level files. */
  name: string;
  /** The samples that belong to this pack, sorted by name. */
  samples: LocalSampleFile[];
  /** The combined size, in bytes, of every sample in the pack. */
  totalSize: number;
}

/** The label used for samples that live directly in the sample directory (no pack folder). */
export const LOOSE_PACK_NAME = "(loose samples)";

/**
 * Groups a flat list of local samples by their pack (parent folder), sorting packs
 * alphabetically and samples within each pack by name. This is pure (no file-system or
 * Tauri access) so it can be unit-tested in isolation.
 */
export function groupByPack(files: LocalSampleFile[]): LocalSamplePack[] {
  const groups = new Map<string, LocalSampleFile[]>();

  for (const file of files) {
    const key = file.pack.trim() === "" ? LOOSE_PACK_NAME : file.pack;
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(file);
    } else {
      groups.set(key, [file]);
    }
  }

  return Array.from(groups.entries())
    .map(([name, samples]) => ({
      name,
      samples: [...samples].sort((a, b) => a.name.localeCompare(b.name)),
      totalSize: samples.reduce((sum, x) => sum + x.size, 0)
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Formats a byte count into a short human-readable string (e.g. "1.4 MB").
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
}
