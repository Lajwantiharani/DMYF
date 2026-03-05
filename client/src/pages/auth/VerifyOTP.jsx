// pages/auth/VerifyOTP.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../../services/API";
import { toast } from "react-toastify";
import "./Auth.css";

const VerifyOTP = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get email from URL query parameter
    const params = new URLSearchParams(location.search);
    const emailParam = params.get("email");
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    } else if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter 6-digit OTP");
      return;
    }
    if (!email) {
      toast.error("Email not found. Please register again.");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/auth/verify-otp", {
        email,
        otp,
      });

      if (res.data.success) {
        toast.success("Email verified! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      console.log("OTP Verification Error:", err);
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page--verify">
      <div className="auth-shell">
        <section className="auth-banner auth-banner--register" aria-hidden="true">
          <div className="auth-banner__overlay" />
          <div className="auth-banner__content">
            <h1>Verify Your Email</h1>
            <p>Enter the 6-digit code sent to your inbox to continue.</p>
          </div>
        </section>
        <section className="auth-panel">
          <div className="auth-card">
            <form onSubmit={handleSubmit}>
              <h1 className="text-center">Verify OTP</h1>
              <hr />
              <p className="text-center mb-3">
                Enter 6-digit code sent to {email}
              </p>

              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter OTP"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default VerifyOTP;
