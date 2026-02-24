// src/pages/Register.jsx
import React from "react";
import { useSelector } from "react-redux";
import Form from "../../components/Shared/Form/Form";
import Spinner from "../../components/Shared/Form/Spinner";

const Register = () => {
  const { loading, error } = useSelector((state) => state.auth);

  return (
    <>
      <style>{`
  html, body, #root {
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    font-family: system-ui, -apple-system, sans-serif;
    background: #f8f9fa;
  }

  .register-full-page {
    height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: row;
  }

  .banner-area {
    flex: 1;
    background: linear-gradient(rgba(200, 35, 51, 0.45), rgba(220, 53, 69, 0.65)),
                url('./assets/images/banner2.jpg') center/cover no-repeat;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem;
    position: relative;
  }

  .banner-area::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(220,53,69,0.2), rgba(200,35,51,0.35));
  }

  .banner-text {
    position: relative;
    z-index: 1;
    max-width: 520px;
  }

  .banner-text h1 {
    font-size: clamp(2.4rem, 6vw, 3.6rem);
    font-weight: 700;
    margin-bottom: 1rem;
    text-shadow: 0 3px 12px rgba(0,0,0,0.55);
  }

  .banner-text p {
    font-size: clamp(1.1rem, 3.2vw, 1.35rem);
    opacity: 0.94;
  }

  .form-area {
    flex: 1;
    background: white;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;       /* start from top → no cut heading */
    padding: 2.5rem 2.5rem 1.5rem;     /* good top padding, less bottom */
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .form-area h1 {
    color: #c82333;
    font-size: clamp(2.1rem, 5.5vw, 2.7rem);
    font-weight: 700;
    text-align: center;
    margin: 0 0 1.8rem 0;
  }

  /* ── Radio buttons ── bigger + more space ──────────────────────── */
  .role-radio-group {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1.8rem 2.8rem;               /* INCREASED SPACE between radios */
    margin: 0 0 2.2rem 0;
    padding: 0.5rem 1rem;
  }

  .form-check-inline {
    display: flex;
    align-items: center;
    margin: 0 !important;
  }

  .form-check-input {
    width: 1.4em !important;          /* bigger radio circle */
    height: 1.4em !important;
    margin-top: 0.15em;
    accent-color: #dc3545;
    cursor: pointer;
  }

  .form-check-label {
    font-size: 1.08rem;
    font-weight: 500;
    color: #333;
    cursor: pointer;
    padding-left: 0.5rem;
  }

  /* Form fields */
  .form-group {
    margin-bottom: 1.6rem;            /* more breathing room between fields */
  }

  .form-group label {
    font-weight: 500;
    color: #555;
    margin-bottom: 0.6rem;
    display: block;
  }

  .form-group input {
    width: 100%;
    padding: 1rem 1.3rem;
    border: 1px solid #ced4da;
    border-radius: 0.55rem;
    font-size: 1.03rem;
  }

  .form-group input:focus {
    border-color: #dc3545;
    box-shadow: 0 0 0 0.25rem rgba(220,53,69,0.13);
    outline: none;
  }

  .btn-primary {
    background-color: #dc3545 !important;
    border-color: #dc3545 !important;
    padding: 1rem 2.2rem;
    font-size: 1.1rem;
    font-weight: 600;
    border-radius: 0.55rem;
    transition: all 0.22s;
    margin-top: 1.2rem;
  }

  .btn-primary:hover {
    background-color: #bd2130 !important;
    transform: translateY(-2px);
  }

  .form-text {
    text-align: center;
    margin-top: 1.8rem;
    font-size: 0.98rem;
  }

  .form-text a {
    color: #dc3545;
    font-weight: 600;
    text-decoration: none;
  }

  .form-text a:hover {
    text-decoration: underline;
  }

  .error-message {
    background: #fff5f5;
    color: #c82333;
    padding: 1rem;
    border-radius: 0.5rem;
    margin: 0.8rem 2rem 1.5rem;
    text-align: center;
    border: 1px solid #f5c6cb;
  }

  /* Mobile adjustments */
  @media (max-width: 992px) {
    .register-full-page {
      flex-direction: column;
    }

    .banner-area {
      min-height: 32vh;
      padding: 2.5rem 1.6rem;
    }

    .form-area {
      padding: 2.2rem 2rem 1.5rem;
    }

    .role-radio-group {
      gap: 1.4rem 2.2rem;           /* still good space on mobile */
    }
  }

  @media (max-width: 576px) {
    .form-area {
      padding: 2rem 1.5rem 1.5rem;
    }

    .role-radio-group {
      gap: 1.2rem 1.8rem;
    }

    .btn-primary {
      width: 100%;
    }
  }

  /* Prevent excessive scroll on very tall screens */
  @media (min-height: 1000px) {
    .form-area {
      padding-bottom: 3rem;
    }
  }
`}</style>

      <div className="register-full-page">
        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Spinner />
          </div>
        ) : (
          <>
            <div className="banner-area">
              <div className="banner-text">
                <h1>Become a Lifesaver</h1>
                <p>
                  Join our community and help save lives through blood donation.
                </p>
              </div>
            </div>

            <div className="form-area">
              <Form
                formTitle="Register"
                submitBtn="Register"
                formType="register"
              />
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Register;
