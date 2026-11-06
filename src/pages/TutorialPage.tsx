
// import {
//   useCallback,
//   useEffect,
//   useRef,
//   useState,
// } from "react";
// import { Link } from "react-router-dom";

// import ProfileMenu from "../components/ProfileMenu";
// import GameCamera from "../components/GameCamera";

// import type { GestureEvent } from "../game/gestureController";
// import type { HandFrame } from "../game/handHologram";

// import "./TutorialPage.css";

// const LANES = ["D", "F", "J", "K"] as const;
// const HOLD_MS = 1200;

// const CARDS = [
//   {
//     label: "CAMERA SETUP",
//     title: "Lights. Camera. Action.",
//     description: "Enable your webcam to get started.",
//   },
//   {
//     label: "HAND TRACKING",
//     title: "Show us your hands.",
//     description: "Hold both hands in view until they're detected.",
//   },
//   {
//     label: "LEFT HAND",
//     title: "Start with your left.",
//     description: "Curl your fingers inward toward your palm to hit a single note.",
//   },
//   {
//     label: "RIGHT HAND",
//     title: "Now your right.",
//     description: "Use the same palm-curl gesture with your right hand to trigger J, then K.",
//   },
//   {
//     label: "HOLD NOTES",
//     title: "Make it last.",
//     description: "Give a thumbs-up and hold the tile steady to sustain a long note.",
//   },
//   {
//     label: "READY TO PLAY",
//     title: "You've got the moves.",
//     description: "You're ready to follow the beat.",
//   },
// ];

// /**
//  * Custom SVG showing four fingers curling inward
//  * toward the palm. This is not a thumb/index pinch.
//  */
// function PalmCurlIllustration({
//   side = "left",
// }: {
//   side?: "left" | "right";
// }) {
//   return (
//     <svg
//       viewBox="0 0 180 180"
//       className="tutorial-gesture-svg"
//       role="img"
//       aria-label={`${side} hand curling fingers toward the palm`}
//     >
//       <defs>
//         <linearGradient id={`palm-fill-${side}`} x1="0" y1="0" x2="1" y2="1">
//           <stop offset="0%" stopColor="#f1d5ad" />
//           <stop offset="100%" stopColor="#bd8856" />
//         </linearGradient>
//       </defs>

//       <g
//         transform={
//           side === "right"
//             ? "translate(180 0) scale(-1 1)"
//             : undefined
//         }
//       >
//         {/* Wrist and palm */}
//         <path
//           d="
//             M 59 166
//             L 58 116
//             C 52 106 43 97 35 88
//             C 27 79 31 69 39 66
//             C 46 63 52 70 62 80
//             L 66 44
//             C 67 33 78 31 83 40
//             L 86 70
//             L 89 32
//             C 90 20 103 20 106 32
//             L 108 69
//             L 112 39
//             C 114 27 127 30 128 42
//             L 127 78
//             L 134 56
//             C 138 46 150 52 148 63
//             L 139 113
//             C 137 128 125 139 119 147
//             L 119 166
//             Z
//           "
//           fill={`url(#palm-fill-${side})`}
//           stroke="#8f603b"
//           strokeWidth="3"
//           strokeLinejoin="round"
//         />

//         {/* Curl direction arcs */}
//         <g
//           fill="none"
//           stroke="#fff0d4"
//           strokeWidth="4"
//           strokeLinecap="round"
//         >
//           <path d="M 77 66 Q 79 91 94 97" />
//           <path d="M 99 64 Q 102 88 111 95" />
//           <path d="M 120 72 Q 123 89 120 101" />
//         </g>

//         {/* Curled finger creases */}
//         <g
//           fill="none"
//           stroke="#98643c"
//           strokeWidth="2.5"
//           strokeLinecap="round"
//         >
//           <path d="M 70 102 Q 82 93 92 103" />
//           <path d="M 90 108 Q 102 99 113 109" />
//           <path d="M 111 114 Q 121 107 131 113" />
//           <path d="M 76 129 Q 95 137 113 127" />
//         </g>

//         {/* Direction arrow */}
//         <path
//           d="M 143 21 Q 154 45 144 80"
//           fill="none"
//           stroke="#e9b878"
//           strokeWidth="4"
//           strokeLinecap="round"
//           strokeDasharray="5 6"
//         />
//         <path
//           d="M 137 72 L 144 84 L 152 72"
//           fill="none"
//           stroke="#e9b878"
//           strokeWidth="4"
//           strokeLinecap="round"
//           strokeLinejoin="round"
//         />
//       </g>
//     </svg>
//   );
// }

// /**
//  * Custom thumbs-up illustration for long notes.
//  */
// function ThumbsUpIllustration() {
//   return (
//     <svg
//       viewBox="0 0 180 180"
//       className="tutorial-gesture-svg"
//       role="img"
//       aria-label="Thumbs-up gesture for hold notes"
//     >
//       <defs>
//         <linearGradient id="thumb-fill" x1="0" y1="0" x2="1" y2="1">
//           <stop offset="0%" stopColor="#f1d5ad" />
//           <stop offset="100%" stopColor="#bd8856" />
//         </linearGradient>
//       </defs>

