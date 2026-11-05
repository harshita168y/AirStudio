
import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import "./App.css";

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [status, setStatus] = useState("Camera stopped");
  const [handCount, setHandCount] = useState(0);
  const [fps, setFps] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;

    let cancelled = false;
    let stream: MediaStream | null = null;
    let landmarker: HandLandmarker | null = null;
    let frameId = 0;
    let lastVideoTime = -1;
    let frames = 0;
    let lastFpsUpdate = performance.now();

    async function startTracking() {
      try {
        setStatus("Loading hand tracking model...");

        const vision = await FilesetResolver.forVisionTasks(
          WASM_URL
        );

        const model = await HandLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          }
        );

        if (cancelled) {
          model.close();
          return;
        }

        landmarker = model;
        setStatus("Requesting camera permission...");

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

        if (!video || !canvas) return;

        video.srcObject = stream;
        await video.play();

        if (cancelled) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas unavailable");

        const drawingUtils = new DrawingUtils(ctx);

        setStatus("Tracking active");

        function processFrame() {
          if (cancelled || !video || !canvas || !ctx || !landmarker) {
            return;
          }

          if (
            video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
            video.currentTime !== lastVideoTime
          ) {
            lastVideoTime = video.currentTime;

            const results = landmarker.detectForVideo(
              video,
              performance.now()
            );

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const landmarks of results.landmarks) {
              drawingUtils.drawConnectors(
                landmarks,
                HandLandmarker.HAND_CONNECTIONS,
                { color: "#D5A253", lineWidth: 3 }
              );

              drawingUtils.drawLandmarks(landmarks, {
                color: "#FFFFFF",
                fillColor: "#D5A253",
                radius: 4,
              });
            }

            setHandCount((previous) =>
              previous === results.landmarks.length
                ? previous
                : results.landmarks.length
            );

            frames++;

            const now = performance.now();
            if (now - lastFpsUpdate >= 1000) {
              setFps(
                Math.round((frames * 1000) / (now - lastFpsUpdate))
              );
              frames = 0;
              lastFpsUpdate = now;
            }
          }

          frameId = requestAnimationFrame(processFrame);
        }

        processFrame();
      } catch (error) {
        if (cancelled) return;

        console.error("Tracking error:", error);
        setStatus(
          error instanceof Error ? error.message : "Tracking failed"
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

  function stopCamera() {
    setRunning(false);
    setHandCount(0);
    setFps(0);
    setStatus("Camera stopped");
  }

  return (
    <main className="app">
      <header>
        <p className="eyebrow">AIRSTUDIO / CV LAB</p>
        <h1>Hand Tracking Prototype</h1>
        <p className="subtitle">
          Stage 2.2 — Webcam and MediaPipe Hand Landmarker
        </p>
      </header>

      <section className="camera-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
        />

        <canvas ref={canvasRef} />

        <div className="camera-label">
          {running ? "LIVE CAMERA" : "CAMERA OFF"}
        </div>
      </section>

      <section className="stats">
        <div className="stat">
          <span>Tracking status</span>
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
      </section>

      <div className="controls">
        {!running ? (
          <button onClick={() => setRunning(true)}>
            Start Camera
          </button>
        ) : (
          <button onClick={stopCamera}>
            Stop Camera
          </button>
        )}
      </div>

      <p className="privacy">
        Video is processed locally. No webcam footage is uploaded.
      </p>
    </main>
  );
}
