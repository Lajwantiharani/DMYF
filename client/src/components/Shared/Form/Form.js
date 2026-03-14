import React, { useState } from "react";
import InputType from "./InputType";
import { Link } from "react-router-dom";
import { handleLogin, handleRegister } from "../../../services/authService";

import { toast } from "react-toastify";
import PhoneInputPk from "../PhoneInputPk";

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

          else if (formType === "register") {
            if (!phone || String(phone).length !== 10) {
              e.preventDefault();
              return toast.error("Phone number must be exactly 10 digits (without +92).");
            }
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

              `+92${phone}`,
            );
          }
        }}
      >
        <h1 className="text-center">{formTitle}</h1>
        <hr />
        {formType === "login" ? (
          <p className="mb-2" style={{ marginTop: "-10px" }}>
            Not registered yet ? Register
            <Link to="/register" style={{ color: "var(--auth-primary)", textDecoration: "none", fontWeight: "700" }}> Here !</Link>
          </p>
        ) : (
          <p className="mb-2" style={{ marginTop: "-10px" }}>
            Already User Please
            <Link to="/login" style={{ color: "var(--auth-primary)", textDecoration: "none", fontWeight: "700" }}> Login !</Link>
          </p>
        )}

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

            <PhoneInputPk
              label="Phone"
              name="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </>
        )}

        <div className="d-flex flex-row justify-content-between">
          {formType === "login" && (
            <p className="mb-0">
              <Link to="/forgot-password">Forgot Password?</Link>
            </p>
          )}
          <button className="btn btn-primary ms-auto" type="submit">
            {submitBtn}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Form;
