import { describe, it, expect } from 'vitest';
import { groupByPack, LocalSample } from '../local/localSampleManager';

describe('groupByPack', () => {
  it('groups samples by their pack name', () => {
    const samples: LocalSample[] = [
      { name: 'kick_01', pack: 'DrumKit', relativePath: 'DrumKit/kick_01.wav', extension: '.wav' },
      { name: 'snare_01', pack: 'DrumKit', relativePath: 'DrumKit/snare_01.wav', extension: '.wav' },
      { name: 'pad_01', pack: 'Synths', relativePath: 'Synths/pad_01.wav', extension: '.wav' },
    ];

    const grouped = groupByPack(samples);

    expect(grouped.size).toBe(2);
    expect(grouped.get('DrumKit')?.length).toBe(2);
    expect(grouped.get('Synths')?.length).toBe(1);
  });

  it('groups unsorted samples under "(Unsorted)"', () => {
    const samples: LocalSample[] = [
      { name: 'loose_sample', pack: '', relativePath: 'loose_sample.wav', extension: '.wav' },
    ];

    const grouped = groupByPack(samples);

    expect(grouped.size).toBe(1);
    expect(grouped.has('(Unsorted)')).toBe(true);
    expect(grouped.get('(Unsorted)')?.length).toBe(1);
  });

  it('returns empty map for empty input', () => {
    const grouped = groupByPack([]);
    expect(grouped.size).toBe(0);
  });

  it('handles mixed packed and unsorted samples', () => {
    const samples: LocalSample[] = [
      { name: 'kick', pack: 'Pack1', relativePath: 'Pack1/kick.wav', extension: '.wav' },
      { name: 'loose', pack: '', relativePath: 'loose.wav', extension: '.wav' },
      { name: 'hat', pack: 'Pack1', relativePath: 'Pack1/hat.wav', extension: '.wav' },
    ];

    const grouped = groupByPack(samples);

    expect(grouped.size).toBe(2);
    expect(grouped.get('Pack1')?.length).toBe(2);
    expect(grouped.get('(Unsorted)')?.length).toBe(1);
  });
});
