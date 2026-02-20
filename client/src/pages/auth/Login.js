import React from "react";
import Form from "../../components/Shared/Form/Form";
import Spinner from "../../components/Shared/Form/Spinner";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../services/API";

const Login = () => {
  const { loading, error } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const handleLogin = async (e, formInputs) => {
    e.preventDefault();
    try {
      const { data } = await API.post("/auth/login", formInputs);
      if (data.success) {
        toast.success(data.message);
        localStorage.setItem("token", data.token); // Store token for ProtectedRoute
        navigate("/"); // Redirect to homepage or role-based dashboard
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Login failed. Please try again."
      );
    }
  };

  return (
    <>
      {error && <span>{alert(error)}</span>}
      {loading ? (
        <Spinner />
      ) : (
        <div className="row g-0">
          <div className="col-md-8 form-banner">
            <img src="./assets/images/login.jpeg" alt="loginImage" />
          </div>
          <div className="col-md-4 form-container">
            <Form
              formTitle={"Login Page"}
              submitBtn={"Login"}
              formType={"login"}
              onSubmit={handleLogin} // Add the onSubmit handler
            />
            <div className="text-center mt-3">
              <Link to="/forgot-password">Forgot Password?</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;
