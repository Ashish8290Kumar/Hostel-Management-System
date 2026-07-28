import React from "react";

export default function Layout({ children, session, role, onLogout, toast }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      {/* Side Navigation Panel */}
      <aside className="w-full lg:w-64 bg-slate-950 text-white flex flex-row lg:flex-col justify-between p-4 lg:p-6 border-b lg:border-b-0 lg:border-r border-slate-800 shrink-0">
        <div className="flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:gap-8 w-full justify-between lg:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-emerald-400 text-slate-950 flex items-center justify-center font-black text-sm">
              HM
            </div>
            <span className="font-extrabold tracking-tight text-sm hidden sm:inline lg:inline">Hostel Cloud</span>
          </div>

          {/* Connected Identity status card */}
          <div className="hidden lg:block bg-slate-900 border border-slate-800 p-4 rounded-xl w-full">
            <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Current Session</p>
            <p className="text-sm font-bold text-slate-200 mt-0.5 truncate">{session?.username}</p>
            <span className="inline-block text-[10px] font-extrabold tracking-wide mt-2 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {role} PANEL
              </span>
          </div>
        </div>

        <div className="flex items-center lg:w-full mt-0 lg:mt-6">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-800 hover:border-rose-900/50 transition w-full justify-center"
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Workspace viewport */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        {toast && (
          <div className="bg-slate-950 text-white px-6 py-2 flex items-center justify-center transition border-b border-slate-800 animate-slide-down">
            <p className="text-xs font-bold tracking-wide">{toast.type === "success" ? "💡 SYSTEM UPDATE: " : "⚠️ OPERATION ALERT: "}
              <span className="text-slate-300 font-medium">{toast.text}</span>
            </p>
          </div>
        )}
        <main className="p-4 sm:p-8 max-w-7xl w-full mx-auto flex-1">
          {children}
        </main>
      </div>
    </div>
  )}