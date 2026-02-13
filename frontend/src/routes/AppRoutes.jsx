import { createBrowserRouter, Navigate } from "react-router-dom";
import RequireAuth from "./RequireAuth";

import MainSection from "../components/layout/MainSection";

import Login from "../pages/auth/Login";
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
import RoleBasedDashboard from "../pages/home/RoleBasedDashboard";
import Challan from "../pages/cashier/Challan";
import GeneratedChallans from "../pages/cashier/Generated-Challans";
import StateChallan from "../pages/cashier/StateChallan";
import GeneratedStateChallans from "../pages/cashier/GeneratedStateChallans";

import TrackForms from "../features/TrackReports/TrackForms";
import TrackStatements from "../features/TrackReports/TrackStatements";
import Expenditure from "../pages/cashier/Expenditure";
import GeneratedExpenditure from "../pages/cashier/GeneratedExpenditure";
import CreateExpenditure from "../pages/cashier/expenditure/CreateExpenditure";
import EditExpenditure from "../pages/cashier/expenditure/EditExpenditure";
import CashReceipt from "../pages/cashier/CashReceipt";
import GeneratedCashReceipt from "../pages/cashier/GeneratedCashReceipt";
// >>>>>>> origin/frontend-design

const AppRoutes = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/unauthorized",
    element: (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold">Unauthorized Access</h1>
        <p>You don't have permission to access this page.</p>
      </div>
    ),
  },

  {
    element: <RequireAuth />,
    children: [
      {
        path: "/",
        element: <MainSection />,
        children: [
          { index: true, element: <RoleBasedDashboard /> },

          //Profile Admin and cashier
          {
            path: "/profile",
            element: <Profile />,
            children: [
              { index: true, element: <Navigate to="personalinfo" replace /> },
              { path: "personalinfo", element: <Personalnfo /> },
              { path: "passwordchanger", element: <PasswordChanger /> },
              { path: "logout", element: <Logout /> },
            ],
          },

          // ADMIN Routes

          {
            element: <RequireAuth allowedRoles={["ADMIN"]} />,
            children: [
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
              { path: "track-forms", element: <TrackForms /> },
              { path: "track-forms/:sector", element: <TrackForms /> },
              { path: "track-statements", element: <TrackStatements /> },
            ],
          },

          // CASHIER
          {
            element: <RequireAuth allowedRoles={["CASHIER"]} />,
            children: [
              { path: "challan", element: <Challan /> },
              { path: "generated-challan", element: <GeneratedChallans /> },
              { path: "state-challan", element: <StateChallan /> },
              {
                path: "generated-state-challan",
                element: <GeneratedStateChallans />,
              },
              { path: "expenditures", element: <Expenditure /> },
              { path: "expenditures/:id", element: <Expenditure /> },
              {
                path: "generated-expenditure",
                element: <GeneratedExpenditure />,
              },
              { path: "expenditures/new", element: <CreateExpenditure /> },
              { path: "expenditures/:id/edit", element: <EditExpenditure /> },
              { path: "cash-receipt", element: <CashReceipt /> },
              { path: "/cash-receipt/:id", element: <CashReceipt /> },
              {
                path: "generated-cash-receipt",
                element: <GeneratedCashReceipt />,
              },
            ],
          },

          // OTHERS
          {
            element: <RequireAuth allowedRoles={["CASHIER", "ADMIN"]} />,
            children: [{ path: "support", element: <Support /> }],
          },
        ],
      },
    ],
  },
]);

export default AppRoutes;
