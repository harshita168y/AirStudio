
// import {
//   useEffect,
//   useRef,
//   type RefObject,
// } from "react";

// import Phaser from "phaser";

// import RhythmScene, {
//   GAME_EVENT,
//   type GameCommand,
//   type GameSnapshot,
// } from "./RhythmScene";

// import type { GestureEvent } from "./gestureController";
// import type { SongChart } from "./songCharts";

// import {
//   HandHologramOverlay,
//   type HandFrame,
// } from "./handHologram";

// interface PhaserBoardProps {
//   chart: SongChart;

//   command: {
//     type: GameCommand;
//     id: number;
//   } | null;

//   onStateChange: (
//     state: GameSnapshot
//   ) => void;

//   handFrameRef?: RefObject<HandFrame | null>;

//   gestureInputRef?: RefObject<
//     ((event: GestureEvent) => void) | null
//   >;
// }

// export default function PhaserBoard({
//   chart,
//   command,
//   onStateChange,
//   gestureInputRef,
//   handFrameRef,
// }: PhaserBoardProps) {
//   const containerRef =
//     useRef<HTMLDivElement>(null);

//   const gameRef =
//     useRef<Phaser.Game | null>(null);

//   const callbackRef = useRef(onStateChange);

//   useEffect(() => {
//     callbackRef.current = onStateChange;
//   }, [onStateChange]);

//   useEffect(() => {
//     const container = containerRef.current;
//     if (!container) return;

//     const onGameState = (
//       state: GameSnapshot
//     ) => {
//       callbackRef.current(state);
//     };

//     const game = new Phaser.Game({
//       type: Phaser.AUTO,
//       parent: container,

//       width: Math.max(
//         1,
//         container.clientWidth
//       ),

//       height: Math.max(
//         1,
//         container.clientHeight
//       ),

//       backgroundColor: "#1e1713",
//       transparent: true,
//       scene: [],

//       render: {
//         antialias: true,
//       },

//       scale: {
//         mode: Phaser.Scale.NONE,
//       },

//       callbacks: {
//         postBoot: (bootedGame) => {
//           bootedGame.events.on(
//             GAME_EVENT,
//             onGameState
//           );

//           bootedGame.scene.add(
//             "RhythmScene",
//             RhythmScene,
//             true,
//             { chart }
//           );
//         },
//       },
//     });

//     gameRef.current = game;

//     if (gestureInputRef) {
//       gestureInputRef.current = (
//         event: GestureEvent
//       ) => {
//         const currentGame =
//           gameRef.current;

//         if (!currentGame) return;

//         const scene =
//           currentGame.scene.keys[
//             "RhythmScene"
//           ] as RhythmScene | undefined;

//         if (scene?.sys.isActive()) {
//           scene.gestureInput(event);
//         }
//       };
//     }

//     const observer = new ResizeObserver(
//       () => {
//         game.scale.resize(
//           Math.max(
//             1,
//             container.clientWidth
//           ),
//           Math.max(
//             1,
//             container.clientHeight
//           )
//         );
//       }
//     );

//     observer.observe(container);

//     return () => {
//       observer.disconnect();

//       game.events.off(
//         GAME_EVENT,
//         onGameState
//       );

//       if (gestureInputRef) {
//         gestureInputRef.current = null;
//       }

//       gameRef.current = null;
//       game.destroy(true);
//     };
//   }, [chart, gestureInputRef]);

//   useEffect(() => {
//     if (!command || !gameRef.current) {
//       return;
//     }

//     const scene =
//       gameRef.current.scene.keys[
//         "RhythmScene"
//       ] as RhythmScene | undefined;

//     if (scene?.sys.isActive()) {
//       scene.command(command.type);
//     }
//   }, [command]);

//   return (
//     <div
//       className="phaser-board"
//       style={{
//         position: "relative",
//         overflow: "hidden",
//       }}
//       aria-label="Interactive four-lane rhythm game"
//     >
//       <div
//         ref={containerRef}
//         style={{
//           position: "absolute",
//           inset: 0,
//         }}
//       />

//       <HandHologramOverlay
//         frameRef={handFrameRef}
//       />
//     </div>
//   );
// }

import {
  useEffect,
  useRef,
  type RefObject,
} from "react";

import Phaser from "phaser";

import RhythmScene, {
  GAME_EVENT,
  type GameCommand,
  type GameSnapshot,
} from "./RhythmScene";

import type { GestureEvent } from "./gestureController";
import type { SongChart } from "./songCharts";

import {
  HandHologramOverlay,
  type HandFrame,
} from "./handHologram";

interface PhaserBoardProps {
  chart: SongChart;

  command: {
    type: GameCommand;
    id: number;
  } | null;

  onStateChange: (
    state: GameSnapshot
  ) => void;

  gestureInputRef?: RefObject<
    ((event: GestureEvent) => void) | null
  >;

  handFrameRef?: RefObject<HandFrame | null>;
}

export default function PhaserBoard({
  chart,
  command,
  onStateChange,
  gestureInputRef,
  handFrameRef,
}: PhaserBoardProps) {
  const containerRef =
    useRef<HTMLDivElement>(null);

  const gameRef =
    useRef<Phaser.Game | null>(null);

  const callbackRef = useRef(onStateChange);

  useEffect(() => {
    callbackRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const onGameState = (
      state: GameSnapshot
    ) => {
      callbackRef.current(state);
    };

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: container,

      width: Math.max(
        1,
        container.clientWidth
      ),

      height: Math.max(
        1,
        container.clientHeight
      ),

      backgroundColor: "#1e1713",
      transparent: true,
      scene: [],

      render: {
        antialias: true,
      },

      scale: {
        mode: Phaser.Scale.NONE,
      },

      callbacks: {
        postBoot: (bootedGame) => {
          bootedGame.events.on(
            GAME_EVENT,
            onGameState
          );

          bootedGame.scene.add(
            "RhythmScene",
            RhythmScene,
            true,
            { chart }
          );
        },
      },
    });

    gameRef.current = game;

    // ORIGINAL GESTURE FORWARDING — UNCHANGED.
    if (gestureInputRef) {
      gestureInputRef.current = (
        event: GestureEvent
      ) => {
        const currentGame =
          gameRef.current;

        if (!currentGame) return;

        const scene =
          currentGame.scene.keys[
            "RhythmScene"
          ] as RhythmScene | undefined;

        if (scene?.sys.isActive()) {
          scene.gestureInput(event);
        }
      };
    }

    const observer = new ResizeObserver(
      () => {
        game.scale.resize(
          Math.max(
            1,
            container.clientWidth
          ),
          Math.max(
            1,
            container.clientHeight
          )
        );
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();

      game.events.off(
        GAME_EVENT,
        onGameState
      );

      if (gestureInputRef) {
        gestureInputRef.current = null;
      }

      gameRef.current = null;
      game.destroy(true);
    };
  }, [chart, gestureInputRef]);

  useEffect(() => {
    if (!command || !gameRef.current) {
      return;
    }

    const scene =
      gameRef.current.scene.keys[
        "RhythmScene"
      ] as RhythmScene | undefined;

    if (scene?.sys.isActive()) {
      scene.command(command.type);
    }
  }, [command]);

  return (
    <div
      ref={containerRef}
      className="phaser-board"
      aria-label="Interactive four-lane rhythm game"
      style={{
        position: "relative",
        overflow: "hidden",
      }}
    >
      <HandHologramOverlay frameRef={handFrameRef} />
    </div>
  );
}