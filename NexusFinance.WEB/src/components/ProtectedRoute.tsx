import { Navigate } from "react-router-dom";
import { authService } from "../services/authService";
import type { JSX } from "react";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = authService.getToken();
  if (!token) return <Navigate to="/" replace />;
  return children;
} 