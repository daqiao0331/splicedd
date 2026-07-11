import { useEffect, useState } from "react";

/**
 * Renders a Splice waveform image the way the 2019 desktop client did: a gray
 * resting layer with a teal layer on top revealing playback progress. The image's
 * alpha channel is used as a CSS mask, so it recolors cleanly regardless of the
 * source colors. Clicking seeks to that position.
 */
export default function Waveform({ url, progress, onSeek }: {
  url?: string,
  progress: number,
  onSeek?: (at: number) => void
}) {
  // Preload the image so we can degrade gracefully (hide) if it fails to load.
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (url == null)
      return;

    const img = new Image();
    img.onload = () => setOk(true);
    img.onerror = () => setOk(false);
    img.src = url;
  }, [url]);

  if (url == null || !ok) {
    return <div className="flex-1 min-w-0" />;
  }

  const mask: React.CSSProperties = {
    WebkitMaskImage: `url("${url}")`,
    maskImage: `url("${url}")`
  };

  function handleClick(ev: React.MouseEvent<HTMLDivElement>) {
    const rect = ev.currentTarget.getBoundingClientRect();
    onSeek?.((ev.clientX - rect.left) / rect.width);
  }

  return (
    <div onClick={handleClick} data-draggable="false"
      className="relative flex-1 min-w-0 h-8 self-center cursor-pointer"
    >
      <div className="absolute inset-0 splice-wf-base" style={mask} />
      <div className="absolute inset-0 splice-wf-progress"
        style={{ ...mask, clipPath: `inset(0 ${100 - progress * 100}% 0 0)` }}
      />
    </div>
  );
}
