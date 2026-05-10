import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: "#f7f8fa", fontFamily: "'Georgia', serif" }}>
      {/* Card */}
      <div
        className="flex flex-col items-center text-center px-10 py-12 rounded-xl"
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          maxWidth: "420px",
          width: "100%",
        }}>
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
          style={{ background: "#fff7ed", border: "2px solid #fde68a" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#c9a84c" strokeWidth="1.5" />
            <line
              x1="12"
              y1="7"
              x2="12"
              y2="13"
              stroke="#c9a84c"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="12" cy="16.5" r="1" fill="#c9a84c" />
          </svg>
        </div>

        {/* Tricolor accent bar */}
        <div
          className="w-16 h-1 rounded-full mb-5"
          style={{
            background:
              "linear-gradient(90deg, #ff9933 33.33%, #ffffff 33.33%, #ffffff 66.66%, #138808 66.66%)",
            border: "1px solid #e5e7eb",
          }}
        />

        {/* Text */}
        <p
          className="text-xs font-bold tracking-widest uppercase mb-2"
          style={{ color: "#c9a84c" }}>
          Access Restricted
        </p>
        <h1 className="text-xl font-bold mb-2" style={{ color: "#0f2744" }}>
          Unauthorized Access
        </h1>
        <p className="text-sm mb-1" style={{ color: "#6b7280" }}>
          You don't have permission to access this page.
        </p>
        <p className="text-xs mb-8" style={{ color: "#9ca3af" }}>
          Please contact your administrator if you believe this is a mistake.
        </p>

        {/* Buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold transition-all"
            style={{
              borderColor: "#e5e7eb",
              background: "#f9fafb",
              color: "#374151",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f3f4f6";
              e.currentTarget.style.borderColor = "#d1d5db";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Go Back
          </button>

          <button
            onClick={() => navigate("/login")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{ background: "#0f2744", color: "#fff" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#1a3a5c")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "#0f2744")
            }>
            Login
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Footer note */}
      <p className="text-xs mt-6" style={{ color: "#9ca3af" }}>
        Treasury & Accounts Department · KAAC
      </p>
    </div>
  );
};

export default Unauthorized;
