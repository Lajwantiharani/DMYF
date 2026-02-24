// src/pages/Login.jsx
import React from "react";
import { useSelector } from "react-redux";
import Form from "../../components/Shared/Form/Form";
import Spinner from "../../components/Shared/Form/Spinner";



const Login = () => {
  const { loading, error } = useSelector((state) => state.auth);

  return (
    <>
      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          overflow: hidden;           /* ← This prevents page scroll */
          font-family: 'Segoe UI', system-ui, sans-serif;
          background: #f9fafb;
        }

        #root, .login-page {
          height: 100%;
          overflow: hidden;
        }

        .login-page {
          display: flex;
          flex-direction: row;
          height: 100vh;              /* Full viewport height */
          width: 100vw;
          background: #fff;
        }

        .banner-side {
          flex: 1 1 60%;              /* ~60-65% on desktop */
          position: relative;
          overflow: hidden;
          background: linear-gradient(
            rgba(200, 35, 51, 0.48),
            rgba(220, 53, 69, 0.65)
          ), url('./assets/images/banner1.jpg') center/cover no-repeat;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2rem;
        }

        .banner-content {
          max-width: 520px;
          z-index: 2;
        }

        .banner-content h1 {
          font-size: clamp(2.1rem, 5.5vw, 3.4rem);
          font-weight: 700;
          margin-bottom: 0.9rem;
          line-height: 1.1;
          text-shadow: 0 3px 14px rgba(0,0,0,0.55);
        }

        .banner-content p {
          font-size: clamp(1rem, 3vw, 1.35rem);
          opacity: 0.94;
          line-height: 1.4;
        }

        .form-side {
          flex: 1 1 40%;
          background: white;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: clamp(1.5rem, 4vw, 3.2rem) clamp(1.2rem, 3.5vw, 2.8rem);
          box-shadow: -8px 0 24px rgba(0,0,0,0.06);
          overflow-y: auto;           /* Only scroll inside form if needed (rare) */
        }

        .form-title {
          color: #c82333;
          font-size: clamp(1.9rem, 5vw, 2.4rem);
          font-weight: 700;
          text-align: center;
          margin-bottom: 1.8rem;
        }

        .user-type-group {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1.1rem 1.4rem;
          margin-bottom: 1.8rem;
        }

        .user-type-group label {
          font-size: 0.98rem;
          font-weight: 500;
          color: #444;
          cursor: pointer;
          white-space: nowrap;
        }

        .user-type-group input[type="radio"] {
          accent-color: #dc3545;
          transform: scale(1.15);
          margin-right: 0.4rem;
        }

        input[type="email"],
        input[type="password"],
        input[type="text"] {
          width: 100%;
          padding: 0.95rem 1.1rem;
          margin-bottom: 1.2rem;
          border: 1px solid #d1d5db;
          border-radius: 0.6rem;
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        input:focus {
          border-color: #dc3545;
          box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.14);
          outline: none;
        }

        .btn-login {
          background: #dc3545;
          color: white;
          border: none;
          padding: 0.95rem;
          font-size: 1.05rem;
          font-weight: 600;
          border-radius: 0.6rem;
          cursor: pointer;
          transition: all 0.22s;
          margin-top: 0.6rem;
        }

        .btn-login:hover {
          background: #bd2130;
          transform: translateY(-1px);
          box-shadow: 0 5px 15px rgba(220, 53, 69, 0.28);
        }

        .register-link {
          text-align: center;
          margin-top: 1.6rem;
          font-size: 0.96rem;
          color: #555;
        }

        .register-link a {
          color: #dc3545;
          font-weight: 600;
          text-decoration: none;
        }

        .register-link a:hover {
          text-decoration: underline;
        }

        .auth-error {
          background: #fff5f5;
          color: #c82333;
          padding: 0.9rem;
          border-radius: 0.5rem;
          margin-bottom: 1.4rem;
          text-align: center;
          border: 1px solid #f5c6cb;
          font-weight: 500;
        }

        /* ──────────────────────────────
           Mobile / Tablet (below ~850px)
        ────────────────────────────── */
        @media (max-width: 850px) {
          .login-page {
            flex-direction: column;
          }

          .banner-side {
            flex: 0 0 auto;
            min-height: 35vh;           /* Smaller image area on mobile */
            padding: 2.5rem 1.5rem;
          }

          .banner-content h1 {
            font-size: clamp(1.8rem, 6.5vw, 2.6rem);
          }

          .banner-content p {
            font-size: clamp(0.95rem, 3.8vw, 1.15rem);
          }

          .form-side {
            flex: 1 1 auto;
            padding: 2rem 1.4rem;
            justify-content: flex-start;
            padding-top: 1.5rem;
          }

          .user-type-group {
            gap: 0.9rem 1.2rem;
            margin-bottom: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .form-side {
            padding: 1.6rem 1.2rem;
          }

          .btn-login {
            padding: 0.9rem;
            font-size: 1rem;
          }
        }
      `}</style>

      <div className="login-page">
        {error && <div className="auth-error">{error}</div>}

        {loading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Spinner />
          </div>
        ) : (
          <>
            <div className="banner-side">
              <div className="banner-content">
                <h1>Save a Life Today</h1>
                <p>Your donation can make the difference between life and death</p>
              </div>
            </div>

            <div className="form-side">
              <h2 className="form-title">Login</h2>

              {/* Your Form component should render the fields below */}
              <Form formTitle="" submitBtn="Login" formType="login" />
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Login;