
// // import {
// //   useCallback,
// //   useEffect,
// //   useMemo,
// //   useRef,
// //   useState,
// // } from "react";

// // import {
// //   Link,
// //   useSearchParams,
// // } from "react-router-dom";

// // import GameCamera from "../components/GameCamera";

// // import {
// //   getSongById,
// //   type Difficulty,
// // } from "../data/songs";

// // import PhaserBoard from "../game/PhaserBoard";
// // import { getSongChart } from "../game/songCharts";
// // import { gameAudio } from "../game/audioController";

// // import type {
// //   GameCommand,
// //   GameSnapshot,
// // } from "../game/RhythmScene";

// // import type {
// //   GestureEvent,
// // } from "../game/gestureController";

// // function isDifficulty(
// //   value: string | null
// // ): value is Difficulty {
// //   return (
// //     value === "easy" ||
// //     value === "normal" ||
// //     value === "hard"
// //   );
// // }

// // const initialState: GameSnapshot = {
// //   score: 0,
// //   combo: 0,
// //   maxCombo: 0,
// //   successfulHits: 0,
// //   misses: 0,
// //   status: "ready",
// //   countdown: 0,
// //   judgement: null,
// //   gameOverReason: null,
// // };

// // export default function GamePage() {
// //   const [params] = useSearchParams();

// //   const song = getSongById(
// //     params.get("song")
// //   );

// //   const difficultyParam =
// //     params.get("difficulty");

// //   const difficulty =
// //     isDifficulty(difficultyParam)
// //       ? difficultyParam
// //       : "easy";

// //   const chart = useMemo(
// //     () =>
// //       song
// //         ? getSongChart(
// //             song.id,
// //             song.bpm,
// //             difficulty
// //           )
// //         : null,
// //     [song?.id, song?.bpm, difficulty]
// //   );

// //   const [gameState, setGameState] =
// //     useState<GameSnapshot>(initialState);

// //   const [command, setCommand] =
// //     useState<{
// //       type: GameCommand;
// //       id: number;
// //     } | null>(null);

// //   const [starting, setStarting] =
// //     useState(false);

// //   const [audioError, setAudioError] =
// //     useState("");

// //   const [cameraOn, setCameraOn] =
// //     useState(false);

// //   const startingRef = useRef(false);
// //   const requestVersion = useRef(0);

// //   const gestureInputRef = useRef<
// //     ((event: GestureEvent) => void) | null
// //   >(null);

// //   const handleGestureInput = useCallback(
// //     (event: GestureEvent) => {
// //       gestureInputRef.current?.(event);
// //     },
// //     []
// //   );

// //   const sendCommand = (
// //     type: GameCommand
// //   ) => {
// //     setCommand((previous) => ({
// //       type,
// //       id: (previous?.id ?? 0) + 1,
// //     }));
// //   };

// //   useEffect(() => {
// //     return () => {
// //       requestVersion.current++;
// //       gameAudio.restart();
// //     };
// //   }, []);

// //   const handleStart = async () => {
// //     if (
// //       startingRef.current ||
// //       gameState.status !== "ready"
// //     ) {
// //       return;
// //     }

// //     if (!cameraOn) {
// //       setAudioError(
// //         "Please enable your camera before starting."
// //       );
// //       return;
// //     }

// //     startingRef.current = true;
// //     setStarting(true);
// //     setAudioError("");

// //     const version =
// //       ++requestVersion.current;

// //     try {
// //       await gameAudio.prepareStart();

// //       if (
// //         version !== requestVersion.current
// //       ) {
// //         gameAudio.restart();
// //         return;
// //       }

// //       sendCommand("start");
// //     } catch (error) {
// //       console.error(
// //         "Audio start failed:",
// //         error
// //       );

// //       if (
// //         version === requestVersion.current
// //       ) {
// //         gameAudio.restart();

