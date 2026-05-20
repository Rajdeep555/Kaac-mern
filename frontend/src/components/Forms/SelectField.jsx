import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Controller } from "react-hook-form";

/**
 * parseLabel
 * Handles:
 * "01 - Taxation"
 * "2026-2027"
 * "Major Head (0001)"
 */
const parseLabel = (label = "") => {
  // Format: "Something (CODE)"
  const parenMatch = label.match(/^(.+?)\s*\(([^)]+)\)\s*$/);

  if (parenMatch) {
    return {
      code: parenMatch[2].trim(),
      name: parenMatch[1].trim(),
    };
  }

  // Format: "2026-2027"
  const financialYearMatch = label.match(/^(\d{4})-(\d{4})$/);

  if (financialYearMatch) {
    return {
      code: financialYearMatch[1],
      name: financialYearMatch[2],
      isFinancialYear: true,
    };
  }

  // Format: "01 - Taxation"
  const dashMatch = label.match(/^(.+?)\s*-\s*(.+)$/);

  if (dashMatch) {
    return {
      code: dashMatch[1].trim(),
      name: dashMatch[2].trim(),
    };
  }

  return {
    code: "",
    name: label.trim(),
  };
};

// ─────────────────────────────────────────────────────────────
// Readonly field
// ─────────────────────────────────────────────────────────────
const ReadonlyField = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-zinc-500">{label}</label>

    <input
      type="text"
      readOnly
      value={value}
      tabIndex={-1}
      className="
        border border-zinc-300 rounded
        outline-none px-3 py-2
        w-full bg-zinc-50
        text-zinc-600 cursor-default
        select-none text-sm
      "
    />
  </div>
);

// ─────────────────────────────────────────────────────────────
// Portal Dropdown
// ─────────────────────────────────────────────────────────────
const DropdownPortal = ({ anchorRef, open, children }) => {
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (!open || !anchorRef.current) return;

    const updatePosition = () => {
      const rect = anchorRef.current.getBoundingClientRect();

      const viewportHeight = window.innerHeight;

      const dropdownHeight = 260;

      const spaceBelow = viewportHeight - rect.bottom;

      const openUpward =
        spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      setStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        zIndex: 9999,

        ...(openUpward
          ? {
              bottom: viewportHeight - rect.top + 4,
            }
          : {
              top: rect.bottom + 4,
            }),
      });
    };

    updatePosition();

    window.addEventListener("scroll", updatePosition, true);

    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);

      window.removeEventListener("resize", updatePosition);
    };
  }, [open, anchorRef]);

  if (!open) return null;

  return createPortal(<div style={style}>{children}</div>, document.body);
};

