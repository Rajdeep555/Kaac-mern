import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-gray-300 flex justify-center items-center">
      <div className="w-[55%] h-[70%] rounded-2xl flex overflow-hidden">
        <div className="w-2/5 bg-button-green h-full flex flex-col items-center justify-center px-10 text-center gap-3">
          <h1 className="text-2xl font-unbounded text-white font-bold whitespace-nowrap">
            Welcome Back!
          </h1>
          <p className="leading-5 text-white">
            To keep connect with us please login with your personal info
          </p>
        </div>

        <div className="w-3/5 bg-white flex flex-col justify-center items-center gap-4">
          <h1 className="text-2xl font-unbounded font-bold text-button-green">
            Login to KAAC Software
          </h1>
          <p className="text-gray-500">Login to your account</p>

          <form
            onSubmit={handleSubmit}
            className="w-[70%] p-3 flex flex-col gap-4">
            <input
              className="bg-gray-200 p-3 outline-0 rounded"
              required
              type="email"
              placeholder="Enter Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />

            <input
              className="bg-gray-200 p-3 outline-0 rounded"
              required
              type="password"
              placeholder="Enter Your Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            {error ? <p className="text-red-600 text-sm">{error}</p> : null}

            <button
              className={`bg-button-green w-1/2 mx-auto mt-3 py-3 rounded-full text-white cursor-pointer active:scale-95 ${
                loading ? "opacity-60 cursor-not-allowed active:scale-100" : ""
              }`}
              type="submit"
              disabled={loading}>
              {loading ? "Please wait..." : "LOGIN"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