//       <path
//         d="
//           M 46 152
//           L 46 98
//           L 66 98
//           C 75 87 82 76 88 61
//           L 91 29
//           C 92 17 106 15 111 27
//           C 114 34 112 50 110 64
//           L 109 78
//           L 139 78
//           C 151 78 155 91 147 98
//           C 156 106 152 119 144 123
//           C 149 133 143 142 134 145
//           C 137 155 129 164 117 164
//           L 78 164
//           C 66 164 56 159 46 152
//           Z
//         "
//         fill="url(#thumb-fill)"
//         stroke="#8f603b"
//         strokeWidth="3.5"
//         strokeLinejoin="round"
//       />

//       <rect
//         x="26"
//         y="96"
//         width="28"
//         height="63"
//         rx="8"
//         fill="#d7a76e"
//         stroke="#8f603b"
//         strokeWidth="3"
//       />

//       <g
//         fill="none"
//         stroke="#98643c"
//         strokeWidth="2.5"
//         strokeLinecap="round"
//       >
//         <path d="M 113 100 L 145 100" />
//         <path d="M 112 121 L 141 121" />
//         <path d="M 110 143 L 133 143" />
//       </g>

//       <path
//         d="M 137 34 L 137 14 M 127 22 L 119 12 M 147 22 L 155 12"
//         stroke="#e9b878"
//         strokeWidth="4"
//         strokeLinecap="round"
//       />
//     </svg>
//   );
// }

// export default function TutorialPage() {
//   const [step, setStep] = useState(0);
//   const [cameraOn, setCameraOn] = useState(false);
//   const [handCount, setHandCount] = useState(0);
//   const [doneLanes, setDoneLanes] = useState<number[]>([]);
//   const [holdProgress, setHoldProgress] = useState(0);
//   const [holdDone, setHoldDone] = useState(false);
//   const [feedback, setFeedback] = useState(
//     "Enable your camera to begin."
//   );

//   const stepRef = useRef(0);
//   const cameraRef = useRef(false);
//   const handsRef = useRef(0);
//   const doneRef = useRef<number[]>([]);
//   const holdStartRef = useRef<number | null>(null);
//   const holdLaneRef = useRef<number | null>(null);
//   const holdDoneRef = useRef(false);
//   const transitionRef = useRef<number | null>(null);

//   const [cardKey, setCardKey] = useState(0);

//   const cancelTransition = useCallback(() => {
//     if (transitionRef.current !== null) {
//       window.clearTimeout(transitionRef.current);
//       transitionRef.current = null;
//     }
//   }, []);

//   const goTo = useCallback(
//     (next: number) => {
//       cancelTransition();

//       const target = Math.max(
//         0,
//         Math.min(CARDS.length - 1, next)
//       );

//       stepRef.current = target;
//       setStep(target);
//       setCardKey((key) => key + 1);

//       if (target === 0) {
//         setFeedback("Enable your camera to begin.");
//       } else if (target === 1) {
//         setFeedback("Show both hands to the camera.");
//       } else if (target === 2) {
//         setFeedback("Curl your left-hand fingers to trigger D.");
//       } else if (target === 3) {
//         setFeedback("Curl your right-hand fingers to trigger J.");
//       } else if (target === 4) {
//         holdStartRef.current = null;
//         holdLaneRef.current = null;
//         holdDoneRef.current = false;
//         setHoldProgress(0);
//         setHoldDone(false);
//         setFeedback("Give a thumbs-up and keep holding.");
//       } else if (target === 5) {
//         setFeedback("Tutorial complete!");
//       }
//     },
//     [cancelTransition]
//   );

//   const advance = useCallback(
//     (expectedStep: number, delay = 650) => {
//       if (
//         stepRef.current !== expectedStep ||
//         transitionRef.current !== null
//       ) {
//         return;
//       }

//       transitionRef.current = window.setTimeout(() => {
//         transitionRef.current = null;

//         if (stepRef.current === expectedStep) {
//           goTo(expectedStep + 1);
//         }
//       }, delay);
//     },
//     [goTo]
//   );

//   const onCameraStatusChange = useCallback(
//     (isOn: boolean) => {
//       cameraRef.current = isOn;
//       setCameraOn(isOn);

//       if (!isOn) {
//         handsRef.current = 0;
//         setHandCount(0);
//         holdStartRef.current = null;
//         holdLaneRef.current = null;
//         setHoldProgress(0);

//         cancelTransition();

//         if (stepRef.current !== 0) {
//           goTo(0);
//         }

//         setFeedback("Enable your camera to begin.");
//       } else if (stepRef.current === 0) {
//         setFeedback("Camera connected!");
//         advance(0);
//       }
//     },
//     [advance, cancelTransition, goTo]
//   );

//   const onHandFrame = useCallback(
//     (frame: HandFrame) => {
//       const count = frame.hands.length;

//       if (handsRef.current !== count) {
//         handsRef.current = count;
//         setHandCount(count);
//       }

//       if (
//         cameraRef.current &&
//         stepRef.current === 1 &&
//         count >= 2
//       ) {
//         setFeedback("Both hands detected!");
//         advance(1);
//       }
//     },
//     [advance]
//   );

//   const onGestureInput = useCallback(
//     (event: GestureEvent) => {
//       if (!cameraRef.current) return;

//       const current = stepRef.current;

