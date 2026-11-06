
// import {
//   useEffect,
//   useRef,
//   useState,
// } from "react";

// import { HandTracker } from "./HandTracker";

// import {
//   DrawingUtils,
//   HandLandmarker,
//   type HandLandmarkerResult,
// } from "@mediapipe/tasks-vision";

// import {
//   GestureController,
//   type GestureEvent,
//   type GestureState,
//   type GestureLane,
// } from "../game/gestureController";

// import type {
//   HandFrame,
// } from "../game/handHologram";

// type CameraStatus =
//   | "off"
//   | "loading"
//   | "on"
//   | "error";

// type TrackingStatus =
//   | "off"
//   | "loading"
//   | "tracking"
//   | "error";

// interface GameCameraProps {
//   onCameraStatusChange?: (
//     isOn: boolean
//   ) => void;

//   onGestureInput?: (
//     event: GestureEvent
//   ) => void;

//   onHandFrame?: (
//     frame: HandFrame
//   ) => void;
// }

// const LANES = [
//   "D",
//   "F",
//   "J",
//   "K",
// ] as const;

// const EMPTY: GestureState = {
//   activeLanes: [],
//   fistLanes: [],
//   handCount: 0,
//   phase: "OPEN",
//   selectedLane: null,
//   closeCount: 0,
// };

// export default function GameCamera({
//   onCameraStatusChange,
//   onGestureInput,
//   onHandFrame,
// }: GameCameraProps) {
//   const videoRef =
//     useRef<HTMLVideoElement>(null);

//   const canvasRef =
//     useRef<HTMLCanvasElement>(null);

//   const streamRef =
//     useRef<MediaStream | null>(null);

//   const trackerRef =
//     useRef<HandTracker | null>(null);

//   const requestRef = useRef(0);

//   const controllerRef =
//     useRef(new GestureController());

//   const callbackRef =
//     useRef(onGestureInput);

//   const handFrameRef =
//     useRef(onHandFrame);

//   const lastUiRef = useRef(0);

//   const [status, setStatus] =
//     useState<CameraStatus>("off");

//   const [
//     trackingStatus,
//     setTrackingStatus,
//   ] = useState<TrackingStatus>("off");

//   const [error, setError] =
//     useState("");

//   const [gesture, setGesture] =
//     useState<GestureState>(EMPTY);

//   useEffect(() => {
//     callbackRef.current =
//       onGestureInput;
//   }, [onGestureInput]);

//   useEffect(() => {
//     handFrameRef.current =
//       onHandFrame;
//   }, [onHandFrame]);

//   useEffect(() => {
//     onCameraStatusChange?.(
//       status === "on"
//     );
//   }, [status, onCameraStatusChange]);

//   const clearCanvas = () => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     canvas
//       .getContext("2d")
//       ?.clearRect(
//         0,
//         0,
//         canvas.width,
//         canvas.height
//       );
//   };

//   const drawHands = (
//     result: HandLandmarkerResult
//   ) => {
//     // Existing gesture recognition is unchanged.
//     const next =
//       controllerRef.current.process(
//         result,
//         (event) => {
//           callbackRef.current?.(event);
//         }
//       );

//     // New: publish raw landmarks to the hologram.
//     handFrameRef.current?.({
//       timestamp: performance.now(),
//       hands: result.landmarks.map(
//         (points, index) => ({
//           id:
//             result.handedness[index]?.[0]
//               ?.categoryName ??
//             `hand-${index}`,

//           points: points.map((point) => ({
//             x: point.x,
//             y: point.y,
//           })),
//         })
//       ),
//     });

//     const now = performance.now();

//     if (
//       now - lastUiRef.current >= 65
//     ) {
//       setGesture(next);
//       lastUiRef.current = now;
//     }

//     const canvas = canvasRef.current;
//     const video = videoRef.current;

//     if (!canvas || !video) return;

//     const context =
//       canvas.getContext("2d");

//     if (!context) return;

//     const width = video.videoWidth;
//     const height = video.videoHeight;

