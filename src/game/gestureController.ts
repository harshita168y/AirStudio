
import type { HandLandmarkerResult } from "@mediapipe/tasks-vision";

export type GestureLane = 0 | 1 | 2 | 3;

export type GesturePhase =
  | "OPEN"
  | "CLOSING"
  | "PINCHED"
  | "RELEASING";

export type GestureEvent = {
  type: "press" | "release";
  lane: GestureLane;

  // Compatibility with the existing RhythmScene:
  // "pinch" = normal note
  // "fist" = thumbs-up / long note
  gesture?: "pinch" | "fist";
};

export type GestureState = {
  activeLanes: GestureLane[];
  handCount: number;
  phase: GesturePhase;
  selectedLane: GestureLane | null;
  closeCount: number;

  // GameCamera uses this field for thumbs-up.
  fistLanes?: GestureLane[];
};

type Point = {
  x: number;
  y: number;
  z?: number;
};

type HandState = {
  phase: GesturePhase;
  selectedLane: GestureLane;

  // Pinch tracking
  lockedLane: GestureLane | null;
  closeFrames: number;
  openFrames: number;
  smoothedRatios: number[];

  // Thumbs-up tracking
  fistLockedLane: GestureLane | null;
  fistCloseFrames: number;
  fistOpenFrames: number;

  lastSeen: number;
};

// =====================================================
// ORIGINAL PINCH SETTINGS - UNCHANGED
// =====================================================

const PRESS_RATIO = 0.65;
const RELEASE_RATIO = 0.90;

const PRESS_FRAMES = 2;
const RELEASE_FRAMES = 2;

const SMOOTHING = 0.85;
const LOST_GRACE_MS = 350;

// =====================================================
// THUMBS-UP SETTINGS
// =====================================================

const THUMB_PRESS_FRAMES = 2;
const THUMB_RELEASE_FRAMES = 1;

const FINGER_CURLED_RATIO = 1.65;
const THUMB_EXTENSION_RATIO = 1.15;

const THUMB_UP_MIN_VERTICAL = 0.015;
const THUMB_UP_DIRECTION_RATIO = 0.35;

// =====================================================
// HELPERS
// =====================================================

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getLane(x: number): GestureLane {
  return Math.max(
    0,
    Math.min(3, Math.floor((1 - x) * 4))
  ) as GestureLane;
}

function getPalmX(points: Point[]): number {
  return (
    points[0].x +
    points[5].x +
    points[9].x +
    points[17].x
  ) / 4;
}

// =====================================================
// ORIGINAL MULTI-FINGER PINCH CALCULATION
// =====================================================

function getFingerRatios(
  points: Point[]
): number[] | null {
  const thumb = points[4];
  const indexBase = points[5];
  const pinkyBase = points[17];

  if (!thumb || !indexBase || !pinkyBase) {
    return null;
  }

  const palmWidth = distance(indexBase, pinkyBase);

  if (palmWidth < 0.025) {
    return null;
  }

  const tips = [
    points[8],
    points[12],
    points[16],
    points[20],
  ];

  if (tips.some((tip) => !tip)) {
    return null;
  }

  return tips.map(
    (tip) => distance(thumb, tip) / palmWidth
  );
}

// =====================================================
// THUMBS-UP CLASSIFIER
// =====================================================

function isThumbsUp(points: Point[]): boolean {
  const wrist = points[0];
  const thumbBase = points[2];
  const thumbTip = points[4];
  const palm = points[9];

  if (!wrist || !thumbBase || !thumbTip || !palm) {
    return false;
  }

  const fingers = [
    { tip: 8, pip: 6 },
    { tip: 12, pip: 10 },
    { tip: 16, pip: 14 },
    { tip: 20, pip: 18 },
  ];

  let curledCount = 0;

  for (const finger of fingers) {
    const tip = points[finger.tip];
    const pip = points[finger.pip];

    if (!tip || !pip) {
      return false;
    }

    const pipDistance = distance(pip, palm);

    if (pipDistance < 0.01) {
      return false;
    }

    const ratio =
      distance(tip, palm) / pipDistance;

    if (ratio <= FINGER_CURLED_RATIO) {
      curledCount++;
    }
  }

  // FIX:
  // Previously only two curled fingers were required.
  // That caused pinches and other hand poses to be
  // incorrectly recognized as thumbs-up.
  if (curledCount < 3) {
    return false;
  }

  const thumbBaseDistance = distance(
    thumbBase,
    wrist
  );

  if (thumbBaseDistance < 0.01) {
    return false;
  }

  const thumbExtension =
    distance(thumbTip, wrist) /
    thumbBaseDistance;

  if (thumbExtension < THUMB_EXTENSION_RATIO) {
    return false;
  }

  // MediaPipe y increases downward.
  const vertical = thumbBase.y - thumbTip.y;

  const horizontal = Math.abs(
    thumbTip.x - thumbBase.x
  );

  if (vertical < THUMB_UP_MIN_VERTICAL) {
    return false;
  }

  if (
    vertical <
    horizontal * THUMB_UP_DIRECTION_RATIO
  ) {
    return false;
  }

  return true;
}