//       if (current === 2 || current === 3) {
//         if (
//           event.type !== "press" ||
//           event.gesture === "fist"
//         ) {
//           return;
//         }

//         const expected =
//           current === 2
//             ? doneRef.current.includes(0)
//               ? 1
//               : 0
//             : doneRef.current.includes(2)
//               ? 3
//               : 2;

//         if (event.lane !== expected) {
//           setFeedback(
//             `Detected ${LANES[event.lane]}. Try ${LANES[expected]}.`
//           );
//           return;
//         }

//         if (doneRef.current.includes(event.lane)) {
//           return;
//         }

//         doneRef.current = [
//           ...doneRef.current,
//           event.lane,
//         ];

//         setDoneLanes([...doneRef.current]);

//         const pairFinished =
//           current === 2
//             ? doneRef.current.includes(0) &&
//               doneRef.current.includes(1)
//             : doneRef.current.includes(2) &&
//               doneRef.current.includes(3);

//         if (pairFinished) {
//           setFeedback("Perfect! Both lanes completed.");
//           advance(current, 800);
//         } else {
//           setFeedback(
//             `Nice! Now curl your fingers for ${LANES[expected + 1]}.`
//           );
//         }
//       }

//       if (current === 4 && !holdDoneRef.current) {
//         if (
//           event.gesture === "fist" &&
//           event.type === "press" &&
//           holdStartRef.current === null
//         ) {
//           holdStartRef.current = performance.now();
//           holdLaneRef.current = event.lane;
//           setFeedback("Thumbs-up detected. Keep holding!");
//         }

//         if (
//           event.gesture === "fist" &&
//           event.type === "release" &&
//           holdLaneRef.current === event.lane
//         ) {
//           holdStartRef.current = null;
//           holdLaneRef.current = null;
//           setHoldProgress(0);
//           setFeedback("Try holding a little longer.");
//         }
//       }
//     },
//     [advance]
//   );

//   useEffect(() => {
//     const timer = window.setInterval(() => {
//       if (
//         stepRef.current !== 4 ||
//         holdDoneRef.current ||
//         !cameraRef.current
//       ) {
//         return;
//       }

//       const start = holdStartRef.current;
//       if (start === null) return;

//       const elapsed = performance.now() - start;
//       const progress = Math.min(
//         100,
//         (elapsed / HOLD_MS) * 100
//       );

//       setHoldProgress(progress);

//       if (elapsed >= HOLD_MS) {
//         holdDoneRef.current = true;
//         setHoldDone(true);
//         setHoldProgress(100);
//         setFeedback("Hold completed!");
//         advance(4, 850);
//       }
//     }, 40);

//     return () => window.clearInterval(timer);
//   }, [advance]);

//   useEffect(() => {
//     return () => cancelTransition();
//   }, [cancelTransition]);

//   const restart = () => {
//     doneRef.current = [];
//     setDoneLanes([]);

//     holdDoneRef.current = false;
//     holdStartRef.current = null;
//     holdLaneRef.current = null;

//     setHoldDone(false);
//     setHoldProgress(0);

//     goTo(cameraRef.current ? 1 : 0);
//   };

//   const current = CARDS[step];

//   const expectedLane =
//     step === 2
//       ? doneLanes.includes(0)
//         ? 1
//         : 0
//       : step === 3
//         ? doneLanes.includes(2)
//           ? 3
//           : 2
//         : null;

//   return (
//     <div className="page tutorial-deck-page">
//       <div className="tutorial-topbar">
//         <Link to="/songs" className="tutorial-back-link">
//           <span aria-hidden="true">←</span>
//           <span>BACK TO SONGS</span>
//         </Link>

//         <ProfileMenu />
//       </div>

//       <div className="tutorial-deck-heading">
//         <div>
//           <p className="eyebrow">AIR STUDIO / QUICK START</p>
//           <h1>Learn the moves.</h1>
//         </div>

//         <span className="tutorial-deck-counter">
//           {String(step + 1).padStart(2, "0")} / 06
//         </span>
//       </div>

//       <div
//         className="tutorial-deck-progress"
//         aria-label="Tutorial progress"
//       >
//         {CARDS.map((card, index) => (
//           <span
//             key={card.label}
//             className={[
//               "tutorial-deck-progress-segment",
//               index <= step ? "is-active" : "",
//             ].join(" ")}
//           />
//         ))}
//       </div>

//       <div className="tutorial-deck-layout">
//         <section
//           className="tutorial-deck-card"
//           key={cardKey}
//           aria-label={`Tutorial step ${step + 1}`}
//         >
//           <div className="tutorial-deck-card-top">
//             <span className="tutorial-deck-step-label">
//               {String(step + 1).padStart(2, "0")} / {current.label}
//             </span>
//             <span
//               className="tutorial-deck-sparkle"
//               aria-hidden="true"
//             >
//               ✦
//             </span>
//           </div>

//           <div className="tutorial-deck-card-main">
//             <h2>{current.title}</h2>

//             <p className="tutorial-deck-description">
//               {current.description}
//             </p>

