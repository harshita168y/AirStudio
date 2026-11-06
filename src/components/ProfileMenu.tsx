
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () =>
      document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function handleSignOut() {
    sessionStorage.removeItem("airstudio-demo-session");
    setOpen(false);
    navigate("/", { replace: true });
  }

  return (
    <div className="studio-profile" ref={menuRef}>
      <button
        type="button"
        className="studio-profile-button"
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((previous) => !previous)}
      >
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
        </svg>
      </button>

      {open && (
        <div className="studio-profile-dropdown" role="menu">
          <span className="studio-profile-caption">
            AIR STUDIO ACCOUNT
          </span>

          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
          >
            <span>Sign out</span>
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      )}
    </div>
  );
}
