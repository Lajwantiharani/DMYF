import React from "react";
import { useSelector } from "react-redux";
import Form from "../../components/Shared/Form/Form";
import "./Auth.css";

const Login = () => {
  const { loading, error, user } = useSelector((state) => state.auth);
  const token = localStorage.getItem("token");

  if (loading || (user && token)) {
    return (
      <div className="auth-loading-overlay">
        <div className="auth-loading-spinner" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="auth-page auth-page--login">
      <div className="auth-shell">
        <section className="auth-banner auth-banner--login" aria-hidden="true">
          <div className="auth-banner__overlay" />
          <div className="auth-banner__content">
            <h1>Save a Life Today</h1>
            <p>Your donation can make the difference between life and death.</p>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-card">
            {error && <div className="auth-alert">{error}</div>}

            <Form formTitle="Login to your Dashboard" submitBtn="Login" formType="login" />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
