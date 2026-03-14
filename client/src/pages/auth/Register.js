import React from "react";
import { useSelector } from "react-redux";
import Form from "../../components/Shared/Form/Form";
import "./Auth.css";

const Register = () => {
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
    <div className="auth-page auth-page--register">
      <div className="auth-shell">
        <section className="auth-banner auth-banner--register" aria-hidden="true">
          <div className="auth-banner__overlay" />
          <div className="auth-banner__content">
            <h1>Become a Lifesaver</h1>
            <p>Join the community and support safe, fast blood access.</p>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-card">
            {error && <div className="auth-alert">{error}</div>}

            <Form formTitle="Register" submitBtn="Register" formType="register" />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Register;
