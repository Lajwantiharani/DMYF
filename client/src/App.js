import "./App.css";
import { Routes, Route } from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyOTP from "./pages/auth/VerifyOTP";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProtectedRoute from "./components/Routes/ProtectedRoute";
import Donor from "./pages/Dashboard/Donor";
import Hospital from "./pages/Dashboard/Hospital";
import OrganizationPage from "./pages/Dashboard/OrganizationPage";
import Consumer from "./pages/Dashboard/Consumer";
import Donation from "./pages/Dashboard/Donation";
import Analytics from "./pages/Dashboard/Analytics";
import Profile from "./pages/Dashboard/Profile";
import Settings from "./pages/Dashboard/Settings";
import DonorList from "./pages/Admin/DonorList";
import HospitalList from "./pages/Admin/HospitalList";
import OrgList from "./pages/Admin/OrgList";
import AdminHome from "./pages/Admin/AdminHome";
import ReceiverList from "./pages/Admin/ReceiverLIst";
import VerificationRequests from "./pages/Admin/VerificationRequests";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import ReceiverDashboard from "./pages/Dashboard/Receiver";
import BloodRequests from "./pages/Dashboard/BloodRequests";

function App() {
  return (
    <div className="App">
      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        className="app-toast-container"
        toastClassName="app-toast"
        bodyClassName="app-toast-body"
      />
      <Routes>
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/receiver-list"
          element={
            <ProtectedRoute>
              <ReceiverList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/verification-requests"
          element={
            <ProtectedRoute>
              <VerificationRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/receiver"
          element={
            <ProtectedRoute>
              <ReceiverDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donor-list"
          element={
            <ProtectedRoute>
              <DonorList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospital-list"
          element={
            <ProtectedRoute>
              <HospitalList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/org-list"
          element={
            <ProtectedRoute>
              <OrgList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/consumer"
          element={
            <ProtectedRoute>
              <Consumer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donation"
          element={
            <ProtectedRoute>
              <Donation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization"
          element={
            <ProtectedRoute>
              <OrganizationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospital"
          element={
            <ProtectedRoute>
              <Hospital />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donor"
          element={
            <ProtectedRoute>
              <Donor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/blood-requests"
          element={
            <ProtectedRoute>
              <BloodRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </div>
  );
}

export default App;
