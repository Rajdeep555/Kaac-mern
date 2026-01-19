const InputField = ({
  label,
  helperText,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  readonly = false,
}) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium flex items-center gap-1">
        {label}
        {helperText && (
          <span className="block text-xs text-gray-900 font-bold">
            {helperText}
          </span>
        )}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readonly}
        className={`border border-zinc-400 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500
           ${
            readonly
              ? "bg-gray-300 cursor-not-allowed"
              : "focus:ring-1 focus:ring-blue-500"
          }`
        }
      />
    </div>
  );
};

export default InputField;
