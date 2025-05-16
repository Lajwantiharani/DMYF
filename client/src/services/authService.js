import { userLogin, userRegister } from '../redux/features/auth/authActions';
import store from '../redux/store';

export const handleLogin = (e, email, password, role) => {
  e.preventDefault();
  try {
    if (!role || !email || !password) {
      return alert("Please Privde All Feilds");
    }
    store.dispatch(userLogin({ email, password, role }));
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
  current_address,
  phone,
  native_town,
  nukh,
  bloodGroup,
  secretkey,
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
  current_address,
  phone,
  secretkey,
  bloodGroup,
  nukh,
  native_town,
 }
  )
  );
  } catch (error) {
    console.log(error);
  }
}; 