// //         setAudioError(
// //           "Unable to start the song. Check the browser console."
// //         );
// //       }
// //     } finally {
// //       if (
// //         version === requestVersion.current
// //       ) {
// //         startingRef.current = false;
// //         setStarting(false);
// //       }
// //     }
// //   };

// //   const handleRestart = () => {
// //     requestVersion.current++;

// //     startingRef.current = false;
// //     setStarting(false);
// //     setAudioError("");

// //     gameAudio.restart();
// //     sendCommand("restart");
// //   };

// //   const handleResume = async () => {
// //     try {
// //       setAudioError("");

// //       await gameAudio.resume();
// //       sendCommand("resume");
// //     } catch (error) {
// //       console.error(
// //         "Audio resume failed:",
// //         error
// //       );

// //       setAudioError(
// //         "Unable to resume audio."
// //       );
// //     }
// //   };

// //   if (!song || !chart) {
// //     return (
// //       <main className="game-studio game-empty-state">
// //         <p className="eyebrow">
// //           NO TRACK SELECTED
// //         </p>

// //         <h1>
// //           Find your rhythm first.
// //         </h1>

// //         <p>
// //           Choose a song to prepare your game session.
// //         </p>

// //         <Link
// //           to="/songs"
// //           className="game-back-link"
// //         >
// //           ← EXPLORE SONGS
// //         </Link>
// //       </main>
// //     );
// //   }

// //   const totalNotes =
// //     chart.notes.length;

// //   const accuracy =
// //     totalNotes > 0
// //       ? Math.round(
// //           (gameState.successfulHits /
// //             totalNotes) *
// //             100
// //         )
// //       : 0;

// //   const showResults =
// //     gameState.status === "finished" ||
// //     gameState.status === "gameover";

// //   return (
// //     <main className="game-studio game-studio--fullscreen">
// //       <header className="game-fullscreen-header">
// //         <div className="game-compact-stats">
// //           <div className="game-compact-stat">
// //             <span>SCORE</span>
// //             <strong>
// //               {gameState.score
// //                 .toString()
// //                 .padStart(6, "0")}
// //             </strong>
// //           </div>

// //           <div className="game-compact-stat">
// //             <span>COMBO</span>
// //             <strong>
// //               {gameState.combo
// //                 .toString()
// //                 .padStart(2, "0")}
// //             </strong>
// //           </div>

// //           <div className="game-compact-stat">
// //             <span>MISSES</span>
// //             <strong>
// //               {gameState.misses} / 3
// //             </strong>
// //           </div>
// //         </div>

// //         <div className="game-compact-track">
// //           <Link
// //             to="/songs"
// //             className="game-compact-back"
// //           >
// //             ← TRACKS
// //           </Link>

// //           <div>
// //             <h1>{song.title}</h1>
// //             <p>
// //               {difficulty.toUpperCase()}
// //               {" · "}
// //               {song.bpm} BPM
// //             </p>
// //           </div>
// //         </div>

// //         <GameCamera
// //           onCameraStatusChange={
// //             setCameraOn
// //           }
// //           onGestureInput={
// //             handleGestureInput
// //           }
// //         />
// //       </header>

// //       <section
// //         className="game-fullscreen-field"
// //         aria-label="Four-lane rhythm game"
// //       >
// //         <PhaserBoard
// //           chart={chart}
// //           command={command}
// //           onStateChange={setGameState}
// //           gestureInputRef={
// //             gestureInputRef
// //           }
// //         />

// //         {gameState.status ===
// //           "ready" && (
// //           <div className="game-result-overlay">
// //             <p className="eyebrow">
// //               AIRSTUDIO · AUDIO MODE
// //             </p>

// //             <h2>Ready to play?</h2>

// //             <p>
// //               {song.title}
// //               {" · "}
// //               {difficulty.toUpperCase()}
// //             </p>

// //             <p>
// //               Use D, F, J and K, or
// //               touch at least three
// //               fingertips to your thumb
// //               in the matching camera
// //               zone. Hold long notes
// //               until their ends, then
// //               release.
// //             </p>

