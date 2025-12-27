import { createBrowserRouter } from "react-router-dom";
import DashBoard from "../pages/home/DashBoard";
import Login from "../pages/auth/Login";
import Accountant from "../pages/home/Accountant";
import Cashier from "../pages/home/Cashier";
import Council from "../pages/home/Council";
import DDO from "../pages/home/DDO";
import Department from "../pages/home/Department";
import Division from "../pages/home/Division";
import Expenditure_Type from "../pages/home/Expenditure_Type";
import GenerateReports from "../pages/home/GenerateReports";
import Heads from "../pages/home/Heads";
import Object_Head from "../pages/home/Object_Head";
import Plan_Non_Plan from "../pages/home/Plan_Non_Plan";
import Reports from "../pages/home/Reports";
import State_Recipt_Report from "../pages/home/State_Recipt_Report";
import State from "../pages/home/State";
import Support from "../pages/home/Support";
import MainSection from "../components/layout/MainSection";

const AppRoutes = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <MainSection />,
    children: [
      { path: "/", element: <DashBoard /> },
      {
        path: "/accountant",
        element: <Accountant />,
      },
      {
        path: "/cashier",
        element: <Cashier />,
      },
      {
        path: "/council",
        element: <Council />,
      },
      {
        path: "/ddo",
        element: <DDO />,
      },
      {
        path: "/department",
        element: <Department />,
      },
      {
        path: "/division",
        element: <Division />,
      },
      {
        path: "/Expenditure",
        element: <Expenditure_Type />,
      },
      {
        path: "/generate-reports",
        element: <GenerateReports />,
      },
      {
        path: "/objecthead",
        element: <Object_Head />,
      },
      {
        path: "/plan-non-plan",
        element: <Plan_Non_Plan />,
      },
      {
        path: "/state",
        element: <State />,
      },
      {
        path: "/state-recipt-report",
        element: <State_Recipt_Report />,
      },
      {
        path: "/support",
        element: <Support />,
      },
    ],
  },
]);
export default AppRoutes;
