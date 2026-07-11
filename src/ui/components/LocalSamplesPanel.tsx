import { useEffect, useState } from "react";
import { CircularProgress, Tooltip } from "@nextui-org/react";
import { PlayIcon, StopIcon, TrashIcon, FolderOpenIcon } from "@heroicons/react/20/solid";
import { startDrag } from "@crabnebula/tauri-plugin-drag";
import { path } from "@tauri-apps/api";

import { cfg } from "../../config";
import { LocalSampleFile, deleteSampleFile, readSampleFile, scanSampleFiles } from "../../native";
import { LocalSamplePack, formatFileSize, groupByPack } from "../../local/grouping";
import { SamplePlaybackContext, useAudioPreview } from "../playback";

/**
 * A single downloaded sample in the local library: preview, drag-into-DAW, and delete.
 */
function LocalSampleEntry({ sample, ctx, onDeleted }: {
  sample: LocalSampleFile,
  ctx: SamplePlaybackContext,
  onDeleted: () => void
}) {
  const preview = useAudioPreview(
    ctx,
    { name: sample.name, packName: sample.pack },
    async () => new Blob([await readSampleFile(cfg().sampleDir, sample.relativePath)], { type: "audio/wav" })
  );

  async function handleDrag() {
    // The file already exists on disk, so dragging just points to it directly.
    startDrag({ item: [await path.join(cfg().sampleDir, sample.relativePath)], icon: "" });
  }

  async function handleDelete() {
    preview.stop();
    await deleteSampleFile(cfg().sampleDir, sample.relativePath);
    onDeleted();
  }

  return (
    <div className="group flex w-full items-center gap-3 px-2 h-10 border-b border-divider
                    hover:bg-white/5 transition-colors cursor-grab select-none text-sm"
    >
      <button onClick={() => preview.play()} aria-label={preview.playing ? "Stop" : "Play"}
        className={`w-7 h-7 shrink-0 flex items-center justify-center rounded-full border
                    ${preview.playing
                      ? "border-splice-accent text-splice-accent"
                      : "border-white/15 text-foreground-400 group-hover:text-foreground hover:!border-splice-accent hover:!text-splice-accent"}`}
      >
        {preview.loading
          ? <CircularProgress size="sm" aria-label="Loading sample..." classNames={{ svg: "w-4 h-4" }} />
          : preview.playing ? <StopIcon className="w-3.5" /> : <PlayIcon className="w-3.5 ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0 truncate" onMouseDown={handleDrag}>
        {sample.name}
      </div>

      <span className="shrink-0 text-xs text-foreground-600 tabular-nums w-16 text-right">
        {formatFileSize(sample.size)}
      </span>

      <button onClick={handleDelete} aria-label="Delete sample"
        className="w-7 h-7 shrink-0 flex items-center justify-center rounded
                   text-foreground-600 opacity-0 group-hover:opacity-100 hover:!text-danger transition-opacity"
      >
        <TrashIcon className="w-4" />
      </button>
    </div>
  );
}

/**
 * The "Library" view: lists every downloaded sample in the configured sample directory,
 * grouped by pack. Mirrors the Splice desktop strategy of managing local sounds.
 */
export default function LocalSamplesPanel({ ctx }: { ctx: SamplePlaybackContext }) {
  const [packs, setPacks] = useState<LocalSamplePack[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const dir = cfg().sampleDir;
    setPacks(dir.trim() !== "" ? groupByPack(await scanSampleFiles(dir)) : []);
    setLoading(false);
  }

  // Refresh whenever the panel mounts (i.e. when the user opens the Library tab).
  useEffect(() => { refresh(); }, []);

  const totalSamples = packs.reduce((n, p) => n + p.samples.length, 0);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <CircularProgress aria-label="Scanning local samples..." />
      </div>
    );
  }

  if (cfg().sampleDir.trim() === "") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
        <FolderOpenIcon className="w-10 text-foreground-600" />
        <p className="text-foreground-400 text-sm max-w-xs">
          Set a sample folder in Settings to manage your downloaded samples here.
        </p>
      </div>
    );
  }

  if (totalSamples === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
        <img className="w-12" src="img/blob-think.png" />
        <p className="text-foreground-400 text-sm max-w-xs">
          No downloaded samples yet. Drag samples from the Browse tab into your DAW and they'll show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h4 className="text-sm font-semibold">My Library</h4>
          <p className="text-xs text-foreground-500">
            {totalSamples} sample{totalSamples != 1 ? "s" : ""} across {packs.length} pack{packs.length != 1 ? "s" : ""}.
          </p>
        </div>
        <Tooltip content="Rescan folder">
          <button onClick={refresh} aria-label="Rescan"
            className="text-xs text-splice-accent hover:underline">
            Refresh
          </button>
        </Tooltip>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto bg-content1 rounded-lg p-3 space-y-4">
        {packs.map(pack => (
          <div key={pack.name}>
            <div className="flex items-baseline justify-between px-2 mb-1">
              <span className="text-xs font-semibold text-foreground-300 truncate">{pack.name}</span>
              <span className="text-[10px] text-foreground-600 shrink-0 ml-2">
                {pack.samples.length} · {formatFileSize(pack.totalSize)}
              </span>
            </div>
            <div className="flex flex-col">
              {pack.samples.map(s => (
                <LocalSampleEntry key={s.relativePath} sample={s} ctx={ctx} onDeleted={refresh} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
