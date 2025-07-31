const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5232/api';

export const login = async ({ email, password }: { email: string; password: string }) => {
  console.log("Body enviado:", JSON.stringify({ Email: email, Password: password }));
  const response = await fetch(`${API_URL}/Usuarios/login`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      Email: email,
      Password: password
    })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Credenciales inválidas");
  }
  return response.json();
};

export async function register(data: {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  moneda: string;
  zonaHoraria: string;
}) {
  const response = await fetch(`${API_URL}/api/usuarios/registrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error("Error al registrar usuario");
  return response.json();
}

export function saveToken(token: string) {
  localStorage.setItem("nexus_token", token);
}

export function getToken() {
  return localStorage.getItem("nexus_token");
}

export function logout() {
  localStorage.removeItem("nexus_token");
  localStorage.removeItem("nexus_user");
  // Redirigir al login
  window.location.href = '/login';
}

export function handleUnauthorized() {
  console.log('Token expirado o inválido. Redirigiendo al login...');
  logout();
}

export type User = {
  usuarioId: string;
  nombre: string;
  apellido: string;
  email: string;
  moneda: string;
  zonaHoraria: string;
};

export function saveUser(user: User) {
  localStorage.setItem("nexus_user", JSON.stringify(user));
}

export function getUser(): User | null {
  const user = localStorage.getItem("nexus_user");
  return user ? JSON.parse(user) : null;
}

export function removeUser() {
  localStorage.removeItem("nexus_user");
}

export function getUserId(): string | null {
  const user = getUser();
  return user ? user.usuarioId : null;
}

// Objeto authService para mantener consistencia con otros servicios
export const authService = {
  login,
  register,
  saveToken,
  getToken,
  logout,
  saveUser,
  getUser,
  removeUser,
  getUserId,
  handleUnauthorized
}; 