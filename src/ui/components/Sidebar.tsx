import { MagnifyingGlassIcon, RectangleStackIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";

/** The primary views the navigation rail can switch between. */
export type AppView = "browse" | "library";

/**
 * The 2019-Splice-style left navigation rail. Hosts the wordmark, the primary view
 * tabs (Browse / Library), and a settings entry pinned to the bottom.
 */
export default function Sidebar({
  view, onNavigate, onOpenSettings
}: {
  view: AppView,
  onNavigate: (view: AppView) => void,
  onOpenSettings: () => void
}) {
  function tab(target: AppView, label: string, icon: JSX.Element) {
    const active = view === target;
    return (
      <button
        type="button"
        aria-label={label}
        aria-current={active}
        onClick={() => onNavigate(target)}
        className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors
          ${active
            ? "bg-splice-accent/15 text-splice-accent font-medium"
            : "text-foreground-400 hover:text-foreground hover:bg-white/5"}`}
      >
        <span className="w-5 h-5 shrink-0">{icon}</span>
        {label}
      </button>
    );
  }

  return (
    <nav className="flex flex-col w-[180px] shrink-0 h-full bg-splice-rail border-r border-white/5 px-3 py-4">
      <div className="px-2 mb-6 flex items-center gap-2 select-none">
        <span className="text-lg font-bold tracking-tight text-foreground">splice</span>
        <span className="text-splice-accent text-lg font-bold leading-none">·</span>
        <span className="text-[10px] uppercase tracking-widest text-foreground-500 mt-1">dd</span>
      </div>

      <div className="flex flex-col gap-1">
        {tab("browse", "Browse", <MagnifyingGlassIcon />)}
        {tab("library", "Library", <RectangleStackIcon />)}
      </div>

      <div className="mt-auto">
        <button
          type="button"
          aria-label="Settings"
          onClick={onOpenSettings}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-foreground-400 hover:text-foreground hover:bg-white/5 transition-colors"
        >
          <span className="w-5 h-5 shrink-0"><Cog6ToothIcon /></span>
          Settings
        </button>
      </div>
    </nav>
  );
}
