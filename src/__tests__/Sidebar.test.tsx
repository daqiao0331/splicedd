import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar, { SidebarTab } from '../ui/components/Sidebar';

describe('Sidebar', () => {
  it('renders the sidebar with Search and My Library tabs', () => {
    render(<Sidebar activeTab="search" onTabChange={() => {}} />);

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-tab-search')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-tab-library')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('My Library')).toBeInTheDocument();
  });

  it('highlights the active search tab', () => {
    render(<Sidebar activeTab="search" onTabChange={() => {}} />);

    const searchTab = screen.getByTestId('sidebar-tab-search');
    const libraryTab = screen.getByTestId('sidebar-tab-library');

    expect(searchTab.className).toContain('sidebar-tab-active');
    expect(libraryTab.className).not.toContain('sidebar-tab-active');
  });

  it('highlights the active library tab', () => {
    render(<Sidebar activeTab="library" onTabChange={() => {}} />);

    const searchTab = screen.getByTestId('sidebar-tab-search');
    const libraryTab = screen.getByTestId('sidebar-tab-library');

    expect(searchTab.className).not.toContain('sidebar-tab-active');
    expect(libraryTab.className).toContain('sidebar-tab-active');
  });

  it('calls onTabChange with "library" when My Library tab is clicked', () => {
    let changedTo: SidebarTab | null = null;
    render(<Sidebar activeTab="search" onTabChange={(tab: SidebarTab) => { changedTo = tab; }} />);

    fireEvent.click(screen.getByTestId('sidebar-tab-library'));

    expect(changedTo).toBe('library');
  });

  it('calls onTabChange with "search" when Search tab is clicked', () => {
    let changedTo: SidebarTab | null = null;
    render(<Sidebar activeTab="library" onTabChange={(tab: SidebarTab) => { changedTo = tab; }} />);

    fireEvent.click(screen.getByTestId('sidebar-tab-search'));

    expect(changedTo).toBe('search');
  });
});
