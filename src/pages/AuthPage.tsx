
import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { DEMO_SESSION_KEY } from "../App";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">(
    "signup"
  );

  const navigate = useNavigate();
  const location = useLocation();

  const requestedPath =
    (location.state as { from?: string } | null)?.from;

  const destination =
    requestedPath?.startsWith("/") &&
    !requestedPath.startsWith("//")
      ? requestedPath
      : "/songs";

  function enterDemo() {
    sessionStorage.setItem(DEMO_SESSION_KEY, "true");
    navigate(destination, { replace: true });
  }

  return (
    <main className="auth-screen">
      <Link to="/" className="auth-back">
        ← BACK TO AIRSTUDIO
      </Link>

      <div className="auth-panel">
        <div className="auth-emblem">✦</div>

        <p className="eyebrow">WELCOME TO THE STUDIO</p>

        <h1>
          {mode === "signup"
            ? "Your rhythm starts here."
            : "Welcome back."}
        </h1>

        <p className="auth-description">
          {mode === "signup"
            ? "Create your space, discover your rhythm and get ready to play."
            : "Pick up where you left off and get back into the music."}
        </p>

        <div className="auth-switch">
          <button
            type="button"
            className={mode === "signin" ? "selected" : ""}
            onClick={() => setMode("signin")}
          >
            SIGN IN
          </button>

          <button
            type="button"
            className={mode === "signup" ? "selected" : ""}
            onClick={() => setMode("signup")}
          >
            SIGN UP
          </button>
        </div>

        <div className="auth-demo-notice">
          Account registration is coming in the backend stage.
          For now, you can enter a temporary demo session
          without creating an account.
        </div>

        <button
          type="button"
          className="auth-enter"
          onClick={enterDemo}
        >
          ENTER DEMO STUDIO ↗
        </button>
      </div>
    </main>
  );
}