// //             {audioError && (
// //               <p role="alert">
// //                 {audioError}
// //               </p>
// //             )}

// //             <button
// //               type="button"
// //               className="game-control-button"
// //               onClick={handleStart}
// //               disabled={starting}
// //             >
// //               {starting
// //                 ? "LOADING AUDIO..."
// //                 : "▶ START GAME"}
// //             </button>
// //           </div>
// //         )}

// //         {showResults && (
// //           <div className="game-result-overlay">
// //             <p className="eyebrow">
// //               {gameState.status ===
// //               "finished"
// //                 ? "SESSION COMPLETE"
// //                 : "SESSION ENDED"}
// //             </p>

// //             <h2>
// //               {gameState.status ===
// //               "finished"
// //                 ? "Track Complete!"
// //                 : "Game Over"}
// //             </h2>

// //             <p>
// //               {song.title}
// //               {" · "}
// //               {difficulty.toUpperCase()}
// //             </p>

// //             {gameState.gameOverReason && (
// //               <p>
// //                 {gameState.gameOverReason}
// //               </p>
// //             )}

// //             <strong>
// //               SCORE ·{" "}
// //               {gameState.score.toLocaleString()}
// //             </strong>

// //             <div className="game-results-stats">
// //               <div>
// //                 <span>MAX COMBO</span>
// //                 <strong>
// //                   {gameState.maxCombo}
// //                 </strong>
// //               </div>

// //               <div>
// //                 <span>PERFECT HITS</span>
// //                 <strong>
// //                   {gameState.successfulHits}
// //                 </strong>
// //               </div>

// //               <div>
// //                 <span>MISSES</span>
// //                 <strong>
// //                   {gameState.misses}
// //                 </strong>
// //               </div>

// //               <div>
// //                 <span>CHART ACCURACY</span>
// //                 <strong>
// //                   {accuracy}%
// //                 </strong>
// //               </div>
// //             </div>

// //             <div className="game-results-actions">
// //               <button
// //                 type="button"
// //                 className="game-control-button"
// //                 onClick={handleRestart}
// //               >
// //                 TRY AGAIN
// //               </button>

// //               <Link
// //                 to="/songs"
// //                 className="game-control-button"
// //               >
// //                 BACK TO TRACKS
// //               </Link>
// //             </div>
// //           </div>
// //         )}
// //       </section>

// //       <footer className="game-fullscreen-footer">
// //         <span>
// //           LEFT HAND · 01–02
// //           &nbsp; / &nbsp;
// //           RIGHT HAND · 03–04
// //         </span>

// //         <div className="game-footer-controls">
// //           {gameState.status ===
// //             "playing" && (
// //             <button
// //               type="button"
// //               className="game-control-button"
// //               onClick={() =>
// //                 sendCommand("pause")
// //               }
// //             >
// //               PAUSE
// //             </button>
// //           )}

// //           {gameState.status ===
// //             "paused" && (
// //             <button
// //               type="button"
// //               className="game-control-button"
// //               onClick={handleResume}
// //             >
// //               RESUME
// //             </button>
// //           )}

// //           <button
// //             type="button"
// //             className="game-control-button"
// //             onClick={handleRestart}
// //           >
// //             RESTART
// //           </button>

// //           <Link
// //             to="/tutorial"
// //             className="game-fullscreen-help"
// //           >
// //             HOW TO PLAY{" "}
// //             <span>↗</span>
// //           </Link>
// //         </div>
// //       </footer>
// //     </main>
// //   );
// // }

// import {
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";

// import {
//   Link,
//   useSearchParams,
// } from "react-router-dom";

// import GameCamera from "../components/GameCamera";

// import {
//   getSongById,
//   type Difficulty,
// } from "../data/songs";

// import PhaserBoard from "../game/PhaserBoard";
// import { getSongChart } from "../game/songCharts";
// import { gameAudio } from "../game/audioController";

