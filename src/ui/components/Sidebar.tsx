import { MagnifyingGlassIcon, MusicalNoteIcon } from "@heroicons/react/20/solid";

export type SidebarTab = "search" | "library";

/**
 * Sidebar navigation component in the style of the 2019 Splice desktop app.
 * Provides tabs for switching between online search and local library views.
 */
export default function Sidebar(
  { activeTab, onTabChange }: {
    activeTab: SidebarTab;
    onTabChange: (tab: SidebarTab) => void;
  }
) {
  return (
    <div className="sidebar" data-testid="sidebar">
      <div className="sidebar-logo">
        <img src="img/blob-salute.png" alt="Splicedd" className="w-8 h-8" />
      </div>

      <nav className="sidebar-nav">
        <button
          data-testid="sidebar-tab-search"
          className={`sidebar-tab ${activeTab === "search" ? "sidebar-tab-active" : ""}`}
          onClick={() => onTabChange("search")}
          title="Search"
        >
          <MagnifyingGlassIcon className="w-5 h-5" />
          <span>Search</span>
        </button>

        <button
          data-testid="sidebar-tab-library"
          className={`sidebar-tab ${activeTab === "library" ? "sidebar-tab-active" : ""}`}
          onClick={() => onTabChange("library")}
          title="My Library"
        >
          <MusicalNoteIcon className="w-5 h-5" />
          <span>My Library</span>
        </button>
      </nav>
    </div>
  );
}
