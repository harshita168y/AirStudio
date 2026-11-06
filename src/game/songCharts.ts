
export type Lane = 0 | 1 | 2 | 3;

export type ChartDifficulty =
  | "easy"
  | "normal"
  | "hard";

export interface ChartNote {
  id: string;
  lane: Lane;
  timeMs: number;
  durationMs?: number;
}

export interface SongChart {
  songId: string;
  difficulty: ChartDifficulty;
  travelTimeMs: number;
  notes: ChartNote[];
}

// Estimated beat grid for Manchild.mp3
const MANCHILD_BEAT_MS = 487.75;
const MANCHILD_FIRST_BEAT_MS = 325;
const MANCHILD_DURATION_MS = 213_708;
const MANCHILD_START_MS = 2_276;

// Each hand controls two lanes.
// Left hand: D (0), F (1)
// Right hand: J (2), K (3)
type HandSide = "left" | "right";

function getHand(lane: Lane): HandSide {
  return lane < 2 ? "left" : "right";
}

// Recovery time after a long hold.
// One beat gives the player enough time
// to release and prepare the next pinch.
const GAP_AFTER_HOLD_BEATS = 1;

// Long notes rotate between 2, 3 and 4 beats.
const LONG_NOTE_MULTIPLIERS = [
  2, 3, 4,
] as const;

const LONG_NOTE_EVERY = 8;

// Easy mode lane sequence.
const EASY_LANES: Lane[] = [
  0, 1, 2, 3, 2, 1,
  0, 2, 3, 1, 2, 0,
];

/**
 * Ensures notes assigned to the same hand
 * do not overlap a previous long hold.
 *
 * If a note conflicts with an existing hold,
 * it is moved forward to the first available
 * time for that hand.
 *
 * Notes on the opposite hand are unaffected.
 */
function enforceHandAvailability(
  notes: ChartNote[],
  beatMs: number
): ChartNote[] {
  const recoveryMs = Math.round(
    beatMs * GAP_AFTER_HOLD_BEATS
  );

  const availableAt: Record<
    HandSide,
    number
  > = {
    left: 0,
    right: 0,
  };

  const sorted = [...notes].sort(
    (a, b) =>
      a.timeMs - b.timeMs ||
      a.lane - b.lane
  );

  const adjusted: ChartNote[] = [];

  for (const note of sorted) {
    const hand = getHand(note.lane);

    // Do not move notes unless their hand
    // is occupied by an earlier long hold.
    const adjustedTime = Math.max(
      note.timeMs,
      availableAt[hand]
    );

    const duration = Math.max(
      0,
      note.durationMs ?? 0
    );

    adjusted.push({
      ...note,
      timeMs: adjustedTime,
    });

    if (duration > 0) {
      // This hand cannot play another note
      // until the hold and recovery finish.
      availableAt[hand] =
        adjustedTime +
        duration +
        recoveryMs;
    }
  }

  return adjusted.sort(
    (a, b) =>
      a.timeMs - b.timeMs ||
      a.lane - b.lane
  );
}

function makeManchildEasyNotes(): ChartNote[] {
  const notes: ChartNote[] = [];

  let beat = 4;
  let index = 0;
  let longNoteIndex = 0;

  while (true) {
    const timeMs = Math.round(
      MANCHILD_FIRST_BEAT_MS +
      beat * MANCHILD_BEAT_MS
    );

    if (
      timeMs >=
      MANCHILD_DURATION_MS - 1_000
    ) {
      break;
    }

    if (timeMs < MANCHILD_START_MS) {
      beat += 2;
      continue;
    }

    const isLong =
      (index + 1) % LONG_NOTE_EVERY === 0;

    const holdBeats = isLong
      ? LONG_NOTE_MULTIPLIERS[
          longNoteIndex %
          LONG_NOTE_MULTIPLIERS.length
        ]
      : 0;

    const durationMs =
      holdBeats > 0
        ? Math.round(
            holdBeats * MANCHILD_BEAT_MS
          )
        : undefined;

    // Prevent a long note from extending
    // beyond the end of the song.
    if (
      durationMs &&
      timeMs + durationMs >=
        MANCHILD_DURATION_MS - 500
    ) {
      break;
    }

    notes.push({
      id: `manchild-easy-${index}`,
      lane:
        EASY_LANES[
          index % EASY_LANES.length
        ],
      timeMs,
      ...(durationMs !== undefined
        ? { durationMs }
        : {}),
    });

    index++;

    if (isLong) {
      longNoteIndex++;
    }

    // Short notes: two beats apart.
    // Long notes: hold plus recovery gap.
    beat +=
      holdBeats > 0
        ? holdBeats + GAP_AFTER_HOLD_BEATS
        : 2;
  }

  return enforceHandAvailability(
    notes,
    MANCHILD_BEAT_MS
  );
}

// Existing fallback patterns.
const patterns: Record<
  ChartDifficulty,
  Array<[Lane, number]>
> = {
  easy: [
    [0, 0], [1, 1], [2, 2], [3, 3],
    [0, 4], [2, 5], [1, 6], [3, 7],
    [0, 8], [1, 9], [2, 10], [3, 11],
  ],

  normal: [
    [0, 0], [1, 0.5],
    [2, 1], [3, 1.5],
    [0, 2], [2, 2.5],
    [1, 3], [3, 3.5],
    [0, 4], [1, 4.5],
    [2, 5], [3, 5.5],
    [0, 6], [2, 6.5],
    [1, 7], [3, 7.5],
  ],

  hard: [
    [0, 0], [1, 0.5],
    [2, 1], [3, 1.5],
    [0, 2], [2, 2],
    [1, 2.5], [3, 3],
    [0, 3.5], [1, 4],
    [2, 4], [3, 4.5],
    [0, 5], [2, 5.5],
    [1, 6], [3, 6],
    [0, 6.5], [1, 7],
    [2, 7.5], [3, 7.5],
  ],
};


export function getSongChart(
  songId: string,
  bpm: number,
  difficulty: ChartDifficulty
): SongChart {
  if (difficulty === "easy") {
    return {
      songId,
      difficulty,
      travelTimeMs: 3000,
      notes: makeManchildEasyNotes(),
    };
  }

  const beatMs = 60_000 / bpm;

  const generatedNotes: ChartNote[] =
    patterns[difficulty].map(
      ([lane, beat], index) => ({
        id: `note-${index}`,
        lane,
        timeMs: Math.round(
          3000 + beat * beatMs
        ),
      })
    );

  return {
    songId,
    difficulty,
    travelTimeMs: 3000,
    notes: enforceHandAvailability(
      generatedNotes,
      beatMs
    ),
  };
}