// import type {
//   GameCommand,
//   GameSnapshot,
// } from "../game/RhythmScene";

// import type {
//   GestureEvent,
// } from "../game/gestureController";

// import type { HandFrame } from "../game/handHologram";

// function isDifficulty(
//   value: string | null
// ): value is Difficulty {
//   return (
//     value === "easy" ||
//     value === "normal" ||
//     value === "hard"
//   );
// }

// const initialState: GameSnapshot = {
//   score: 0,
//   combo: 0,
//   maxCombo: 0,
//   successfulHits: 0,
//   misses: 0,
//   status: "ready",
//   countdown: 0,
//   judgement: null,
//   gameOverReason: null,
// };

// export default function GamePage() {
//   const [params] = useSearchParams();

//   const song = getSongById(
//     params.get("song")
//   );

//   const difficultyParam =
//     params.get("difficulty");

//   const difficulty =
//     isDifficulty(difficultyParam)
//       ? difficultyParam
//       : "easy";

//   const chart = useMemo(
//     () =>
//       song
//         ? getSongChart(
//             song.id,
//             song.bpm,
//             difficulty
//           )
//         : null,
//     [song?.id, song?.bpm, difficulty]
//   );

//   const [gameState, setGameState] =
//     useState<GameSnapshot>(initialState);

//   const [command, setCommand] =
//     useState<{
//       type: GameCommand;
//       id: number;
//     } | null>(null);

//   const [starting, setStarting] =
//     useState(false);

//   const [audioError, setAudioError] =
//     useState("");

//   const [cameraOn, setCameraOn] =
//     useState(false);

//   const startingRef = useRef(false);
//   const requestVersion = useRef(0);

//   const gestureInputRef = useRef<
//     ((event: GestureEvent) => void) | null
//   >(null);

//   // NEW: hologram-only data.
//   const handFrameRef =
//     useRef<HandFrame | null>(null);

//   const handleHandFrame = useCallback(
//     (frame: HandFrame) => {
//       handFrameRef.current = frame;
//     },
//     []
//   );

//   // ORIGINAL GESTURE CALLBACK — UNCHANGED.
//   const handleGestureInput = useCallback(
//     (event: GestureEvent) => {
//       gestureInputRef.current?.(event);
//     },
//     []
//   );

//   const sendCommand = (
//     type: GameCommand
//   ) => {
//     setCommand((previous) => ({
//       type,
//       id: (previous?.id ?? 0) + 1,
//     }));
//   };

//   useEffect(() => {
//     return () => {
//       requestVersion.current++;
//       gameAudio.restart();
//     };
//   }, []);

//   const handleStart = async () => {
//     if (
//       startingRef.current ||
//       gameState.status !== "ready"
//     ) {
//       return;
//     }

//     if (!cameraOn) {
//       setAudioError(
//         "Please enable your camera before starting."
//       );
//       return;
//     }

//     startingRef.current = true;
//     setStarting(true);
//     setAudioError("");

//     const version =
//       ++requestVersion.current;

//     try {
//       await gameAudio.prepareStart();

//       if (
//         version !== requestVersion.current
//       ) {
//         gameAudio.restart();
//         return;
//       }

//       sendCommand("start");
//     } catch (error) {
//       console.error(
//         "Audio start failed:",
//         error
//       );

//       if (
//         version === requestVersion.current
//       ) {
//         gameAudio.restart();

//         setAudioError(
//           "Unable to start the song. Check the browser console."
//         );
//       }
//     } finally {
//       if (
//         version === requestVersion.current
//       ) {
//         startingRef.current = false;
//         setStarting(false);
//       }
//     }
//   };

//   const handleRestart = () => {
//     requestVersion.current++;

//     startingRef.current = false;
//     setStarting(false);
//     setAudioError("");

//     gameAudio.restart();
//     sendCommand("restart");
//   };

//   const handleResume = async () => {
//     try {
//       setAudioError("");