// =====================================================
// GESTURE CONTROLLER
// =====================================================

export class GestureController {
  private hands = new Map<string, HandState>();

  reset(
    emit?: (event: GestureEvent) => void
  ): void {
    for (const hand of this.hands.values()) {
      if (emit && hand.lockedLane !== null) {
        emit({
          type: "release",
          lane: hand.lockedLane,
          gesture: "pinch",
        });
      }

      if (
        emit &&
        hand.fistLockedLane !== null
      ) {
        emit({
          type: "release",
          lane: hand.fistLockedLane,
          gesture: "fist",
        });
      }
    }

    this.hands.clear();
  }

  process(
    result: HandLandmarkerResult,
    emit: (event: GestureEvent) => void
  ): GestureState {
    const now = performance.now();

    const seen = new Set<string>();

    const activeLanes = new Set<GestureLane>();
    const fistLanes = new Set<GestureLane>();

    let selectedLane: GestureLane | null = null;
    let phase: GesturePhase = "OPEN";
    let closeCount = 0;

    result.landmarks.forEach((points, index) => {
      const ratios = getFingerRatios(points);

      if (!ratios) {
        return;
      }

      const id =
        result.handedness[index]?.[0]
          ?.categoryName ?? `hand-${index}`;

      seen.add(id);

      const lane = getLane(getPalmX(points));

      let hand = this.hands.get(id);

      if (!hand) {
        hand = {
          phase: "OPEN",
          selectedLane: lane,

          lockedLane: null,
          closeFrames: 0,
          openFrames: 0,
          smoothedRatios: ratios,

          fistLockedLane: null,
          fistCloseFrames: 0,
          fistOpenFrames: 0,

          lastSeen: now,
        };

        this.hands.set(id, hand);
      }

      hand.lastSeen = now;
      hand.selectedLane = lane;

      // =============================================
      // PINCH SMOOTHING - ORIGINAL FORMULA
      // =============================================

      hand.smoothedRatios =
        hand.smoothedRatios.map(
          (previous, i) =>
            previous * (1 - SMOOTHING) +
            ratios[i] * SMOOTHING
        );

      const closed =
        hand.smoothedRatios.filter(
          (ratio) => ratio <= PRESS_RATIO
        ).length;

      const opened =
        hand.smoothedRatios.filter(
          (ratio) => ratio >= RELEASE_RATIO
        ).length;

      closeCount = Math.max(closeCount, closed);

      // =============================================
      // GESTURE CLASSIFICATION
      // =============================================

      // A valid pinch has priority over thumbs-up.
      const pinchCandidate = closed >= 3;

      // For thumbs-up, at least three fingertips
      // must be separated from the thumb.
      // This prevents a multi-finger pinch from
      // being classified as thumbs-up.
      const thumbSeparated =
        ratios.filter(
          (ratio) => ratio >= RELEASE_RATIO
        ).length >= 3;

      const thumbsUp =
        !pinchCandidate &&
        thumbSeparated &&
        isThumbsUp(points);

      // =============================================
      // THUMBS-UP PRESS / RELEASE
      // =============================================

      if (hand.fistLockedLane === null) {
        hand.fistOpenFrames = 0;

        // Do not begin thumbs-up while a pinch
        // is active.
        if (
          thumbsUp &&
          hand.lockedLane === null
        ) {
          hand.fistCloseFrames++;

          if (
            hand.fistCloseFrames >=
            THUMB_PRESS_FRAMES
          ) {
            hand.fistLockedLane = lane;
            hand.fistCloseFrames = 0;

            emit({
              type: "press",
              lane,
              gesture: "fist",
            });

            console.debug(
              "[AirStudio] THUMBS-UP PRESS",
              ["D", "F", "J", "K"][lane]
            );
          }
        } else {
          hand.fistCloseFrames = 0;
        }
      } else {
        hand.fistCloseFrames = 0;

        if (!thumbsUp) {
          hand.fistOpenFrames++;

          if (
            hand.fistOpenFrames >=
            THUMB_RELEASE_FRAMES
          ) {
            const locked =
              hand.fistLockedLane;

            hand.fistLockedLane = null;
            hand.fistOpenFrames = 0;

            emit({
              type: "release",
              lane: locked,
              gesture: "fist",
            });

            console.debug(
              "[AirStudio] THUMBS-UP RELEASE",
              ["D", "F", "J", "K"][locked]
            );
          }
        } else {
          hand.fistOpenFrames = 0;
        }
      }

      if (hand.fistLockedLane !== null) {
        fistLanes.add(hand.fistLockedLane);
      }

      // =============================================
      // PINCH PRESS / RELEASE
      // =============================================

      if (hand.lockedLane === null) {
        hand.openFrames = 0;

        // FIX:
        // A pinch cannot begin while thumbs-up
        // is active or being confirmed.
        if (
          closed >= 3 &&
          hand.fistLockedLane === null &&
          hand.fistCloseFrames === 0
        ) {
          hand.closeFrames++;
          hand.phase = "CLOSING";

          const confirmed =
            closed === 4 ||
            hand.closeFrames >= PRESS_FRAMES;

          if (confirmed) {
            hand.lockedLane = lane;
            hand.phase = "PINCHED";
            hand.closeFrames = 0;

            emit({
              type: "press",
              lane,
              gesture: "pinch",
            });

            console.debug(
              "[AirStudio] PRESS",
              ["D", "F", "J", "K"][lane]
            );
          }
        } else {
          hand.closeFrames = 0;
          hand.phase = "OPEN";
        }
      } else {
        // Existing pinch release behaviour.
        // Always allow releases to be processed.
        hand.closeFrames = 0;

        if (opened >= 3) {
          hand.openFrames++;
          hand.phase = "RELEASING";

          if (
            hand.openFrames >= RELEASE_FRAMES
          ) {
            const locked = hand.lockedLane;

            hand.lockedLane = null;
            hand.phase = "OPEN";
            hand.openFrames = 0;

            emit({
              type: "release",
              lane: locked,
              gesture: "pinch",
            });

            console.debug(
              "[AirStudio] RELEASE",
              ["D", "F", "J", "K"][locked]
            );
          }
        } else {
          hand.openFrames = 0;
          hand.phase = "PINCHED";
        }
      }

      // =============================================
      // ACTIVE LANE STATE
      // =============================================

      if (hand.lockedLane !== null) {
        activeLanes.add(hand.lockedLane);
      }

      if (
        selectedLane === null ||
        hand.lockedLane !== null
      ) {
        selectedLane =
          hand.lockedLane ?? lane;

        phase = hand.phase;
      }
    });

    // ===============================================
    // HAND TRACKING LOSS
    // ===============================================

    for (const [id, hand] of this.hands) {
      if (seen.has(id)) {
        continue;
      }

      if (
        now - hand.lastSeen >
        LOST_GRACE_MS
      ) {
        if (hand.lockedLane !== null) {
          emit({
            type: "release",
            lane: hand.lockedLane,
            gesture: "pinch",
          });

          console.debug(
            "[AirStudio] RELEASE (tracking lost)",
            ["D", "F", "J", "K"][
              hand.lockedLane
            ]
          );
        }

        if (hand.fistLockedLane !== null) {
          emit({
            type: "release",
            lane: hand.fistLockedLane,
            gesture: "fist",
          });

          console.debug(
            "[AirStudio] THUMBS-UP RELEASE (tracking lost)",
            ["D", "F", "J", "K"][
              hand.fistLockedLane
            ]
          );
        }

        this.hands.delete(id);
      } else {
        // Preserve active gestures during a short
        // tracking interruption.
        if (hand.lockedLane !== null) {
          activeLanes.add(hand.lockedLane);
        }

        if (hand.fistLockedLane !== null) {
          fistLanes.add(
            hand.fistLockedLane
          );
        }
      }
    }

    return {
      activeLanes: [...activeLanes],
      handCount: result.landmarks.length,
      phase,
      selectedLane,
      closeCount,
      fistLanes: [...fistLanes],
    };
  }
}
