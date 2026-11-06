
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DEMO_SESSION_KEY } from "../App";

export default function HomePage() {
  const navigate = useNavigate();
  const stageRef = useRef<HTMLDivElement>(null);

  function handlePointerMove(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    if (event.pointerType === "touch") return;

    const stage = stageRef.current;
    if (!stage) return;

    const rect = stage.getBoundingClientRect();

    const x =
      ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y =
      ((event.clientY - rect.top) / rect.height - 0.5) * 2;

    stage.style.setProperty("--pointer-x", x.toFixed(3));
    stage.style.setProperty("--pointer-y", y.toFixed(3));
    stage.style.setProperty(
      "--glow-x",
      `${((x + 1) / 2) * 100}%`
    );
    stage.style.setProperty(
      "--glow-y",
      `${((y + 1) / 2) * 100}%`
    );
  }

  function resetPointer() {
    const stage = stageRef.current;
    if (!stage) return;

    stage.style.setProperty("--pointer-x", "0");
    stage.style.setProperty("--pointer-y", "0");
    stage.style.setProperty("--glow-x", "50%");
    stage.style.setProperty("--glow-y", "50%");
  }

  function startPlaying() {
    const signedIn =
      sessionStorage.getItem(DEMO_SESSION_KEY) === "true";

    navigate(signedIn ? "/songs" : "/auth");
  }

  return (
    <main
      ref={stageRef}
      className="immersive-landing"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
    >
      <div className="landing-topline">
        <div className="landing-brand">
          <span className="brand-symbol">✦</span>
          AIR<span>STUDIO</span>
        </div>
        <div className="landing-top-tagline">
            <span>AN EXPERIENCE YOU CAN FEEL.</span>
            <span>AN INTERACTIVE RHYTHM EXPERIENCE</span>
        </div>
      </div>

      <div className="landing-content">
        <section className="landing-copy">
          <div className="landing-copy-motion">
            <p className="eyebrow">
              A NEW WAY TO PLAY MUSIC
            </p>

            <h1>
              Feel the rhythm.
              <br />
              <em>Move with it.</em>
            </h1>

            <p className="landing-description">
              Your hands are the controller. Step into
              a rhythm experience where every movement
              becomes part of the music.
            </p>

            <button
              className="landing-start"
              type="button"
              onClick={startPlaying}
            >
              <span>START PLAYING</span>
              <span aria-hidden="true">↗</span>
            </button>

            <p className="landing-smallprint">
              NO CONTROLLER. NO TOUCHSCREEN. JUST YOU.
            </p>
          </div>
        </section>

        <div className="vinyl-stage" aria-hidden="true">
          <div className="vinyl-motion">
            <div className="vinyl-halo vinyl-halo-one" />
            <div className="vinyl-halo vinyl-halo-two" />

            <div className="vinyl-tilt">
              <div className="vinyl-record">
                <div className="vinyl-label">
                  <span className="vinyl-label-top">
                    AIR / STUDIO
                  </span>
                  <span className="vinyl-label-mark">
                    A/S
                  </span>
                  <span className="vinyl-label-bottom">
                    SIDE A · 33 RPM
                  </span>
                  <div className="vinyl-hole" />
                </div>
              </div>
            </div>
          </div>

          <span className="vinyl-caption">
            RHYTHM IN MOTION — VOL. 001
          </span>
        </div>
      </div>

    </main>
  );
}
