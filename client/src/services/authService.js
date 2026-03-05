import { userLogin, userRegister } from '../redux/features/auth/authActions';
import store from '../redux/store';
import { toast } from "react-toastify";

export const handleLogin = (e, email, password) => {
  e.preventDefault();
  try {
    if (!email || !password) {
      return toast.error("Please provide all fields");
    }
    store.dispatch(userLogin({ email, password }));
  } catch (error) {
    console.log(error);
  }
};

export const handleRegister = (
  e,
  name,
  role,
  email,
  password,
  organizationName,
  hospitalName,
  website,
  address,
  phone
) => {
  e.preventDefault();
  try {
   store.dispatch(userRegister( 
 {
  name,
  role,
  email,
  password,
  organizationName,
  hospitalName,
  website,
  address,
  phone
 }
  )
  );
  } catch (error) {
    console.log(error);
  }
}; 
