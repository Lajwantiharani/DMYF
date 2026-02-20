import React, { useState } from "react";
import InputType from "./InputType";
import { Link } from "react-router-dom";

const Form = ({ formType, submitBtn, formTitle, onSubmit }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("donor");
  const [name, setName] = useState("");
  const [organizationName, setOrganization] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const formInputs = {
      email,
      password,
      role,
      name,
      organizationName,
      hospitalName,
      website,
      address,
      phone,
    };

    if (formType === "login" || formType === "register") {
      onSubmit(e, formInputs);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h1 className="text-center">{formTitle}</h1>
        <hr />
        <div className="d-flex mb-3">
          {["donor", "admin", "hospital", "organization", "receiver"].map(
            (r) => (
              <div className="form-check ms-2" key={r}>
                <input
                  type="radio"
                  className="form-check-input"
                  name="role"
                  id={`${r}Radio`}
                  value={r}
                  onChange={(e) => setRole(e.target.value)}
                  checked={role === r}
                />
                <label htmlFor={`${r}Radio`} className="form-check-label">
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </label>
              </div>
            )
          )}
        </div>

        {formType === "login" && (
          <>
            <InputType
              labelText="Email"
              labelFor="forEmail"
              inputType="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <InputType
              labelText="Password"
              labelFor="forPassword"
              inputType="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </>
        )}

        {formType === "register" && (
          <>
            <InputType
              labelText="Name"
              labelFor="forName"
              inputType="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <InputType
              labelText="Email"
              labelFor="forEmail"
              inputType="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <InputType
              labelText="Password"
              labelFor="forPassword"
              inputType="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {role === "organization" && (
              <InputType
                labelText="Organization"
                labelFor="forOrganization"
                inputType="text"
                name="organizationName" // Fixed to match state and backend
                value={organizationName}
                onChange={(e) => setOrganization(e.target.value)}
              />
            )}
            {role === "hospital" && (
              <InputType
                labelText="Hospital Name"
                labelFor="forHospitalName"
                inputType="text"
                name="hospitalName"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
              />
            )}
            <InputType
              labelText="Website"
              labelFor="forWebsite"
              inputType="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
            <InputType
              labelText="Address"
              labelFor="forAddress"
              inputType="text"
              name="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <InputType
              labelText="Phone"
              labelFor="forPhone"
              inputType="text"
              name="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </>
        )}

        <div className="d-flex flex-row justify-content-between">
          {formType === "login" ? (
            <p>
              Not registered yet? <Link to="/register">Register Here!</Link>
            </p>
          ) : (
            <p>
              Already a user? <Link to="/login">Login!</Link>
            </p>
          )}
          <button className="btn btn-primary" type="submit">
            {submitBtn}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Form;
