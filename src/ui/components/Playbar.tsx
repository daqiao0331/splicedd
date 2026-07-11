import { useEffect, useState } from "react";
import { PlayIcon, PauseIcon } from "@heroicons/react/20/solid";

import { SamplePlaybackContext } from "../playback";

const fmtTime = (secs: number) => {
  if (!isFinite(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

/**
 * The bottom playbar, as in the 2019 Splice desktop client: shows the sample that is
 * currently playing (or was last played), with play/pause, a seekable progress bar,
 * and elapsed/total time.
 */
export default function Playbar({ ctx }: { ctx: SamplePlaybackContext }) {
  const np = ctx.nowPlaying;

  const [paused, setPaused] = useState(true);
  const [time, setTime] = useState({ current: 0, total: 0 });

  useEffect(() => {
    if (np == null)
      return;

    const audio = np.audio;
    const update = () => {
      setPaused(audio.paused);
      setTime({ current: audio.currentTime, total: audio.duration || 0 });
    };

    update();

    // addEventListener, so we don't clobber the on* handlers the sample rows use.
    const events = ["timeupdate", "play", "pause", "ended", "loadedmetadata"] as const;
    events.forEach(e => audio.addEventListener(e, update));
    return () => events.forEach(e => audio.removeEventListener(e, update));
  }, [np]);

  if (np == null)
    return null;

  function togglePause() {
    np!.audio.paused ? np!.audio.play() : np!.audio.pause();
  }

  function handleSeek(ev: React.MouseEvent<HTMLDivElement>) {
    const rect = ev.currentTarget.getBoundingClientRect();
    const at = (ev.clientX - rect.left) / rect.width;
    np!.audio.currentTime = at * (np!.audio.duration || 0);
  }

  const progress = time.total > 0 ? time.current / time.total : 0;

  return (
    <footer className="h-12 shrink-0 flex items-center gap-3 px-3 bg-splice-rail border-t border-white/5 select-none">
      <button onClick={togglePause} aria-label={paused ? "Play" : "Pause"}
        className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full
                   border border-white/15 text-foreground hover:border-splice-accent hover:text-splice-accent"
      >
        {paused ? <PlayIcon className="w-4 ml-0.5" /> : <PauseIcon className="w-4" />}
      </button>

      {np.packCover && <img src={np.packCover} alt="" className="w-8 h-8 rounded shrink-0" />}

      <div className="w-52 min-w-0 shrink-0">
        <div className="truncate text-xs text-foreground">{np.name}</div>
        {np.packName &&
          <div className="truncate text-[10px] text-foreground-500">{np.packName}</div>}
      </div>

      <div onClick={handleSeek}
        className="flex-1 h-4 flex items-center cursor-pointer group"
      >
        <div className="w-full h-1 rounded bg-white/10 overflow-hidden">
          <div className="h-full bg-splice-accent" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      <span className="shrink-0 text-[10px] tabular-nums text-foreground-500 w-20 text-right">
        {fmtTime(time.current)} / {fmtTime(time.total)}
      </span>
    </footer>
  );
}
