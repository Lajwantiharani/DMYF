import React from "react";
import Form from "../../components/Shared/Form/Form";
import { useSelector } from "react-redux";
import Spinner from "../../components/Shared/Form/Spinner";

const Register = () => {
  const { loading, error } = useSelector((state) => state.auth);

  return (
    <>
      {error && <span> {alert(error)}</span>}
      {loading ? (
        <Spinner />
      ) : (
        <div className="row">
          <div className="col-md-6 form-banner">
            <img src="./assets/images/login.jpeg" alt="Register" />
          </div>
          <div className="col-md-5 form-container">
           
            <Form
              formTitle={"Register"}
              submitBtn={"Register"}
              formType={"register"}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Register;