//       await gameAudio.resume();
//       sendCommand("resume");
//     } catch (error) {
//       console.error(
//         "Audio resume failed:",
//         error
//       );

//       setAudioError(
//         "Unable to resume audio."
//       );
//     }
//   };

//   if (!song || !chart) {
//     return (
//       <main className="game-studio game-empty-state">
//         <p className="eyebrow">
//           NO TRACK SELECTED
//         </p>

//         <h1>
//           Find your rhythm first.
//         </h1>

//         <p>
//           Choose a song to prepare your game session.
//         </p>

//         <Link
//           to="/songs"
//           className="game-back-link"
//         >
//           ← EXPLORE SONGS
//         </Link>
//       </main>
//     );
//   }

//   const totalNotes =
//     chart.notes.length;

//   const accuracy =
//     totalNotes > 0
//       ? Math.round(
//           (gameState.successfulHits /
//             totalNotes) *
//             100
//         )
//       : 0;

//   const showResults =
//     gameState.status === "finished" ||
//     gameState.status === "gameover";

//   return (
//     <main className="game-studio game-studio--fullscreen">
//       <header className="game-fullscreen-header">
//         <div className="game-compact-stats">
//           <div className="game-compact-stat">
//             <span>SCORE</span>
//             <strong>
//               {gameState.score
//                 .toString()
//                 .padStart(6, "0")}
//             </strong>
//           </div>

//           <div className="game-compact-stat">
//             <span>COMBO</span>
//             <strong>
//               {gameState.combo
//                 .toString()
//                 .padStart(2, "0")}
//             </strong>
//           </div>

//           <div className="game-compact-stat">
//             <span>MISSES</span>
//             <strong>
//               {gameState.misses} / 3
//             </strong>
//           </div>
//         </div>

//         <div className="game-compact-track">
//           <Link
//             to="/songs"
//             className="game-compact-back"
//           >
//             ← TRACKS
//           </Link>

//           <div>
//             <h1>{song.title}</h1>
//             <p>
//               {difficulty.toUpperCase()}
//               {" · "}
//               {song.bpm} BPM
//             </p>
//           </div>
//         </div>

//         <GameCamera
//           onCameraStatusChange={
//             setCameraOn
//           }
//           onGestureInput={
//             handleGestureInput
//           }
//           onHandFrame={handleHandFrame}
//         />
//       </header>

//       <section
//         className="game-fullscreen-field"
//         aria-label="Four-lane rhythm game"
//       >
//         <PhaserBoard
//           chart={chart}
//           command={command}
//           onStateChange={setGameState}
//           gestureInputRef={
//             gestureInputRef
//           }
//           handFrameRef={handFrameRef}
//         />

//         {gameState.status ===
//           "ready" && (
//           <div className="game-result-overlay">
//             <p className="eyebrow">
//               AIRSTUDIO · AUDIO MODE
//             </p>

//             <h2>Ready to play?</h2>

//             <p>
//               {song.title}
//               {" · "}
//               {difficulty.toUpperCase()}
//             </p>

//             <p>
//               Use D, F, J and K, or
//               touch at least three
//               fingertips to your thumb
//               in the matching camera
//               zone. Hold long notes
//               until their ends, then
//               release.
//             </p>

//             {audioError && (
//               <p role="alert">
//                 {audioError}
//               </p>
//             )}

//             <button
//               type="button"
//               className="game-control-button"
//               onClick={handleStart}
//               disabled={starting}
//             >
//               {starting
//                 ? "LOADING AUDIO..."
//                 : "▶ START GAME"}
//             </button>
//           </div>
//         )}

//         {showResults && (
//           <div className="game-result-overlay">
//             <p className="eyebrow">
//               {gameState.status ===
//               "finished"
//                 ? "SESSION COMPLETE"
//                 : "SESSION ENDED"}
//             </p>

//             <h2>
//               {gameState.status ===
//               "finished"
//                 ? "Track Complete!"
//                 : "Game Over"}
//             </h2>

