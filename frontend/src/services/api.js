import axios from "axios";

const API = axios.create({
  baseURL:"https://task-allotment-webapp.onrender.com",
});

export default API;