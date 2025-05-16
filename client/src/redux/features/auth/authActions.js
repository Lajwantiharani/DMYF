// import { createAsyncThunk } from "@reduxjs/toolkit";
// import API from "../../../services/API";
// //import { toast } from "react-toastify";

// // User Login
// export const userLogin = createAsyncThunk(
//   "auth/login",
//   async ({ role, email, password }, { rejectWithValue }) => {
//     try {
//       const { data } = await API.post("/auth/login", { role, email, password });
//       if (data.success) {
//       alert(data.message);
//         localStorage.setItem("token", data.token);
//         window.location.replace("/"); // Or use navigate from react-router-dom
//       }
//       return data;
//     } catch (error) {
//       if (error.response && error.response.data.message) {
//         return rejectWithValue(error.response.data.message);
//       } else {
//         return rejectWithValue(error.message);
//       }
//     }
//   }
// );

// // User Registration
// export const userRegister = createAsyncThunk(
//   "auth/register",
//   async (
//     {
//       name,
//       role,
//       email,
//       password,
//       organizationName,
//       hospitalName,
//       website,
//       current_address,
//       phone,
//       secretkey
//     },
//     { rejectWithValue }
//   ) => {
//     try {
//       const { data } = await API.post("/auth/register", {
//         name,
//         role,
//         email,
//         password,
//         organizationName,
//         hospitalName,
//         website,
//         current_address,
//         phone,
//         secretkey
//       });
//       if (data?.success) {
//         alert("User Registerd Successfully");
//         window.location.replace("/login");
//        // toast.success("User Registerd Successfully");
//       }
//     } catch (error) {
//       console.log(error);
//       if (error.response && error.response.data.message) {
//         return rejectWithValue(error.response.data.message);
//       } else {
//         return rejectWithValue(error.message);
//       }
//     }
//   }
// );

// // Get Current User
// export const getCurrentUser = createAsyncThunk(
//   "auth/getCurrentUser",
//   async ({ rejectWithValue }) => {
//     try {
//       const res = await API.get("/auth/current-user");
//       return res?.data;
//     } catch (error) {
//       console.log(error);
//       if (error.response && error.response.data.message) {
//         return rejectWithValue(error.response.data.message);
//       } else {
//         return rejectWithValue(error.message);
//       }
//     }
//   }
// );

import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../../services/API";

export const userLogin = createAsyncThunk(
  "auth/login",
  async ({ role, email, password }, { rejectWithValue }) => {
    try {
      const { data } = await API.post("/auth/login", { role, email, password });
      if (data.success) {
        alert(data.message);
        localStorage.setItem("token", data.token);

        // Role-based redirection
        if (role === "admin") {
          window.location.replace("/admin");
        } else if (role === "donor") {
          window.location.replace("/donor");
        } else if (role === "receiver") {
          window.location.replace("/consumer");
        } else if (role === "hospital") {
          window.location.replace("/hospital");
        } else if (role === "organization") {
          window.location.replace("/organization");
        } else {
          window.location.replace("/"); // Fallback for unknown roles
        }
      }
      return data;
    } catch (error) {
      if (error.response && error.response.data.message) {
        return rejectWithValue(error.response.data.message);
      } else {
        return rejectWithValue(error.message);
      }
    }
  }
);

// User Registration
export const userRegister = createAsyncThunk(
  "auth/register",
  async (
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
      native_town,
      nukh,
      bloodGroup,
      secretkey,
    },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await API.post("/auth/register", {
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
        nukh,
        bloodGroup,
        native_town,
      });
      if (data?.success) {
        alert("User Registered Successfully");
        window.location.replace("/login");
      }
    } catch (error) {
      console.log(error);
      if (error.response && error.response.data.message) {
        return rejectWithValue(error.response.data.message);
      } else {
        return rejectWithValue(error.message);
      }
    }
  }
);

// Get Current User
export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async ({ rejectWithValue }) => {
    try {
      const res = await API.get("/auth/current-user");
      return res?.data;
    } catch (error) {
      console.log(error);
      if (error.response && error.response.data.message) {
        return rejectWithValue(error.response.data.message);
      } else {
        return rejectWithValue(error.message);
      }
    }
  }
);