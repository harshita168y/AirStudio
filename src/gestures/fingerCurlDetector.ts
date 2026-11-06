
import type { HandSide, Lane } from "../vision/laneMapping";

export type GestureEventType = "TAP_START" | "TAP_END";
export type GestureState = "READY" | "ACTIVE";

export interface GestureEvent {
  type: GestureEventType;
  hand: HandSide;
  lane: Lane;
  timestamp: number;
  holdDurationMs?: number;
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface CurlSettings {
  // Bend score from 0 to 1.
  activationThreshold: number;
  releaseThreshold: number;
  smoothing: number;
}

export const DEFAULT_CURL_SETTINGS: CurlSettings = {
  activationThreshold: 0.38,
  releaseThreshold: 0.22,
  smoothing: 0.65,
};

interface Tracker {
  state: GestureState;
  smoothedCurl: number | null;
  rawCurl: number;
  activeLane: Lane | null;
  tapStartTime: number | null;
  lastSeen: number;
}

function newTracker(): Tracker {
  return {
    state: "READY",
    smoothedCurl: null,
    rawCurl: 0,
    activeLane: null,
    tapStartTime: null,
    lastSeen: 0,
  };
}

function angleDegrees(
  a: Landmark,
  b: Landmark,
  c: Landmark
): number {
  const ab = {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  };

  const cb = {
    x: c.x - b.x,
    y: c.y - b.y,
    z: c.z - b.z,
  };

  const dot =
    ab.x * cb.x +
    ab.y * cb.y +
    ab.z * cb.z;

  const abLength = Math.hypot(ab.x, ab.y, ab.z);
  const cbLength = Math.hypot(cb.x, cb.y, cb.z);

  if (abLength < 1e-6 || cbLength < 1e-6) {
    return 180;
  }

  const cosine = Math.max(
    -1,
    Math.min(1, dot / (abLength * cbLength))
  );

  return (Math.acos(cosine) * 180) / Math.PI;
}

function fingerBend(
  landmarks: Landmark[],
  mcp: number,
  pip: number,
  dip: number
): number {
  const angle = angleDegrees(
    landmarks[mcp],
    landmarks[pip],
    landmarks[dip]
  );

  // 180 degrees: approximately straight.
  // 90 degrees: substantially curled.
  return Math.max(0, Math.min(1, (180 - angle) / 90));
}

export function calculateCurlScore(
  landmarks: Landmark[]
): number {
  if (landmarks.length < 21) return 0;

  const scores = [
    fingerBend(landmarks, 5, 6, 7),
    fingerBend(landmarks, 9, 10, 11),
    fingerBend(landmarks, 13, 14, 15),
    fingerBend(landmarks, 17, 18, 19),
  ].sort((a, b) => a - b);

  return (scores[1] + scores[2]) / 2;
}

export class FingerCurlDetector {
  private trackers: Record<HandSide, Tracker> = {
    Left: newTracker(),
    Right: newTracker(),
  };

  private settings: CurlSettings = {
    ...DEFAULT_CURL_SETTINGS,
  };

  setSettings(settings: CurlSettings) {
    if (
      settings.releaseThreshold >=
      settings.activationThreshold
    ) {
      throw new Error(
        "Release threshold must be below activation threshold"
      );
    }

    this.settings = { ...settings };
  }

  reset() {
    this.trackers = {
      Left: newTracker(),
      Right: newTracker(),
    };
  }

  getStatus(hand: HandSide, now: number) {
    const t = this.trackers[hand];

    return {
      state: t.state,
      curlScore: t.smoothedCurl ?? 0,
      rawCurlScore: t.rawCurl,
      activeLane: t.activeLane,
      holdDurationMs:
        t.state === "ACTIVE" &&
        t.tapStartTime !== null
          ? Math.max(0, now - t.tapStartTime)
          : 0,
    };
  }

  update(
    hand: HandSide,
    landmarks: Landmark[],
    lane: Lane,
    now: number
  ): GestureEvent | null {
    const t = this.trackers[hand];

    t.lastSeen = now;

    const rawCurl = calculateCurlScore(landmarks);
    t.rawCurl = rawCurl;

    t.smoothedCurl =
      t.smoothedCurl === null
        ? rawCurl
        : t.smoothedCurl +
          this.settings.smoothing *
            (rawCurl - t.smoothedCurl);

    const curl = t.smoothedCurl;

    if (
      t.state === "READY" &&
      curl >= this.settings.activationThreshold
    ) {
      t.state = "ACTIVE";
      t.activeLane = lane;
      t.tapStartTime = now;

      return {
        type: "TAP_START",
        hand,
        lane,
        timestamp: now,
      };
    }

    if (
      t.state === "ACTIVE" &&
      curl <= this.settings.releaseThreshold
    ) {
      const completedLane = t.activeLane;
      const duration =
        t.tapStartTime === null
          ? 0
          : now - t.tapStartTime;

      t.state = "READY";
      t.activeLane = null;
      t.tapStartTime = null;

      if (completedLane !== null) {
        return {
          type: "TAP_END",
          hand,
          lane: completedLane,
          timestamp: now,
          holdDurationMs: duration,
        };
      }
    }

    return null;
  }

  handleMissing(
    visible: Set<HandSide>,
    now: number
  ) {
    for (const hand of ["Left", "Right"] as const) {
      const t = this.trackers[hand];

      if (
        !visible.has(hand) &&
        t.lastSeen > 0 &&
        now - t.lastSeen > 450
      ) {
        this.trackers[hand] = newTracker();
      }
    }
  }
}
