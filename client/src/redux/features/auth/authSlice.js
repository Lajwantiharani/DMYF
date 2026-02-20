import { createSlice } from "@reduxjs/toolkit";
import {
  getCurrentUser,
  userLogin,
  userRegister,
  verifyOTP,
} from "./authActions";

const token = localStorage.getItem("token")
  ? localStorage.getItem("token")
  : null;

const initialState = {
  loading: false,
  user: null,
  token,
  error: null,
  tempUserId: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {},
  extraReducers: (builder) => {
    // login user
    builder.addCase(userLogin.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(userLogin.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.user = payload.user;
      state.token = payload.token;
    });
    builder.addCase(userLogin.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    });
    // REGISTER user
    builder.addCase(userRegister.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(userRegister.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.tempUserId = payload.tempUserId;
    });
    builder.addCase(userRegister.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    });
    // OTP verification
    builder.addCase(verifyOTP.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(verifyOTP.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.user = payload.user;
      state.tempUserId = null;
    });
    builder.addCase(verifyOTP.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    });
    // CURRENT user
    builder.addCase(getCurrentUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getCurrentUser.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.user = payload.user;
    });
    builder.addCase(getCurrentUser.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    });
  },
});

export default authSlice;
