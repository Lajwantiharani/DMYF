import React from "react";
import { useSelector } from "react-redux";
import Form from "../../components/Shared/Form/Form";
import Spinner from "../../components/Shared/Form/Spinner";
import "./Auth.css";

const Register = () => {
  const { loading, error } = useSelector((state) => state.auth);

  return (
    <div className="auth-page auth-page--register">
      <div className="auth-shell">
        <section className="auth-banner auth-banner--register" aria-hidden="true">
          <div className="auth-banner__overlay" />
          <div className="auth-banner__content">
            <h1>Become a Lifesaver</h1>
            <p>Join our community and support safe, fast blood access.</p>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-card">
            {error && <div className="auth-alert">{error}</div>}

            {loading ? (
              <div className="auth-spinner-wrap">
                <Spinner />
              </div>
            ) : (
              <Form formTitle="Register" submitBtn="Register" formType="register" />
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Register;
