import React, { useRef, useState } from "react";

/**
 * Describes the sample that is currently playing (or was last played), powering
 * the bottom playbar and the one-sample-at-a-time rule.
 */
export interface NowPlaying {
  audio: HTMLAudioElement;
  name: string;
  packName?: string;
  packCover?: string;
  /** Stops playback and rewinds to the start. */
  stop: () => void;
}

/**
 * Represents the shared playback state of the app.
 */
export interface SamplePlaybackContext {
  nowPlaying: NowPlaying | null;
  setNowPlaying: React.Dispatch<React.SetStateAction<NowPlaying | null>>;
}

export interface AudioPreviewMeta {
  name: string;
  packName?: string;
  packCover?: string;
}

/**
 * Shared preview-playback logic for sample rows. Lazily loads the audio via `load` on
 * the first play, caches the audio element across re-renders, tracks progress, and
 * cooperates with the shared playback context so only one sample plays at a time.
 *
 * The `playing` state is derived from the audio element's own events, so external
 * controls (like the playbar) always stay in sync with the row.
 */
export function useAudioPreview(
  ctx: SamplePlaybackContext,
  meta: AudioPreviewMeta,
  load: () => Promise<Blob>
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function ensureAudio() {
    let audio = audioRef.current;
    if (audio != null)
      return audio;

    setLoading(true);
    try {
      audio = new Audio(URL.createObjectURL(await load()));
    } finally {
      setLoading(false);
    }

    audio.onplay = () => setPlaying(true);
    audio.onpause = () => setPlaying(false);
    audio.onended = () => setProgress(0);
    audio.ontimeupdate = () =>
      setProgress(audio!.duration ? audio!.currentTime / audio!.duration : 0);

    audioRef.current = audio;
    return audio;
  }

  function stop() {
    const audio = audioRef.current;
    if (audio == null)
      return;

    audio.pause();
    audio.currentTime = 0;
    setProgress(0);
  }

  /**
   * Plays this sample. With no argument, acts as a play/stop toggle; with `at` (0..1),
   * seeks to that fraction and plays from there (e.g. when clicking the waveform).
   */
  async function play(at?: number) {
    if (loading)
      return;

    const audio = await ensureAudio();

    const current = ctx.nowPlaying;
    if (current != null && current.audio !== audio) {
      current.stop(); // one sample at a time
    }

    if (at == null && !audio.paused) {
      stop();
      return;
    }

    if (at != null) {
      const seek = () => { audio.currentTime = at * audio.duration; };
      if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
        seek();
      } else {
        audio.onloadedmetadata = seek;
      }
    }

    audio.play();
    ctx.setNowPlaying({ audio, stop, ...meta });
  }

  return { playing, loading, progress, play, stop };
}
