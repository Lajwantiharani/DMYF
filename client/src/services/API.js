import axios from "axios";


const API = axios.create({
  baseURL: process.env.REACT_APP_BASEURL,
  withCredentials: true,
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});



export default API;
