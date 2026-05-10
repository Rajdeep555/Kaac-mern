import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Logout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logout();
    setTimeout(() => {
      // Pass a unique timestamp in state so React Router
      // generates a new location.key → forces Login to remount
      navigate("/login", {
        replace: true,
        state: { fresh: Date.now() },
      });
    }, 50);
  }, []);

  return null;
};

export default Logout;
