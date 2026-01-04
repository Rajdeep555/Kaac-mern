import { createBrowserRouter, Navigate } from "react-router-dom";
import RequireAuth from "./RequireAuth";

import MainSection from "../components/layout/MainSection";

import Login from "../pages/auth/Login";
import DashBoard from "../pages/home/DashBoard";
import Accountant from "../pages/home/Accountant";
import Cashier from "../pages/home/Cashier";
import Council from "../pages/home/Council";
import DDO from "../pages/home/DDO";
import Department from "../pages/home/Department";
import Division from "../pages/home/Division";
import Expenditure_Type from "../pages/home/Expenditure_Type";
import GenerateReports from "../pages/home/GenerateReports";
import Object_Head from "../pages/home/Object_Head";
import Plan_Non_Plan from "../pages/home/Plan_Non_Plan";
import State_Recipt_Report from "../pages/home/State_Recipt_Report";
import State from "../pages/home/State";
import Support from "../pages/home/Support";
import Profile from "../pages/auth/Profile";
import Personalnfo from "../pages/auth/Personalnfo";
import PasswordChanger from "../pages/auth/PasswordChanger";
import Logout from "../pages/auth/Logout";

const AppRoutes = createBrowserRouter([
  { path: "/login", element: <Login /> },

  {
    element: <RequireAuth />,
    children: [
      {
        path: "/",
        element: <MainSection />,
        children: [
          { index: true, element: <DashBoard /> },

          // ADMIN
          {
            element: <RequireAuth allowedRoles={["ADMIN"]} />,
            children: [
              {
                path: "/profile", element: <Profile />, children: [

                  //profile

                  { index: true, element: <Navigate to="personalinfo" replace /> },
                  { path: "personalinfo", element: <Personalnfo /> },
                  { path: "passwordchanger", element: <PasswordChanger /> },
                  { path: "logout", element: <Logout /> },
                ]
              },
              { path: "accountant", element: <Accountant /> },
              { path: "department", element: <Department /> },
              { path: "division", element: <Division /> },
              { path: "cashier", element: <Cashier /> },
              { path: "Expenditure", element: <Expenditure_Type /> },
              { path: "objecthead", element: <Object_Head /> },
              { path: "plan-non-plan", element: <Plan_Non_Plan /> },
              { path: "state", element: <State /> },
              { path: "council", element: <Council /> },
              { path: "ddo", element: <DDO /> },
              { path: "generate-reports", element: <GenerateReports /> },
              { path: "state-recipt-report", element: <State_Recipt_Report /> },
            ],
          },

          // CASHIER
          {
            element: <RequireAuth allowedRoles={["CASHIER"]} />,
            // children: [{ path: "cashier", element: <Cashier /> }],
          },

          // OTHERS
          {
            element: <RequireAuth allowedRoles={["OTHER"]} />,
            children: [
              { path: "support", element: <Support /> },
            ],
          },
        ],
      },
    ],
  },
]);

export default AppRoutes;
