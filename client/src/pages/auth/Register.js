import React from 'react'
import Form from '../../components/Shared/Form/Form';
import { useSelector } from 'react-redux';
import Spinner from '../../components/Shared/Form/Spinner';
import "./lg_reg.css"; 
const Register = () => {
const { loading, error } = useSelector((state) => state.auth);

  return (
   <>
 {error  &&<span> {alert(error)}</span>}
  
      {loading ? (
        <Spinner />
      ) : (
   <div className="row g-0">
    <div className="col-md-8 form-banner">
      <img src="./assets/images/lg_reg.jpg" alt="registerImage" />
    </div>
     <div className="col-md-4 form-container">
      <Form    formTitle={'Sign up'} submitBtn={'Register'} formType={'register'}
      />
     </div>
   </div>
      )}
   </>
      
  );
}

export default Register