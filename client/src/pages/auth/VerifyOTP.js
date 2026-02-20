import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../services/API";

const VerifyOTP = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post(`/auth/verify-otp/${token}`, { otp });
      if (data.success) {
        toast.success(data.message);
        navigate("/login");
      }
    } catch (error) {
      toast.error("Invalid or expired OTP");
    }
  };

  return (
    <div className="row g-0">
      <div className="col-md-8 form-banner">
        <img src="./assets/images/login.jpeg" alt="Verify OTP" />
      </div>
      <div className="col-md-4 form-container">
        <h2 className="text-center mb-4">Verify OTP</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="otp" className="form-label">
              OTP
            </label>
            <input
              type="text"
              className="form-control"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Verify OTP
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTP;
