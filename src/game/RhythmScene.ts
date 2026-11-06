
import Phaser from "phaser";
import type {
  ChartNote,
  SongChart,
} from "./songCharts";
import { gameAudio } from "./audioController";
import type { GestureEvent } from "./gestureController";

export type GameStatus =
  | "ready"
  | "countdown"
  | "playing"
  | "paused"
  | "finished"
  | "gameover";

export type Judgement =
  | "PERFECT"
  | "GOOD"
  | "MISS"
  | "BAD HIT";

export interface GameSnapshot {
  score: number;
  combo: number;
  maxCombo: number;
  successfulHits: number;
  misses: number;
  status: GameStatus;
  countdown: number;
  judgement: Judgement | null;
  gameOverReason: string | null;
}

export type GameCommand =
  | "start"
  | "pause"
  | "resume"
  | "restart";

export const GAME_EVENT = "airstudio:game-state";

const KEYS = ["D", "F", "J", "K"] as const;

const LATE_HIT_MS = 250;
const MAX_MISSES = 3;
const COUNTDOWN_MS = 3000;

const RELEASE_TOLERANCE_MS = 150;
const MIN_HOLD_RATIO = 2 / 3;

const NOTE_HEIGHT = 110;

const WRONG_HIT_DURATION_MS = 650;
const WRONG_HIT_HEIGHT = 110;

type InputSource = "gesture" | "keyboard";
type GestureKind = "pinch" | "fist";

type WrongHitFlash = {
  lane: number;
  startedAt: number;
};

type ActiveHold = {
  note: ChartNote;
  source: InputSource;
  lane: number;
  startedAtMs: number;
  gesture?: GestureKind;
};

export default class RhythmScene extends Phaser.Scene {
  private chart!: SongChart;
  private orderedNotes: ChartNote[] = [];

  private elapsedMs = 0;
  private countdownMs = COUNTDOWN_MS;
  private status: GameStatus = "ready";

  private score = 0;
  private combo = 0;
  private maxCombo = 0;
  private successfulHits = 0;
  private misses = 0;
  private nextNoteIndex = 0;

  private judgement: Judgement | null = null;
  private judgementUntil = 0;
  private gameOverReason: string | null = null;

  private completed = new Set<string>();
  private flashUntil = new Map<number, number>();

  private activeHold: ActiveHold | null = null;
  private wrongHitFlash: WrongHitFlash | null = null;

  // Tracks fists that are currently closed,
  // including fists closed before a note arrives.
  private heldFistLanes = new Set<number>();
  private consumedFistLanes = new Set<number>();

  // Track normal pinches held shortly before the judgement line.
  private heldPinchLanes = new Set<number>();
  private consumedPinchLanes = new Set<number>();

  private board!: Phaser.GameObjects.Graphics;
  private notes!: Phaser.GameObjects.Graphics;

  private labels: Phaser.GameObjects.Text[] = [];
  private keys: Phaser.GameObjects.Text[] = [];

  private centerText!: Phaser.GameObjects.Text;
  private judgementText!: Phaser.GameObjects.Text;

  private keyDownListener?: (
    event: KeyboardEvent
  ) => void;

  private keyUpListener?: (
    event: KeyboardEvent
  ) => void;

  private playbackVersion = 0;

  constructor() {
    super({ key: "RhythmScene" });
  }

  init(data: { chart: SongChart }) {
    this.chart = data.chart;

    this.orderedNotes = [
      ...data.chart.notes,
    ].sort(
      (a, b) =>
        a.timeMs - b.timeMs ||
        a.lane - b.lane
    );

    this.resetState();
  }

  private resetState() {
    this.elapsedMs = 0;
    this.countdownMs = COUNTDOWN_MS;
    this.status = "ready";

    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.successfulHits = 0;
    this.misses = 0;
    this.nextNoteIndex = 0;

    this.judgement = null;
    this.judgementUntil = 0;
    this.gameOverReason = null;

    this.activeHold = null;
    this.wrongHitFlash = null;

    this.heldFistLanes.clear();
    this.consumedFistLanes.clear();
    this.heldPinchLanes.clear();
    this.consumedPinchLanes.clear();

    this.completed.clear();
    this.flashUntil.clear();
  }

