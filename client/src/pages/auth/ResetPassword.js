import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../services/API";

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      return toast.error("Please provide all fields");
    }
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    try {
      const { data } = await API.post(`/auth/reset-password/${token}`, {
        password,
      });
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.log("Error details:", error.response?.data || error.message);
    }
  };

  return (
    <div className="row g-0">
      <div className="col-md-8 form-banner">
        <img src="./assets/images/login.jpeg" alt="resetPasswordImage" />
      </div>
      <div className="col-md-4 form-container">
        <h2 className="text-center mb-4">Reset Password</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              New Password
            </label>
            <input
              type="password"
              className="form-control"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <input
              type="password"
              className="form-control"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div className="d-flex justify-content-between">
            <Link to="/login">Back to Login</Link>
            <button type="submit" className="btn btn-primary">
              Reset Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