//     if (!width || !height) return;

//     if (
//       canvas.width !== width ||
//       canvas.height !== height
//     ) {
//       canvas.width = width;
//       canvas.height = height;
//     }

//     context.clearRect(
//       0,
//       0,
//       width,
//       height
//     );

//     const draw =
//       new DrawingUtils(context);

//     for (
//       const landmarks of result.landmarks
//     ) {
//       draw.drawConnectors(
//         landmarks,
//         HandLandmarker.HAND_CONNECTIONS,
//         {
//           color: "#e6c18b",
//           lineWidth: 3,
//         }
//       );

//       draw.drawLandmarks(
//         landmarks,
//         {
//           color: "#f5e9d7",
//           fillColor: "#c99553",
//           lineWidth: 1,
//           radius: 4,
//         }
//       );
//     }
//   };

//   const stopCamera = () => {
//     requestRef.current++;

//     controllerRef.current.reset(
//       (event) => {
//         callbackRef.current?.(event);
//       }
//     );

//     trackerRef.current?.dispose();
//     trackerRef.current = null;

//     streamRef.current
//       ?.getTracks()
//       .forEach((track) => {
//         track.stop();
//       });

//     streamRef.current = null;

//     if (videoRef.current) {
//       videoRef.current.pause();
//       videoRef.current.srcObject = null;
//     }

//     clearCanvas();

//     handFrameRef.current?.({
//       timestamp: performance.now(),
//       hands: [],
//     });

//     setGesture(EMPTY);
//     setTrackingStatus("off");
//     setStatus("off");
//     setError("");
//   };

//   const startCamera = async () => {
//     if (
//       status === "loading" ||
//       status === "on"
//     ) {
//       return;
//     }

//     const requestId =
//       ++requestRef.current;

//     setStatus("loading");
//     setTrackingStatus("off");
//     setGesture(EMPTY);
//     setError("");

//     controllerRef.current.reset();

//     let stream: MediaStream | null =
//       null;

//     let tracker: HandTracker | null =
//       null;

//     let cameraStarted = false;

//     try {
//       if (
//         !navigator.mediaDevices
//           ?.getUserMedia
//       ) {
//         throw new Error(
//           "Camera access requires HTTPS or localhost."
//         );
//       }

//       stream =
//         await navigator.mediaDevices
//           .getUserMedia({
//             audio: false,

//             video: {
//               facingMode: "user",

//               width: {
//                 ideal: 640,
//               },

//               height: {
//                 ideal: 360,
//               },
//             },
//           });

//       if (
//         requestId !==
//         requestRef.current
//       ) {
//         stream
//           .getTracks()
//           .forEach((track) => {
//             track.stop();
//           });

//         return;
//       }

//       streamRef.current = stream;

//       const video = videoRef.current;

//       if (!video) {
//         throw new Error(
//           "Video element unavailable."
//         );
//       }

//       video.srcObject = stream;

//       await video.play();

//       if (
//         requestId !==
//         requestRef.current
//       ) {
//         return;
//       }

//       cameraStarted = true;

//       setStatus("on");
//       setTrackingStatus("loading");

//       tracker = new HandTracker();
//       trackerRef.current = tracker;

//       await tracker.initialize();

//       if (
//         requestId !==
//         requestRef.current
//       ) {
//         tracker.dispose();
//         return;
//       }

//       tracker.start(
//         video,
//         drawHands
//       );

//       setTrackingStatus("tracking");
//     } catch (err) {
//       if (
//         requestId !==
//         requestRef.current
//       ) {
//         tracker?.dispose();
//         return;
//       }

//       console.error(
//         "[AirStudio] Camera or tracking error:",
//         err
//       );

//       tracker?.dispose();
//       trackerRef.current = null;

//       controllerRef.current.reset(
//         (event) => {
//           callbackRef.current?.(event);
//         }
//       );

//       handFrameRef.current?.({
//         timestamp: performance.now(),
//         hands: [],
//       });

//       if (cameraStarted) {
//         setTrackingStatus("error");

