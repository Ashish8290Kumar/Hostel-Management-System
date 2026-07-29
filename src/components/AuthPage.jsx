
import React from "react";
import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";


export default function AuthPage({
  mode,
  setMode,
  loginForm,
  setLoginForm,
  registerForm,
  setRegisterForm,
  onLogin,
  onRegister,
  busy,
  toast,
  theme,
  toggleTheme,
}) {
  const isDark = theme === "dark";
  const isDeviceAdminBanned =
    localStorage.getItem("system_hardware_admin_ban") === "LOCKED";
  const [showPassword, setShowPassword] = useState(false);       // login form
  const [showRegPassword, setShowRegPassword] = useState(false); // register form


  return (
    <main
      className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 relative ${isDark ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-900"
        }`}
    >
      {/* Floating Theme Toggle Button */}
      <button
        type="button"
        onClick={toggleTheme}
        className={`absolute top-6 right-6 px-4 py-2 rounded-xl border text-xs font-bold shadow-md transition-all cursor-pointer z-50 ${isDark
          ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800"
          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
      >
        {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
      </button>

      {/* ================= MAIN STRUCTURAL GRID ================= */}
      <div
        className={`grid w-full max-w-6xl min-h-150 lg:grid-cols-2 border rounded-3xl overflow-hidden shadow-2xl transition-colors duration-300 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}
      >
        {/* ================= LEFT SIDE: IMAGE + NAME ================= */}
        <section
          className={`flex flex-col items-center justify-center p-8 transition-colors duration-300 ${isDark
            ? "bg-linear-to-br from-slate-900 via-slate-950 to-slate-900"
            : "bg-linear-to-br from-slate-50 via-slate-100 to-slate-50"
            }`}
        >
          <img
            src="/images/hostel-building.jpg"
            alt="Shanti Hostel Building"
            className="w-full h-80 object-cover rounded-2xl shadow-2xl border border-slate-800 opacity-90 hover:opacity-100 transition-opacity duration-300 mb-6 "
          />

          <div className="flex items-center gap-2">
            <img
              src="/images/peacock-feather.svg"
              alt="Peacock Feather"
              className="w-8 h-8 drop-shadow-md"
            />
            <h1
              className={`text-3xl font-black tracking-wide ${isDark ? "text-emerald-400" : "text-emerald-600"
                }`}
            >
              Shanti Hostel
            </h1>
          </div>



          <p className="text-lg italic text-white-300">
            Alwar, Rajasthan
          </p>
          <p className="text-sm text-amber-200 mt-1">
            Catering to Boys & Girls Accommodation
          </p>
        </section>


        {/* part two */}

        {/* ================= RIGHT SIDE: AUTH FORMS ================= */}
        <section
          className={`flex flex-col justify-center p-8 sm:p-12 z-10 transition-colors duration-300 ${isDark ? "bg-slate-900" : "bg-slate-50"
            }`}
        >
          <div className="w-full max-w-md mx-auto">
            {/* ====== Title & Branding ====== */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2
                  className={`text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"
                    }`}
                >
                  {mode === "login" ? "Sign In" : "Register"}
                </h2>
                <p
                  className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                >
                  Hostel Management ERP Cloud Access
                </p>
              </div>
              <div className="lg:hidden grid h-10 w-10 place-items-center rounded-xl bg-slate-950 font-black text-white">
                HM
              </div>
            </div>

            {/* ====== Mode Switch Buttons ====== */}
            <div
              className={`grid grid-cols-2 rounded-xl p-1 mb-6 border ${isDark
                ? "bg-slate-950 border-slate-800"
                : "bg-slate-200/60 border-slate-300/40"
                }`}
            >
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${mode === "login"
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
                className={`rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${mode === "register"
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

            {/* ====== Toast Notification ====== */}
            {toast && (
              <div
                className={`mb-4 p-3.5 rounded-xl text-xs font-semibold border ${toast.type === "success"
                  ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
                  : "bg-rose-950/40 border-rose-500/30 text-rose-400"
                  }`}
              >
                {toast.text}
              </div>
            )}

            {/* ====== Dynamic Forms (Login/Register) ====== */}
            <div className="w-full">
              {mode === "login" ? (
                <form onSubmit={onLogin} className="space-y-4">
                  <div>
                    <label
                      className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-400" : "text-slate-600"
                        }`}
                    >
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      disabled={busy}
                      placeholder="Enter username"
                      value={loginForm?.username || ""}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, username: e.target.value })
                      }
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition disabled:opacity-50 ${isDark
                        ? "border-slate-800 bg-slate-950 text-white focus:border-emerald-500"
                        : "border-slate-200 bg-white text-slate-900 focus:border-slate-950"
                        }`}
                    />
                  </div>

                  {/* ====== PASSWORDS KA CHUNK CORRECTION ====== */}
                  <div>
                    <label
                      className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-400" : "text-slate-600"
                        }`}
                    >
                      Password
                    </label>

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"} // <-- register hata kar simple showPassword kiya
                        required
                        disabled={busy}
                        placeholder="••••••••"
                        value={loginForm?.password || ""} // <-- registerForm ko badal kar loginForm kiya
                        onChange={(e) =>
                          setLoginForm({ ...loginForm, password: e.target.value }) // <-- setRegisterForm ko setLoginForm kiya
                        }
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition disabled:opacity-50 ${isDark
                          ? "border-slate-800 bg-slate-950 text-white focus:border-emerald-500"
                          : "border-slate-200 bg-white text-slate-900 focus:border-slate-950"
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)} // <-- independent eye toggle handler
                        className="absolute right-3 top-2 text-gray-600"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full mt-2 rounded-xl bg-emerald-400 hover:bg-emerald-500 py-3 text-sm font-bold text-slate-950 transition disabled:opacity-50 cursor-pointer"
                  >
                    {busy ? "Authenticating Data..." : "Secure Login →"}
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={onRegister}
                  className="space-y-3 max-h-95 overflow-y-auto pr-1"
                >


                  {/* part 3 */}
                  {/* Registration form fields continue in Part 3 */}

                  {/* ================= REGISTRATION FORM FIELDS ================= */}
                  <div>
                    <label
                      className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-400" : "text-slate-600"
                        }`}
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      disabled={busy}
                      placeholder="Ashish Kumar"
                      value={registerForm?.fullName || ""}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          fullName: e.target.value,
                        })
                      }
                      className={`w-full rounded-xl border px-4 py-2 text-sm outline-none transition disabled:opacity-50 ${isDark
                        ? "border-slate-800 bg-slate-950 text-white focus:border-emerald-500"
                        : "border-slate-200 bg-white text-slate-900 focus:border-slate-950"
                        }`}
                    />
                  </div>

                  {/* ====== USERNAME FIELD FOR REGISTRATION ====== */}
                  <div>
                    <label
                      className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      disabled={busy}
                      placeholder=" username"
                      value={registerForm?.username || ""}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          username: e.target.value, // <--- Yeh seedhe backend ke username se map hoga
                        })
                      }
                      className={`w-full rounded-xl border px-4 py-2 text-sm outline-none transition disabled:opacity-50 ${isDark
                        ? "border-slate-800 bg-slate-950 text-white focus:border-emerald-500"
                        : "border-slate-200 bg-white text-slate-900 focus:border-slate-950"
                        }`}
                    />
                  </div>


                  <div>
                    <label
                      className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-400" : "text-slate-600"
                        }`}
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      disabled={busy}
                      placeholder="ashish@example.com"
                      value={registerForm?.email || ""}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          email: e.target.value,
                        })
                      }
                      className={`w-full rounded-xl border px-4 py-2 text-sm outline-none transition disabled:opacity-50 ${isDark
                        ? "border-slate-800 bg-slate-950 text-white focus:border-emerald-500"
                        : "border-slate-200 bg-white text-slate-900 focus:border-slate-950"
                        }`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-400" : "text-slate-600"
                        }`}
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? "text" : "password"}
                        required
                        disabled={busy}
                        placeholder="••••••••"
                        value={registerForm?.password || ""}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, password: e.target.value })
                        }
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition disabled:opacity-50 ${isDark
                          ? "border-slate-800 bg-slate-950 text-white focus:border-emerald-500"
                          : "border-slate-200 bg-white text-slate-900 focus:border-slate-950"
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-2 text-gray-600"
                      >
                        {showRegPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                  </div>

                  {/* ====== PHONE NUMBER FIELD ====== */}
                  <div>
                    <label
                      className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-400" : "text-slate-600"
                        }`}
                    >
                      Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      disabled={busy}
                      placeholder="9876543210"
                      value={registerForm?.phone || ""}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          phone: e.target.value,
                        })
                      }
                      className={`w-full rounded-xl border px-4 py-2 text-sm outline-none transition disabled:opacity-50 ${isDark
                        ? "border-slate-800 bg-slate-950 text-white focus:border-emerald-500"
                        : "border-slate-200 bg-white text-slate-900 focus:border-slate-950"
                        }`}
                    />
                  </div>

                  {/* ================= ROLE SELECTION FIELD ================= */}
                  <div>
                    <label
                      className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Register As
                    </label>
                    <select
                      required
                      disabled={busy}
                      value={registerForm?.role || "STUDENT"}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          role: e.target.value,
                        })
                      }
                      className={`w-full rounded-xl border px-4 py-2 text-sm outline-none transition disabled:opacity-50 ${isDark
                        ? "border-slate-800 bg-slate-950 text-white focus:border-emerald-500"
                        : "border-slate-200 bg-white text-slate-900 focus:border-slate-950"
                        }`}
                    >
                      <option value="STUDENT">Student</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  {/* ================= STUDENT ROLL NUMBER (ONLY FOR STUDENT) ================= */}
                  {registerForm.role === "STUDENT" && (
                    <div>
                      <label
                        className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-400" : "text-slate-600"
                          }`}
                      >
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
                            role: "STUDENT" // 🚀 role stays Student when roll number is entered
                          })
                        }
                        className={`w-full rounded-xl border px-4 py-2 text-sm outline-none transition disabled:opacity-50 ${isDark
                            ? "border-slate-800 bg-slate-950 text-white focus:border-emerald-500"
                            : "border-slate-200 bg-white text-slate-900 focus:border-slate-950"
                          }`}
                      />
                    </div>
                  )}


                  {/* ================= SUBMIT BUTTON ================= */}
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