//             <p>
//               {song.title}
//               {" · "}
//               {difficulty.toUpperCase()}
//             </p>

//             {gameState.gameOverReason && (
//               <p>
//                 {gameState.gameOverReason}
//               </p>
//             )}

//             <strong>
//               SCORE ·{" "}
//               {gameState.score.toLocaleString()}
//             </strong>

//             <div className="game-results-stats">
//               <div>
//                 <span>MAX COMBO</span>
//                 <strong>
//                   {gameState.maxCombo}
//                 </strong>
//               </div>

//               <div>
//                 <span>PERFECT HITS</span>
//                 <strong>
//                   {gameState.successfulHits}
//                 </strong>
//               </div>

//               <div>
//                 <span>MISSES</span>
//                 <strong>
//                   {gameState.misses}
//                 </strong>
//               </div>

//               <div>
//                 <span>CHART ACCURACY</span>
//                 <strong>
//                   {accuracy}%
//                 </strong>
//               </div>
//             </div>

//             <div className="game-results-actions">
//               <button
//                 type="button"
//                 className="game-control-button"
//                 onClick={handleRestart}
//               >
//                 TRY AGAIN
//               </button>

//               <Link
//                 to="/songs"
//                 className="game-control-button"
//               >
//                 BACK TO TRACKS
//               </Link>
//             </div>
//           </div>
//         )}
//       </section>

//       <footer className="game-fullscreen-footer">
//         <span>
//           LEFT HAND · 01–02
//           &nbsp; / &nbsp;
//           RIGHT HAND · 03–04
//         </span>

//         <div className="game-footer-controls">
//           {gameState.status ===
//             "playing" && (
//             <button
//               type="button"
//               className="game-control-button"
//               onClick={() =>
//                 sendCommand("pause")
//               }
//             >
//               PAUSE
//             </button>
//           )}

//           {gameState.status ===
//             "paused" && (
//             <button
//               type="button"
//               className="game-control-button"
//               onClick={handleResume}
//             >
//               RESUME
//             </button>
//           )}

//           <button
//             type="button"
//             className="game-control-button"
//             onClick={handleRestart}
//           >
//             RESTART
//           </button>

//           <Link
//             to="/tutorial"
//             className="game-fullscreen-help"
//           >
//             HOW TO PLAY{" "}
//             <span>↗</span>
//           </Link>
//         </div>
//       </footer>
//     </main>
//   );
// }


import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import GameCamera from "../components/GameCamera";

import {
  getSongById,
  type Difficulty,
} from "../data/songs";

import PhaserBoard from "../game/PhaserBoard";
import { getSongChart } from "../game/songCharts";
import { gameAudio } from "../game/audioController";

import type {
  GameCommand,
  GameSnapshot,
} from "../game/RhythmScene";

import type {
  GestureEvent,
} from "../game/gestureController";

import type { HandFrame } from "../game/handHologram";

function isDifficulty(
  value: string | null
): value is Difficulty {
  return (
    value === "easy" ||
    value === "normal" ||
    value === "hard"
  );
}

const initialState: GameSnapshot = {
  score: 0,
  combo: 0,
  maxCombo: 0,
  successfulHits: 0,
  misses: 0,
  status: "ready",
  countdown: 0,
  judgement: null,
  gameOverReason: null,
};