//         setError(
//           "Hand tracking unavailable. Camera is still active."
//         );

//         return;
//       }

//       stream
//         ?.getTracks()
//         .forEach((track) => {
//           track.stop();
//         });

//       streamRef.current = null;

//       if (videoRef.current) {
//         videoRef.current.srcObject = null;
//       }

//       clearCanvas();

//       setStatus("error");
//       setTrackingStatus("off");

//       if (
//         err instanceof DOMException &&
//         err.name === "NotAllowedError"
//       ) {
//         setError(
//           "Camera permission denied."
//         );
//       } else {
//         setError(
//           err instanceof Error
//             ? err.message
//             : "Unable to access camera."
//         );
//       }
//     }
//   };

//   useEffect(() => {
//     return () => {
//       requestRef.current++;

//       controllerRef.current.reset(
//         (event) => {
//           callbackRef.current?.(event);
//         }
//       );

//       trackerRef.current?.dispose();
//       trackerRef.current = null;

//       streamRef.current
//         ?.getTracks()
//         .forEach((track) => {
//           track.stop();
//         });

//       streamRef.current = null;
//     };
//   }, []);

//   const fistLanes =
//     gesture.fistLanes ?? [];

//   const isFistActive =
//     fistLanes.length > 0;

//   return (
//     <div className="game-compact-camera">
//       <div className="game-camera-preview">
//         <video
//           ref={videoRef}
//           autoPlay
//           muted
//           playsInline
//           aria-label="Live camera preview"
//         />

//         <div
//           className="game-camera-zone-grid"
//           aria-hidden="true"
//         >
//           {LANES.map((lane, i) => {
//             const isSelected =
//               gesture.selectedLane === i;

//             const isPinched =
//               gesture.activeLanes.includes(
//                 i as GestureLane
//               );

//             const isFist =
//               fistLanes.includes(
//                 i as GestureLane
//               );

//             return (
//               <div
//                 key={lane}
//                 className={[
//                   "game-camera-zone",
//                   isSelected
//                     ? "is-selected"
//                     : "",
//                   isPinched
//                     ? "is-pinched"
//                     : "",
//                   isFist
//                     ? "is-fist"
//                     : "",
//                 ]
//                   .filter(Boolean)
//                   .join(" ")}
//               >
//                 <span>{lane}</span>
//               </div>
//             );
//           })}
//         </div>

//         <canvas
//           ref={canvasRef}
//           className="game-hand-overlay"
//           aria-hidden="true"
//         />

//         {status !== "on" && (
//           <div className="game-camera-placeholder">
//             <span className="game-camera-placeholder-icon">
//               ✦
//             </span>

//             <span>
//               {status === "loading"
//                 ? "CONNECTING..."
//                 : "CAMERA OFF"}
//             </span>
//           </div>
//         )}

//         {status === "on" && (
//           <span className="game-camera-live">
//             <span className="game-camera-live-dot" />
//             LIVE
//           </span>
//         )}

//         {status === "on" &&
//           trackingStatus ===
//             "tracking" && (
//             <span
//               className={[
//                 "game-gesture-indicator",
//                 gesture.phase ===
//                   "PINCHED"
//                   ? "is-pinched"
//                   : "",
//                 isFistActive
//                   ? "is-fist"
//                   : "",
//               ]
//                 .filter(Boolean)
//                 .join(" ")}
//             >
//               {isFistActive
//                 ? "THUMBS UP"
//                 : gesture.phase}

//               {" · "}

//               {isFistActive
//                 ? fistLanes
//                     .map(
//                       (lane) =>
//                         LANES[lane]
//                     )
//                     .join("+")
//                 : gesture.selectedLane ===
//                     null
//                   ? "—"
//                   : LANES[
//                       gesture.selectedLane
//                     ]}

//               {" · "}

//               {isFistActive
//                 ? "HOLD"
//                 : `${gesture.closeCount}/4`}
//             </span>
//           )}
//       </div>

