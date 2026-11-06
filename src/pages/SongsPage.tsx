
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProfileMenu from "../components/ProfileMenu";
import {
  songs,
  type Difficulty,
  type Song,
} from "../data/songs";

const difficultyLevels: Difficulty[] = [
  "easy",
  "normal",
  "hard",
];

export default function SongsPage() {
  const navigate = useNavigate();

  const [selectedSong, setSelectedSong] = useState<Song>(
    songs[0]
  );

  const [difficulty, setDifficulty] =
    useState<Difficulty>("easy");

  function selectSong(song: Song) {
    setSelectedSong(song);
    setDifficulty("easy");
  }

  function startTrack() {
    const params = new URLSearchParams({
      song: selectedSong.id,
      difficulty,
    });

    navigate(`/game?${params.toString()}`);
  }

  return (
    <main className="music-library music-library--wide">
      {/* Branding and tutorial */}

    <header className="library-topbar">
      <div className="library-brand">
        <div className="library-brand-name">
          <span className="library-brand-symbol">✦</span>
          <strong>AirStudio</strong>
        </div>
        <p>YOUR MUSIC. YOUR MOVEMENT.</p>
      </div>

      <div className="library-header-actions">
        <Link to="/tutorial" className="library-tutorial-link">
          <span aria-hidden="true">◈</span>
          <span>TUTORIAL</span>
          <span aria-hidden="true">↗</span>
        </Link>

        <ProfileMenu />
      </div>
    </header>


      {/* Two-column layout */}
      <div className="library-layout library-layout--aligned">
        {/* Left column */}
        <section className="library-track-section">
          <header className="library-heading">
            <div>
              <h1>
                Choose your rhythm<span>.</span>
              </h1>

              <p>
                Every track is a new challenge. Find your
                sound, choose your difficulty and step into
                the music.
              </p>
            </div>
          </header>

          <div className="library-section-title">
            <span>TRACK LIBRARY</span>

            <span className="library-inline-count">
              {String(songs.length).padStart(2, "0")} AVAILABLE
              TRACKS
            </span>
          </div>

          <div className="library-track-list">
            {songs.map((song, index) => {
              const active = selectedSong.id === song.id;

              return (
                <button
                  key={song.id}
                  type="button"
                  className={`library-track ${
                    active ? "is-selected" : ""
                  }`}
                  onClick={() => selectSong(song)}
                  aria-pressed={active}
                >
                  <span className="library-track-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span
                    className="library-track-art"
                    style={
                      {
                        "--track-accent": song.accent,
                      } as React.CSSProperties
                    }
                  >
                    <span className="library-mini-disc" />
                  </span>

                  <span className="library-track-info">
                    <strong>{song.title}</strong>
                    <small>{song.artist}</small>
                  </span>

                  <span className="library-track-duration">
                    {song.duration}
                  </span>

                  <span className="library-track-arrow">
                    {active ? "◆" : "↗"}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="library-footnote">
            MORE TRACKS COMING SOON · MOVE TO THE BEAT
          </p>
        </section>

        {/* Right column */}
        <aside className="selected-track-panel">
          <div className="selected-track-topline">
            <span>NOW SELECTED</span>
            <span>◉ READY</span>
          </div>

          <div
            className="selected-track-artwork"
            style={
              {
                "--track-accent": selectedSong.accent,
              } as React.CSSProperties
            }
          >
            <div className="selected-track-orbit" />

            <div className="selected-track-record">
              <div className="selected-track-record-label">
                A/S
              </div>
            </div>
          </div>

          <div className="selected-track-identity">
            <p>{selectedSong.artist}</p>
            <h2>{selectedSong.title}</h2>
            <span>{selectedSong.description}</span>
          </div>

          <div className="selected-track-stats">
            <div>
              <span>DURATION</span>
              <strong>{selectedSong.duration}</strong>
            </div>

            <div>
              <span>TEMPO</span>
              <strong>{selectedSong.bpm} BPM</strong>
            </div>

            <div>
              <span>LANES</span>
              <strong>04</strong>
            </div>
          </div>

          <div className="difficulty-selector">
            <div className="difficulty-heading">
              <span>CHOOSE DIFFICULTY</span>
              <span>{difficulty.toUpperCase()}</span>
            </div>

            <div className="difficulty-options">
              {difficultyLevels.map((level) => (
                <button
                  key={level}
                  type="button"
                  className={
                    difficulty === level ? "active" : ""
                  }
                  onClick={() => setDifficulty(level)}
                  aria-pressed={difficulty === level}
                >
                  {level.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="selected-track-start"
            onClick={startTrack}
          >
            <span>START TRACK</span>
            <span aria-hidden="true">↗</span>
          </button>

          <p className="selected-track-disclaimer">
            TRACK PREVIEW · AUDIO ARRIVING IN STAGE 4.4
          </p>
        </aside>
      </div>
    </main>
  );
}
