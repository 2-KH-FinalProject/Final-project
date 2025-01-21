// axiosAPI.js

import axios from "axios";

export const axiosApi = axios.create({
  baseURL: "http://192.168.50.236:8081",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  withCredentials: true, // 쿠키 포함 설정
  // 서버에서도 credential 허용 설정 필요함
});
