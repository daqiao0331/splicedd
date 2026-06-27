import { describe, it, expect } from "vitest";
import type { LocalSampleFile } from "../native";
import { groupByPack, formatFileSize, LOOSE_PACK_NAME } from "./grouping";

function sample(name: string, pack: string, size = 1000): LocalSampleFile {
  return { name, pack, size, relativePath: pack ? `${pack}/${name}` : name };
}

describe("groupByPack", () => {
  it("groups samples by their pack folder", () => {
    const packs = groupByPack([
      sample("kick.wav", "Drums"),
      sample("snare.wav", "Drums"),
      sample("lead.wav", "Synths")
    ]);

    expect(packs).toHaveLength(2);
    expect(packs.map(p => p.name)).toEqual(["Drums", "Synths"]);
    expect(packs[0].samples).toHaveLength(2);
    expect(packs[1].samples).toHaveLength(1);
  });

  it("sorts packs and samples alphabetically", () => {
    const packs = groupByPack([
      sample("zeta.wav", "Zylo"),
      sample("alpha.wav", "Acid"),
      sample("beta.wav", "Acid")
    ]);

    expect(packs.map(p => p.name)).toEqual(["Acid", "Zylo"]);
    expect(packs[0].samples.map(s => s.name)).toEqual(["alpha.wav", "beta.wav"]);
  });

  it("sums the total size of each pack", () => {
    const packs = groupByPack([
      sample("a.wav", "P", 1500),
      sample("b.wav", "P", 2500)
    ]);

    expect(packs[0].totalSize).toBe(4000);
  });

  it("places root-level samples under a loose-samples label", () => {
    const packs = groupByPack([sample("loose.wav", "")]);

    expect(packs).toHaveLength(1);
    expect(packs[0].name).toBe(LOOSE_PACK_NAME);
  });

  it("returns an empty array for no input", () => {
    expect(groupByPack([])).toEqual([]);
  });
});

describe("formatFileSize", () => {
  it("formats bytes, kilobytes, and megabytes", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
