
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import AppLayout from "./components/AppLayout";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import SongsPage from "./pages/SongsPage";
import GamePage from "./pages/GamePage";
import TutorialPage from "./pages/TutorialPage";
import CursorEffects from "./components/CursorEffects";

export const DEMO_SESSION_KEY = "airstudio-demo-session";

function RequireSession({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const signedIn =
    sessionStorage.getItem(DEMO_SESSION_KEY) === "true";

  if (!signedIn) {
    return (
      <Navigate
        to="/auth"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <CursorEffects />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />

        <Route
          element={
            <RequireSession>
              <AppLayout />
            </RequireSession>
          }
        >
          <Route path="/songs" element={<SongsPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/tutorial" element={<TutorialPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
