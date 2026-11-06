
export type Difficulty = "easy" | "normal" | "hard";

export type Song = {
  id: string;
  title: string;
  artist: string;
  duration: string;
  durationMs: number;
  bpm: number;
  description: string;
  accent: string;
  difficulties: Difficulty[];
  audioUrl?: string;
  license?: string;
  attributionUrl?: string;
};

export const songs: Song[] = [
  {
    id: "first-light",
    title: "Manchild",
    artist: "AirStudio Originals",
    duration: "1:24",
    durationMs: 84000,
    bpm: 96,
    description:
      "A gentle introduction to the rhythm. Find your timing and settle into the flow.",
    accent: "#D5A46A",
    difficulties: ["easy", "normal", "hard"],
  },
  {
    id: "copper-pulse",
    title: "Song 2",
    artist: "AirStudio Originals",
    duration: "1:48",
    durationMs: 108000,
    bpm: 124,
    description:
      "A steady, driving pulse with enough energy to keep your hands moving.",
    accent: "#C99553",
    difficulties: ["easy", "normal", "hard"],
  },
  {
    id: "afterglow",
    title: "Song3",
    artist: "AirStudio Originals",
    duration: "2:12",
    durationMs: 132000,
    bpm: 142,
    description:
      "A faster challenge built for players ready to push their timing further.",
    accent: "#E6C18B",
    difficulties: ["easy", "normal", "hard"],
  },
];

export function getSongById(id: string | null): Song | undefined {
  return songs.find((song) => song.id === id);
}