//             {step === 0 && (
//               <div className="tutorial-deck-instruction">
//                 <span
//                   className="tutorial-deck-hero-icon"
//                   aria-hidden="true"
//                 >
//                   ◉
//                 </span>
//                 <strong>
//                   {cameraOn
//                     ? "CAMERA CONNECTED"
//                     : "CAMERA OFF"}
//                 </strong>
//                 <small>
//                   {cameraOn
//                     ? "Moving to hand tracking..."
//                     : "Press ENABLE in the camera panel."}
//                 </small>
//               </div>
//             )}

//             {step === 1 && (
//               <div className="tutorial-deck-instruction">
//                 <div className="tutorial-deck-hands">
//                   <span className={handCount >= 1 ? "detected" : ""}>
//                     ✋
//                   </span>
//                   <span className={handCount >= 2 ? "detected" : ""}>
//                     🤚
//                   </span>
//                 </div>
//                 <strong>{handCount}/2 HANDS DETECTED</strong>
//                 <small>
//                   Keep both hands visible for a moment.
//                 </small>
//               </div>
//             )}

//             {(step === 2 || step === 3) && (
//               <div className="tutorial-deck-lane-practice">
//                 <div className="tutorial-deck-gesture-visual">
//                   <PalmCurlIllustration
//                     side={step === 2 ? "left" : "right"}
//                   />
//                   <div className="tutorial-deck-gesture-caption">
//                     <strong>
//                       {step === 2
//                         ? "LEFT HAND"
//                         : "RIGHT HAND"}
//                     </strong>
//                     <small>FINGERS CURL TOWARD PALM</small>
//                   </div>
//                 </div>

//                 <div className="tutorial-deck-lane-row">
//                   {LANES.map((lane, index) => {
//                     const done = doneLanes.includes(index);
//                     const active = expectedLane === index;
//                     const belongsToHand =
//                       step === 2
//                         ? index < 2
//                         : index >= 2;

//                     return (
//                       <div
//                         key={lane}
//                         className={[
//                           "tutorial-deck-lane",
//                           done ? "is-done" : "",
//                           active ? "is-target" : "",
//                           !belongsToHand ? "is-muted" : "",
//                         ].join(" ")}
//                       >
//                         <strong>{lane}</strong>
//                         <small>
//                           {done
//                             ? "✓"
//                             : active
//                               ? "CURL"
//                               : "·"}
//                         </small>
//                       </div>
//                     );
//                   })}
//                 </div>

//                 <small className="tutorial-deck-hint">
//                   {step === 2
//                     ? "D + F · LEFT HAND"
//                     : "J + K · RIGHT HAND"}
//                 </small>
//               </div>
//             )}

//             {step === 4 && (
//               <div className="tutorial-deck-instruction">
//                 <ThumbsUpIllustration />

//                 <strong>
//                   {holdDone
//                     ? "HOLD COMPLETE"
//                     : "THUMBS-UP TO HOLD"}
//                 </strong>

//                 <div className="tutorial-deck-hold-track">
//                   <div
//                     style={{
//                       width: `${holdProgress}%`,
//                     }}
//                   />
//                 </div>

//                 <small>
//                   {holdDone
//                     ? "Perfect!"
//                     : `${Math.round(holdProgress)}% / 1.2 seconds`}
//                 </small>
//               </div>
//             )}

//             {step === 5 && (
//               <div className="tutorial-deck-instruction">
//                 <span
//                   className="tutorial-deck-hero-icon"
//                   aria-hidden="true"
//                 >
//                   ✦
//                 </span>

//                 <strong>TUTORIAL COMPLETE</strong>

//                 <small>
//                   Palm curl to hit · Thumbs-up to hold
//                 </small>

//                 <small>
//                   Three misses or a wrong-lane press
//                   ends the game.
//                 </small>
//               </div>
//             )}
//           </div>

//           <div className="tutorial-deck-card-bottom">
//             <p
//               className="tutorial-deck-feedback"
//               role="status"
//             >
//               <span aria-hidden="true">●</span>
//               {feedback}
//             </p>

//             <div className="tutorial-deck-actions">
//               {step > 0 && step < 5 && (
//                 <button
//                   type="button"
//                   className="tutorial-deck-secondary"
//                   onClick={() => goTo(step - 1)}
//                 >
//                   ← Back
//                 </button>
//               )}

//               {step === 5 ? (
//                 <>
//                   <button
//                     type="button"
//                     className="tutorial-deck-secondary"
//                     onClick={restart}
//                   >
//                     Practice again
//                   </button>

//                   <Link
//                     to="/songs"
//                     className="button button-primary"
//                   >
//                     Choose a song ↗
//                   </Link>
//                 </>
//               ) : (
//                 <span className="tutorial-deck-auto">
//                   {step === 0
//                     ? "Waiting for camera"
//                     : step === 1
//                       ? "Waiting for both hands"
//                       : "Auto-advances when complete"}
//                 </span>
//               )}
//             </div>
//           </div>
//         </section>

//         <aside className="tutorial-deck-camera">
//           <div className="tutorial-deck-camera-heading">
//             <div>
//               <p className="eyebrow">LIVE PRACTICE</p>
//               <h3>Your hands. Your controller.</h3>
//             </div>

//             <span className={cameraOn ? "is-online" : ""}>
//               {cameraOn ? "● LIVE" : "○ OFFLINE"}
//             </span>
//           </div>

