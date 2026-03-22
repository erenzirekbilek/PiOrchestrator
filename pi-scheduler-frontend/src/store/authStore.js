export default function authStore() {
  return {
    token: localStorage.getItem("token"),
    isAuthenticated: !!localStorage.getItem("token"),
    setToken: (token) => {
      localStorage.setItem("token", token);
    },
    clearToken: () => {
      localStorage.removeItem("token");
    },
  };
}
