import { useState, useEffect, useRef } from "react";

const EditableCell = ({ value, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value ?? "");
  const inputRef = useRef(null);

  useEffect(() => {
    setInputValue(value ?? "");
  }, [value]);
  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (Number(inputValue) !== Number(value)) onSave(Number(inputValue));
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        step="0.01"
        min="0"
        max="100"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current.blur()}
        className="w-20 px-2 py-1 text-center bg-white border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-semibold text-primary"
      />
    );
  }
  return (
    <div
      onClick={() => setIsEditing(true)}
      className="w-full px-2 py-1 text-center cursor-pointer hover:bg-surface-container-low rounded transition-colors font-semibold text-green-600"
      title="Click để sửa"
    >
      {value != null ? `${Number(value).toFixed(2)}%` : "--"}
    </div>
  );
};
export default EditableCell;
