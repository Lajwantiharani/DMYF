import React from "react";

import PasswordInput from "../PasswordInput";

const InputType = ({
  labelText,
  labelFor,
  inputType,
  value,
  onChange,
  name,
}) => {

  if (inputType === "password") {
    return (
      <PasswordInput
        label={labelText}
        id={labelFor}
        name={name}
        value={value}
        onChange={onChange}
        required
      />
    );
  }

  return (
    <>
      <div className="mb-1">
        <label htmlFor={labelFor} className="form-label">
          {labelText}
        </label>
        <input
          type={inputType}
          className="form-control"
          name={name}
          value={value}
          onChange={onChange}
        />
      </div>
    </>
  );
};

export default InputType;
