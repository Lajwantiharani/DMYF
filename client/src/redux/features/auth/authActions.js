import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../../services/API";
import { toast } from "react-toastify";
import {
  isProfileComplete,
  isProfileVerificationApproved,
} from "../../../utils/profileCompletion";

// User Login
export const userLogin = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await API.post("/auth/login", { email, password });
      if (data.success) {
        toast.success(data.message || "Login successful");
        localStorage.setItem("token", data.token);

        const userRole = data?.user?.role;
        const redirectByRole = {
          admin: "/analytics",
          organization: "/inventory",
          donor: "/inventory",
          hospital: "/organization",
          receiver: "/donor-list",
        };
        const profileComplete = isProfileComplete(data?.user);
        const profileVerified = isProfileVerificationApproved(data?.user);
        const nextPath =
          profileComplete && profileVerified
            ? redirectByRole[userRole] || "/inventory"
            : "/profile";

        window.location.replace(nextPath);
      }
      return data;
    } catch (error) {
      if (error.response && error.response.data.message) {
        return rejectWithValue(error.response.data.message);
      } else {
        return rejectWithValue(error.message);
      }
    }
  },
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
      address,
      phone,
    },
    { rejectWithValue },
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
        address,
        phone,
      });
      if (data?.success) {
        toast.success("User registered successfully! Please verify your email.");
        // Redirect to verify OTP page with email
        setTimeout(() => {
          window.location.href = `/verify-otp?email=${encodeURIComponent(email)}`;
        }, 500);
        return data;
      } else {
        return rejectWithValue(data.message || "Registration failed");
      }
    } catch (error) {
      console.log(error);
      if (error.response && error.response.data.message) {
        return rejectWithValue(error.response.data.message);
      } else {
        return rejectWithValue(error.message);
      }
    }
  },
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
  },
);