// ─────────────────────────────────────────────────────────────
// Searchable Select
// ─────────────────────────────────────────────────────────────
export const SearchableSelect = ({
  name,
  value,
  onChange,
  options = [],
  disabled = false,
  placeholder = "Select",
}) => {
  const [open, setOpen] = useState(false);

  const [search, setSearch] = useState("");

  const containerRef = useRef(null);

  const inputRef = useRef(null);

  const portalRef = useRef(null);

  const selectedLabel =
    options.find((o) => String(o.value) === String(value))?.label ?? "";

  // Better reusable search
  const normalize = (str) =>
    str
      ?.toString()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const filtered = options.filter((o) => {
    const q = normalize(search);

    if (!q) return true;

    return normalize(o.label).includes(q) || normalize(o.value).includes(q);
  });

  // Outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current?.contains(e.target)) return;

      if (portalRef.current?.contains(e.target)) return;

      setOpen(false);

      setSearch("");
    };

    if (open) {
      document.addEventListener("mousedown", handler);

      return () => document.removeEventListener("mousedown", handler);
    }
  }, [open]);

  // Focus input
  useEffect(() => {
    if (open && inputRef.current) {
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 0);

      return () => clearTimeout(timeout);
    }
  }, [open]);

  const handleSelect = (val) => {
    onChange(val);

    setOpen(false);

    setTimeout(() => setSearch(""), 0);
  };

  const handleClear = (e) => {
    e.stopPropagation();

    onChange("");

    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className="
          border border-zinc-400 rounded
          outline-none
          focus:ring-1 focus:ring-blue-500
          px-3 py-2 w-full text-left
          flex items-center justify-between gap-2
          bg-white
        ">
        <span
          className={`truncate text-sm ${
            !selectedLabel ? "text-zinc-400" : ""
          }`}>
          {selectedLabel || placeholder}
        </span>

        <span className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="
                text-zinc-400
                hover:text-red-500
                transition-colors
                text-xs
              ">
              ✕
            </span>
          )}

          <svg
            className={`
              w-4 h-4 text-zinc-500
              transition-transform duration-200
              ${open ? "rotate-180" : ""}
            `}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>

      {/* Dropdown */}
      <DropdownPortal anchorRef={containerRef} open={open}>
        <div
          ref={portalRef}
          className="
            bg-white border border-zinc-300
            rounded shadow-xl
          ">
          <div className="p-2 border-b border-zinc-200">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="
                w-full border border-zinc-300
                rounded px-2 py-1.5 text-sm
                outline-none
                focus:ring-1 focus:ring-blue-500
              "
            />
          </div>

          <ul className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-zinc-400">No results</li>
            ) : (
              filtered.map((opt) => (
                <li
                  key={opt.value}
                  onMouseDown={(e) => {
                    e.preventDefault();

                    handleSelect(opt.value);
                  }}
                  className={`
                    px-3 py-2 text-sm cursor-pointer
                    hover:bg-blue-600 hover:text-white

                    ${
                      String(opt.value) === String(value)
                        ? "bg-blue-600 text-white"
                        : ""
                    }
                  `}>
                  {opt.label}
                </li>
              ))
            )}
          </ul>
        </div>
      </DropdownPortal>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Main SelectField
// ─────────────────────────────────────────────────────────────
const SelectField = ({
  label,
  name,
  control,
  value,
  onChange,
  options = [],
  disabled,
  showSplit = true,
}) => {
  const renderSplitFields = (selectedLabel, splitCode, splitName) => {
    if (!showSplit || !selectedLabel) return null;

    const isFinancialYear = label === "Financial Year";

    return (
      <div className="grid grid-cols-2 gap-2 mt-1">
        {isFinancialYear ? (
          <>
            <ReadonlyField label="Financial Year Start" value={splitCode} />

            <ReadonlyField label="Financial Year End" value={splitName} />
          </>
        ) : (
          <>
            <ReadonlyField label={`${label} Code`} value={splitCode} />

            <ReadonlyField label={`${label} Name`} value={splitName} />
          </>
        )}
      </div>
    );
  };

  // RHF Mode
  if (control) {
    return (
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const selectedLabel =
            options.find((o) => String(o.value) === String(field.value))
              ?.label ?? "";

          const { code: splitCode, name: splitName } =
            parseLabel(selectedLabel);

          return (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">{label}</label>

              <SearchableSelect
                name={name}
                value={field.value ?? ""}
                onChange={(val) => field.onChange(val)}
                options={options}
                disabled={disabled}
              />

              {field.value &&
                renderSplitFields(selectedLabel, splitCode, splitName)}
            </div>
          );
        }}
      />
    );
  }

  // Controlled Mode
  const selectedLabel =
    options.find((o) => String(o.value) === String(value))?.label ?? "";

  const { code: splitCode, name: splitName } = parseLabel(selectedLabel);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label}</label>

      <SearchableSelect
        name={name}
        value={value ?? ""}
        onChange={(val) =>
          onChange({
            target: {
              name,
              value: val,
            },
          })
        }
        options={options}
        disabled={disabled}
      />

      {value && renderSplitFields(selectedLabel, splitCode, splitName)}
    </div>
  );
};

export default SelectField;
