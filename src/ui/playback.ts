import React, { useRef, useState } from "react";

/**
 * Represents a shared audio context.
 */
export interface SamplePlaybackContext {
  cancellation: SamplePlaybackCancellation | null;
  setCancellation: React.Dispatch<React.SetStateAction<SamplePlaybackCancellation | null>>;
}

/**
 * Represents a function that can signal to the current owner of a given context to
 * give up control over said context.
 */
export type SamplePlaybackCancellation = () => void;

/**
 * Shared preview-playback logic for sample rows. Lazily loads the audio via `load` on
 * the first play, caches the audio element across re-renders, and cooperates with the
 * shared playback context so only one sample plays at a time.
 */
export function useAudioPreview(ctx: SamplePlaybackContext, load: () => Promise<Blob>) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  function stop() {
    if (audioRef.current == null)
      return;

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setPlaying(false);
  }

  /** Starts playback — or stops it, if this sample is the one currently playing. */
  async function toggle() {
    ctx.cancellation?.(); // stop whatever is currently playing (possibly us)

    if (playing || loading)
      return;

    let audio = audioRef.current;
    if (audio == null) {
      setLoading(true);
      try {
        audio = new Audio(URL.createObjectURL(await load()));
      } finally {
        setLoading(false);
      }

      audio.onended = () => setPlaying(false);
      audioRef.current = audio;
    }

    audio.play();
    setPlaying(true);
    ctx.setCancellation(() => stop);
  }

  return { playing, loading, toggle, stop };
}
