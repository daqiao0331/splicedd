import { useEffect, useState } from "react";
import { CircularProgress } from "@nextui-org/react";
import { TrashIcon, FolderIcon } from "@heroicons/react/20/solid";

import { cfg } from "../../config";
import { LocalSample, scanLocalSamples, deleteLocalSample, groupByPack } from "../../local/localSampleManager";

/**
 * Displays and manages locally downloaded samples, grouped by pack.
 * Mirrors Splice's local library management strategy.
 */
export default function LocalSamplesPanel() {
  const [samples, setSamples] = useState<LocalSample[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    const dir = cfg().sampleDir;
    if (!dir || dir.trim() === "") {
      setError("Sample directory not configured. Please set it in Settings.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await scanLocalSamples(dir);
      setSamples(result);
    } catch {
      setError("Failed to scan sample directory.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(sample: LocalSample) {
    const success = await deleteLocalSample(cfg().sampleDir, sample.relativePath);
    if (success) {
      setSamples(prev => prev.filter(s => s.relativePath !== sample.relativePath));
    }
  }

  const grouped = groupByPack(samples);

  return (
    <div className="local-samples-panel" data-testid="local-samples-panel">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold">My Library</h2>
          <p className="text-small text-default-400">
            {samples.length} sample{samples.length !== 1 ? "s" : ""} downloaded
          </p>
        </div>
        <button
          onClick={refresh}
          className="text-sm text-foreground-400 hover:text-foreground-600 transition-colors"
          title="Refresh"
        >
          ↻ Refresh
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <CircularProgress aria-label="Scanning local samples..." />
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-foreground-400" data-testid="local-samples-error">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && samples.length === 0 && (
        <div className="text-center py-8 text-foreground-400" data-testid="local-samples-empty">
          <p>No samples downloaded yet.</p>
          <p className="text-xs mt-2">Search and drag samples to your DAW to start building your library.</p>
        </div>
      )}

      {!loading && !error && samples.length > 0 && (
        <div className="overflow-y-auto flex-1">
          {Array.from(grouped.entries()).map(([packName, packSamples]) => (
            <div key={packName} className="mb-4">
              <div className="flex items-center gap-2 mb-2 text-foreground-500">
                <FolderIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{packName}</span>
                <span className="text-xs text-foreground-400">({packSamples.length})</span>
              </div>

              {packSamples.map(sample => (
                <div
                  key={sample.relativePath}
                  data-testid="local-sample-entry"
                  className="flex items-center justify-between px-4 py-2 rounded
                             hover:bg-foreground-100 transition-background group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{sample.name}</div>
                    <div className="text-xs text-foreground-400">{sample.extension}</div>
                  </div>

                  <button
                    data-testid="local-sample-delete"
                    onClick={() => handleDelete(sample)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity
                               text-danger-400 hover:text-danger-600 p-1"
                    title="Delete sample"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
