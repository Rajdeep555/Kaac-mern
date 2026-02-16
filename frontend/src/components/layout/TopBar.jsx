import React, { useEffect, useState } from "react";
import { AiFillBell } from "react-icons/ai";
import { CgProfile } from "react-icons/cg";
import { BsArrowRight } from "react-icons/bs";
import { FiSearch } from "react-icons/fi";
import { Link, useNavigate } from "react-router";
import { menuItems } from "./SideBar";
import { useAuth } from "../../context/AuthContext";

const TopBar = () => {
  const { user, role } = useAuth();
  const [search, setSearch] = useState("");
  const [searchItem, setSearchItem] = useState([]);
  const [index, setIndex] = useState(-1);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!search) {
      setSearchItem([]);
      setIndex(-1);
      return;
    }

    const results = [];

    menuItems.forEach((item) => {
      if (!item.roles.includes(user.role)) return;

      if (
        item.type === "link" &&
        item.label.toLowerCase().includes(search.toLowerCase())
      ) {
        results.push({ ...item, searchKey: `link-${item.to}` });
      }

      if (item.type === "dropdown" && item.children) {
        item.children.forEach((child) => {
          if (child.label.toLowerCase().includes(search.toLowerCase())) {
            results.push({
              ...child,
              searchKey: `child-${item.key}-${child.to}`,
            });
          }
        });
      }
    });

    setSearchItem(results);
    setIndex(-1);
  }, [search, user.role]);

  return (
    <div
      className="flex-shrink-0 relative z-40"
      style={{ fontFamily: "'Georgia', serif" }}>
      {/* ── Main TopBar ── */}
      <div
        className="w-full flex items-center justify-between px-6"
        style={{
          height: "60px",
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        }}>
        {/* Left: Search */}
        <div className="relative flex items-center" style={{ width: "380px" }}>
          <FiSearch
            className="absolute left-3 text-gray-400 pointer-events-none"
            size={15}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (!searchItem.length) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndex((prev) =>
                  prev < searchItem.length - 1 ? prev + 1 : 0,
                );
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndex((prev) =>
                  prev > 0 ? prev - 1 : searchItem.length - 1,
                );
              }
              if (e.key === "Enter" && index >= 0) {
                navigate(searchItem[index].to);
                setSearch("");
              }
              if (e.key === "Escape") setSearch("");
            }}
            type="search"
            placeholder="Search modules, reports, forms..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded border text-gray-700 placeholder-gray-400 outline-none transition-all duration-150"
            style={{
              background: "#f9fafb",
              borderColor: search ? "#1a3a5c" : "#d1d5db",
              fontFamily: "'Georgia', serif",
              fontSize: "12px",
            }}
          />
        </div>

        {/* Center: Page label */}
        <div className="flex items-center gap-2">
          <div
            className="w-1 h-4 rounded-full"
            style={{ background: "#c9a84c" }}
          />
          <span
            className="text-xs font-bold tracking-wider uppercase"
            style={{ color: "#0f2744" }}>
            Financial Management System
          </span>
          <div
            className="w-1 h-4 rounded-full"
            style={{ background: "#c9a84c" }}
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen((p) => !p)}
              className="relative flex items-center justify-center w-9 h-9 rounded transition-all duration-150 cursor-pointer"
              style={{
                background: notifOpen ? "#f0f4f8" : "transparent",
                border: "1.5px solid #e5e7eb",
              }}>
              <AiFillBell size={17} style={{ color: "#1a3a5c" }} />
              {/* Dot */}
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background: "#c9a84c", border: "1.5px solid white" }}
              />
            </button>

            {notifOpen && (
              <div
                className="absolute right-0 top-11 rounded border text-sm overflow-hidden"
                style={{
                  width: "240px",
                  background: "#fff",
                  borderColor: "#e5e7eb",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                }}>
                <div
                  className="px-4 py-2.5 border-b"
                  style={{ background: "#0f2744", borderColor: "#1a3a5c" }}>
                  <p className="text-xs font-bold text-white tracking-wide">
                    Notifications
                  </p>
                </div>
                <div className="px-4 py-6 text-center">
                  <p className="text-xs text-gray-400">No notifications yet.</p>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-6" style={{ background: "#e5e7eb" }} />

          {/* User Profile */}
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2.5 cursor-pointer group">
            <img
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              style={{ border: "2px solid #c9a84c" }}
              src="https://static.vecteezy.com/system/resources/previews/007/409/979/original/people-icon-design-avatar-icon-person-icons-people-icons-are-set-in-trendy-flat-style-user-icon-set-vector.jpg"
              alt="User"
            />
            <div className="text-left">
              <p
                className="text-xs font-bold leading-tight"
                style={{ color: "#0f2744" }}>
                {user.name}
              </p>
              <p
                className="text-xs leading-tight"
                style={{ color: "#c9a84c", fontSize: "10px" }}>
                {role}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* ── Search Dropdown ── */}
      {search.length > 0 && (
        <div
          className="absolute left-6 top-14 rounded border overflow-hidden"
          style={{
            width: "380px",
            background: "#ffffff",
            borderColor: "#1a3a5c",
            boxShadow: "0 8px 24px rgba(15,39,68,0.15)",
            zIndex: 100,
          }}>
          {/* Header */}
          <div
            className="px-3 py-2 border-b"
            style={{ background: "#0f2744", borderColor: "#1a3a5c" }}>
            <p className="text-xs text-white font-semibold tracking-wide">
              {searchItem.length > 0
                ? `${searchItem.length} result${searchItem.length > 1 ? "s" : ""} found`
                : "No results"}
            </p>
          </div>

          {searchItem.length > 0 ? (
            searchItem.map((item, idx) => (
              <Link
                key={item.searchKey || item.id}
                to={item.to}
                onClick={() => setSearch("")}
                className="flex items-center justify-between px-4 py-2.5 text-sm border-b transition-all duration-100 cursor-pointer"
                style={{
                  borderColor: "#f3f4f6",
                  background: idx === index ? "#f0f4f8" : "transparent",
                  borderLeft:
                    idx === index
                      ? "3px solid #c9a84c"
                      : "3px solid transparent",
                  color: idx === index ? "#0f2744" : "#374151",
                  fontFamily: "'Georgia', serif",
                  fontSize: "12px",
                }}>
                <span className="font-medium">{item.label}</span>
                <BsArrowRight
                  size={13}
                  style={{ color: idx === index ? "#c9a84c" : "#9ca3af" }}
                />
              </Link>
            ))
          ) : (
            <div className="px-4 py-5 text-center">
              <p className="text-xs text-gray-400">
                No modules match "<strong>{search}</strong>"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TopBar;
