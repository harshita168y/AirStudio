
export class AudioController {
  private audio: HTMLAudioElement;
  private source: string;

  constructor(source: string) {
    this.source = source;

    this.audio = new Audio();

    this.audio.preload = "auto";
    this.audio.src = source;

    console.log(
      "[AirStudio] Audio source:",
      this.audio.src
    );

    this.audio.addEventListener("error", () => {
      console.error(
        "[AirStudio] Audio element error:",
        this.audio.error
      );
    });
  }

  async load(): Promise<void> {
    if (this.audio.readyState >= 1) return;

    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => {
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        reject(
          new Error(
            `Failed to load audio: ${this.audio.src}`
          )
        );
      };

      const cleanup = () => {
        this.audio.removeEventListener(
          "loadedmetadata",
          onLoaded
        );

        this.audio.removeEventListener(
          "error",
          onError
        );
      };

      this.audio.addEventListener(
        "loadedmetadata",
        onLoaded
      );

      this.audio.addEventListener(
        "error",
        onError
      );

      this.audio.load();
    });
  }

  async prepareStart(): Promise<void> {
    // Ensure the source is still attached.
    if (!this.audio.getAttribute("src")) {
      this.audio.src = this.source;
    }

    // Start playback from the user's button click.
    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio.muted = true;

    try {
      await this.audio.play();
    } catch (error) {
      this.audio.muted = false;
      throw error;
    }
  }

  beginAudiblePlayback(): void {
    this.audio.currentTime = 0;
    this.audio.muted = false;
    this.audio.volume = 1;
  }

  async resume(): Promise<void> {
    await this.audio.play();
  }

  pause(): void {
    this.audio.pause();
  }

  restart(): void {
    this.audio.pause();

    if (this.audio.readyState >= 1) {
      this.audio.currentTime = 0;
    }

    this.audio.muted = false;
    this.audio.volume = 1;
  }

  getCurrentTimeMs(): number {
    return this.audio.currentTime * 1000;
  }

  getDurationMs(): number {
    return Number.isFinite(this.audio.duration)
      ? this.audio.duration * 1000
      : 0;
  }

  isPlaying(): boolean {
    return !this.audio.paused && !this.audio.ended;
  }

  dispose(): void {
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
  }
}

export const gameAudio = new AudioController(
  "/audio/manchild.mp3"
);
