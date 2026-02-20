import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../../services/API"; // Correct path

// Login user
export const userLogin = createAsyncThunk(
  "auth/login",
  async (formInputs, { rejectWithValue }) => {
    try {
      const { data } = await API.post("/auth/login", formInputs);
      if (data.success) {
        localStorage.setItem("token", data.token);
        return data;
      }
      return rejectWithValue(data.message);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

// Register user
export const userRegister = createAsyncThunk(
  "auth/register",
  async (formInputs, { rejectWithValue }) => {
    try {
      const { data } = await API.post("/auth/register", formInputs);
      if (data.success) {
        return { tempUserId: data.user?.id, token: data.token };
      }
      return rejectWithValue(data.message);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Registration failed"
      );
    }
  }
);

// Verify OTP
export const verifyOTP = createAsyncThunk(
  "auth/verifyOTP",
  async ({ token, otp }, { rejectWithValue }) => {
    try {
      const { data } = await API.post(`/auth/verify-otp/${token}`, { otp });
      if (data.success) {
        return { user: data.user };
      }
      return rejectWithValue(data.message);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "OTP verification failed"
      );
    }
  }
);

// Get current user
export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get("/auth/current-user");
      if (data.success) {
        return { user: data.user };
      }
      return rejectWithValue(data.message);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch user"
      );
    }
  }
);
