import React from "react";

const onlyDigits = (value = "") => String(value || "").replace(/\D/g, "");

const PhoneInputPk = ({
  label = "Phone",
  name = "phone",
  value,
  onChange,
  required = false,
  disabled = false,
}) => {
  return (
    <div className="mb-1">
      {label && (
        <label className="form-label" htmlFor="pkPhoneInput">
          {label}
        </label>
      )}
      <div className="input-group">
        <span className="input-group-text" aria-hidden="true">
          🇵🇰 +92
        </span>
        <input
          id="pkPhoneInput"
          type="tel"
          className="form-control"
          name={name}
          value={value}
          onChange={(e) => {
            const digits = onlyDigits(e.target.value).slice(0, 10);
            onChange?.({
              target: { name, value: digits },
            });
          }}
          inputMode="numeric"
          pattern="[0-9]{10}"
          minLength={10}
          maxLength={10}
          placeholder="3XXXXXXXXX"
          required={required}
          disabled={disabled}
          aria-describedby="pkPhoneHelp"
        />
      </div>
      <small id="pkPhoneHelp" className="text-muted">
        Enter 10 digits (without +92).
      </small>
    </div>
  );
};

export default PhoneInputPk;
