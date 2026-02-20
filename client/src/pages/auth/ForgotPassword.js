import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../services/API";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      return toast.error("Please provide an email");
    }
    try {
      const { data } = await API.post("/auth/forgot-password", { email });
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
        <img src="./assets/images/login.jpeg" alt="forgotPasswordImage" />
      </div>
      <div className="col-md-4 form-container">
        <h2 className="text-center mb-4">Forgot Password</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="d-flex justify-content-between">
            <Link to="/login">Back to Login</Link>
            <button type="submit" className="btn btn-primary">
              Send Reset Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
