
import { useEffect, useRef } from "react";

type Particle = {
  id: number;
  x: number;
  y: number;
  kind: "sparkle" | "note";
  symbol: string;
  dx: number;
  dy: number;
};

const SPARKLES = ["✦", "✧", "⋆"];
const NOTES = ["♪", "♫", "♬"];

export default function CursorEffects() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const finePointer = window.matchMedia(
      "(pointer: fine)"
    );

    let lastSparkleTime = 0;
    let lastX = 0;
    let lastY = 0;

    function spawnParticle(
      x: number,
      y: number,
      kind: Particle["kind"],
      symbol: string,
      dx = 0,
      dy = 0
    ) {
      if (!container || motionPreference.matches) return;

      const particle = document.createElement("span");
      particle.className = `cursor-particle cursor-${kind}`;
      particle.textContent = symbol;

      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.setProperty("--dx", `${dx}px`);
      particle.style.setProperty("--dy", `${dy}px`);

      container.appendChild(particle);

      particle.addEventListener(
        "animationend",
        () => particle.remove(),
        { once: true }
      );
    }

    function handlePointerMove(event: PointerEvent) {
      if (
        !finePointer.matches ||
        motionPreference.matches ||
        event.pointerType === "touch"
      ) {
        return;
      }

      const now = performance.now();

      if (now - lastSparkleTime < 55) return;

      const distance = Math.hypot(
        event.clientX - lastX,
        event.clientY - lastY
      );

      if (distance < 8) return;

      lastSparkleTime = now;
      lastX = event.clientX;
      lastY = event.clientY;

      const symbol =
        SPARKLES[Math.floor(Math.random() * SPARKLES.length)];

      spawnParticle(
        event.clientX + (Math.random() - 0.5) * 16,
        event.clientY + (Math.random() - 0.5) * 16,
        "sparkle",
        symbol,
        (Math.random() - 0.5) * 28,
        -12 - Math.random() * 24
      );
    }

    function handleClick(event: MouseEvent) {
      if (motionPreference.matches) return;

      const target = event.target;

      if (!(target instanceof Element)) return;

      const interactive = target.closest(
        "a, button, .studio-nav-item"
      );

      if (!interactive) return;

      for (let i = 0; i < 3; i++) {
        const angle = (-130 + i * 45) * (Math.PI / 180);
        const distance = 32 + Math.random() * 24;

        spawnParticle(
          event.clientX,
          event.clientY,
          "note",
          NOTES[i],
          Math.cos(angle) * distance,
          Math.sin(angle) * distance
        );
      }
    }

    document.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener(
        "pointermove",
        handlePointerMove
      );

      document.removeEventListener("click", handleClick);
      container.replaceChildren();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="cursor-effects-layer"
      aria-hidden="true"
    />
  );
}
