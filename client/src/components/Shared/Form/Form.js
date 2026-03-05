import React, { useState } from "react";
import InputType from "./InputType";
import { Link } from "react-router-dom";
import { handleLogin, handleRegister } from "../../../services/authService";

const Form = ({ formType, submitBtn, formTitle }) => {
  // Destructure props here
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("donor");
  const [name, setName] = useState("");
  const [organizationName, setOrganization] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <div>
      <form
        onSubmit={(e) => {
          if (formType === "login")
            return handleLogin(e, email, password);
          else if (formType === "register")
            return handleRegister(
              e,
              role === "organization" ? "" : name,
              role,
              email,
              password,
              role === "organization" ? organizationName : "",
              "",
              "",
              "",
              phone,
            );
        }}
      >
        <h1 className="text-center">{formTitle}</h1>
        <hr />
        {formType === "register" && (
          <>
            <div className="auth-role-desktop d-flex mb-3">
              <div className="form-check">
                <input
                  type="radio"
                  className="form-check-input"
                  name="role"
                  id="donorRadio"
                  value={"donor"}
                  onChange={(e) => setRole(e.target.value)}
                  checked={role === "donor"}
                />
                <label htmlFor="donorRadio" className="form-check-label">
                  Donor
                </label>
              </div>
              <div className="form-check ms-2">
                <input
                  type="radio"
                  className="form-check-input"
                  name="role"
                  id="organizationRadio"
                  value={"organization"}
                  onChange={(e) => setRole(e.target.value)}
                  checked={role === "organization"}
                />
                <label htmlFor="organizationRadio" className="form-check-label">
                  Organization
                </label>
              </div>
              <div className="form-check ms-2">
                <input
                  type="radio"
                  className="form-check-input"
                  name="role"
                  id="receiverRadio"
                  value={"receiver"}
                  onChange={(e) => setRole(e.target.value)}
                  checked={role === "receiver"}
                />
                <label htmlFor="receiverRadio" className="form-check-label">
                  Receiver
                </label>
              </div>
            </div>

            <div className="auth-role-mobile mb-3">
              <label htmlFor="mobileRoleSelect" className="form-label">Select Role</label>
              <select
                id="mobileRoleSelect"
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="donor">Donor</option>
                <option value="organization">Organization</option>
                <option value="receiver">Receiver</option>
              </select>
            </div>
          </>
        )}
        {/* Conditional rendering based on formType */}
        {formType === "login" && (
          <>
            <InputType
              labelText={"Email"}
              labelFor={"forEmail"}
              inputType={"email"}
              name={"email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <InputType
              labelText={"Password"}
              labelFor={"forPassword"}
              inputType={"password"}
              name={"password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </>
        )}

        {formType === "register" && (
          <>
            <InputType
              labelText={"Email"}
              labelFor={"forEmail"}
              inputType={"email"}
              name={"email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <InputType
              labelText={"Password"}
              labelFor={"forPassword"}
              inputType={"password"}
              name={"password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {(role === "donor" || role === "receiver") && (
              <InputType
                labelText={"Name"}
                labelFor={"forName"}
                inputType={"text"}
                name={"name"}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}

            {role === "organization" && (
              <InputType
                labelText={"Organization"}
                labelFor={"forOrganization"}
                inputType={"text"}
                name={"organization"}
                value={organizationName}
                onChange={(e) => setOrganization(e.target.value)}
              />
            )}
            <InputType
              labelText={"Phone"}
              labelFor={"forPhone"}
              inputType={"text"}
              name={"phone"}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </>
        )}

        <div className="d-flex flex-row justify-content-between">
          {formType === "login" ? (
            <div>
              <p className="mb-1">
                {" "}
                Not registered yet ? Register
                <Link to="/register"> Here !</Link>
              </p>
              <p className="mb-0">
                <Link to="/forgot-password">Forgot Password?</Link>
              </p>
            </div>
          ) : (
            <p>
              {" "}
              Already User Please
              <Link to="/login"> Login !</Link>
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
