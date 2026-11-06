
import { Outlet, useLocation } from "react-router-dom";

export default function AppLayout() {
  const location = useLocation();
  const isGamePage = location.pathname === "/game";

  return (
    <div
      className={`studio-shell ${
        isGamePage ? "studio-shell--game" : "studio-shell--wide"
      }`}
    >
      <div className="studio-content">
        <Outlet />
      </div>
    </div>
  );
}