//       <div className="game-camera-controls">
//         <span className="game-camera-status">
//           {status === "on"
//             ? "CAMERA ON"
//             : status === "loading"
//               ? "CONNECTING"
//               : "CAMERA OFF"}
//         </span>

//         <button
//           type="button"
//           className="game-camera-toggle"
//           onClick={
//             status === "on" ||
//             status === "loading"
//               ? stopCamera
//               : startCamera
//           }
//         >
//           {status === "on" ||
//           status === "loading"
//             ? "TURN OFF"
//             : "ENABLE"}
//         </button>
//       </div>

//       {status === "on" && (
//         <span className="game-camera-status">
//           {trackingStatus === "loading"
//             ? "LOADING HAND MODEL..."
//             : trackingStatus ===
//                 "tracking"
//               ? `${
//                   gesture.handCount
//                 } HAND${
//                   gesture.handCount === 1
//                     ? ""
//                     : "S"
//                 } DETECTED`
//               : trackingStatus ===
//                   "error"
//                 ? "TRACKING UNAVAILABLE"
//                 : "TRACKING OFF"}
//         </span>
//       )}

//       {error && (
//         <span
//           className="game-camera-error"
//           role="alert"
//         >
//           {error}
//         </span>
//       )}
//     </div>
//   );
// }

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { HandTracker } from "./HandTracker";

