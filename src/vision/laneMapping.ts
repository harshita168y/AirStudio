
export type HandSide = "Left" | "Right";
export type Lane = 1 | 2 | 3 | 4;

export interface PalmPosition {
  x: number;
  y: number;
}

export function getPalmCenter(
  landmarks: Array<{ x: number; y: number }>
): PalmPosition {
  const indices = [0, 5, 9, 13, 17];

  const x =
    indices.reduce(
      (sum, index) => sum + landmarks[index].x,
      0
    ) / indices.length;

  const y =
    indices.reduce(
      (sum, index) => sum + landmarks[index].y,
      0
    ) / indices.length;

  return { x, y };
}

export function mirrorX(x: number): number {
  return 1 - x;
}

export function mapHandToLane(
  hand: HandSide,
  screenX: number,
  previousLane?: Lane,
  hysteresis = 0.025
): Lane | null {
  const x = Math.max(0, Math.min(1, screenX));

  if (hand === "Left") {
    // Reject positions outside the left-hand area.
    if (x > 0.5) return null;

    const boundary = 0.25;

    if (
      previousLane === 1 &&
      x < boundary + hysteresis
    ) {
      return 1;
    }

    if (
      previousLane === 2 &&
      x > boundary - hysteresis
    ) {
      return 2;
    }

    return x < boundary ? 1 : 2;
  }

  // Reject positions outside the right-hand area.
  if (x < 0.5) return null;

  const boundary = 0.75;

  if (
    previousLane === 3 &&
    x < boundary + hysteresis
  ) {
    return 3;
  }

  if (
    previousLane === 4 &&
    x > boundary - hysteresis
  ) {
    return 4;
  }

  return x < boundary ? 3 : 4;
}
