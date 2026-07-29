import React, { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function AuthPage({
  mode,
  setMode,
  loginForm,
  setLoginForm,
  registerForm,
  setRegisterForm,
  onLogin,
  busy,
  toast,
  theme,
  toggleTheme,
}) {
  const isDark = theme === "dark";
  const [showPassword, setShowPassword] = useState(false);       // login form
  const [showRegPassword, setShowRegPassword] = useState(false); // register form

  // ✅ onRegister function
  async function onRegister(e) {
    e.preventDefault();
    setBusy(true);

    try {
      const body = {
        fullName: registerForm.fullName,
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        phoneNumber: registerForm.phoneNumber, // corrected key
        role: registerForm.role,
        rollNumber: registerForm.role === "STUDENT" ? registerForm.rollNumber : null,
      };

      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      });

      setToast({ type: "success", text: "Registration successful!" });
    } catch (err) {
      setToast({ type: "error", text: "Registration failed: " + err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 relative ${
        isDark ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-900"
      }`}
    >


      {/* Theme Toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        className={`absolute top-6 right-6 px-4 py-2 rounded-xl border text-xs font-bold shadow-md transition-all cursor-pointer z-50 ${
          isDark
            ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800"
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
        }`}
      >
        {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
      </button>

      {/* Main Grid */}
      <div
        className={`grid w-full max-w-6xl min-h-150 lg:grid-cols-2 border rounded-3xl overflow-hidden shadow-2xl transition-colors duration-300 ${
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        {/* Left Side */}
        <section
          className={`flex flex-col items-center justify-center p-8 transition-colors duration-300 ${
            isDark
              ? "bg-linear-to-br from-slate-900 via-slate-950 to-slate-900"
              : "bg-linear-to-br from-slate-50 via-slate-100 to-slate-50"
          }`}
        >
          <img
            src="/images/hostel-building.jpg"
            alt="Shanti Hostel Building"
            className="w-full h-80 object-cover rounded-2xl shadow-2xl border border-slate-800 opacity-90 hover:opacity-100 transition-opacity duration-300 mb-6"
          />
          <h1
            className={`text-3xl font-black tracking-wide ${
              isDark ? "text-emerald-400" : "text-emerald-600"
            }`}
          >
            Shanti Hostel
          </h1>
          <p className="text-lg italic text-white-300">Alwar, Rajasthan</p>
          <p className="text-sm text-amber-200 mt-1">
            Catering to Boys & Girls Accommodation
          </p>
        </section>

        {/* Right Side: Auth Forms */}
        <section
          className={`flex flex-col justify-center p-8 sm:p-12 z-10 transition-colors duration-300 ${
            isDark ? "bg-slate-900" : "bg-slate-50"
          }`}
        >
          <div className="w-full max-w-md mx-auto">
            {/* Title */}
            <h2
              className={`text-3xl font-black tracking-tight ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {mode === "login" ? "Sign In" : "Register"}
            </h2>

            {/* Mode Switch */}
            <div
              className={`grid grid-cols-2 rounded-xl p-1 mb-6 border ${
                isDark
                  ? "bg-slate-950 border-slate-800"
                  : "bg-slate-200/60 border-slate-300/40"
              }`}
            >
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
                  mode === "login"
                    ? isDark
                      ? "bg-slate-800 text-emerald-400 shadow-sm"
                      : "bg-white text-slate-950 shadow-sm"
                    : isDark
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Account Login
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
                  mode === "register"
                    ? isDark
                      ? "bg-slate-800 text-emerald-400 shadow-sm"
                      : "bg-white text-slate-950 shadow-sm"
                    : isDark
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                New Registration
              </button>
            </div>

            {/* Toast */}
            {toast && (
              <div
                className={`mb-4 p-3.5 rounded-xl text-xs font-semibold border ${
                  toast.type === "success"
                    ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
                    : "bg-rose-950/40 border-rose-500/30 text-rose-400"
                }`}
              >
                {toast.text}
              </div>
            )}

            {/* Forms */}
            <div className="w-full">
              {mode === "login" ? (
                <form onSubmit={onLogin} className="space-y-4">
                  {/* Login fields here */}
                </form>
              ) : (
                <form
                  onSubmit={onRegister}
                  className="space-y-3 max-h-95 overflow-y-auto pr-1"
                >


                  {/* Registration fields */}
                  {/* Full Name */}
                  {/* Username */}
                  {/* Email */}
                  {/* Password */}
                  {/* Phone Number */}
                  {/* Role Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1">
                      Register As
                    </label>
                    <select
                      required
                      disabled={busy}
                      value={registerForm?.role || "STUDENT"}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, role: e.target.value })
                      }
                      className="w-full rounded-xl border px-4 py-2 text-sm outline-none transition disabled:opacity-50"
                    >
                      <option value="STUDENT">Student</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  {/* Roll Number only for Student */}
                  {registerForm.role === "STUDENT" && (
                    <div>
                      <label className="block text-xs font-bold uppercase mb-1">
                        Roll Number
                      </label>
                      <input
                        type="text"
                        required
                        disabled={busy}
                        placeholder="2026CS101"
                        value={registerForm?.rollNumber || ""}
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            rollNumber: e.target.value,
                            role: "STUDENT",
                          })
                        }
                        className="w-full rounded-xl border px-4 py-2 text-sm outline-none transition disabled:opacity-50"
                      />
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full mt-2 rounded-xl bg-emerald-400 hover:bg-emerald-500 py-3 text-sm font-bold text-slate-950 transition disabled:opacity-50 cursor-pointer"
                  >
                    {busy ? "Registering Data..." : "Create Account →"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
