import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client";
import { formatApiError } from "../api/formatApiError";

export default function Signup({ mode = "user" }) {
  const isAdmin = mode === "admin";
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAdminAccount, setIsAdminAccount] = useState(isAdmin);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loginPath = isAdmin ? "/admin/login" : "/login";

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.");
      setLoading(false);
      return;
    }

    try {
      const { data } = await client.post("/auth/signup/", {
        username,
        email: email || "",
        password,
        is_admin: isAdmin ? isAdminAccount : false,
      });
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pi Scheduler</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {isAdmin ? "Yönetici hesabı oluştur" : "Hesap oluştur"}
        </p>
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Kullanıcı adı"
              required
              minLength={3}
              autoComplete="username"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta (opsiyonel)"
              autoComplete="email"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Şifreyi tekrar girin"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {isAdmin && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAdminAccount}
                onChange={(e) => setIsAdminAccount(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Django admin / staff yetkisi ver (is_staff)
              </span>
            </label>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium"
          >
            {loading ? "Kayıt yapılıyor..." : "Kayıt ol"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Zaten hesabınız var mı?{" "}
          <Link to={loginPath} className="text-blue-600 hover:underline">
            Giriş yapın
          </Link>
        </p>
        <p className="mt-2 text-center text-sm">
          {isAdmin ? (
            <Link to="/signup" className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
              Kullanıcı kaydı
            </Link>
          ) : (
            <Link to="/admin/signup" className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
              Yönetici kaydı
            </Link>
          )}
        </p>
      </div>
    </div>
  );
}
