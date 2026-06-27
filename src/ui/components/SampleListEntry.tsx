import { Chip, CircularProgress, Tooltip } from "@nextui-org/react";
import { MusicalNoteIcon, PlayIcon, StopIcon } from "@heroicons/react/20/solid";

import { Response, ResponseType, fetch } from '@tauri-apps/api/http';
import { useState } from "react";
import { startDrag } from "@crabnebula/tauri-plugin-drag";

import * as wav from "node-wav";
import { checkFileExists, createPlaceholder, writeSampleFile } from "../../native";
import { path } from "@tauri-apps/api";

import { cfg } from "../../config";
import { SamplePlaybackContext } from "../playback";
import { SpliceTag } from "../../splice/entities";
import { SpliceSample } from "../../splice/api";
import { decodeSpliceAudio } from "../../splice/decoder";

const getChordTypeDisplay = (type: string | null) =>
  type == null ? "" : type == "major" ? " Major" : " Minor";

export type TagClickHandler = (tag: SpliceTag) => void;

/**
 * A dense, single-line view of a Splice sample, styled after the 2019 Splice desktop
 * browser: play button, pack thumbnail, name + tags, inline waveform, and metadata columns.
 */
export default function SampleListEntry(
  { sample, ctx, onTagClick }: {
    sample: SpliceSample,
    ctx: SamplePlaybackContext,
    onTagClick: TagClickHandler
  }
) {
  const [fgLoading, setFgLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audio = document.createElement("audio");

  const pack = sample.parents.items[0];
  const packCover = pack
    ? pack.files.find(x => x.asset_file_type_slug == "cover_image")?.url
    : "img/missing-cover.png";

  const waveformUrl = sample.files.find(x => x.asset_file_type_slug == "waveform")?.url;

  let decodedSample: Uint8Array | null = null;

  let fetchAhead: Promise<Response<ArrayBuffer>> | null = null;
  function startFetching() {
    if (fetchAhead != null)
      return;

    const file = sample.files.find(x => x.asset_file_type_slug == "preview_mp3")!;

    fetchAhead = fetch<ArrayBuffer>(file.url, {
      method: "GET",
      responseType: ResponseType.Binary
    });
  }

  audio.onended = () => setPlaying(false);

  function stop() {
    audio.pause();
    audio.currentTime = 0;
    setPlaying(false);
  }

  async function handlePlayClick() {
    ctx.cancellation?.();

    if (playing)
      return;

    if (audio.src == "") {
      setFgLoading(true);
      await ensureAudioDecoded();
      setFgLoading(false);

      audio.src = URL.createObjectURL(
        new Blob([decodedSample!], { "type": "audio/mpeg" })
      );
    }

    audio.play();
    setPlaying(true);

    ctx.setCancellation(() => stop);
  }

  async function ensureAudioDecoded() {
    if (decodedSample != null)
      return;

    if (fetchAhead == null) {
      startFetching();
    }

    const resp = await fetchAhead;
    decodedSample = decodeSpliceAudio(new Uint8Array(resp!.data));
  }

  const sanitizePath = (x: string) => x.replace(/[<>:"|?* ]/g, "_");

  async function handleDrag(ev: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    // Verify that the parent of the element that we began the dragging from
    // is not explicitly marked as non-draggable (as it may be clicked etc.)
    const dragOrigin = document.elementFromPoint(ev.clientX, ev.clientY)?.parentElement;
    if (dragOrigin != null && dragOrigin.dataset.draggable === "false") {
      return;
    }

    const samplePath = sanitizePath(pack.name) + "/" + sanitizePath(sample.name);

    const dragParams = {
      item: [await path.join(cfg().sampleDir, samplePath)],
      icon: ""
    };

    setFgLoading(true);
    await ensureAudioDecoded();

    if (!await checkFileExists(cfg().sampleDir, samplePath)) {
      if (cfg().placeholders) {
        await createPlaceholder(cfg().sampleDir, samplePath);
        startDrag(dragParams);
      }

      const actx = new AudioContext();

      const samples = await actx.decodeAudioData(decodedSample!.buffer);
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

      if (!cfg().placeholders) {
        startDrag(dragParams);
      }

      setFgLoading(false);
    } else {
      setFgLoading(false);
      startDrag(dragParams);
    }
  }

  return (
    <div onMouseOver={startFetching}
      className="group flex w-full items-center gap-3 px-2 h-11 rounded
                 hover:bg-white/5 transition-colors cursor-grab select-none text-sm"
    >
      { /* when loading, set the cursor for everything to a waiting icon */}
      {fgLoading && <style> {`* { cursor: wait }`} </style>}

      { /* play / stop */}
      <button onClick={handlePlayClick} aria-label={playing ? "Stop" : "Play"}
        className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full
                   text-foreground-500 group-hover:text-foreground hover:!text-splice-accent"
        data-draggable="false"
      >
        {fgLoading
          ? <CircularProgress size="sm" aria-label="Loading sample..." classNames={{ svg: "w-5 h-5" }} />
          : playing ? <StopIcon className="w-5" /> : <PlayIcon className="w-5" />}
      </button>

      { /* pack thumbnail */}
      <Tooltip content={
        <div className="flex flex-col gap-2 p-2">
          <img src={packCover} alt={pack?.name} width={128} height={128} />
          <span className="text-xs">{pack?.name}</span>
        </div>
      }>
        <a href={pack ? `https://splice.com/sounds/labels/${pack.permalink_base_url}` : undefined}
          target="_blank" data-draggable="false" className="shrink-0"
        >
          <img src={packCover} alt={pack?.name} width={28} height={28} className="rounded" />
        </a>
      </Tooltip>

      { /* name + tags */}
      <div className="w-[34%] min-w-0 shrink-0" onMouseDown={handleDrag}>
        <div className="flex items-center gap-1 truncate">
          <span className="truncate">{sample.name.split("/").pop()}</span>
        </div>
        <div className="flex gap-1 overflow-hidden h-4">
          {sample.tags.slice(0, 4).map(x => (
            <Chip key={x.uuid} size="sm" variant="flat"
              className="h-4 px-1 text-[10px] cursor-pointer"
              onClick={() => onTagClick(x)} data-draggable="false"
            >
              {x.label}
            </Chip>
          ))}
        </div>
      </div>

      { /* inline waveform — fills the remaining space */}
      <div className="flex-1 min-w-0 h-full flex items-center" onMouseDown={handleDrag}>
        {waveformUrl &&
          <img src={waveformUrl} alt="" aria-hidden
            className={`splice-waveform ${playing ? "playing" : ""}`}
            onError={e => (e.currentTarget.style.display = "none")}
          />
        }
      </div>

      { /* metadata columns */}
      <div className="flex items-center gap-4 shrink-0 text-xs font-medium text-foreground-500 tabular-nums"
        onMouseDown={handleDrag}
      >
        <span className="w-16 flex items-center gap-1 justify-end">
          {sample.key != null && <>
            <MusicalNoteIcon className="w-3.5" />
            {`${sample.key.toUpperCase()}${getChordTypeDisplay(sample.chord_type)}`}
          </>}
        </span>
        <span className="w-14 text-right">{sample.bpm != null ? `${sample.bpm} BPM` : ""}</span>
        <span className="w-12 text-right">{`${(sample.duration / 1000).toFixed(1)}s`}</span>
        <span className="w-12 text-right text-foreground-600 lowercase">{sample.asset_category_slug}</span>
      </div>
    </div>
  );
}
