import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../services/API";
import "./Auth.css";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!email) {
      toast.error("Invalid reset link. Please request password reset again.");
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.otp || !formData.newPassword || !formData.confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.post("/auth/forgot-password/reset", {
        email,
        otp: formData.otp,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      if (data?.success) {
        toast.success("Password reset successful. You can now log in.");
        navigate("/login");
      } else {
        toast.error(data?.message || "Unable to reset password");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to reset password");
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
            <h1>Set New Password</h1>
            <p>Enter OTP and set your new password securely.</p>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-card">
            <form onSubmit={handleSubmit}>
              <h1 className="text-center">Reset Password</h1>
              <hr />

              <div className="mb-1">
                <label className="form-label" htmlFor="otpInput">
                  OTP
                </label>
                <input
                  id="otpInput"
                  type="text"
                  className="form-control"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-1">
                <label className="form-label" htmlFor="newPasswordInput">
                  New Password
                </label>
                <input
                  id="newPasswordInput"
                  type="password"
                  className="form-control"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-1">
                <label className="form-label" htmlFor="confirmPasswordInput">
                  Confirm Password
                </label>
                <input
                  id="confirmPasswordInput"
                  type="password"
                  className="form-control"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="d-flex flex-row justify-content-between mt-3">
                <p className="mb-0">
                  Back to
                  <Link to="/login"> Login</Link>
                </p>
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? "Please wait..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ResetPassword;
