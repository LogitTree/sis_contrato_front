export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.href = "/login";
}

export function getToken() {
  return localStorage.getItem("token");
}