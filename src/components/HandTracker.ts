
import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm";
export type HandTrackingCallback = (
  result: HandLandmarkerResult
) => void;

export class HandTracker {
  private landmarker: HandLandmarker | null = null;
  private animationFrameId: number | null = null;
  private running = false;
  private lastVideoTime = -1;
  private lastDetectionTime = -1;

  async initialize(): Promise<void> {
    if (this.landmarker) return;

    const vision = await FilesetResolver.forVisionTasks(
      WASM_URL
    );

    this.landmarker =
      await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
  }

  start(
    video: HTMLVideoElement,
    onResults: HandTrackingCallback
  ): void {
    if (!this.landmarker) {
      throw new Error("HandTracker is not initialized.");
    }

    this.stop();
    this.running = true;
    this.lastVideoTime = -1;
    this.lastDetectionTime = -1;

    const detect = () => {
      if (!this.running || !this.landmarker) return;

      if (
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        const now = performance.now();

        if (video.currentTime !== this.lastVideoTime) {
          this.lastVideoTime = video.currentTime;

          // MediaPipe requires increasing timestamps.
          const timestamp = Math.max(
            now,
            this.lastDetectionTime + 1
          );

          this.lastDetectionTime = timestamp;

          try {
            const result = this.landmarker.detectForVideo(
              video,
              timestamp
            );

            onResults(result);
          } catch (error) {
            console.error(
              "[AirStudio] Hand detection failed:",
              error
            );
          }
        }
      }

      this.animationFrameId =
        requestAnimationFrame(detect);
    };

    this.animationFrameId =
      requestAnimationFrame(detect);
  }

  stop(): void {
    this.running = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  dispose(): void {
    this.stop();
    this.landmarker?.close();
    this.landmarker = null;
  }
}
