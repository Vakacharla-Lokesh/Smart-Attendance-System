"use client";

export function logout() {
  // Remove token and user data from localStorage
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  // Redirect to login page
  window.location.href = "/login";
}
