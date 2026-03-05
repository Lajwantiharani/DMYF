import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../services/API";
import "./Auth.css";

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Email is required");
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.post("/auth/forgot-password/request-otp", {
        email,
      });
      if (data?.success) {
        toast.success(data?.message || "OTP sent to your email");
        setOtpSent(true);
      } else {
        toast.error(data?.message || "Unable to send OTP");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page--login">
      <div className="auth-shell">
        <section className="auth-banner auth-banner--login" aria-hidden="true">
          <div className="auth-banner__overlay" />
          <div className="auth-banner__content">
            <h1>Reset Password</h1>
            <p>Enter your email to receive OTP and password reset link.</p>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-card">
            <form onSubmit={handleSendOtp}>
              <h1 className="text-center">Forgot Password</h1>
              <hr />

              <div className="mb-1">
                <label className="form-label" htmlFor="forgotEmail">
                  Email
                </label>
                <input
                  id="forgotEmail"
                  type="email"
                  className="form-control"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {otpSent && (
                <p className="text-success mt-2 mb-1">
                  OTP and reset link sent. Open email and click the reset link.
                </p>
              )}

              <div className="d-flex flex-row justify-content-between mt-3">
                <p className="mb-0">
                  Back to
                  <Link to="/login"> Login</Link>
                </p>
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? "Please wait..." : "Send OTP"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ForgotPassword;
