import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../services/API";
import Form from "../../components/Shared/Form/Form"; // Adjust path based on your structure

const Register = () => {
  const navigate = useNavigate();

  const handleRegister = async (e, formInputs) => {
    e.preventDefault();
    try {
      const { data } = await API.post("/auth/register", formInputs);
      if (data.success) {
        toast.success(data.message);
        if (data.token) {
          navigate(`/verify-otp/${data.token}`);
        } else {
          navigate("/login");
        }
      }
    } catch (error) {
      toast.error("Registration failed. Please try again.");
    }
  };

  return (
    <div className="row g-0">
      <div className="col-md-8 form-banner">
        <img src="./assets/images/login.jpeg" alt="Register" />
      </div>
      <div className="col-md-4 form-container">
        <Form
          formType="register"
          submitBtn="Register"
          formTitle="Register"
          onSubmit={handleRegister}
        />
      </div>
    </div>
  );
};

export default Register;