import { userRegister } from "../../redux/features/auth/authActions";
import store from "../../redux/store";
import { toast } from "react-toastify";

export const handleRegister = (
  e,
  name,
  role,
  email,
  password,
  organizationName = "",
  hospitalName = "",
  website = "",
  address = "",
  phone = ""
) => {
  e.preventDefault();
  try {
    if (!name || !role || !email || !password) {
      return toast.error(
        "Please Provide Required Fields (Name, Role, Email, Password)"
      );
    }
    store.dispatch(
      userRegister({
        name,
        role,
        email,
        password,
        organizationName,
        hospitalName,
        website,
        address,
        phone,
      })
    );
  } catch (error) {
    console.log(error);
    toast.error("Something went wrong during registration");
  }
};
