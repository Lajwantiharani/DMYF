import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  loading: false,
  user: null,
  token: null,
  error: null // Fixed typo from "erro" to "error"
}

const authSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {},
  extraReducers: {},
});

export default authSlice;// Export only the reducer
