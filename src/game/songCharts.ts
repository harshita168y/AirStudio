
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

// MANCHILD SONG CONFIGURATION

const MANCHILD_BEAT_MS = 487.75;
const MANCHILD_FIRST_BEAT_MS = 325;
const MANCHILD_DURATION_MS = 213_708;
const MANCHILD_START_MS = 2_276;

// Existing lane sequence.
const EASY_LANES: Lane[] = [
  0, 1, 2, 3,
  2, 1, 0, 2,
  3, 1, 2, 0,
];

const LONG_NOTE_MULTIPLIERS = [
  2, 3, 4,
] as const;

const LONG_NOTE_EVERY = 8;
const GAP_AFTER_HOLD_BEATS = 1;

// After a long note, keep the same hand
// free for an additional beat.
const HAND_RECOVERY_BEATS = 1;

function getHand(lane: Lane): "left" | "right" {
  return lane <= 1 ? "left" : "right";
}

function oppositeHandLane(
  lane: Lane
): Lane {
  // D -> J, F -> K
  // J -> D, K -> F
  return (
    lane <= 1
      ? lane + 2
      : lane - 2
  ) as Lane;
}

/**
 * Prevents notes from requiring the
 * same hand while that hand is occupied
 * with a long note.
 *
 * Also reserves a short recovery period
 * after the long note finishes.
 *
 * Musical timing remains unchanged.
 */
function enforceHandAvailability(
  notes: ChartNote[],
  beatMs: number
): ChartNote[] {
  const result = notes
    .map((note) => ({ ...note }))
    .sort(
      (a, b) =>
        a.timeMs - b.timeMs ||
        a.lane - b.lane
    );

  for (let i = 0; i < result.length; i++) {
    const hold = result[i];

    const duration =
      hold.durationMs ?? 0;

    if (duration <= 0) continue;

    const holdHand = getHand(hold.lane);

    const recoveryEnd =
      hold.timeMs +
      duration +
      beatMs * HAND_RECOVERY_BEATS;

    for (
      let j = i + 1;
      j < result.length;
      j++
    ) {
      const next = result[j];

      if (
        next.timeMs > recoveryEnd
      ) {
        break;
      }

      // If the next note requires the
      // occupied hand, move it to the
      // opposite hand.
      if (
        getHand(next.lane) === holdHand
      ) {
        next.lane =
          oppositeHandLane(next.lane);
      }
    }
  }

  return result;
}

/**
 * Easy chart for Manchild.
 *
 * Normal notes use the existing
 * pinch gesture.
 *
 * Long notes use the new closed-fist
 * gesture.
 */
function makeManchildEasyNotes(): ChartNote[] {
  const notes: ChartNote[] = [];

  const beatMs = MANCHILD_BEAT_MS;

  const songStart =
    MANCHILD_START_MS +
    MANCHILD_FIRST_BEAT_MS;

  const lastAllowedTime =
    MANCHILD_DURATION_MS -
    beatMs * 2;

  let beat = 4;
  let noteIndex = 0;
  let holdIndex = 0;

  while (true) {
    const timeMs =
      songStart +
      beat * beatMs;

    if (timeMs >= lastAllowedTime) {
      break;
    }

    const lane =
      EASY_LANES[
        noteIndex %
        EASY_LANES.length
      ];

    const isLongNote =
      (noteIndex + 1) %
        LONG_NOTE_EVERY ===
      0;

    if (isLongNote) {
      const holdBeats =
        LONG_NOTE_MULTIPLIERS[
          holdIndex %
          LONG_NOTE_MULTIPLIERS.length
        ];

      const durationMs =
        holdBeats * beatMs;

      notes.push({
        id: `manchild-easy-${noteIndex}`,
        lane,
        timeMs,
        durationMs,
      });

      holdIndex++;

      // Preserve the existing spacing:
      // no new note until after the hold
      // plus the recovery gap.
      beat +=
        holdBeats +
        GAP_AFTER_HOLD_BEATS;
    } else {
      notes.push({
        id: `manchild-easy-${noteIndex}`,
        lane,
        timeMs,
      });

      beat += 2;
    }

    noteIndex++;
  }

  return enforceHandAvailability(
    notes,
    beatMs
  );
}

/**
 * Fallback chart generator for
 * normal and hard difficulties,
 * and songs without a custom chart.
 */
function makeGeneratedNotes(
  songId: string,
  bpm: number,
  difficulty: ChartDifficulty
): ChartNote[] {
  const safeBpm = Math.max(
    60,
    Math.min(220, bpm || 120)
  );

  const beatMs = 60_000 / safeBpm;

  const lanePatterns: Record<
    ChartDifficulty,
    Lane[]
  > = {
    easy: [
      0, 1, 2, 3,
      1, 2, 0, 3,
    ],
    normal: [
      0, 2, 1, 3,
      2, 0, 3, 1,
      1, 3, 0, 2,
    ],
    hard: [
      0, 3, 1, 2,
      3, 0, 2, 1,
      0, 2, 3, 1,
    ],
  };

  const pattern =
    lanePatterns[difficulty];

  const spacingBeats =
    difficulty === "easy"
      ? 2
      : difficulty === "normal"
        ? 1
        : 0.5;

  const totalBeats =
    difficulty === "easy"
      ? 128
      : difficulty === "normal"
        ? 192
        : 256;

  const notes: ChartNote[] = [];

  let beat = 4;
  let noteIndex = 0;
  let holdIndex = 0;

  while (beat < totalBeats) {
    const lane =
      pattern[
        noteIndex %
        pattern.length
      ];

    const isLongNote =
      (noteIndex + 1) %
        LONG_NOTE_EVERY ===
      0;

    if (isLongNote) {
      const holdBeats =
        LONG_NOTE_MULTIPLIERS[
          holdIndex %
          LONG_NOTE_MULTIPLIERS.length
        ];

      notes.push({
        id: `${songId}-${difficulty}-${noteIndex}`,
        lane,
        timeMs: beat * beatMs,
        durationMs:
          holdBeats * beatMs,
      });

      holdIndex++;

      beat +=
        holdBeats +
        GAP_AFTER_HOLD_BEATS;
    } else {
      notes.push({
        id: `${songId}-${difficulty}-${noteIndex}`,
        lane,
        timeMs: beat * beatMs,
      });

      beat += spacingBeats;
    }

    noteIndex++;
  }

  return enforceHandAvailability(
    notes,
    beatMs
  );
}

/**
 * Public chart provider used by
 * the Phaser game.
 */
export function getSongChart(
  songId: string,
  bpm: number,
  difficulty: ChartDifficulty = "easy"
): SongChart {
  const travelTimeMs = 3000;

  if (
    songId === "manchild" &&
    difficulty === "easy"
  ) {
    return {
      songId,
      difficulty,
      travelTimeMs,
      notes: makeManchildEasyNotes(),
    };
  }

  return {
    songId,
    difficulty,
    travelTimeMs,
    notes: makeGeneratedNotes(
      songId,
      bpm,
      difficulty
    ),
  };
}