//           <div className="tutorial-deck-camera-content">
//             <GameCamera
//               onCameraStatusChange={onCameraStatusChange}
//               onGestureInput={onGestureInput}
//               onHandFrame={onHandFrame}
//             />
//           </div>

//           <div className="tutorial-deck-camera-footer">
//             <span>LEFT · D / F</span>
//             <span>RIGHT · J / K</span>
//           </div>
//         </aside>
//       </div>

//       <div className="tutorial-deck-page-footer">
//         <span>
//           Complete each card to unlock the next move.
//         </span>

//         <Link
//           to="/songs"
//           className="tutorial-back-link"
//         >
//           SKIP TUTORIAL →
//         </Link>
//       </div>
//     </div>
//   );
// }


import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";

import GameCamera from "../components/GameCamera";

import {
  HandHologramOverlay,
  type HandFrame,
} from "../game/handHologram";

import type {
  GestureEvent,
  GestureLane,
} from "../game/gestureController";

import "./TutorialPage.css";

type LaneName = "D" | "F" | "J" | "K";

type TutorialStep =
  | "camera"
  | "hands"
  | LaneName
  | "hold"
  | "complete";

type PracticeMode = "demo" | "practice";

const LANES: LaneName[] = [
  "D",
  "F",
  "J",
  "K",
];

const STEPS: TutorialStep[] = [
  "camera",
  "hands",
  "D",
  "F",
  "J",
  "K",
  "hold",
  "complete",
];

const LANE_INDEX: Record<LaneName, GestureLane> = {
  D: 0,
  F: 1,
  J: 2,
  K: 3,
};

const STEP_COPY: Record<
  TutorialStep,
  {
    eyebrow: string;
    title: string;
    description: string;
  }
> = {
  camera: {
    eyebrow: "01 / SETUP",
    title: "Lights. Camera. Action.",
    description:
      "Enable your camera to begin rhythm training.",
  },

  hands: {
    eyebrow: "02 / TRACKING",
    title: "Show us your hands.",
    description:
      "Hold both hands in front of the camera until both are detected.",
  },

  D: {
    eyebrow: "03 / LEFT HAND",
    title: "First beat. Lane D.",
    description:
      "Move your left hand into D and curl your fingers toward your Thumb.",
  },

  F: {
    eyebrow: "04 / LEFT HAND",
    title: "Move across to F.",
    description:
      "Release your previous gesture, move to F, and curl your fingers again.",
  },

  J: {
    eyebrow: "05 / RIGHT HAND",
    title: "Switch hands. Lane J.",
    description:
      "Use your right hand in J and curl your fingers toward your Thumb.",
  },

  K: {
    eyebrow: "06 / RIGHT HAND",
    title: "One more. Lane K.",
    description:
      "Release your gesture, move your right hand to K, and hit again.",
  },

  hold: {
    eyebrow: "07 / LONG NOTES",
    title: "Hold the beat.",
    description:
      "Give a thumbs-up and hold it steadily until the progress bar fills.",
  },

  complete: {
    eyebrow: "TRAINING COMPLETE",
    title: "You're ready to play.",
    description:
      "You've learned the basic gestures. Choose a song and start playing.",
  },
};

const ADVANCE_DELAY_MS = 850;
const HOLD_DURATION_MS = 1300;

function isLaneStep(
  step: TutorialStep
): step is LaneName {
  return (
    step === "D" ||
    step === "F" ||
    step === "J" ||
    step === "K"
  );
}

function needsDemo(step: TutorialStep) {
  return isLaneStep(step) || step === "hold";
}

function GestureDemo({
  isHold,
  onStart,
}: {
  isHold: boolean;
  onStart: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        marginTop: 10,
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          width: 190,
          minHeight: 158,
          border:
            "1px solid rgba(225,180,124,.32)",
          borderRadius: 16,
          background: "rgba(18,13,9,.92)",
          boxShadow:
            "0 12px 35px rgba(0,0,0,.3)",
        }}
      >
        <span
          aria-label={
            isHold
              ? "Thumbs-up demonstration"
              : "Pinching demonstration"
          }
          role="img"
          style={{
            fontSize: 78,
            lineHeight: 1,
            display: "inline-block",
            animation: isHold
              ? "tutorialThumbDemo 2s ease-in-out infinite"
              : "tutorialPinchDemo 1.8s ease-in-out infinite",
            transformOrigin: "center center",
          }}
        >
          {isHold ? "👍" : "🫳"}
        </span>

        <span
          style={{
            color: "#e1b47c",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: ".12em",
          }}
        >
          {isHold
            ? "THUMBS UP → HOLD"
            : "OPEN → CURL → RELEASE"}
        </span>
      </div>

      <span
        style={{
          maxWidth: 290,
          textAlign: "center",
          fontSize: 12,
          lineHeight: 1.5,
          color: "#c3b4a5",
        }}
      >
        {isHold
          ? "Watch the thumbs up gesture, then keep it active during practice."
          : "Watch the movement. Curl your fingers toward your Thumb, then release. Do not pinch thumb to index finger."}
      </span>

      <button
        type="button"
        onClick={onStart}
        style={{
          marginTop: 4,
          padding: "13px 24px",
          border: "none",
          borderRadius: 6,
          background: "#e1b47c",
          color: "#21150c",
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: ".1em",
          cursor: "pointer",
        }}
      >
        GOT IT — LET ME TRY →
      </button>

      <style>
        {`
          @keyframes tutorialPinchDemo {
            0%, 100% {
              transform: scale(1) rotate(-8deg);
            }
            45%, 60% {
              transform: scale(.78) rotate(4deg);
            }
          }

          @keyframes tutorialThumbDemo {
            0%, 100% {
              transform: scale(.92) rotate(-8deg);
            }
            45%, 65% {
              transform: scale(1.12) rotate(0deg);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .training-instruction [role="img"] {
              animation: none !important;
            }
          }
        `}
      </style>
    </div>
  );
}

