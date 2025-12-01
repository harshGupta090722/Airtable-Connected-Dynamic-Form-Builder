import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function useAuth() {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("token"));

  const login = (jwt) => {
    localStorage.setItem("token", jwt);
    setToken(jwt);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    navigate("/");
  };

  const requireAuth = () => {
    if (!token) navigate("/");
  };

  return { token, login, logout, requireAuth };
}
