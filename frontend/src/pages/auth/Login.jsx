import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from "react-icons/fi";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Invalid credentials. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const getFinancialYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const startYear = month >= 3 ? year : year - 1;
    const endYear = startYear + 1;

    return `${startYear} – ${String(endYear).slice(2)}`; // e.g. "2025 – 26"
  };
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{ background: "#f0f2f5", fontFamily: "'Georgia', serif" }}>
      {/* ── Subtle background grid pattern ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,39,68,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,39,68,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* ── Decorative corner shapes ── */}
      <div
        className="absolute top-0 left-0 w-64 h-64 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(15,39,68,0.08), transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-64 h-64 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at bottom right, rgba(201,168,76,0.1), transparent 70%)",
        }}
      />

      {/* ── Main Card ── */}
      <div
        className="relative flex overflow-hidden rounded-lg w-full"
        style={{
          maxWidth: "860px",
          boxShadow: "0 8px 40px rgba(15,39,68,0.18)",
          border: "1px solid #d1d5db",
        }}>
        {/* ══ LEFT PANEL ══ */}
        <div
          className="flex flex-col justify-between px-10 py-10 flex-shrink-0"
          style={{
            width: "42%",
            background:
              "linear-gradient(160deg, #0f2744 0%, #1a3a5c 55%, #1e4976 100%)",
          }}>
          {/* Tricolor stripe */}
          <div
            className="absolute top-0 left-0 h-1.5"
            style={{
              width: "42%",
              background:
                "linear-gradient(90deg, #ff9933 33.33%, #ffffff 33.33%, #ffffff 66.66%, #138808 66.66%)",
            }}
          />

          {/* Top: Emblem + Org name */}
          <div className="flex flex-col items-center gap-4 mt-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                border: "2px solid #c9a84c",
                background: "rgba(201,168,76,0.12)",
              }}>
              <svg width="48" height="48" viewBox="0 0 30 30" fill="none">
                <circle
                  cx="15"
                  cy="15"
                  r="12"
                  stroke="#c9a84c"
                  strokeWidth="1.5"
                  fill="none"
                />
                <circle cx="15" cy="15" r="3" fill="#c9a84c" />
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(
                  (deg, i) => (
                    <line
                      key={i}
                      x1="15"
                      y1="15"
                      x2={15 + 9 * Math.cos(((deg - 90) * Math.PI) / 180)}
                      y2={15 + 9 * Math.sin(((deg - 90) * Math.PI) / 180)}
                      stroke="#c9a84c"
                      strokeWidth="1"
                    />
                  ),
                )}
              </svg>
            </div>

            <div className="text-center">
              <p
                className="text-xs font-bold tracking-widest uppercase mb-1"
                style={{ color: "#c9a84c" }}>
                Government of India ( KAAC )
              </p>
              <h1 className="text-xl font-bold text-white leading-tight">
                Financial Management
                <br />
                System
              </h1>
              <p className="text-xs mt-1" style={{ color: "#93b8d8" }}>
                Treasury & Accounts Department
              </p>
            </div>
          </div>

          {/* Middle: Tagline */}
          <div className="flex flex-col gap-3">
            <div
              className="h-px w-full"
              style={{ background: "rgba(201,168,76,0.3)" }}
            />
            <p
              className="text-sm text-center leading-6"
              style={{ color: "rgba(255,255,255,0.75)" }}>
              Secure access to government financial records, registers, and
              official reporting tools.
            </p>
            <div
              className="h-px w-full"
              style={{ background: "rgba(201,168,76,0.3)" }}
            />
          </div>

          {/* Bottom: Info badges */}
          <div className="flex flex-col gap-2">
            {[
              { dot: "#22c55e", label: "System Status", value: "Operational" },
              {
                dot: "#c9a84c",
                label: "Financial Year",
                value: getFinancialYear(),
              },
              { dot: "#93b8d8", label: "Access Level", value: "Restricted" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2.5">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: item.dot }}
                />
                <span
                  className="text-xs"
                  style={{ color: "rgba(255,255,255,0.5)" }}>
                  {item.label}:
                </span>
                <span
                  className="text-xs font-bold"
                  style={{ color: "rgba(255,255,255,0.85)" }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* Bottom tricolor */}
          <div
            className="absolute bottom-0 left-0 h-1"
            style={{
              width: "42%",
              background:
                "linear-gradient(90deg, #ff9933 33.33%, #ffffff 33.33%, #ffffff 66.66%, #138808 66.66%)",
            }}
          />
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div
          className="flex flex-col justify-center px-12 py-10 flex-1"
          style={{ background: "#ffffff" }}>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-1 h-5 rounded-full"
                style={{ background: "#c9a84c" }}
              />
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "#6b7280" }}>
                Official Portal
              </p>
            </div>
            <h2 className="text-2xl font-bold" style={{ color: "#0f2744" }}>
              Sign In
            </h2>
            <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
              Enter your official credentials to access the system.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5"
                style={{ color: "#374151" }}>
                <FiMail size={13} style={{ color: "#1a3a5c" }} />
                Email Address
              </label>
              <input
                required
                type="email"
                placeholder="Enter your official email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                disabled={loading}
                className="w-full px-4 py-3 text-sm rounded border outline-none transition-all duration-150"
                style={{
                  background: "#f9fafb",
                  borderColor: "#d1d5db",
                  fontFamily: "'Georgia', serif",
                  fontSize: "13px",
                  color: "#111827",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#1a3a5c";
                  e.target.style.background = "#fff";
                  e.target.style.boxShadow = "0 0 0 3px rgba(26,58,92,0.08)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#d1d5db";
                  e.target.style.background = "#f9fafb";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5"
                style={{ color: "#374151" }}>
                <FiLock size={13} style={{ color: "#1a3a5c" }} />
                Password
              </label>
              <div className="relative">
                <input
                  required
                  type={showPass ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  disabled={loading}
                  className="w-full px-4 py-3 pr-11 text-sm rounded border outline-none transition-all duration-150"
                  style={{
                    background: "#f9fafb",
                    borderColor: error ? "#dc2626" : "#d1d5db",
                    fontFamily: "'Georgia', serif",
                    fontSize: "13px",
                    color: "#111827",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#1a3a5c";
                    e.target.style.background = "#fff";
                    e.target.style.boxShadow = "0 0 0 3px rgba(26,58,92,0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = error ? "#dc2626" : "#d1d5db";
                    e.target.style.background = "#f9fafb";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ color: "#9ca3af" }}>
                  {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded border text-xs font-semibold"
                style={{
                  background: "rgba(220,38,38,0.07)",
                  borderColor: "rgba(220,38,38,0.25)",
                  color: "#991b1b",
                }}>
                <FiAlertCircle size={13} />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded transition-all duration-150 active:scale-95"
              style={{
                background: loading ? "#6b7280" : "#0f2744",
                color: loading ? "#fff" : "#c9a84c",
                border: `1.5px solid ${loading ? "#6b7280" : "#c9a84c"}`,
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = "#1a3a5c";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = "#0f2744";
              }}>
              {loading ? (
                <>
                  <svg
                    className="animate-spin"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="3"
                    />
                    <path
                      d="M12 2a10 10 0 0 1 10 10"
                      stroke="#ffffff"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  Authenticating...
                </>
              ) : (
                "Sign In to Portal"
              )}
            </button>
          </form>

          {/* Disclaimer */}
          <div className="mt-8 pt-5" style={{ borderTop: "1px solid #e5e7eb" }}>
            <p
              className="text-xs text-center leading-relaxed"
              style={{ color: "#9ca3af" }}>
              This is a restricted government portal. Unauthorised access is a
              punishable offence under applicable IT laws and the Official
              Secrets Act.
            </p>
          </div>
        </div>
      </div>

      {/* ── Bottom watermark ── */}
      {/* <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <p className="text-xs" style={{ color: "rgba(15,39,68,0.35)" }}>
          © Government Financial Management System — Official Use Only
        </p>
      </div> */}
    </div>
  );
};

export default Login;
