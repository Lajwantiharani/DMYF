import React, { useEffect, useMemo, useRef, useState } from "react";
import { getCitySuggestions } from "../../utils/pakistanCities";

const renderHighlightedPrefix = (label, query) => {
  const q = String(query || "").trim();
  if (!q) return label;

  const lowerLabel = String(label || "").toLowerCase();
  const lowerQuery = q.toLowerCase();

  if (!lowerLabel.startsWith(lowerQuery)) return label;

  const prefix = label.slice(0, q.length);
  const rest = label.slice(q.length);

  return (
    <>
      <span style={{ color: "#0d6efd", fontWeight: 700 }}>{prefix}</span>
      <span>{rest}</span>
    </>
  );
};

const CityAutocompleteInput = ({
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder = "Enter city",
  id,
  name = "city",
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const suggestions = useMemo(() => getCitySuggestions(value, 10), [value]);

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const showSuggestions = open && !disabled && suggestions.length > 0 && String(value || "").trim().length > 0;

  return (
    <div ref={rootRef} className="position-relative">
      <input
        id={id}
        name={name}
        type="text"
        className="form-control"
        value={value}
        onChange={(e) => {
          onChange?.(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
        disabled={disabled}
        required={required}
        placeholder={placeholder}
      />

      {showSuggestions && (
        <div
          className="list-group position-absolute w-100 shadow"
          style={{ zIndex: 2000, maxHeight: 220, overflowY: "auto" }}
          role="listbox"
          aria-label="City suggestions"
        >
          {suggestions.map((city) => (
            <button
              key={city}
              type="button"
              className="list-group-item list-group-item-action"
              onClick={() => {
                onChange?.(city);
                setOpen(false);
              }}
            >
              {renderHighlightedPrefix(city, value)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CityAutocompleteInput;

