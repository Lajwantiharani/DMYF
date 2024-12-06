// import { createSlice } from "@reduxjs/toolkit";

// const initialState = {
//   loading: false,
//   user: null,
//   token: null,
//   error: null // Fixed typo from "erro" to "error"
// }

// const authSlice = createSlice({
//   name: "auth",
//   initialState: initialState,
//   reducers: {},
//   extraReducers: {},
// });

// export default authSlice;// Export only the reducer


import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  loading: false,
  user: null,
  token: null,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout } =
  authSlice.actions;

export default authSlice.reducer;