export default function GamePage() {
  const [params] = useSearchParams();

  const song = getSongById(
    params.get("song")
  );

  const difficultyParam =
    params.get("difficulty");

  const difficulty =
    isDifficulty(difficultyParam)
      ? difficultyParam
      : "easy";

  const chart = useMemo(
    () =>
      song
        ? getSongChart(
            song.id,
            song.bpm,
            difficulty
          )
        : null,
    [song?.id, song?.bpm, difficulty]
  );

  const [gameState, setGameState] =
    useState<GameSnapshot>(initialState);

  const [command, setCommand] =
    useState<{
      type: GameCommand;
      id: number;
    } | null>(null);

  const [starting, setStarting] =
    useState(false);

  const [audioError, setAudioError] =
    useState("");

  const [cameraOn, setCameraOn] =
    useState(false);

  const startingRef = useRef(false);
  const requestVersion = useRef(0);

  const gestureInputRef = useRef<
    ((event: GestureEvent) => void) | null
  >(null);

  // NEW: hologram-only data.
  const handFrameRef =
    useRef<HandFrame | null>(null);

  const handleHandFrame = useCallback(
    (frame: HandFrame) => {
      handFrameRef.current = frame;
    },
    []
  );

  // ORIGINAL GESTURE CALLBACK — UNCHANGED.
  const handleGestureInput = useCallback(
    (event: GestureEvent) => {
      gestureInputRef.current?.(event);
    },
    []
  );

  const sendCommand = (
    type: GameCommand
  ) => {
    setCommand((previous) => ({
      type,
      id: (previous?.id ?? 0) + 1,
    }));
  };

  useEffect(() => {
    return () => {
      requestVersion.current++;
      gameAudio.restart();
    };
  }, []);

  const handleStart = async () => {
    if (
      startingRef.current ||
      gameState.status !== "ready"
    ) {
      return;
    }

    if (!cameraOn) {
      setAudioError(
        "Please enable your camera before starting."
      );
      return;
    }

    startingRef.current = true;
    setStarting(true);
    setAudioError("");

    const version =
      ++requestVersion.current;

    try {
      await gameAudio.prepareStart();

      if (
        version !== requestVersion.current
      ) {
        gameAudio.restart();
        return;
      }

      sendCommand("start");
    } catch (error) {
      console.error(
        "Audio start failed:",
        error
      );

      if (
        version === requestVersion.current
      ) {
        gameAudio.restart();

        setAudioError(
          "Unable to start the song. Check the browser console."
        );
      }
    } finally {
      if (
        version === requestVersion.current
      ) {
        startingRef.current = false;
        setStarting(false);
      }
    }
  };

  const handleRestart = () => {
    requestVersion.current++;

    startingRef.current = false;
    setStarting(false);
    setAudioError("");

    gameAudio.restart();
    sendCommand("restart");
  };

  const handleResume = async () => {
    try {
      setAudioError("");

      await gameAudio.resume();
      sendCommand("resume");
    } catch (error) {
      console.error(
        "Audio resume failed:",
        error
      );

      setAudioError(
        "Unable to resume audio."
      );
    }
  };

  if (!song || !chart) {
    return (
      <main className="game-studio game-empty-state">
        <p className="eyebrow">
          NO TRACK SELECTED
        </p>

        <h1>
          Find your rhythm first.
        </h1>

        <p>
          Choose a song to prepare your game session.
        </p>

        <Link
          to="/songs"
          className="game-back-link"
        >
          ← EXPLORE SONGS
        </Link>
      </main>
    );
  }

  const totalNotes =
    chart.notes.length;

  const accuracy =
    totalNotes > 0
      ? Math.round(
          (gameState.successfulHits /
            totalNotes) *
            100
        )
      : 0;

  const showResults =
    gameState.status === "finished" ||
    gameState.status === "gameover";

  return (
    <main className="game-studio game-studio--fullscreen">
      <header className="game-fullscreen-header">
        <div className="game-compact-track">
          <Link
            to="/songs"
            className="game-compact-back"
          >
            ← TRACKS
          </Link>

          <div>
            <h1>{song.title}</h1>
            <p>
              {difficulty.toUpperCase()}
              {" · "}
              {song.bpm} BPM
            </p>
          </div>
        </div>


        <div className="game-compact-stats">
          <div className="game-compact-stat">
            <span>SCORE</span>
            <strong>
              {gameState.score
                .toString()
                .padStart(6, "0")}
            </strong>
          </div>

          <div className="game-compact-stat">
            <span>COMBO</span>
            <strong>
              {gameState.combo
                .toString()
                .padStart(2, "0")}
            </strong>
          </div>

          <div className="game-compact-stat">
            <span>MISSES</span>
            <strong>
              {gameState.misses} / 3
            </strong>
          </div>
        </div>

        <GameCamera
          onCameraStatusChange={
            setCameraOn
          }
          onGestureInput={
            handleGestureInput
          }
          onHandFrame={handleHandFrame}
        />
      </header>

      <section
        className="game-fullscreen-field"
        aria-label="Four-lane rhythm game"
      >
        <PhaserBoard
          chart={chart}
          command={command}
          onStateChange={setGameState}
          gestureInputRef={
            gestureInputRef
          }
          handFrameRef={handFrameRef}
        />

        {gameState.status ===
          "ready" && (
          <div className="game-result-overlay">
            <p className="eyebrow">
              AIRSTUDIO · AUDIO MODE
            </p>

            <h2>Ready to play?</h2>

            <p>
              {song.title}
              {" · "}
              {difficulty.toUpperCase()}
            </p>

            <p>
              Use D, F, J and K, or
              touch at least three
              fingertips to your thumb
              in the matching camera
              zone. Hold long notes
              until their ends, then
              release.
            </p>

            {audioError && (
              <p role="alert">
                {audioError}
              </p>
            )}

            <button
              type="button"
              className="game-control-button"
              onClick={handleStart}
              disabled={starting}
            >
              {starting
                ? "LOADING AUDIO..."
                : "▶ START GAME"}
            </button>
          </div>
        )}

        {showResults && (
          <div className="game-result-overlay">
            <p className="eyebrow">
              {gameState.status ===
              "finished"
                ? "SESSION COMPLETE"
                : "SESSION ENDED"}
            </p>

            <h2>
              {gameState.status ===
              "finished"
                ? "Track Complete!"
                : "Game Over"}
            </h2>

            <p>
              {song.title}
              {" · "}
              {difficulty.toUpperCase()}
            </p>

            {gameState.gameOverReason && (
              <p>
                {gameState.gameOverReason}
              </p>
            )}

            <strong>
              SCORE ·{" "}
              {gameState.score.toLocaleString()}
            </strong>

            <div className="game-results-stats">
              <div>
                <span>MAX COMBO</span>
                <strong>
                  {gameState.maxCombo}
                </strong>
              </div>

              <div>
                <span>PERFECT HITS</span>
                <strong>
                  {gameState.successfulHits}
                </strong>
              </div>

              <div>
                <span>MISSES</span>
                <strong>
                  {gameState.misses}
                </strong>
              </div>

              <div>
                <span>CHART ACCURACY</span>
                <strong>
                  {accuracy}%
                </strong>
              </div>
            </div>

            <div className="game-results-actions">
              <button
                type="button"
                className="game-control-button"
                onClick={handleRestart}
              >
                TRY AGAIN
              </button>

              <Link
                to="/songs"
                className="game-control-button"
              >
                BACK TO TRACKS
              </Link>
            </div>
          </div>
        )}
      </section>

      <footer className="game-fullscreen-footer">
        <span>
          LEFT HAND · 01–02
          &nbsp; / &nbsp;
          RIGHT HAND · 03–04
        </span>

        <div className="game-footer-controls">
          {gameState.status ===
            "playing" && (
            <button
              type="button"
              className="game-control-button"
              onClick={() =>
                sendCommand("pause")
              }
            >
              PAUSE
            </button>
          )}

          {gameState.status ===
            "paused" && (
            <button
              type="button"
              className="game-control-button"
              onClick={handleResume}
            >
              RESUME
            </button>
          )}

          <button
            type="button"
            className="game-control-button"
            onClick={handleRestart}
          >
            RESTART
          </button>

          <Link
            to="/tutorial"
            className="game-fullscreen-help"
          >
            HOW TO PLAY{" "}
            <span>↗</span>
          </Link>
        </div>
      </footer>
    </main>
  );
}