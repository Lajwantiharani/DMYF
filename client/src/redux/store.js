import { configureStore } from "@reduxjs/toolkit";

import authSlice from "./features/auth/authSlice";
const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
  },
});

export default store;
// const store = configureStore({
//   reducer: {
//     auth: authSlice.reducer, // Use authReducer, as only the reducer is exported
//   },
// });

// export default store;
