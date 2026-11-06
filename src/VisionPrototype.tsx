
import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

import {
  getPalmCenter,
  mirrorX,
  mapHandToLane,
  type HandSide,
  type Lane,
} from "./vision/laneMapping";

import {
  FingerCurlDetector,
  DEFAULT_CURL_SETTINGS,
  type CurlSettings,
  type GestureEvent,
} from "./gestures/fingerCurlDetector";

import "./App.css";

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

type ZoneLanes = Record<HandSide, Lane | null>;
type CurlStatus = ReturnType<FingerCurlDetector["getStatus"]>;

function emptyLanes(): ZoneLanes {
  return { Left: null, Right: null };
}

function initialStatuses(): Record<HandSide, CurlStatus> {
  const detector = new FingerCurlDetector();
  return {
    Left: detector.getStatus("Left", 0),
    Right: detector.getStatus("Right", 0),
  };
}

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef(new FingerCurlDetector());

  const previousLanesRef = useRef<{
    Left?: Lane;
    Right?: Lane;
  }>({});

  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("Camera stopped");
  const [handCount, setHandCount] = useState(0);
  const [fps, setFps] = useState(0);
  const [activeLanes, setActiveLanes] =
    useState<ZoneLanes>(emptyLanes);

  const [gestures, setGestures] = useState(initialStatuses);
  const [tapCount, setTapCount] = useState(0);
  const [events, setEvents] = useState<GestureEvent[]>([]);
  const [sensitivity, setSensitivity] = useState(50);

  useEffect(() => {
    // Higher sensitivity means less finger bending
    // is needed to start a tap.
    const activationThreshold =
      0.58 - sensitivity * 0.004;

    const settings: CurlSettings = {
      ...DEFAULT_CURL_SETTINGS,
      activationThreshold,
      releaseThreshold: Math.max(
        0.08,
        activationThreshold - 0.16
      ),
    };

    detectorRef.current.setSettings(settings);
  }, [sensitivity]);

  useEffect(() => {
    if (!running) return;

    let cancelled = false;
    let stream: MediaStream | null = null;
    let landmarker: HandLandmarker | null = null;
    let frameId = 0;

    let lastVideoTime = -1;
    let frames = 0;
    let lastFpsUpdate = performance.now();
    let lastUiUpdate = 0;

    const detector = detectorRef.current;

    async function startTracking() {
      try {
        setStatus("Loading MediaPipe model...");

        const vision =
          await FilesetResolver.forVisionTasks(WASM_URL);

        const model =
          await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });

        if (cancelled) {
          model.close();
          return;
        }

        landmarker = model;
        setStatus("Requesting webcam...");

        const cameraStream =
          await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: "user",
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 30 },
            },
          });

        if (cancelled) {
          cameraStream.getTracks().forEach((t) => t.stop());
          return;
        }

        stream = cameraStream;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) {
          throw new Error("Camera elements unavailable");
        }

        video.srcObject = stream;
        await video.play();

        if (cancelled) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas unavailable");

        const drawing = new DrawingUtils(ctx);
        setStatus("Tracking active");

        function processFrame() {
          if (
            cancelled ||
            !video ||
            !canvas ||
            !ctx ||
            !landmarker
          ) {
            return;
          }

          if (
            video.readyState >=
              HTMLMediaElement.HAVE_CURRENT_DATA &&
            video.currentTime !== lastVideoTime
          ) {
            lastVideoTime = video.currentTime;
            const now = performance.now();

            const results = landmarker.detectForVideo(
              video,
              now
            );

            ctx.clearRect(
              0,
              0,
              canvas.width,
              canvas.height
            );

            const nextLanes = emptyLanes();
            const visible = new Set<HandSide>();

            type Candidate = {
              landmarks: (typeof results.landmarks)[number];
              screenX: number;
            };

            const candidates: Partial<
              Record<HandSide, Candidate>
            > = {};

            results.landmarks.forEach((landmarks) => {
              drawing.drawConnectors(
                landmarks,
                HandLandmarker.HAND_CONNECTIONS,
                { color: "#D5A253", lineWidth: 3 }
              );

              drawing.drawLandmarks(landmarks, {
                color: "#FFFFFF",
                fillColor: "#D5A253",
                radius: 4,
              });

              const palm = getPalmCenter(landmarks);
              const screenX = mirrorX(palm.x);

              const zone: HandSide =
                screenX < 0.5 ? "Left" : "Right";

              const targetX =
                zone === "Left" ? 0.25 : 0.75;

              const existing = candidates[zone];

              if (
                !existing ||
                Math.abs(screenX - targetX) <
                  Math.abs(existing.screenX - targetX)
              ) {
                candidates[zone] = {
                  landmarks,
                  screenX,
                };
              }
            });

            for (const zone of [
              "Left",
              "Right",
            ] as const) {
              const candidate = candidates[zone];
              if (!candidate) continue;

              visible.add(zone);

              const lane = mapHandToLane(
                zone,
                candidate.screenX,
                previousLanesRef.current[zone]
              );

              if (lane === null) continue;

              previousLanesRef.current[zone] = lane;
              nextLanes[zone] = lane;

              const event = detector.update(
                zone,
                candidate.landmarks,
                lane,
                now
              );

              if (event) {
                if (event.type === "TAP_START") {
                  setTapCount((count) => count + 1);
                }

                setEvents((previous) =>
                  [event, ...previous].slice(0, 12)
                );
              }
            }

            for (const zone of [
              "Left",
              "Right",
            ] as const) {
              if (!visible.has(zone)) {
                delete previousLanesRef.current[zone];
              }
            }

            detector.handleMissing(visible, now);

            setActiveLanes((previous) => {
              if (
                previous.Left === nextLanes.Left &&
                previous.Right === nextLanes.Right
              ) {
                return previous;
              }

              return nextLanes;
            });

            const count = results.landmarks.length;
            setHandCount((previous) =>
              previous === count ? previous : count
            );

            frames++;

            if (now - lastFpsUpdate >= 1000) {
              setFps(
                Math.round(
                  (frames * 1000) /
                    (now - lastFpsUpdate)
                )
              );
              frames = 0;
              lastFpsUpdate = now;
            }

            if (now - lastUiUpdate >= 100) {
              setGestures({
                Left: detector.getStatus("Left", now),
                Right: detector.getStatus("Right", now),
              });
              lastUiUpdate = now;
            }
          }

          frameId = requestAnimationFrame(processFrame);
        }

        processFrame();
      } catch (error) {
        if (cancelled) return;

        console.error(error);
        setStatus(
          error instanceof Error
            ? error.message
            : "Camera tracking failed"
        );
        setRunning(false);
      }
    }

    startTracking();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);

      stream?.getTracks().forEach((track) => track.stop());
      landmarker?.close();

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [running]);

  function resetTracking() {
    detectorRef.current.reset();
    previousLanesRef.current = {};

    setActiveLanes(emptyLanes());
    setGestures(initialStatuses());
    setTapCount(0);
    setEvents([]);
  }

  function startCamera() {
    resetTracking();
    setRunning(true);
  }

  function stopCamera() {
    setRunning(false);
    setStatus("Camera stopped");
    setHandCount(0);
    setFps(0);
    resetTracking();
  }

  function resetGestures() {
    resetTracking();
    setStatus("Gesture detector reset");
  }

  return (
    <main className="app">
      <header>
        <p className="eyebrow">AIRSTUDIO / CV LAB</p>
        <h1>Finger Curl Detection</h1>
        <p className="subtitle">
          Stage 2.4 — Tap, Double Tap & Hold
        </p>
      </header>

      <section className="camera-container">
        <video ref={videoRef} autoPlay playsInline muted />
        <canvas ref={canvasRef} />
        <div className="camera-label">
          {running ? "LIVE CAMERA" : "CAMERA OFF"}
        </div>
      </section>

      <section className="lane-display">
        {([1, 2, 3, 4] as Lane[]).map((lane) => {
          const zone: HandSide =
            lane <= 2 ? "Left" : "Right";

          const isActive = activeLanes[zone] === lane;

          const isHolding =
            gestures[zone].state === "ACTIVE" &&
            gestures[zone].activeLane === lane;

          return (
            <div
              key={lane}
              className={`lane ${
                isActive ? "active" : ""
              } ${isHolding ? "holding" : ""}`}
            >
              <span>{zone.toUpperCase()} ZONE</span>
              <strong>Lane {lane}</strong>
              <small>
                {isHolding
                  ? "TAP / HOLD"
                  : isActive
                    ? "TRACKING"
                    : "INACTIVE"}
              </small>
            </div>
          );
        })}
      </section>

      <section className="stats">
        <div className="stat">
          <span>Status</span>
          <strong>{status}</strong>
        </div>
        <div className="stat">
          <span>Hands detected</span>
          <strong>{handCount} / 2</strong>
        </div>
        <div className="stat">
          <span>Processing FPS</span>
          <strong>{fps}</strong>
        </div>
        <div className="stat">
          <span>Total taps</span>
          <strong>{tapCount}</strong>
        </div>
      </section>

      <section className="gesture-debug">
        {(["Left", "Right"] as HandSide[]).map(
          (zone) => {
            const gesture = gestures[zone];

            return (
              <div className="gesture-card" key={zone}>
                <h3>{zone} zone</h3>

                <p>
                  State: <strong>{gesture.state}</strong>
                </p>

                <p>
                  Curl score:{" "}
                  <strong>
                    {gesture.curlScore.toFixed(3)}
                  </strong>
                </p>

                <div className="curl-meter">
                  <div
                    className="curl-meter-fill"
                    style={{
                      width: `${
                        Math.min(
                          100,
                          Math.max(
                            0,
                            gesture.curlScore * 100
                          )
                        )
                      }%`,
                    }}
                  />
                </div>

                <p>
                  Hold duration:{" "}
                  {(
                    gesture.holdDurationMs / 1000
                  ).toFixed(2)}
                  s
                </p>

                <p>
                  Active lane:{" "}
                  {gesture.activeLane ?? "None"}
                </p>
              </div>
            );
          }
        )}
      </section>

      <section className="sensitivity-panel">
        <h3>Finger curl sensitivity</h3>

        <div className="sensitivity-row">
          <span>Less sensitive</span>
          <strong>{sensitivity}%</strong>
          <span>More sensitive</span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={sensitivity}
          onChange={(event) =>
            setSensitivity(Number(event.target.value))
          }
        />

        <p>
          Increase sensitivity if half curls are
          missed. Reduce it if relaxed fingers
          trigger accidental taps.
        </p>
      </section>

      <section className="event-history">
        <h3>Recent gesture events</h3>

        {events.length === 0 ? (
          <p>No gestures detected yet.</p>
        ) : (
          <div className="event-list">
            {events.map((event, index) => (
              <div
                className="event-item"
                key={`${event.timestamp}-${index}`}
              >
                <strong>{event.type}</strong>
                <span>
                  {event.hand} zone · Lane {event.lane}
                </span>
                {event.type === "TAP_END" && (
                  <span>
                    Held for{" "}
                    {(
                      (event.holdDurationMs ?? 0) /
                      1000
                    ).toFixed(2)}
                    s
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="controls">
        {!running ? (
          <button onClick={startCamera}>
            Start Camera
          </button>
        ) : (
          <>
            <button onClick={stopCamera}>
              Stop Camera
            </button>
            <button onClick={resetGestures}>
              Reset Gestures
            </button>
          </>
        )}
      </div>

      <p className="privacy">
        Hand tracking runs locally in your browser.
        No camera footage is uploaded.
      </p>
    </main>
  );
}
