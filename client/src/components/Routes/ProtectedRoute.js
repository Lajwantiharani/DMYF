import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getCurrentUser } from "../../redux/features/auth/authActions";
import API from "../../services/API";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();

  //get user current
  const getUser = async () => {
    try {
      const { data } = await API.get("/auth/current-user");
      if (data?.success) {
        dispatch(getCurrentUser(data));
      }
    } catch (error) {
      localStorage.clear();
      console.log(error);
    }
  };

  useEffect(() => {
    getUser();
  });

  if (localStorage.getItem("token")) {
    return children;
  } else {
    return <Navigate to="/login" />;
  }
};

export default ProtectedRoute;



// // added admin role based access control

// import React, { useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { getCurrentUser } from "../../redux/features/auth/authActions";
// import API from "../../services/API";
// import { Navigate, useLocation } from "react-router-dom";

// const ProtectedRoute = ({ children }) => {
//   const dispatch = useDispatch();
//   const { user } = useSelector((state) => state.auth);
//   const location = useLocation();

//   // Get current user
//   const getUser = async () => {
//     try {
//       const { data } = await API.get("/auth/current-user");
//       if (data?.success) {
//         dispatch(getCurrentUser(data));
//       }
//     } catch (error) {
//       localStorage.clear();
//       console.log(error);
//     }
//   };

//   useEffect(() => {
//     getUser();
//   });

//   // Check if the user is logged in
//   if (!localStorage.getItem("token")) {
//     return <Navigate to="/login" />;
//   }

//   // Role-based access control for /admin route
//   if (location.pathname === "/admin" && user?.role !== "admin") {
//     return <Navigate to="/landingpage" />;
//   }

//   return children;
// };

// export default ProtectedRoute;