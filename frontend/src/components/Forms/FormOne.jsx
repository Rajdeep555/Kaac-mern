import { IoMdClose } from "react-icons/io";

const FormOne = ({
  isOpen,
  onClose,
  title,
  fields = [],
  onSubmit,
  loading,
  error,
  initialValues = {},
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    onSubmit?.(data);
  };

  return (
    <div
      // ✅ FIX: overflow-y-auto on backdrop so the whole modal scrolls on small screens
      // removed min-h-screen (was forcing viewport height causing clip)
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Modal"}>
      {/* ✅ FIX: max-h + flex flex-col so header/footer stay fixed, body scrolls */}
      <div className="relative w-full max-w-xl my-auto rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 flex flex-col max-h-[90vh]">
        {/* Header — shrink-0 so it never compresses */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 shrink-0">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-900">
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Fill in the details below.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            aria-label="Close">
            <IoMdClose className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* ✅ FIX: overflow-y-auto + flex-1 — only the fields area scrolls */}
          <div className="overflow-y-auto flex-1 px-6 py-5">
            {error && (
              <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <div
                  key={field.name}
                  className={field.fullWidth ? "sm:col-span-2" : ""}>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    {field.label}
                  </label>

                  {field.type === "select" ? (
                    <select
                      name={field.name}
                      disabled={field.disabled}
                      defaultValue={initialValues?.[field.name] ?? ""}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20">
                      <option value="" disabled>
                        Select an option
                      </option>
                      {(field.options || []).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={field.name}
                      disabled={field.disabled}
                      type={field.type || "text"}
                      placeholder={field.placeholder}
                      defaultValue={initialValues?.[field.name] ?? ""}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    />
                  )}

                  {field.helperText && (
                    <p className="mt-1.5 text-xs text-slate-500">
                      {field.helperText}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer — shrink-0 so it's always visible at the bottom */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end shrink-0 bg-white rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2">
              Cancel
            </button>
            <button
              disabled={loading}
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2">
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormOne;
