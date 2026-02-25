const InputField = ({
  label,
  helperText,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  readonly = false,
  register,
  required = false, // ✅ NEW
  error, // ✅ NEW — error message from react-hook-form
}) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium flex items-center gap-1">
        {label}
        {required && (
          <span className="text-red-500 text-sm leading-none">*</span> // ✅ red asterisk
        )}
        {helperText && (
          <span className="block text-xs text-gray-900 font-bold">
            {helperText}
          </span>
        )}
      </label>

      <input
        type={type}
        name={name}
        placeholder={placeholder}
        readOnly={readonly}
        {...(register
          ? register(name, {
              ...(required && { required: `${label} is required` }), // ✅ pass required rule
            })
          : { value, onChange })}
        className={`border rounded px-3 py-2 outline-none transition-all
          ${
            error
              ? "border-red-500 focus:ring-1 focus:ring-red-400 bg-red-50" // ✅ red border on error
              : "border-zinc-400 focus:ring-1 focus:ring-blue-500"
          }
          ${readonly ? "bg-gray-300 cursor-not-allowed" : ""}
        `}
      />

      {/* ✅ Error message below field */}
      {error && (
        <span className="text-xs text-red-500 font-medium mt-0.5">{error}</span>
      )}
    </div>
  );
};

export default InputField;