import {
  DrawingUtils,
  HandLandmarker,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";

import {
  GestureController,
  type GestureEvent,
  type GestureState,
  type GestureLane,
} from "../game/gestureController";

import type { HandFrame } from "../game/handHologram";

type CameraStatus =
  | "off"
  | "loading"
  | "on"
  | "error";

type TrackingStatus =
  | "off"
  | "loading"
  | "tracking"
  | "error";

interface GameCameraProps {
  onCameraStatusChange?: (
    isOn: boolean
  ) => void;

  onGestureInput?: (
    event: GestureEvent
  ) => void;

  onHandFrame?: (
    frame: HandFrame
  ) => void;
}

const LANES = [
  "D",
  "F",
  "J",
  "K",
] as const;

const EMPTY: GestureState = {
  activeLanes: [],
  fistLanes: [],
  handCount: 0,
  phase: "OPEN",
  selectedLane: null,
  closeCount: 0,
};

export default function GameCamera({
  onCameraStatusChange,
  onGestureInput,
  onHandFrame,
}: GameCameraProps) {
  const videoRef =
    useRef<HTMLVideoElement>(null);

  const canvasRef =
    useRef<HTMLCanvasElement>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const trackerRef =
    useRef<HandTracker | null>(null);

  const requestRef = useRef(0);

  const controllerRef =
    useRef(new GestureController());

  const callbackRef =
    useRef(onGestureInput);

  // New: independent visual callback.
  const handFrameCallbackRef =
    useRef(onHandFrame);

  const lastUiRef = useRef(0);

  const [status, setStatus] =
    useState<CameraStatus>("off");

  const [
    trackingStatus,
    setTrackingStatus,
  ] = useState<TrackingStatus>("off");

  const [error, setError] =
    useState("");

  const [gesture, setGesture] =
    useState<GestureState>(EMPTY);

  useEffect(() => {
    callbackRef.current =
      onGestureInput;
  }, [onGestureInput]);

  useEffect(() => {
    handFrameCallbackRef.current =
      onHandFrame;
  }, [onHandFrame]);

  useEffect(() => {
    onCameraStatusChange?.(
      status === "on"
    );
  }, [status, onCameraStatusChange]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    canvas
      .getContext("2d")
      ?.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );
  };

  const clearHologram = () => {
    handFrameCallbackRef.current?.({
      timestamp: performance.now(),
      hands: [],
    });
  };

  const drawHands = (
    result: HandLandmarkerResult
  ) => {
    // ORIGINAL GESTURE PROCESSING — UNCHANGED.
    const next =
      controllerRef.current.process(
        result,
        (event) => {
          callbackRef.current?.(event);
        }
      );

    // NEW: send landmark copies to the visual overlay.
    // This does not modify the MediaPipe result.
    handFrameCallbackRef.current?.({
      timestamp: performance.now(),
      hands: result.landmarks.map(
        (points, index) => ({
          id:
            result.handedness[index]?.[0]
              ?.categoryName ??
            `hand-${index}`,

         points: points.map((point) => ({
            x: point.x,
            y: point.y,
            z: point.z,
            })),
        })
      ),
    });

    const now = performance.now();

    // ORIGINAL UI THROTTLING — UNCHANGED.
    if (
      now - lastUiRef.current >= 65
    ) {
      setGesture(next);
      lastUiRef.current = now;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const context =
      canvas.getContext("2d");

    if (!context) return;

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) return;

    if (
      canvas.width !== width ||
      canvas.height !== height
    ) {
      canvas.width = width;
      canvas.height = height;
    }

    context.clearRect(
      0,
      0,
      width,
      height
    );

    const draw =
      new DrawingUtils(context);

    for (
      const landmarks of result.landmarks
    ) {
      draw.drawConnectors(
        landmarks,
        HandLandmarker.HAND_CONNECTIONS,
        {
          color: "#e6c18b",
          lineWidth: 3,
        }
      );

      draw.drawLandmarks(
        landmarks,
        {
          color: "#f5e9d7",
          fillColor: "#c99553",
          lineWidth: 1,
          radius: 4,
        }
      );
    }
  };

  const stopCamera = () => {
    requestRef.current++;

    controllerRef.current.reset(
      (event) => {
        callbackRef.current?.(event);
      }
    );

    trackerRef.current?.dispose();
    trackerRef.current = null;

    streamRef.current
      ?.getTracks()
      .forEach((track) => {
        track.stop();
      });

    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    clearCanvas();
    clearHologram();

    setGesture(EMPTY);
    setTrackingStatus("off");
    setStatus("off");
    setError("");
  };

  const startCamera = async () => {
    if (
      status === "loading" ||
      status === "on"
    ) {
      return;
    }

    const requestId =
      ++requestRef.current;

    setStatus("loading");
    setTrackingStatus("off");
    setGesture(EMPTY);
    setError("");

    controllerRef.current.reset();

    let stream: MediaStream | null =
      null;

    let tracker: HandTracker | null =
      null;

    let cameraStarted = false;

    try {
      if (
        !navigator.mediaDevices
          ?.getUserMedia
      ) {
        throw new Error(
          "Camera access requires HTTPS or localhost."
        );
      }

      stream =
        await navigator.mediaDevices
          .getUserMedia({
            audio: false,

            video: {
              facingMode: "user",

              width: {
                ideal: 640,
              },

              height: {
                ideal: 360,
              },
            },
          });

      if (
        requestId !==
        requestRef.current
      ) {
        stream
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        return;
      }

      streamRef.current = stream;

      const video = videoRef.current;

      if (!video) {
        throw new Error(
          "Video element unavailable."
        );
      }

      video.srcObject = stream;

      await video.play();

      if (
        requestId !==
        requestRef.current
      ) {
        return;
      }

      cameraStarted = true;

      setStatus("on");
      setTrackingStatus("loading");

      tracker = new HandTracker();
      trackerRef.current = tracker;

      await tracker.initialize();

      if (
        requestId !==
        requestRef.current
      ) {
        tracker.dispose();
        return;
      }

      tracker.start(
        video,
        drawHands
      );

      setTrackingStatus("tracking");
    } catch (err) {
      if (
        requestId !==
        requestRef.current
      ) {
        tracker?.dispose();
        return;
      }

      console.error(
        "[AirStudio] Camera or tracking error:",
        err
      );

      tracker?.dispose();
      trackerRef.current = null;

      controllerRef.current.reset(
        (event) => {
          callbackRef.current?.(event);
        }
      );

      clearHologram();

      if (cameraStarted) {
        setTrackingStatus("error");

        setError(
          "Hand tracking unavailable. Camera is still active."
        );

        return;
      }

      stream
        ?.getTracks()
        .forEach((track) => {
          track.stop();
        });

      streamRef.current = null;

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      clearCanvas();

      setStatus("error");
      setTrackingStatus("off");

      if (
        err instanceof DOMException &&
        err.name === "NotAllowedError"
      ) {
        setError(
          "Camera permission denied."
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to access camera."
        );
      }
    }
  };

  useEffect(() => {
    return () => {
      requestRef.current++;

      controllerRef.current.reset(
        (event) => {
          callbackRef.current?.(event);
        }
      );

      trackerRef.current?.dispose();
      trackerRef.current = null;

      streamRef.current
        ?.getTracks()
        .forEach((track) => {
          track.stop();
        });

      streamRef.current = null;
    };
  }, []);

  const fistLanes =
    gesture.fistLanes ?? [];

  const isFistActive =
    fistLanes.length > 0;

  return (
    <div className="game-compact-camera">
      <div className="game-camera-preview">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          aria-label="Live camera preview"
        />

        <div
          className="game-camera-zone-grid"
          aria-hidden="true"
        >
          {LANES.map((lane, i) => {
            const isSelected =
              gesture.selectedLane === i;

            const isPinched =
              gesture.activeLanes.includes(
                i as GestureLane
              );

            const isFist =
              fistLanes.includes(
                i as GestureLane
              );

            return (
              <div
                key={lane}
                className={[
                  "game-camera-zone",
                  isSelected
                    ? "is-selected"
                    : "",
                  isPinched
                    ? "is-pinched"
                    : "",
                  isFist
                    ? "is-fist"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span>{lane}</span>
              </div>
            );
          })}
        </div>

        <canvas
          ref={canvasRef}
          className="game-hand-overlay"
          aria-hidden="true"
        />

        {status !== "on" && (
          <div className="game-camera-placeholder">
            <span className="game-camera-placeholder-icon">
              ✦
            </span>

            <span>
              {status === "loading"
                ? "CONNECTING..."
                : "CAMERA OFF"}
            </span>
          </div>
        )}

        {status === "on" && (
          <span className="game-camera-live">
            <span className="game-camera-live-dot" />
            LIVE
          </span>
        )}

        {status === "on" &&
          trackingStatus ===
            "tracking" && (
            <span
              className={[
                "game-gesture-indicator",
                gesture.phase ===
                  "PINCHED"
                  ? "is-pinched"
                  : "",
                isFistActive
                  ? "is-fist"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {isFistActive
                ? "THUMBS UP"
                : gesture.phase}
              {" · "}
              {isFistActive
                ? fistLanes
                    .map(
                      (lane) =>
                        LANES[lane]
                    )
                    .join("+")
                : gesture.selectedLane ===
                    null
                  ? "—"
                  : LANES[
                      gesture.selectedLane
                    ]}
              {" · "}
              {isFistActive
                ? "HOLD"
                : `${gesture.closeCount}/4`}
            </span>
          )}
      </div>

      <div className="game-camera-controls">
        <span className="game-camera-status">
          {status === "on"
            ? "CAMERA ON"
            : status === "loading"
              ? "CONNECTING"
              : "CAMERA OFF"}
        </span>

        <button
          type="button"
          className="game-camera-toggle"
          onClick={
            status === "on" ||
            status === "loading"
              ? stopCamera
              : startCamera
          }
        >
          {status === "on" ||
          status === "loading"
            ? "TURN OFF"
            : "ENABLE"}
        </button>
      </div>

      {status === "on" && (
        <span className="game-camera-status">
          {trackingStatus === "loading"
            ? "LOADING HAND MODEL..."
            : trackingStatus ===
                "tracking"
              ? `${
                  gesture.handCount
                } HAND${
                  gesture.handCount === 1
                    ? ""
                    : "S"
                } DETECTED`
              : trackingStatus ===
                  "error"
                ? "TRACKING UNAVAILABLE"
                : "TRACKING OFF"}
        </span>
      )}

      {error && (
        <span
          className="game-camera-error"
          role="alert"
        >
          {error}
        </span>
      )}
    </div>
  );
}