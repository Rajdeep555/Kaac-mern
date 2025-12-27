import { NavLink } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import { useState } from "react";
import { RiArrowDropDownLine } from "react-icons/ri";
import { RiDashboardFill } from "react-icons/ri";
import { MdSupervisorAccount } from "react-icons/md";
import { SiCashapp } from "react-icons/si";
import { GiPoliceOfficerHead } from "react-icons/gi";
import { AiFillAlert } from "react-icons/ai";
import { RiFundsFill } from "react-icons/ri";
import { nanoid } from "nanoid"

export const menuItems = [
  {
    id:nanoid(),
    type: "link",
    label: "Dashboard",
    to: "/",
    icon: <RiDashboardFill className="icon-sm" />,
  },
  {
    id:nanoid(),
    type: "link",
    label: "Accountant",
    to: "/accountant",
    icon: <MdSupervisorAccount className="icon-sm" />,
  },
  {
    type: "link",
    label: "Cashier",
    to: "/cashier",
    icon: <SiCashapp className="icon-sm" />,
  },
  {
    id:nanoid(),
    type: "link",
    label: "DDO",
    to: "/ddo",
    icon: <GiPoliceOfficerHead className="icon-sm" />,
  },
  {
    type: "link",
    label: "Department",
    to: "/department",
    icon: <RiFundsFill className="icon-sm" />,
  },
  {
    type: "link",
    label: "Division",
    to: "/division",
    icon: <AiFillAlert className="icon-sm" />,
  },
  {
    id:nanoid(),
    type: "link",
    label: "Expenditure Type",
    to: "/expenditure",
    icon: <RiFundsFill className="icon-sm" />,
  },

  // HEAD DROPDOWN
  {
    id:nanoid(),
    type: "dropdown",
    label: "Head",
    key: "head",
    children: [
      {
        id:nanoid(),
        label: "Council",
        to: "/council",
        icon: <MdSupervisorAccount className="icon-sm" />,
      },
      {
        id:nanoid(),
        label: "State",
        to: "/state",
        icon: <MdSupervisorAccount className="icon-sm" />,
      },
    ],
  },

  {
    type: "link",
    label: "Object Head",
    to: "/objecthead",
    icon: <GiPoliceOfficerHead className="icon-sm" />,
  },

  // REPORTS DROPDOWN
  {
    id:nanoid(),
    type: "dropdown",
    label: "Reports",
    key: "reports",
    children: [
      {
        id:nanoid(),
        label: "Generate Reports",
        to: "/generate-reports",
        icon: <MdSupervisorAccount className="icon-sm" />,
      },
      {
        id:nanoid(),
        label: "State Receipt Report",
        to: "/state-recipt-report",
        icon: <MdSupervisorAccount className="icon-sm" />,
      },
    ],
  },

  {
    id:nanoid(),
    type: "link",
    label: "Plan Non Plan",
    to: "/plan-non-plan",
    icon: <MdSupervisorAccount className="icon-sm" />,
  },
  {
    id:nanoid(),
    type: "link",
    label: "Support",
    to: "/support",
    icon: <MdSupervisorAccount className="icon-sm" />,
  },
];

const Sidebar = () => {
  const [openDropdown, setOpenDropdown] = useState({
    head: false,
    reports: false,
  });

  const [openHead, setOpenHead] = useState(false);

  return (
    <div className="max-h-full w-[20%] bg-gray-300 pb-10 overflow-auto ">
      <div className="h-full w-[80%] mx-auto flex flex-col flex-start">
        <h1 className="text-3xl font-bold text-button-green mt-5 mb-10">
          KAAC
        </h1>
        <h2 className="font-semibold text-gray-500 mb-4">MENU</h2>
        <div className="flex flex-col gap-3 text-md font-semibold">
          {menuItems.map((item) => {
            // NORMAL LINK
            if (item.type === "link") {
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) =>
                    isActive ? "active padding" : "hover"
                  }
                >
                  <span className="flex items-center gap-1">
                    {item.icon} {item.label}
                  </span>
                </NavLink>
              );
            }

            // DROPDOWN
            if (item.type === "dropdown") {
              const isOpen = openDropdown[item.key];

              return (
                <div key={item.label}>
                  <button
                    onClick={() =>
                      setOpenDropdown((prev) => ({
                        ...prev,
                        [item.key]: !prev[item.key],
                      }))
                    }
                    className="w-full flex items-center justify-between cursor-pointer hover"
                  >
                    <span>{item.label}</span>
                    <RiArrowDropDownLine
                      className={`icon-md transition-transform duration-300 ${
                        isOpen ? "rotate-180" : "rotate-0"
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="ml-4 mt-2 flex flex-col gap-2 text-sm">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.label}
                          to={child.to}
                          className={({ isActive }) =>
                            isActive ? "active padding" : "hover"
                          }
                        >
                          <span className="flex items-center gap-1">
                            {child.icon} {child.label}
                          </span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })}

          <FiLogOut
            onClick={() => alert("don't click otherwise you logout")}
            className="icon-md icon-cursor text-red-500"
          />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
