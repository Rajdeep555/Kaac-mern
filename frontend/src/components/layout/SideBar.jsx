import { NavLink, useNavigate } from "react-router-dom";
import { FiLogOut, FiSettings, FiChevronDown } from "react-icons/fi";
import { useState } from "react";
import {
  RiDashboardFill,
  RiFundsFill,
  RiArrowDropDownLine,
} from "react-icons/ri";
import { MdSupervisorAccount } from "react-icons/md";
import { SiCashapp } from "react-icons/si";
import { GiPoliceOfficerHead } from "react-icons/gi";
import { AiFillAlert } from "react-icons/ai";
import { nanoid } from "nanoid";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.jpg";

export const menuItems = [
  {
    id: nanoid(),
    type: "link",
    label: "Dashboard",
    to: "/",
    icon: <RiDashboardFill />,
    roles: ["ADMIN", "CASHIER"],
  },

  {
    id: nanoid(),
    type: "link",
    label: "Users",
    to: "/user",
    icon: <SiCashapp />,
    roles: ["ADMIN"],
  },
  {
    id: nanoid(),
    type: "link",
    label: "DDO",
    to: "/ddo",
    icon: <GiPoliceOfficerHead />,
    roles: ["ADMIN"],
  },
  {
    id: nanoid(),
    type: "link",
    label: "Department",
    to: "/department",
    icon: <RiFundsFill />,
    roles: ["ADMIN"],
  },
  {
    id: nanoid(),
    type: "link",
    label: "Division",
    to: "/division",
    icon: <AiFillAlert />,
    roles: ["ADMIN"],
  },
  {
    id: nanoid(),
    type: "link",
    label: "Expenditure Type",
    to: "/expenditure",
    icon: <RiFundsFill />,
    roles: ["ADMIN"],
  },
  {
    id: nanoid(),
    type: "dropdown",
    label: "Head",
    key: "head",
    roles: ["ADMIN"],
    children: [
      {
        id: nanoid(),
        label: "Council",
        to: "/council",
        icon: <MdSupervisorAccount />,
      },
      {
        id: nanoid(),
        label: "State",
        to: "/state",
        icon: <MdSupervisorAccount />,
      },
    ],
  },
  {
    id: nanoid(),
    type: "link",
    label: "Object Head",
    to: "/objecthead",
    icon: <GiPoliceOfficerHead />,
    roles: ["ADMIN"],
  },
  {
    id: nanoid(),
    type: "dropdown",
    label: "Reports",
    key: "reports",
    roles: ["ADMIN"],
    children: [
      {
        id: nanoid(),
        label: "Generate Reports",
        to: "/generate-reports",
        icon: <MdSupervisorAccount />,
      },
      {
        id: nanoid(),
        label: "State Receipt Report",
        to: "/state-recipt-report",
        icon: <MdSupervisorAccount />,
      },
    ],
  },
  {
    id: nanoid(),
    type: "link",
    label: "Plan Non Plan",
    to: "/plan-non-plan",
    icon: <MdSupervisorAccount />,
    roles: ["ADMIN"],
  },
  {
    id: nanoid(),
    type: "dropdown",
    label: "Receipt-Reports",
    key: "challans",
    roles: ["CASHIER"],
    children: [
      {
        id: nanoid(),
        label: "Challan",
        to: "/challan",
        icon: <MdSupervisorAccount />,
      },
      {
        id: nanoid(),
        label: "Generated Challans",
        to: "/generated-challan",
        icon: <MdSupervisorAccount />,
      },
      {
        id: nanoid(),
        label: "State-Challan",
        to: "/state-challan",
        icon: <MdSupervisorAccount />,
      },
      {
        id: nanoid(),
        label: "Generated State Challans",
        to: "/generated-state-challan",
        icon: <MdSupervisorAccount />,
      },
      {
        id: nanoid(),
        label: "Cash Receipt",
        to: "/cash-receipt",
        icon: <MdSupervisorAccount />,
      },
      {
        id: nanoid(),
        label: "Generated Cash Receipt",
        to: "/generated-cash-receipt",
        icon: <MdSupervisorAccount />,
      },
      {
        id: nanoid(),
        label: "Recovery Challan",
        to: "/recovery-challan",
        icon: <MdSupervisorAccount />,
      },
    ],
  },
  {
    id: nanoid(),
    type: "dropdown",
    label: "Expenditures",
    key: "expenditures",
    roles: ["CASHIER"],
    children: [
      {
        id: nanoid(),
        label: "Expenditure",
        to: "/expenditures",
        icon: <MdSupervisorAccount />,
      },
      {
        id: nanoid(),
        label: "Generated Expenditure",
        to: "/generated-expenditure",
        icon: <MdSupervisorAccount />,
      },
    ],
  },
  {
    id: nanoid(),
    type: "link",
    label: "Support",
    to: "/support",
    icon: <MdSupervisorAccount />,
    roles: ["ADMIN", "CASHIER"],
  },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState({
    head: false,
    reports: false,
    challans: false,
    expenditures: false,
  });
  const { user, role } = useAuth();

  const toggleDropdown = (key) =>
    setOpenDropdown((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div
      className="flex flex-col h-screen w-64 flex-shrink-0"
      style={{ background: "#0f2744", fontFamily: "'Georgia', serif" }}>
      {/* ── Tricolor top stripe ── */}
      <div
        className="h-1.5 w-full flex-shrink-0"
        style={{
          background:
            "linear-gradient(90deg, #ff9933 33.33%, #ffffff 33.33%, #ffffff 66.66%, #138808 66.66%)",
        }}
      />

      {/* ── Logo / Header ── */}
      <div
        className="px-5 pt-5 pb-4 flex-shrink-0 border-b"
        style={{ borderColor: "rgba(201,168,76,0.25)" }}>
        <div className="flex items-center gap-3">
          {/* Ashoka wheel emblem */}
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{
              border: "2px solid #c9a84c",
              background: "rgba(201,168,76,0.12)",
            }}>
            {/* <svg width="26" height="26" viewBox="0 0 30 30" fill="none">
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
            </svg> */}
            <img src={logo} alt="KAAC" className="w-14 h-14 object-contain" />
          </div>
          <div>
            <p
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: "#c9a84c" }}>
              Govt. of India
            </p>
            <p className="text-white font-bold text-sm leading-tight">
              Financial System
            </p>
            <p className="text-xs" style={{ color: "#93b8d8" }}>
              Treasury & Accounts
            </p>
          </div>
        </div>
      </div>

      {/* ── Menu Label ── */}
      <div className="px-5 pt-4 pb-2 flex-shrink-0">
        <p
          className="text-xs font-bold tracking-widest uppercase"
          style={{ color: "rgba(201,168,76,0.7)" }}>
          Navigation
        </p>
      </div>

      {/* ── Menu Items ── */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 flex flex-col gap-0.5">
        {menuItems
          .filter((item) => item.roles.includes(user.role))
          .map((item) => {
            // NORMAL LINK
            if (item.type === "link") {
              return (
                <NavLink
                  key={item.id}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? "text-white font-semibold"
                        : "text-blue-200 hover:text-white hover:bg-white/10"
                    }`
                  }
                  style={({ isActive }) =>
                    isActive
                      ? {
                          background:
                            "linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.08))",
                          borderLeft: "3px solid #c9a84c",
                          paddingLeft: "9px",
                        }
                      : {}
                  }>
                  <span
                    className="text-base flex-shrink-0"
                    style={{ color: "inherit" }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </NavLink>
              );
            }

            // DROPDOWN
            if (item.type === "dropdown") {
              const isOpen = openDropdown[item.key];
              return (
                <div key={item.id || item.key}>
                  <button
                    onClick={() => toggleDropdown(item.key)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all duration-150 text-blue-200 hover:text-white hover:bg-white/10 cursor-pointer">
                    <span>{item.label}</span>
                    <FiChevronDown
                      className={`transition-transform duration-300 flex-shrink-0 ${isOpen ? "rotate-180" : "rotate-0"}`}
                      size={14}
                    />
                  </button>

                  {isOpen && (
                    <div
                      className="ml-3 mt-0.5 mb-1 flex flex-col gap-0.5 border-l"
                      style={{ borderColor: "rgba(201,168,76,0.3)" }}>
                      {item.children.map((child) => (
                        <NavLink
                          key={child.id}
                          to={child.to}
                          className={({ isActive }) =>
                            `flex items-center gap-2 pl-4 pr-3 py-2 text-xs font-medium rounded-r transition-all duration-150 ${
                              isActive
                                ? "text-white"
                                : "text-blue-300 hover:text-white hover:bg-white/10"
                            }`
                          }
                          style={({ isActive }) =>
                            isActive
                              ? {
                                  background: "rgba(201,168,76,0.15)",
                                  color: "#c9a84c",
                                }
                              : {}
                          }>
                          <span className="text-sm flex-shrink-0">
                            {child.icon}
                          </span>
                          <span>{child.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })}
      </div>

      {/* ── Divider ── */}
      <div
        className="mx-4 flex-shrink-0"
        style={{ height: "1px", background: "rgba(201,168,76,0.25)" }}
      />

      {/* ── User Profile Footer ── */}
      <div className="px-4 py-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <img
            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            style={{ border: "2px solid #c9a84c" }}
            src="https://static.vecteezy.com/system/resources/previews/007/409/979/original/people-icon-design-avatar-icon-person-icons-people-icons-are-set-in-trendy-flat-style-user-icon-set-vector.jpg"
            alt="User"
          />
          <div className="overflow-hidden">
            <p className="text-white text-xs font-bold truncate">{user.name}</p>
            <p className="text-xs truncate" style={{ color: "#c9a84c" }}>
              {role}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-1.5 text-xs text-blue-300 hover:text-white transition-colors duration-150 cursor-pointer">
            <FiSettings size={13} />
            <span>Settings</span>
          </button>
          {/* <button
            onClick={() => alert("Don't click otherwise You Logout!")}
            className="flex items-center gap-1.5 text-xs transition-colors duration-150 cursor-pointer"
            style={{ color: "#f87171" }}>
            <FiLogOut size={13} />
            <span>Logout</span>
          </button> */}
        </div>
      </div>

      {/* ── Bottom tricolor stripe ── */}
      <div
        className="h-1 w-full flex-shrink-0"
        style={{
          background:
            "linear-gradient(90deg, #ff9933 33.33%, #ffffff 33.33%, #ffffff 66.66%, #138808 66.66%)",
        }}
      />
    </div>
  );
};

export default Sidebar;
