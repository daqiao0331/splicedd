import { LocalSampleFile, deleteSampleFile, scanSampleFiles } from "../native";
import { LocalSamplePack, groupByPack } from "./grouping";

// Re-export the pure grouping helpers so callers have a single entry point.
export { LOOSE_PACK_NAME, groupByPack, formatFileSize } from "./grouping";
export type { LocalSamplePack } from "./grouping";

/**
 * Scans the given sample directory and returns its samples grouped by pack.
 * Returns an empty array when no directory is configured.
 */
export async function loadLocalLibrary(sampleDir: string): Promise<LocalSamplePack[]> {
  if (!sampleDir || sampleDir.trim() === "") {
    return [];
  }

  const files = await scanSampleFiles(sampleDir);
  return groupByPack(files);
}

/**
 * Deletes a local sample from disk.
 */
export async function removeLocalSample(sampleDir: string, sample: LocalSampleFile): Promise<void> {
  await deleteSampleFile(sampleDir, sample.relativePath);
}
