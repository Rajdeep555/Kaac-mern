const SelectField = ({
  label,
  name,
  value,
  onChange,
  options = [],
  removable,
  register,
  disabled,
}) => {
  const isRHF = !!register;

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label}</label>

      <div className="flex gap-2">
        <select
          disabled={disabled}
          name={name}
          {...(isRHF ? register(name) : { value, onChange })}
          className="border border-zinc-400 rounded outline-none focus:ring-1 focus:ring-blue-500 px-3 py-2 w-full">
          <option value="">Select</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {removable && !isRHF && value && (
          <button
            type="button"
            onClick={() => onChange({ target: { name, value: "" } })}
            className="text-red-500 text-sm">
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default SelectField;
