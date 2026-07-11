import { CircularProgress, Tooltip } from "@nextui-org/react";
import { PlayIcon, StopIcon, ArrowDownTrayIcon, CheckIcon } from "@heroicons/react/20/solid";

import { Response, ResponseType, fetch } from '@tauri-apps/api/http';
import { useEffect, useRef, useState } from "react";
import { startDrag } from "@crabnebula/tauri-plugin-drag";

import * as wav from "node-wav";
import { checkFileExists, createPlaceholder, writeSampleFile } from "../../native";
import { path } from "@tauri-apps/api";

import { cfg } from "../../config";
import { SamplePlaybackContext, useAudioPreview } from "../playback";
import { SpliceTag } from "../../splice/entities";
import { SpliceSample } from "../../splice/api";
import { decodeSpliceAudio } from "../../splice/decoder";
import Waveform from "./Waveform";

const getChordTypeDisplay = (type: string | null) =>
  type == null ? "" : type == "major" ? "maj" : "min";

const sanitizePath = (x: string) => x.replace(/[<>:"|?* ]/g, "_");

export type TagClickHandler = (tag: SpliceTag) => void;

/**
 * The column header matching {@link SampleListEntry}'s layout, as in the 2019 Splice
 * sounds browser. Keep the widths in sync with the row below.
 */
export function SampleListHeader() {
  const label = "text-[10px] uppercase tracking-wider text-foreground-600 font-semibold";
  return (
    <div className="flex w-full items-center gap-3 px-2 h-7 border-b border-divider select-none shrink-0">
      <span className="w-7 shrink-0" />
      <span className="w-7 shrink-0" />
      <span className={`w-[30%] min-w-44 shrink-0 ${label}`}>Filename</span>
      <span className="flex-1 min-w-0" />
      <span className={`w-10 shrink-0 text-right ${label}`}>Time</span>
      <span className={`w-12 shrink-0 text-right ${label}`}>Key</span>
      <span className={`w-12 shrink-0 text-right ${label}`}>BPM</span>
      <span className="w-7 shrink-0" />
    </div>
  );
}

/**
 * A dense sample row styled after the 2019 Splice sounds browser: play button, pack art,
 * filename with tags, a seekable waveform with teal progress, time / key / BPM columns,
 * and a download button. The row itself can be dragged into a DAW.
 */
export default function SampleListEntry(
  { sample, ctx, onTagClick }: {
    sample: SpliceSample,
    ctx: SamplePlaybackContext,
    onTagClick: TagClickHandler
  }
) {
  const [dragLoading, setDragLoading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // Cached across re-renders, so hover-prefetching and decoding only ever happen once.
  const fetchAhead = useRef<Promise<Response<ArrayBuffer>> | null>(null);
  const decoded = useRef<Uint8Array | null>(null);

  const pack = sample.parents.items[0];
  const packCover = pack
    ? pack.files.find(x => x.asset_file_type_slug == "cover_image")?.url
    : "img/missing-cover.png";

  const waveformUrl = sample.files.find(x => x.asset_file_type_slug == "waveform")?.url;
  const name = sample.name.split("/").pop();
  const samplePath = sanitizePath(pack.name) + "/" + sanitizePath(sample.name);

  useEffect(() => {
    checkFileExists(cfg().sampleDir, samplePath).then(setDownloaded).catch(() => {});
  }, []);

  function startFetching() {
    if (fetchAhead.current != null)
      return;

    const file = sample.files.find(x => x.asset_file_type_slug == "preview_mp3")!;

    fetchAhead.current = fetch<ArrayBuffer>(file.url, {
      method: "GET",
      responseType: ResponseType.Binary
    });
  }

  /** Downloads and unscrambles the preview MP3, caching the result. */
  async function ensureAudioDecoded() {
    if (decoded.current == null) {
      startFetching();
      const resp = await fetchAhead.current!;
      decoded.current = decodeSpliceAudio(new Uint8Array(resp.data));
    }

    return decoded.current;
  }

  const preview = useAudioPreview(
    ctx,
    { name: name ?? sample.name, packName: pack?.name, packCover },
    async () => new Blob([await ensureAudioDecoded()], { type: "audio/mpeg" })
  );

  const busy = dragLoading || preview.loading;

  /** Decodes the sample and writes it to the sample directory as a .wav. */
  async function writeToDisk() {
    const mp3 = await ensureAudioDecoded();

    const actx = new AudioContext();
    try {
      // decodeAudioData detaches the buffer it's given, so pass a copy to keep the
      // cached MP3 playable afterwards.
      const samples = await actx.decodeAudioData(mp3.slice().buffer);
      const channels: Float32Array[] = [];

      if (samples.length < 60 * 44100) {
        for (let i = 0; i < samples.numberOfChannels; i++) {
          const chan = samples.getChannelData(i);

          const start = 1200;
          const end = ((sample.duration / 1000) * samples.sampleRate) + start;

          channels.push(chan.subarray(start, end));
        }
      } else {
        // processing big samples may result in memory allocation errors (it sure did for me!!)
        console.warn(`big boi detected of ${samples.length} samples - not pre-processing!`);
      }

      await writeSampleFile(cfg().sampleDir, samplePath, wav.encode(channels, {
        bitDepth: 16,
        sampleRate: samples.sampleRate
      }));
    } finally {
      actx.close();
    }

    setDownloaded(true);
  }

  async function handleDownload() {
    if (downloaded || busy)
      return;

    setDragLoading(true);
    if (!await checkFileExists(cfg().sampleDir, samplePath)) {
      await writeToDisk();
    }
    setDownloaded(true);
    setDragLoading(false);
  }

  async function handleDrag(ev: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    // Verify that the parent of the element that we began the dragging from
    // is not explicitly marked as non-draggable (as it may be clicked etc.)
    const dragOrigin = document.elementFromPoint(ev.clientX, ev.clientY)?.parentElement;
    if (dragOrigin != null && dragOrigin.dataset.draggable === "false") {
      return;
    }

    const dragParams = {
      item: [await path.join(cfg().sampleDir, samplePath)],
      icon: ""
    };

    setDragLoading(true);

    if (!await checkFileExists(cfg().sampleDir, samplePath)) {
      if (cfg().placeholders) {
        await createPlaceholder(cfg().sampleDir, samplePath);
        startDrag(dragParams);
        await writeToDisk();
      } else {
        await writeToDisk();
        startDrag(dragParams);
      }
    } else {
      startDrag(dragParams);
    }

    setDownloaded(true);
    setDragLoading(false);
  }

  return (
    <div onMouseOver={startFetching}
      className="group flex w-full items-center gap-3 px-2 h-11 border-b border-divider
                 hover:bg-white/5 transition-colors cursor-grab select-none text-sm"
    >
      { /* when loading, set the cursor for everything to a waiting icon */}
      {busy && <style> {`* { cursor: wait }`} </style>}

      { /* play / stop */}
      <button onClick={() => preview.play()} aria-label={preview.playing ? "Stop" : "Play"}
        className={`w-7 h-7 shrink-0 flex items-center justify-center rounded-full border
                    ${preview.playing
                      ? "border-splice-accent text-splice-accent"
                      : "border-white/15 text-foreground-400 group-hover:text-foreground hover:!border-splice-accent hover:!text-splice-accent"}`}
        data-draggable="false"
      >
        {busy
          ? <CircularProgress size="sm" aria-label="Loading sample..." classNames={{ svg: "w-4 h-4" }} />
          : preview.playing ? <StopIcon className="w-3.5" /> : <PlayIcon className="w-3.5 ml-0.5" />}
      </button>

      { /* pack art */}
      <Tooltip content={
        <div className="flex flex-col gap-2 p-2">
          <img src={packCover} alt={pack?.name} width={128} height={128} />
          <span className="text-xs">{pack?.name}</span>
        </div>
      }>
        <a href={pack ? `https://splice.com/sounds/labels/${pack.permalink_base_url}` : undefined}
          target="_blank" data-draggable="false" className="shrink-0"
        >
          <img src={packCover} alt={pack?.name} width={28} height={28} className="rounded-sm" />
        </a>
      </Tooltip>

      { /* filename + tags */}
      <div className="w-[30%] min-w-44 shrink-0 overflow-hidden" onMouseDown={handleDrag}>
        <div className="truncate text-[13px] text-foreground group-hover:text-splice-accent transition-colors">
          {name}
        </div>
        <div className="flex gap-2 overflow-hidden h-4 text-[10px] text-foreground-500">
          {sample.tags.slice(0, 4).map(x => (
            <button key={x.uuid} onClick={() => onTagClick(x)} data-draggable="false"
              className="hover:text-splice-accent hover:underline shrink-0"
            >
              {x.label}
            </button>
          ))}
        </div>
      </div>

      { /* waveform with playback progress; click to seek */}
      <Waveform url={waveformUrl} progress={preview.progress} onSeek={at => preview.play(at)} />

      { /* metadata columns */}
      <span className="w-10 shrink-0 text-right text-xs text-foreground-500 tabular-nums" onMouseDown={handleDrag}>
        {(sample.duration / 1000).toFixed(1)}s
      </span>
      <span className="w-12 shrink-0 text-right text-xs text-foreground-500 tabular-nums" onMouseDown={handleDrag}>
        {sample.key != null ? `${sample.key.toUpperCase()}${getChordTypeDisplay(sample.chord_type)}` : "—"}
      </span>
      <span className="w-12 shrink-0 text-right text-xs text-foreground-500 tabular-nums" onMouseDown={handleDrag}>
        {sample.bpm ?? "—"}
      </span>

      { /* download */}
      <button onClick={handleDownload} data-draggable="false"
        aria-label={downloaded ? "Downloaded" : "Download"}
        className={`w-7 h-7 shrink-0 flex items-center justify-center rounded
                    ${downloaded
                      ? "text-splice-accent"
                      : "text-foreground-500 hover:!text-splice-accent"}`}
      >
        {downloaded ? <CheckIcon className="w-4" /> : <ArrowDownTrayIcon className="w-4" />}
      </button>
    </div>
  );
}