  private publish() {
    const snapshot: GameSnapshot = {
      score: this.score,
      combo: this.combo,
      maxCombo: this.maxCombo,
      successfulHits: this.successfulHits,
      misses: this.misses,
      status: this.status,

      countdown:
        this.status === "countdown"
          ? Math.max(
              1,
              Math.ceil(
                this.countdownMs / 1000
              )
            )
          : 0,

      judgement: this.judgement,
      gameOverReason: this.gameOverReason,
    };

    this.game.events.emit(
      GAME_EVENT,
      snapshot
    );
  }

  create() {
    this.board = this.add.graphics();
    this.notes = this.add.graphics();

    this.labels = [];
    this.keys = [];

    for (let lane = 0; lane < 4; lane++) {
      this.labels.push(
        this.add.text(0, 0, "", {
          fontFamily: "Arial, sans-serif",
          fontSize: "11px",
          color: "#a99b8c",
        })
      );

      this.keys.push(
        this.add
          .text(0, 0, KEYS[lane], {
            fontFamily: "Arial, sans-serif",
            fontSize: "15px",
            fontStyle: "bold",
            color: "#e6c18b",
          })
          .setOrigin(0.5)
      );
    }

    this.centerText = this.add
      .text(0, 0, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "42px",
        fontStyle: "bold",
        color: "#f5e9d7",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.judgementText = this.add
      .text(0, 0, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "24px",
        fontStyle: "bold",
        color: "#e6c18b",
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.keyDownListener = (event) => {
      const target = event.target;

      if (
        target instanceof HTMLElement &&
        (
          target.isContentEditable ||
          [
            "INPUT",
            "TEXTAREA",
            "SELECT",
          ].includes(target.tagName)
        )
      ) {
        return;
      }

      if (event.repeat) return;

      if (event.key === "Escape") {
        this.togglePause();
        return;
      }

      const lane = KEYS.indexOf(
        event.key.toUpperCase() as
          (typeof KEYS)[number]
      );

      if (lane < 0) return;

      event.preventDefault();

      this.pressLane(
        lane,
        "keyboard"
      );
    };

    this.keyUpListener = (event) => {
      const lane = KEYS.indexOf(
        event.key.toUpperCase() as
          (typeof KEYS)[number]
      );

      if (lane >= 0) {
        this.releaseLane(
          lane,
          "keyboard"
        );
      }
    };

    window.addEventListener(
      "keydown",
      this.keyDownListener
    );

    window.addEventListener(
      "keyup",
      this.keyUpListener
    );

    this.scale.on(
      Phaser.Scale.Events.RESIZE,
      this.layout,
      this
    );

    this.events.once(
      Phaser.Scenes.Events.SHUTDOWN,
      () => {
        this.playbackVersion++;
        gameAudio.restart();

        this.scale.off(
          Phaser.Scale.Events.RESIZE,
          this.layout,
          this
        );

        if (this.keyDownListener) {
          window.removeEventListener(
            "keydown",
            this.keyDownListener
          );
        }

        if (this.keyUpListener) {
          window.removeEventListener(
            "keyup",
            this.keyUpListener
          );
        }
      }
    );

    this.layout();
    this.publish();
  }

  public command(command: GameCommand) {
    if (command === "start") {
      if (this.status !== "ready") return;

      this.countdownMs = COUNTDOWN_MS;
      this.status = "countdown";
      this.publish();
      return;
    }

    if (command === "restart") {
      this.playbackVersion++;
      gameAudio.restart();
      this.resetState();
      this.publish();
      return;
    }

    if (
      command === "pause" &&
      this.status === "playing"
    ) {
      this.playbackVersion++;
      gameAudio.pause();
      this.status = "paused";
      this.publish();
      return;
    }

    if (
      command === "resume" &&
      this.status === "paused"
    ) {
      if (gameAudio.isPlaying()) {
        this.status = "playing";
        this.publish();
        return;
      }

      const version =
        ++this.playbackVersion;

      void gameAudio
        .resume()
        .then(() => {
          if (
            version !==
              this.playbackVersion ||
            this.status !== "paused"
          ) {
            gameAudio.pause();
            return;
          }

          this.status = "playing";
          this.publish();
        })
        .catch((error) => {
          console.error(
            "Audio resume failed:",
            error
          );
        });
    }
  }

  private togglePause() {
    if (this.status === "playing") {
      this.command("pause");
    } else if (this.status === "paused") {
      this.command("resume");
    }
  }

  private syncClock() {
    if (this.status === "playing") {
      this.elapsedMs =
        gameAudio.getCurrentTimeMs();
    }
  }

  // Camera gesture input:
  // - Pinch for normal notes
  // - Thumbs-up (legacy "fist" event) for long notes
  public gestureInput(event: GestureEvent) {
    const gesture: GestureKind = event.gesture ?? "pinch";

    if (gesture === "fist") {
      if (event.type === "press") {
        this.heldFistLanes.add(event.lane);
      } else {
        this.heldFistLanes.delete(event.lane);
        this.consumedFistLanes.delete(event.lane);
      }
    } else {
      if (event.type === "press") {
        this.heldPinchLanes.add(event.lane);
      } else {
        this.heldPinchLanes.delete(event.lane);
        this.consumedPinchLanes.delete(event.lane);
      }
    }

    if (event.type === "press") {
      this.pressLane(event.lane, "gesture", gesture);
    } else {
      this.releaseLane(event.lane, "gesture", gesture);
    }
  }

  // Keep compatibility with existing
  // single-hit gesture callbacks.
  public gestureHit(lane: number) {
    this.pressLane(
      lane,
      "gesture",
      "pinch"
    );
  }

  private showJudgement(
    value: Judgement
  ) {
    this.judgement = value;

    this.judgementUntil =
      this.elapsedMs + 500;

    const color =
      value === "PERFECT"
        ? "#f5d6a3"
        : value === "GOOD"
          ? "#c99553"
          : "#db8b76";

    this.judgementText.setColor(
      color
    );
  }

  private endGame(
    reason: string
  ) {
    if (
      this.status === "gameover"
    ) {
      return;
    }

    this.playbackVersion++;
    gameAudio.pause();

    this.status = "gameover";
    this.gameOverReason = reason;
    this.combo = 0;
    this.activeHold = null;

    this.publish();
  }

  private award(
    note: ChartNote
  ) {
    this.completed.add(note.id);
    this.nextNoteIndex++;

    this.score += 300;
    this.combo++;
    this.successfulHits++;

    this.maxCombo = Math.max(
      this.maxCombo,
      this.combo
    );

    this.showJudgement(
      "PERFECT"
    );

    this.publish();
  }

  private failNote(
    note: ChartNote,
    reason?: string
  ) {
    this.completed.add(note.id);
    this.nextNoteIndex++;

    this.activeHold = null;
    this.misses++;
    this.combo = 0;

    this.showJudgement("MISS");

    if (
      this.misses >= MAX_MISSES
    ) {
      this.endGame(
        reason ??
          "Three missed notes."
      );
    } else {
      this.publish();
    }
  }

  // Pinch: normal notes
  // Fist: long notes
  // Keyboard: both
  private pressLane(
    lane: number,
    source: InputSource,
    gesture: GestureKind = "pinch"
  ) {
    if (
      !Number.isInteger(lane) ||
      lane < 0 ||
      lane > 3 ||
      this.status !== "playing"
    ) {
      return;
    }

    this.syncClock();

    // Clear expired notes before checking the expected lane.
    // Otherwise a missed note blocks later camera gestures.
    this.expireOverdueNotes();
    if (this.status !== "playing" || this.activeHold) return;

    // Avoid interpreting the same thumbs-up as a normal pinch.
    if (source === "gesture" && gesture === "pinch" &&
        (this.heldFistLanes.has(lane) || this.consumedPinchLanes.has(lane))) {
      return;
    }

    if (source === "gesture" && gesture === "fist" &&
        this.consumedFistLanes.has(lane)) return;

    const expected =
      this.orderedNotes[
        this.nextNoteIndex
      ];

    if (!expected) return;

    const isLongNote =
      (expected.durationMs ?? 0) > 0;

    // Prevent pinch/fist overlap
    // from triggering the wrong note type.
    if (source === "gesture") {
      if (
        isLongNote &&
        gesture !== "fist"
      ) {
        return;
      }

      if (
        !isLongNote &&
        gesture !== "pinch"
      ) {
        return;
      }
    }

    const until =
      expected.timeMs -
      this.elapsedMs;

    if (
      until >
        this.chart.travelTimeMs ||
      until < -LATE_HIT_MS
    ) {
      return;
    }

    // Normal camera pinches use the original early-hit window.
    // Long camera holds are still restricted below.

    // Long notes start only when
    // near the judgement line.
    if (
      isLongNote &&
      Math.abs(until) >
        LATE_HIT_MS
    ) {
      return;
    }

    this.flashUntil.set(
      lane,
      this.elapsedMs + 130
    );

   if (
      lane !== expected.lane
    ) {
      console.warn("[AirStudio] WRONG LANE INPUT", {
        source,
        gesture,
        pressed: KEYS[lane],
        expected: KEYS[expected.lane],
        songTimeMs: Math.round(this.elapsedMs),
        noteTimeMs: expected.timeMs,
      });

      this.wrongHitFlash = {
        lane,
        startedAt:
          performance.now(),
      };

      this.showJudgement(
        "BAD HIT"
      );

      this.endGame(
        `Wrong lane! Expected ${
          KEYS[expected.lane]
        }, pressed ${
          KEYS[lane]
        }.`
      );

      return;
    }

    if (isLongNote) {
      if (source === "gesture" && gesture === "fist") {
        this.consumedFistLanes.add(lane);
      }
      this.activeHold = {
        note: expected,
        lane,
        source,
        startedAtMs:
          this.elapsedMs,
        gesture:
          source === "gesture"
            ? gesture
            : undefined,
      };

      this.showJudgement(
        "GOOD"
      );

      this.publish();
    } else {
      if (source === "gesture" && gesture === "pinch") {
        this.consumedPinchLanes.add(lane);
      }
      this.award(
        expected
      );
    }
  }

  // A pinch release cannot cancel
  // a fist hold, or vice versa.
  private releaseLane(
    lane: number,
    source: InputSource,
    gesture: GestureKind = "pinch"
  ) {
    if (
      this.status !== "playing"
    ) {
      return;
    }

    this.syncClock();

    const hold =
      this.activeHold;

    if (
      !hold ||
      hold.lane !== lane ||
      hold.source !== source
    ) {
      return;
    }

    if (
      source === "gesture" &&
      hold.gesture !== gesture
    ) {
      return;
    }

    const duration =
      hold.note.durationMs ?? 0;

    const actualHoldMs =
      this.elapsedMs -
      hold.startedAtMs;

    const requiredHoldMs =
      duration *
      MIN_HOLD_RATIO;

    this.activeHold = null;

    if (
      actualHoldMs >=
      requiredHoldMs
    ) {
      this.award(
        hold.note
      );
    } else {
      this.failNote(
        hold.note,
        "Long note released before 66.7% completion."
      );
    }
  }

  // Resolve overdue notes before evaluating incoming gestures.
  // A miss counts once and the game ends on the third miss.
  private expireOverdueNotes() {
    while (
      !this.activeHold &&
      this.status === "playing" &&
      this.nextNoteIndex < this.orderedNotes.length
    ) {
      const expected = this.orderedNotes[this.nextNoteIndex];
      if (this.elapsedMs <= expected.timeMs + LATE_HIT_MS) break;
      this.failNote(expected);
    }
  }

  private processMisses() {
    // Complete a sufficiently held long note first.
    if (this.activeHold) {
      const hold = this.activeHold;
      const duration = hold.note.durationMs ?? 0;
      const heldMs = this.elapsedMs - hold.startedAtMs;
      if (heldMs >= duration * MIN_HOLD_RATIO) {
        this.activeHold = null;
        this.award(hold.note);
      } else {
        return;
      }
    }

    // Never let an overdue note block subsequent gestures.
    this.expireOverdueNotes();
    if (this.status !== "playing" || this.activeHold) return;

    const expected = this.orderedNotes[this.nextNoteIndex];
    if (!expected) return;

    const until = expected.timeMs - this.elapsedMs;
    const isLong = (expected.durationMs ?? 0) > 0;

    if (isLong) {
      // A thumbs-up can begin just before the long note arrives.
      // Consume this particular hold so it cannot trigger another note.
      if (
        Math.abs(until) <= LATE_HIT_MS &&
        this.heldFistLanes.has(expected.lane) &&
        !this.consumedFistLanes.has(expected.lane)
      ) {
        this.pressLane(expected.lane, "gesture", "fist");
      }
    } else if (
      // A pinched hand may already be held as the note approaches.
      // Match once, then wait for release before another pinch hit.
      this.heldPinchLanes.has(expected.lane) &&
      !this.heldFistLanes.has(expected.lane) &&
      !this.consumedPinchLanes.has(expected.lane) &&
      until <= this.chart.travelTimeMs &&
      until >= -LATE_HIT_MS
    ) {
      this.pressLane(expected.lane, "gesture", "pinch");
    }
  }

  private layout() {
    const width =
      this.scale.width;

    const height =
      this.scale.height;

    const laneWidth =
      width / 4;

    this.labels.forEach(
      (label, lane) => {
        label
          .setText(
            String(
              lane + 1
            ).padStart(
              2,
              "0"
            )
          )
          .setPosition(
            lane * laneWidth +
              14,
            15
          );
      }
    );

    this.keys.forEach(
      (label, lane) => {
        label.setPosition(
          lane * laneWidth +
            laneWidth / 2,
          height - 23
        );
      }
    );

    this.centerText.setPosition(
      width / 2,
      height * 0.4
    );

    this.judgementText.setPosition(
      width / 2,
      height * 0.55
    );

    this.drawBoard();
    this.drawNotes();
  }

  private drawBoard() {
    const width =
      this.scale.width;

    const height =
      this.scale.height;

    const laneWidth =
      width / 4;

    const hitY =
      height - 65;

    this.board.clear();

    for (
      let lane = 0;
      lane < 4;
      lane++
    ) {
      const flashing =
        (
          this.flashUntil.get(
            lane
          ) ?? 0
        ) >
          this.elapsedMs &&
        this.status ===
          "playing";

      const holding =
        this.activeHold?.lane ===
        lane;

      this.board.fillStyle(
        0xe6c18b,
        holding
          ? 0.23
          : flashing
            ? 0.18
            : lane % 2 === 0
              ? 0.018
              : 0.035
      );

      this.board.fillRect(
        lane *
          laneWidth,
        0,
        laneWidth,
        height
      );

      if (
        lane > 0
      ) {
        this.board.lineStyle(
          1,
          0xc99553,
          0.15
        );

        this.board.lineBetween(
          lane *
            laneWidth,
          0,
          lane *
            laneWidth,
          height
        );
      }
    }

    this.board.lineStyle(
      10,
      0xe6c18b,
      0.055
    );

    this.board.lineBetween(
      0,
      hitY,
      width,
      hitY
    );

    this.board.lineStyle(
      2,
      0xe6c18b,
      1
    );

    this.board.lineBetween(
      0,
      hitY,
      width,
      hitY
    );
  }

  private drawWrongHitFlash() {
    const flash =
      this.wrongHitFlash;

    if (
      !flash
    ) {
      return;
    }

    const elapsed =
      performance.now() -
      flash.startedAt;

    if (
      elapsed >=
      WRONG_HIT_DURATION_MS
    ) {
      this.wrongHitFlash = null;
      return;
    }

    const alpha =
      Math.max(
        0,
        1 -
          elapsed /
            WRONG_HIT_DURATION_MS
      );

    const width =
      this.scale.width;

    const height =
      this.scale.height;

    const laneWidth =
      width / 4;

    const hitY =
      height - 65;

    const x =
      flash.lane *
        laneWidth +
      laneWidth * 0.06;

    const y =
      hitY -
      WRONG_HIT_HEIGHT;

    const tileWidth =
      laneWidth * 0.88;

    this.notes.fillStyle(
      0xff4545,
      0.38 * alpha
    );

    this.notes.fillRoundedRect(
      x,
      y,
      tileWidth,
      WRONG_HIT_HEIGHT,
      6
    );

    this.notes.lineStyle(
      3,
      0xff6666,
      alpha
    );

    this.notes.strokeRoundedRect(
      x,
      y,
      tileWidth,
      WRONG_HIT_HEIGHT,
      6
    );
  }

  private drawNotes() {
    this.notes.clear();

    const width =
      this.scale.width;

    const height =
      this.scale.height;

    const laneWidth =
      width / 4;

    const hitY =
      height - 65;

    const travelTime =
      Math.max(
        1,
        this.chart.travelTimeMs
      );

    const noteWidth =
      laneWidth * 0.88;

    const speed =
      hitY /
      travelTime;

    for (
      const note of
      this.orderedNotes
    ) {
      if (
        this.completed.has(
          note.id
        )
      ) {
        continue;
      }

      const until =
        note.timeMs -
        this.elapsedMs;

      const duration =
        Math.max(
          0,
          note.durationMs ?? 0
        );

      if (
        until >
          travelTime ||
        until <
          -(
            duration +
            LATE_HIT_MS +
            RELEASE_TOLERANCE_MS
          )
      ) {
        continue;
      }

      const noteHeight =
        NOTE_HEIGHT +
        duration * speed;

      const headBottomY =
        hitY -
        until * speed;

      const y =
        headBottomY -
        NOTE_HEIGHT -
        duration * speed;

      const x =
        note.lane *
          laneWidth +
        laneWidth * 0.06;

      const isNext =
        note.id ===
        this.orderedNotes[
          this.nextNoteIndex
        ]?.id;

      const isHolding =
        this.activeHold?.note
          .id ===
        note.id;

      this.notes.fillStyle(
        isHolding
          ? 0xf5d6a3
          : isNext
            ? 0xf0c989
            : 0xc99553,
        1
      );

      this.notes.fillRoundedRect(
        x,
        y,
        noteWidth,
        noteHeight,
        6
      );

      this.notes.lineStyle(
        1,
        0xf5e9d7,
        isNext
          ? 0.9
          : 0.4
      );

      this.notes.strokeRoundedRect(
        x,
        y,
        noteWidth,
        noteHeight,
        6
      );

      if (
        duration > 0
      ) {
        this.notes.lineStyle(
          2,
          0x6e4a2b,
          0.6
        );

        this.notes.lineBetween(
          x + 6,
          headBottomY -
            NOTE_HEIGHT,
          x +
            noteWidth -
            6,
          headBottomY -
            NOTE_HEIGHT
        );
      }
    }

    this.drawWrongHitFlash();
  }

  update(
    _time: number,
    delta: number
  ) {
    if (
      this.status ===
      "countdown"
    ) {
      const previous =
        Math.ceil(
          this.countdownMs /
            1000
        );

      this.countdownMs -=
        delta;

      if (
        this.countdownMs <= 0
      ) {
        this.countdownMs = 0;

        gameAudio.beginAudiblePlayback();

        this.elapsedMs =
          gameAudio.getCurrentTimeMs();

        this.status =
          "playing";

        this.publish();
      } else if (
        Math.ceil(
          this.countdownMs /
            1000
        ) !== previous
      ) {
        this.publish();
      }
    } else if (
      this.status ===
      "playing"
    ) {
      this.syncClock();
      this.processMisses();

      if (
        this.judgement &&
        this.elapsedMs >=
          this.judgementUntil
      ) {
        this.judgement = null;
        this.publish();
      }

      if (
        this.status ===
          "playing" &&
        this.nextNoteIndex >=
          this.orderedNotes
            .length &&
        !this.activeHold
      ) {
        this.playbackVersion++;
        gameAudio.pause();

        this.status =
          "finished";

        this.publish();
      }
    }

    this.drawBoard();
    this.drawNotes();

    const message =
      this.status ===
      "countdown"
        ? String(
            Math.max(
              1,
              Math.ceil(
                this.countdownMs /
                  1000
              )
            )
          )
        : this.status ===
            "paused"
          ? "PAUSED"
          : this.status ===
              "finished"
            ? "TRACK COMPLETE"
            : this.status ===
                "gameover"
              ? "GAME OVER"
              : "";

    this.centerText.setText(
      message
    );

    this.centerText.setFontSize(
      this.status ===
        "countdown"
        ? 64
        : 34
    );

    this.judgementText.setText(
      this.status ===
        "playing" ||
      this.status ===
        "gameover"
        ? this.judgement ??
            ""
        : ""
    );
  }
}
