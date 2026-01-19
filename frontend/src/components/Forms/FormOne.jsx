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
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Modal"}>
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
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

        <form onSubmit={handleSubmit}>
          {/* Body form */}
          <div className="px-6 py-5">
            {error ? (
              <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
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

                  {field.helperText ? (
                    <p className="mt-1.5 text-xs text-slate-500">
                      {field.helperText}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
              onClick={onClose}>
              Cancel
            </button>

            <button
              disabled={loading}
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2">
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
        
      </div>
    </div>
  );
};

export default FormOne;
