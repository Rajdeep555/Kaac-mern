import { Outlet } from "react-router-dom";
import Sidebar from "./SideBar";
import TopBar from "./TopBar";

const MainSection = () => {
  return (
    <div
      className="h-screen max-w-full flex overflow-hidden"
      style={{ fontFamily: "'Georgia', serif", background: "#f0f2f5" }}>
      {/* ── Sidebar ── */}
      <Sidebar />

      {/* ── Main Area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Top Bar ── */}
        <TopBar />

        {/* ── Content + Footer wrapper ── */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* ── Page Content ── */}
          <main className="flex-1 px-6 py-5">
            <Outlet />
          </main>

          {/* ── Footer ── */}
          <footer
            className="flex-shrink-0 flex items-center justify-between px-6 py-3"
            style={{
              background: "#0f2744",
              borderTop: "3px solid #c9a84c",
            }}>
            {/* Tricolor accent line */}
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{
                background:
                  "linear-gradient(90deg, #ff9933 33.33%, #ffffff 33.33%, #ffffff 66.66%, #138808 66.66%)",
              }}
            />

            <div className="flex items-center gap-3">
              {/* Mini emblem */}
              <svg width="18" height="18" viewBox="0 0 30 30" fill="none">
                <circle
                  cx="15"
                  cy="15"
                  r="12"
                  stroke="#c9a84c"
                  strokeWidth="1.5"
                  fill="none"
                />
                <circle cx="15" cy="15" r="3" fill="#c9a84c" />
                {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                  <line
                    key={i}
                    x1="15"
                    y1="15"
                    x2={15 + 9 * Math.cos(((deg - 90) * Math.PI) / 180)}
                    y2={15 + 9 * Math.sin(((deg - 90) * Math.PI) / 180)}
                    stroke="#c9a84c"
                    strokeWidth="1"
                  />
                ))}
              </svg>
              <p className="text-xs" style={{ color: "#93b8d8" }}>
                © KAAC Financial Management System. All rights reserved.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  color: "#c9a84c",
                  background: "rgba(201,168,76,0.12)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  letterSpacing: "1px",
                  fontSize: "9px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                }}>
                Official Use Only
              </span>
              <p className="text-xs" style={{ color: "#93b8d8" }}>
                Confidential — Restricted Access
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default MainSection;
