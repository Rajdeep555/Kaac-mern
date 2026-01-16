import { useAuth } from "../../context/AuthContext";
import DashBoard from "./DashBoard";
import CashierDashboard from "./CashierDashboard";

const RoleBasedDashboard = () => {
  const { user } = useAuth();
  if (user.role === "ADMIN") return <DashBoard />;
  if (user.role === "CASHIER") return <CashierDashboard />;

  return null;
};

export default RoleBasedDashboard;