export default function TutorialPage() {
  const [stepIndex, setStepIndex] =
    useState(0);

  const [mode, setMode] =
    useState<PracticeMode>("practice");

  const [cameraOn, setCameraOn] =
    useState(false);

  const [handCount, setHandCount] =
    useState(0);

  const [lastHit, setLastHit] =
    useState<LaneName | null>(null);

  const [feedback, setFeedback] =
    useState("");

  const [holdProgress, setHoldProgress] =
    useState(0);

  const [holdActive, setHoldActive] =
    useState(false);

  // Same ref contract used by the existing
  // HandHologramOverlay component.
  const handFrameRef =
    useRef<HandFrame | null>(null);

  const stepIndexRef = useRef(0);
  const modeRef =
    useRef<PracticeMode>("practice");

  const cameraOnRef = useRef(false);
  const advancingRef = useRef(false);

  const advanceTimerRef = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);

  const holdTimerRef = useRef<
    ReturnType<typeof setInterval> | null
  >(null);

  const holdStartRef =
    useRef<number | null>(null);

  const holdLaneRef =
    useRef<GestureLane | null>(null);

  const step = STEPS[stepIndex];
  const copy = STEP_COPY[step];

  const activeLane = isLaneStep(step)
    ? step
    : null;

  const isComplete = step === "complete";
  const isDemo =
    needsDemo(step) && mode === "demo";

  const stopHoldTimer = useCallback(() => {
    if (holdTimerRef.current !== null) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const resetHold = useCallback(() => {
    stopHoldTimer();

    holdStartRef.current = null;
    holdLaneRef.current = null;

    setHoldActive(false);
    setHoldProgress(0);
  }, [stopHoldTimer]);

  const moveToStep = useCallback(
    (index: number) => {
      if (advanceTimerRef.current !== null) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }

      resetHold();

      const next = Math.max(
        0,
        Math.min(index, STEPS.length - 1)
      );

      const nextStep = STEPS[next];

      const nextMode: PracticeMode =
        needsDemo(nextStep)
          ? "demo"
          : "practice";

      stepIndexRef.current = next;
      modeRef.current = nextMode;

      advancingRef.current = false;

      setStepIndex(next);
      setMode(nextMode);
      setLastHit(null);
      setFeedback("");
    },
    [resetHold]
  );

  const scheduleAdvance = useCallback(
    (message: string) => {
      if (advancingRef.current) return;

      advancingRef.current = true;
      setFeedback(message);

      advanceTimerRef.current = setTimeout(
        () => {
          advanceTimerRef.current = null;

          moveToStep(
            stepIndexRef.current + 1
          );
        },
        ADVANCE_DELAY_MS
      );
    },
    [moveToStep]
  );

  const startPractice = useCallback(() => {
    // Demo is deliberately separate from
    // practice so the player can watch first.
    modeRef.current = "practice";

    setMode("practice");
    setFeedback("");
    setLastHit(null);
  }, []);

  const handleCameraStatus = useCallback(
    (isOn: boolean) => {
      cameraOnRef.current = isOn;
      setCameraOn(isOn);

      if (!isOn) {
        setHandCount(0);
        handFrameRef.current = null;

        resetHold();

        if (stepIndexRef.current !== 0) {
          moveToStep(0);
        }

        return;
      }

      if (
        STEPS[stepIndexRef.current] ===
        "camera"
      ) {
        scheduleAdvance(
          "Camera connected!"
        );
      }
    },
    [
      moveToStep,
      resetHold,
      scheduleAdvance,
    ]
  );

  const handleHandFrame = useCallback(
    (frame: HandFrame) => {
      // This is what drives the actual
      // Three.js hologram.
      handFrameRef.current = frame;

      const count = frame.hands.length;

      setHandCount((previous) =>
        previous === count
          ? previous
          : count
      );

      if (
        cameraOnRef.current &&
        STEPS[stepIndexRef.current] ===
          "hands" &&
        count >= 2
      ) {
        scheduleAdvance(
          "Both hands detected!"
        );
      }

      if (
        STEPS[stepIndexRef.current] ===
          "hold" &&
        count === 0 &&
        holdStartRef.current !== null
      ) {
        resetHold();

        setFeedback(
          "Hands lost. Try again!"
        );
      }
    },
    [
      resetHold,
      scheduleAdvance,
    ]
  );

  const handleGesture = useCallback(
    (event: GestureEvent) => {
      if (!cameraOnRef.current) return;

      // Do not complete a stage while
      // the demonstration is playing.
      if (modeRef.current !== "practice") {
        return;
      }

      if (advancingRef.current) return;

      const currentStep =
        STEPS[stepIndexRef.current];

      // NORMAL NOTE HITS
      if (isLaneStep(currentStep)) {
        const isNormalHit =
          event.gesture === "pinch" ||
          event.gesture === undefined;

        if (
          event.type !== "press" ||
          !isNormalHit
        ) {
          return;
        }

        const expectedLane =
          LANE_INDEX[currentStep];

        if (event.lane !== expectedLane) {
          setFeedback(
            `Detected ${LANES[event.lane]}. Try ${currentStep}.`
          );

          return;
        }

        setLastHit(currentStep);

        scheduleAdvance(
          `${currentStep} — PERFECT!`
        );

        return;
      }

      // LONG NOTE HOLD
      if (currentStep === "hold") {
        if (event.gesture !== "fist") {
          return;
        }

        if (event.type === "press") {
          if (
            holdStartRef.current !== null
          ) {
            return;
          }

          holdStartRef.current =
            performance.now();

          holdLaneRef.current =
            event.lane;

          setHoldActive(true);
          setFeedback(
            "Keep holding..."
          );

          stopHoldTimer();

          holdTimerRef.current =
            setInterval(() => {
              const started =
                holdStartRef.current;

              if (started === null) {
                return;
              }

              const elapsed =
                performance.now() -
                started;

              const progress = Math.min(
                100,
                (elapsed /
                  HOLD_DURATION_MS) *
                  100
              );

              setHoldProgress(progress);

              if (progress >= 100) {
                stopHoldTimer();

                holdStartRef.current =
                  null;

                holdLaneRef.current =
                  null;

                setHoldActive(false);
                setHoldProgress(100);

                scheduleAdvance(
                  "HOLD COMPLETE!"
                );
              }
            }, 30);

          return;
        }

        if (
          event.type === "release" &&
          event.lane ===
            holdLaneRef.current
        ) {
          resetHold();

          setFeedback(
            "Released early. Try again!"
          );
        }
      }
    },
    [
      resetHold,
      scheduleAdvance,
      stopHoldTimer,
    ]
  );

  useEffect(() => {
    return () => {
      if (
        advanceTimerRef.current !== null
      ) {
        clearTimeout(
          advanceTimerRef.current
        );
      }

      stopHoldTimer();
    };
  }, [stopHoldTimer]);

  const restart = () => {
    moveToStep(
      cameraOnRef.current ? 1 : 0
    );
  };

  const statusText = !cameraOn
    ? "CAMERA OFFLINE"
    : handCount === 0
      ? "SEARCHING FOR HANDS"
      : `${handCount} HAND${
          handCount === 1 ? "" : "S"
        } TRACKED`;

  return (
    <main className="training-page">
      <header className="training-header">
        <div className="training-brand">
          <span className="training-brand-mark">
            AIR<span>STUDIO</span>
          </span>

          <span className="training-header-divider" />

          <span className="training-mode">
            PRACTICE MODE
          </span>
        </div>

        <div className="training-header-right">
          <span className="training-step-count">
            {String(
              stepIndex + 1
            ).padStart(2, "0")}

            <span> / </span>

            {String(
              STEPS.length
            ).padStart(2, "0")}
          </span>

          <Link
            to="/songs"
            className="training-exit"
          >
            EXIT TRAINING ×
          </Link>
        </div>
      </header>

      <div className="training-progress">
        {STEPS.map((item, index) => (
          <div
            key={item}
            className={[
              "training-progress-bar",
              index <= stepIndex
                ? "is-filled"
                : "",
            ].join(" ")}
          />
        ))}
      </div>

      <section className="training-stage">
        <div className="training-board">
          <div className="training-board-grid">
            {LANES.map((lane, index) => {
              const isTarget =
                activeLane === lane;

              const isHit =
                lastHit === lane;

              return (
                <div
                  key={lane}
                  className={[
                    "training-lane",
                    isTarget
                      ? "is-target"
                      : "",
                    isHit
                      ? "is-hit"
                      : "",
                    activeLane &&
                    !isTarget
                      ? "is-dimmed"
                      : "",
                  ].join(" ")}
                >
                  <div className="training-lane-top">
                    <span className="training-lane-hand">
                      {index < 2
                        ? "LEFT HAND"
                        : "RIGHT HAND"}
                    </span>
                  </div>

                  {isTarget &&
                    !isDemo && (
                      <div
                        key={`${step}-${lane}`}
                        className="training-falling-note"
                      >
                        <span />
                      </div>
                    )}

                  {step === "hold" &&
                    !isDemo &&
                    lane === "J" && (
                      <div className="training-hold-note">
                        <div
                          style={{
                            height:
                              `${holdProgress}%`,
                          }}
                        />
                      </div>
                    )}

                  <div className="training-hit-line">
                    <div
                      className={[
                        "training-hit-pad",
                        isHit
                          ? "is-hit"
                          : "",
                      ].join(" ")}
                    >
                      {lane}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* LIVE THREE.JS HAND HOLOGRAM */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              pointerEvents: "none",
              overflow: "hidden",
            }}
          >
            <HandHologramOverlay
              frameRef={handFrameRef}
            />
          </div>

          {/* TUTORIAL CONTENT */}
          <div
            className="training-board-overlay"
            style={{
              zIndex: 3,
            }}
          >
            <div
              key={`${step}-${mode}`}
              className="training-instruction"
            >
              <span className="training-eyebrow">
                {copy.eyebrow}
              </span>

              <h1>{copy.title}</h1>

              <p>{copy.description}</p>

              {isDemo && (
                <GestureDemo
                  isHold={step === "hold"}
                  onStart={startPractice}
                />
              )}

              {isLaneStep(step) &&
                !isDemo && (
                  <div className="training-gesture-guide">
                    <span
                      role="img"
                      aria-label="Pinching gesture"
                      style={{
                        fontSize: 56,
                        lineHeight: 1,
                      }}
                    >
                      🫳
                    </span>

                    <div>
                      <strong>
                        NORMAL HIT
                      </strong>

                      <span>
                        {step === "D" ||
                        step === "F"
                          ? "Use your left hand"
                          : "Use your right hand"}
                      </span>
                    </div>
                  </div>
                )}

              {step === "hold" &&
                !isDemo && (
                  <div className="training-gesture-guide">
                    <span
                      role="img"
                      aria-label="Thumbs-up"
                      style={{
                        fontSize: 56,
                        lineHeight: 1,
                      }}
                    >
                      👍
                    </span>

                    <div>
                      <strong>
                        THUMBS-UP HOLD
                      </strong>

                      <span>
                        Keep holding steadily
                      </span>
                    </div>
                  </div>
                )}

              {step === "camera" && (
                <div className="training-setup-indicator">
                  <span className="training-pulse-dot" />
                  Waiting for camera
                </div>
              )}

              {step === "hands" && (
                <div className="training-hand-count">
                  <span
                    className={
                      handCount >= 1
                        ? "is-detected"
                        : ""
                    }
                  >
                    HAND 01
                  </span>

                  <span
                    className={
                      handCount >= 2
                        ? "is-detected"
                        : ""
                    }
                  >
                    HAND 02
                  </span>
                </div>
              )}

              {step === "hold" &&
                !isDemo && (
                  <div className="training-hold-progress">
                    <div className="training-hold-bar">
                      <div
                        style={{
                          width:
                            `${holdProgress}%`,
                        }}
                      />
                    </div>

                    <span>
                      {holdActive
                        ? `${Math.round(
                            holdProgress
                          )}%`
                        : "READY"}
                    </span>
                  </div>
                )}

              {isComplete && (
                <div className="training-complete-actions">
                  <Link
                    to="/songs"
                    className="training-play-button"
                  >
                    CHOOSE A SONG
                    <span>→</span>
                  </Link>

                  <button
                    type="button"
                    onClick={restart}
                    className="training-restart-button"
                  >
                    REPLAY TRAINING
                  </button>
                </div>
              )}

              {feedback && (
                <div
                  className="training-feedback"
                  role="status"
                >
                  {feedback}
                </div>
              )}
            </div>
          </div>

          <div className="training-board-bottom">
            <span>
              D + F
              <small>LEFT HAND</small>
            </span>

            <div className="training-board-bottom-center">
              HIT ZONE
            </div>

            <span>
              J + K
              <small>RIGHT HAND</small>
            </span>
          </div>
        </div>

        {/* CAMERA ALWAYS ON THE RIGHT */}
        <aside className="training-camera-panel">
          <div className="training-camera-top">
            <div>
              <span className="training-camera-label">
                LIVE TRACKING
              </span>

              <h2>Your camera</h2>
            </div>

            <span
              className={[
                "training-live-dot",
                cameraOn
                  ? "is-live"
                  : "",
              ].join(" ")}
            />
          </div>

          <div className="training-camera-view">
            <GameCamera
              onCameraStatusChange={
                handleCameraStatus
              }
              onGestureInput={
                handleGesture
              }
              onHandFrame={
                handleHandFrame
              }
            />
          </div>

          <div className="training-camera-info">
            <div className="training-camera-status">
              <span
                className={
                  cameraOn
                    ? "is-online"
                    : ""
                }
              />

              {statusText}
            </div>

            <div className="training-camera-help">
              <strong>
                CAMERA TIPS
              </strong>

              <p>
                Keep both hands visible
                and position yourself in
                good lighting.
              </p>
            </div>
          </div>

          <div className="training-camera-footer">
            <button
              type="button"
              onClick={() =>
                moveToStep(
                  Math.max(
                    0,
                    stepIndex - 1
                  )
                )
              }
              disabled={stepIndex === 0}
            >
              ← BACK
            </button>

            <button
              type="button"
              onClick={() =>
                moveToStep(
                  Math.min(
                    STEPS.length - 1,
                    stepIndex + 1
                  )
                )
              }
              disabled={isComplete}
            >
              SKIP →
            </button>
          </div>
        </aside>
      </section>

      <footer className="training-footer">
        <span>
          AIRSTUDIO / INTERACTIVE TRAINING
        </span>

        <span>
          {isDemo
            ? "WATCH THE DEMONSTRATION"
            : activeLane
              ? `TARGET: ${activeLane}`
              : isComplete
                ? "SESSION COMPLETE"
                : "FOLLOW THE INSTRUCTIONS"}
        </span>
      </footer>
    </main>
  );
}
