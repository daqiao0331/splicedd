import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import LocalSamplesPanel from '../ui/components/LocalSamplesPanel';

// Mock the config module
vi.mock('../config', () => ({
  cfg: () => ({
    sampleDir: '',
    placeholders: false,
    darkMode: true,
    configured: true,
  }),
}));

// Mock the local sample manager
vi.mock('../local/localSampleManager', () => ({
  scanLocalSamples: vi.fn().mockResolvedValue([]),
  deleteLocalSample: vi.fn().mockResolvedValue(true),
  groupByPack: vi.fn().mockReturnValue(new Map()),
}));

describe('LocalSamplesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the panel', () => {
    render(<LocalSamplesPanel />);

    expect(screen.getByTestId('local-samples-panel')).toBeInTheDocument();
    expect(screen.getByText('My Library')).toBeInTheDocument();
  });

  it('shows error when sample directory is not configured', async () => {
    render(<LocalSamplesPanel />);

    const error = await screen.findByTestId('local-samples-error');
    expect(error).toBeInTheDocument();
    expect(error.textContent).toContain('Sample directory not configured');
  });
});
