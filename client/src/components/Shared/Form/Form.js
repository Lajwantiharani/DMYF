import React, { useState } from "react";
import InputType from "./InputType";
import { Link } from "react-router-dom";
import { handleLogin, handleRegister } from "../../../services/authService";

const Form = ({ formType, submitBtn, formTitle }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("donor");
  const [name, setName] = useState("");
  const [organizationName, setOrganization] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [website, setWebsite] = useState("");
  const [current_address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [secretkey, setSecretKey] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [nukh, setNukh] = useState("");
  const [native_town, setNativeTown] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formType === "login") {
      return handleLogin(e, email, password, role);
    } else if (formType === "register") {
      // Validate secret key for admin role
      if (role === "admin" && secretkey !== "DMYF") {
        alert("Invalid Admin! Enter the right key.");
        return; // Stop the submission if the key is incorrect
      }
      // Proceed with registration if validation passes
      return handleRegister(
        e,
        name,
        role,
        email,
        password,
        organizationName,
        hospitalName,
        website,
        current_address,
        phone,
        native_town,
        nukh,
        bloodGroup,
        secretkey
      );
      
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h1 className="text-center">{formTitle}</h1>
        <hr />
        {/* Role selection using dropdown */}
        <div className="mb-3">
          <label htmlFor="roleSelect" className="form-label">
            Select Role
          </label>
          <select
            className="form-select"
            id="roleSelect"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="admin">Admin</option>
            <option value="donor">Donor</option>
            <option value="receiver">Receiver</option>
            <option value="hospital">Hospital</option>
            <option value="organization">Organization</option>
          </select>
        </div>

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
            {(role === "admin" || role === "donor" || role === "receiver") && (
              <InputType
                labelText={"Name"}
                labelFor={"forName"}
                inputType={"text"}
                name={"name"}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <InputType
              labelText={"Password"}
              labelFor={"forPassword"}
              inputType={"password"}
              name={"password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {role === "admin" && (
              <InputType
                labelText={"Secret Key"}
                placeHolder={"Enter Secret Key"}
                labelFor={"forKey"}
                inputType={"text"}
                name={"secretkey"}
                value={secretkey}
                onChange={(e) => setSecretKey(e.target.value)}
              />
            )}
            {role === "organization" && (
              <InputType
                labelText={"Organization Name"}
                labelFor={"forOrganization"}
                inputType={"text"}
                name={"organization"}
                value={organizationName}
                onChange={(e) => setOrganization(e.target.value)}
              />
            )}
            {role === "hospital" && (
              <InputType
                labelText={"Hospital Name"}
                labelFor={"forHospitalName"}
                inputType={"text"}
                name={"hospitalName"}
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
              />
            )}
            {(role === "organization" || role === "hospital") && (
              <>
                <InputType
                  labelText={"Website"}
                  labelFor={"forWebsite"}
                  inputType={"text"}
                  name={"website"}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </>
            )}
            {(role === "donor" ||
              role === "receiver" ||
              role === "organization" ||
              role === "hospital") && (
              <>
                <InputType
                  labelText={"Current Address"}
                  labelFor={"forAddress"}
                  inputType={"text"}
                  name={"current_address"}
                  value={current_address}
                  onChange={(e) => setAddress(e.target.value)}
                />
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

            {(role === "donor" || role === "receiver") && (
              <>
                <InputType
                  labelText={"Nukh"}
                  labelFor={"forNukh"}
                  inputType={"text"}
                  name={"nukh"}
                  value={nukh}
                  onChange={(e) => setNukh(e.target.value)}
                />
                <InputType
                  labelText={"Native Town"}
                  labelFor={"forNativeTown"}
                  inputType={"text"}
                  name={"native_town"}
                  value={native_town}
                  onChange={(e) => setNativeTown(e.target.value)}
                />
              </>
            )}
            {(role === "donor" || role === "receiver") && (
              <>
                <div className="mb-3">
                  <label htmlFor="bloodGroup" className="form-label">
                    Blood Group
                  </label>
                  <select
                    className="form-select"
                    id="bloodGroup"
                    name="bloodGroup"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                  >
                    <option value="">-- Select Blood Group --</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </>
            )}
          </>
        )}

        <div className="d-flex flex-row justify-content-between align-items-center">
          {formType === "login" ? (
            <p style={{ color: "#34495e" }}>
              Not registered yet?{" "}
              <Link
                to="/register"
                style={{
                  color: "rgba(106, 11, 55, 0.7)",
                  textDecoration: "none",
                }}
              >
                Register Here!
              </Link>
            </p>
          ) : (
            <p style={{ color: "#34495e" }}>
              Already a user? Please{" "}
              <Link
                to="/login"
                style={{
                  color: "rgba(106, 11, 55, 0.7)",
                  textDecoration: "none",
                }}
              >
                Login!
              </Link>
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
