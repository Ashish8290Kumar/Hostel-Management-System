import React, { useState, useEffect } from "react";
import { formatMoney, formatDate, loadRazorpay } from "../App";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

// Master Student Dashboard Controller Component
export default function StudentDashboard({ api, session, setToast }) {
  const [profile, setProfile] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("profile");

  const [complaintForm, setComplaintForm] = useState({ title: "", description: "", status: "OPEN" });

  useEffect(() => {
    fetchStudentData();
  }, [activeView]);

  async function fetchStudentData() {
    setLoading(true);
    try {
      // 🚀 FIXED: Yahan ab sahi backticks (``) hain taaki session.username successfully read ho sake
      const profileData = await api(`/api/student/profile/${session.username}`);
      setProfile(profileData);

      if (activeView === "rooms") {
        const roomsData = await api("/api/student/rooms/available");
        setAvailableRooms(roomsData || []);
      } else if (activeView === "complaints") {
        // 🚀 FIXED: Yahan bhi backticks (``) lagaye hain complaints fetch karne ke liye
        const complaintsData = await api(`/api/student/complaints/${session.username}`);
        setComplaints(complaintsData || []);
      }
    } catch (error) {
      setToast("error", "Data synchronization failed: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileComplaint(e) {
    e.preventDefault();
    try {
      // 🚀 FIXED: New complaint register karne ke liye URL ko backticks me convert kiya hai
      await api(`/api/student/complaints/${session.username}`, {
        method: "POST",
        body: JSON.stringify(complaintForm),
      });
      setToast("success", "Grievance ticket created and assigned into work-pool queue.");
      setComplaintForm({ title: "", description: "", status: "OPEN" });
      setActiveView("complaints");
    } catch (error) {
      setToast("error", error.message);
    }
  }



  // 🚀 FIXED: Now accepts the specific installment slot parameter
  async function handleFeePayment(installment = null) {
    let targetAmount = profile?.room?.pricePerMonth || profile?.pricePerMonth || 0;
    const currentRoomType = (profile?.room?.roomType || profile?.roomType || "").toLowerCase();

    if (currentRoomType === "double" || profile?.room?.capacity === 2 || profile?.capacity === 2) {
      targetAmount = targetAmount / 2;
    }

    // 🚀 SWITCH VALUE: Use the exact installment slice price if selected
    if (installment && installment.amount) {
      targetAmount = installment.amount;
    }

    try {
      const razorpayLoaded = await loadRazorpay();
      if (!razorpayLoaded) throw new Error("Razorpay checkout SDK network load timed out.");

      const orderRequest = { 
        amount: Number(targetAmount), 
        studentId: profile?.id || 1,
        username: session.username 
      };
      
      const orderResponse = await api("/api/payments/create-order", { 
        method: "POST", 
        body: JSON.stringify(orderRequest) 
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_92Bsa6uS6B6B5t",
        amount: orderResponse.amount,
        currency: orderResponse.currency || "INR",
        name: "Hostel Management System",
        description: installment ? `Installment Slot #${installment.installmentNumber}` : "Hostel Fee Unit Settlement",
        order_id: orderResponse.id,
        handler: async function (response) {
          try {
            const verificationRequest = {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              username: session?.username,
              // 🚀 CRITICAL LINK: Connects the installment row ID back to your PaymentController verification logic
              installmentId: installment ? installment.id : null 
            };

            const verificationResponse = await api("/api/payments/verify", {
              method: "POST",
              body: JSON.stringify(verificationRequest)
            });

            if (verificationResponse.status === "SUCCESS" || verificationResponse.success || verificationResponse.message?.includes("verified")) {
              setToast("success", "Payment verified. Accounts balance database updated.");
              fetchStudentData(); 
            } else {
              setToast("error", "Payment confirmation signature tracking rejected.");
            }
          } catch (err) {
            setToast("error", "Verification process broke down: " + err.message);
          }
        },
        prefill: { name: session.username || "Kunal", email: "student@example.com", contact: "9876543210" },
        theme: { color: "#10b981" }
      };
      const rzpWindow = new window.Razorpay(options);
      rzpWindow.open();
    } catch (error) {
      setToast("error", "Payment orchestration terminal dropped: " + error.message);
    }
  }



  return (
    <div className="space-y-6 text-slate-900 w-full">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900">Welcome, {session.username || "Vanshika"}</h1>
          {/* 🚀 LIVE LOGIC CHECK: Agar student backend se blocked hai toh UI me status update dikhega */}
          <p className="text-xs text-slate-500 mt-0.5">
            Role Authorization Status:{" "}
            <span className={`font-mono font-bold ${profile?.feeStatus === "BLOCKED" ? "text-rose-600" : "text-slate-700"}`}>
              {profile?.feeStatus === "BLOCKED" ? "STUDENT BLOCKED" : "STUDENT ACTIVE"}
            </span>
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          {[{ id: "profile", label: "My Hub" }, { id: "rooms", label: "Vacant Units" }, { id: "complaints", label: "My Tickets" }].map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`px-4 py-1.5 text-xs font-black rounded-lg tracking-wide uppercase transition-all w-full md:w-auto cursor-pointer ${
                activeView === view.id ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>
      </header>

      {loading && <div className="text-center py-12 text-xs text-slate-400 font-medium animate-pulse">Syncing core student datastore framework...</div>}

      {/* 🚀 LIVE LOGIC CHECK: Agar backend ne student ko block kiya hai, toh use ek warning message milega */}
      {!loading && profile?.feeStatus === "BLOCKED" ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center space-y-2 max-w-xl mx-auto shadow-xs">
          <p className="text-2xl">⚠️</p>
          <h3 className="text-sm font-black uppercase text-rose-800 tracking-wider">Access Restricted</h3>
          <p className="text-xs text-rose-600 leading-relaxed font-medium">Your hostel account access has been blocked by the Administrator. Your room assignment has been cancelled. Please contact the main management desk to resolve this restriction status.</p>
        </div>
      ) : (
        // Baki normal layout tab open hoga jab user blocked nahi hai
        <>
          {!loading && activeView === "profile" && (
            <StudentProfileHub profile={profile} onPayFee={handleFeePayment} session={session} />
          )}
          {!loading && activeView === "rooms" && (
            <LiveVacancyMap availableRooms={availableRooms} />
          )}
          {!loading && activeView === "complaints" && (
            <StudentComplaintsDesk 
              complaintForm={complaintForm} 
              setComplaintForm={(updatedForm) => {
                setComplaintForm(prev => typeof updatedForm === 'function' ? updatedForm(prev) : { ...prev, ...updatedForm });
              }} 
              complaints={complaints} 
              onSubmit={handleFileComplaint} 
            />
          )}
        </>
      )}
    </div>
  );
}




// Component to render the 3 main dashboard cards (Room Info, Fee Payments, and Account Meta)
// Component to render the main dashboard cards and installments grid matrix
function StudentProfileHub({ profile, onPayFee, session }) {
  const isBlocked = profile?.feeStatus === "BLOCKED";
  const roomLabel = isBlocked ? "UNASSIGNED" : (profile?.roomNumber || profile?.room?.roomNumber || "Allocated (Active)");
  
  let calculatedRate = profile?.room?.pricePerMonth || profile?.pricePerMonth || 0;
  const currentRoomType = (profile?.room?.roomType || profile?.roomType || "").toLowerCase();

  if (currentRoomType === "double" || profile?.room?.capacity === 2 || profile?.capacity === 2) {
    calculatedRate = calculatedRate / 2;
  }

  const roomRate = calculatedRate;
  const currentFeeStatus = profile?.feeStatus || "PENDING";

  return (
    <div className="space-y-6 w-full">
      <div className="grid md:grid-cols-3 gap-6 w-full">
        {/* Card 1: Allotted Location Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Allotted Location</p>
            <h2 className={`text-4xl font-black mt-2 ${isBlocked ? "text-rose-600" : "text-slate-900"}`}>{roomLabel}</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {isBlocked ? "No room allotted currently." : "Room structure initialized and active."}
            </p>
          </div>
          <div className="border-t border-slate-100 pt-4 mt-6 flex justify-between text-xs text-slate-500">
            <span>Beds Layout Capacity</span>
            <span className={`font-bold ${isBlocked ? "text-rose-500" : "text-slate-900"}`}>
              {isBlocked ? "Suspended ⚠️" : "Verified Allotment ✓"}
            </span>
          </div>
        </div>

        {/* Card 2: Financial Accounts Clearance Grid */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Statement Balance</p>
            <h2 className="text-4xl font-black text-slate-900 mt-2">{formatMoney(roomRate)}</h2>
            <div className="mt-2" />
            <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black tracking-wide uppercase border ${
              currentFeeStatus === "PAID" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : 
              currentFeeStatus === "PARTIALLY_PAID" ? "bg-amber-50 text-amber-700 border-amber-200/60" :
              currentFeeStatus === "BLOCKED" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
            }`}>{currentFeeStatus}</span>
          </div>
          <div className="mt-6">
            {isBlocked ? (
              <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100 font-bold text-center">
                Transactions Disabled for Blocked Accounts.
              </div>
            ) : currentFeeStatus === "PAID" ? (
              <div className="text-xs text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 font-bold text-center">
                ✓ Accounts settled. Zero dues outstanding.
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center italic bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-medium">
                Please settle payments using the active installment list schedule cards below.
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Account Security Profile Check */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
          <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Profile Records Information</p>
          <div className="text-xs space-y-2 pt-1">
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-400">Account Identity</span>
              <span className="font-semibold text-slate-900 truncate max-w-40">{session.username}</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-400">Registered Portal</span>
              <span className="font-semibold text-slate-900">Hostel Portal</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ERP Access Engine</span>
              <span className={`font-extrabold ${isBlocked ? "text-rose-600" : "text-emerald-600"}`}>
                {isBlocked ? "ACCESS BLOCKED" : "STUDENT ACTIVE"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC INSTALLMENTS GRID GRID WITH EMBEDDED BUTTON WRAPPERS */}
      {!isBlocked && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm w-full">
          <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Your Configured Installments Schedule</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Pay each specific segment allocation independently using the checkout button wrappers.</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wider font-mono">
              Live DB Synced
            </span>
          </div>

          {!profile?.installments || profile.installments.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 italic font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No installment matrix plan deployed for your profile yet. Standard full terminal settlement applies.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
              {profile.installments.map((inst, index) => {
                const isPaid = inst.status === "PAID";
                return (
                  <div key={index} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 font-mono">Slot #{inst.installmentNumber || index + 1}</span>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase border ${
                        isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200/60 animate-pulse"
                      }`}>
                        {inst.status || "PENDING"}
                      </span>
                    </div>
                    <div>
                      <p className="text-xl font-black text-slate-900">{formatMoney(inst.amount)}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Due Rate Segment Valuation</p>
                    </div>
                    
                    {/* ACTIONS SLOT LAYER */}
                    <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-1.5">
                      {isPaid ? (
                        <>
                          <div className="text-center text-[10px] font-bold text-emerald-600 bg-emerald-50/60 py-1.5 rounded-lg border border-emerald-100">
                            ✓ Settled Successfully
                          </div>
                         
                          {inst.paymentDate && (
                            <p className="text-[9px] text-slate-400 font-mono text-center font-bold bg-white/40 border border-slate-200/40 rounded py-0.5 px-1 truncate">
                              ⏰ {formatDate(inst.paymentDate)}
                            </p>
                          )}
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onPayFee(inst)} 
                          className="w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 rounded-lg text-[10px] uppercase tracking-wide transition shadow-xs cursor-pointer"
                        >
                          Pay Installment 💳
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}





// 1. Component to display Live Hostel Vacancy Grid List
function LiveVacancyMap({ availableRooms }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm w-full">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Vacancy Map</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <th className="p-4">Room Unit</th>
              <th className="p-4">Classification</th>
              <th className="p-4">Free Spaces</th>
              <th className="p-4">Rate Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {availableRooms.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-center text-slate-400">No alternate vacancies catalogued matching framework profiles.</td></tr>
            ) : (
              availableRooms.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/20">
                  <td className="p-4 font-bold text-slate-900">{r.roomNumber}</td>
                  <td className="p-4 text-slate-500 font-medium">{r.roomType}</td>
                  <td className="p-4 text-slate-600 font-bold">{r.capacity - (r.currentOccupancy || 0)} Available Beds left</td>
                  <td className="p-4 font-bold text-slate-900">{formatMoney(r.pricePerMonth)} / Mo</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 2. Component to display Complaint registration forms and History register grids
function StudentComplaintsDesk({ complaintForm, setComplaintForm, complaints, onSubmit }) {
  return (
    <div className="grid lg:grid-cols-[1fr_2fr] gap-6 w-full">
      {/* Grievance Submission Form Block */}
      <form onSubmit={onSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 h-fit shadow-sm text-slate-900">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">Log Grievance Ticket</h3>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Issue Category / Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Washroom leakage, Fan broken"
            value={complaintForm.title || ""}
            // 🚀 FIXED: Spread operator (...prev) use kiya hai taaki object data crash na ho
            onChange={(e) => setComplaintForm(prev => ({ ...prev, title: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-slate-950 focus:bg-white"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Detailed Technical Description</label>
          <textarea
            required
            rows={4}
            placeholder="Describe exact coordinates clearly..."
            value={complaintForm.description || ""}
            // 🚀 FIXED: State mutations ko preserve karne ke liye handler update kiya hai
            onChange={(e) => setComplaintForm(prev => ({ ...prev, description: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-slate-950 focus:bg-white resize-none"
          />
        </div>
        <button type="submit" className="w-full rounded-xl bg-slate-950 py-2.5 text-xs font-bold text-white transition hover:bg-slate-900 cursor-pointer">
          Submit Ticket Parameters
        </button>
      </form>

      {/* History Register List View Component */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm text-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="p-4">Ticket Parameters</th>
                <th className="p-4">Logged On</th>
                <th className="p-4">Tracking State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {complaints.length === 0 ? (
                <tr><td colSpan={3} className="p-4 text-center text-slate-400">No active grievance records found.</td></tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/20">
                    <td className="p-4 max-w-xs">
                      <p className="font-bold text-slate-900">{c.title}</p>
                      <p className="text-slate-400 text-[11px] mt-0.5 truncate">{c.description}</p>
                    </td>
                    <td className="p-4 text-slate-400 whitespace-nowrap">{formatDate(c.createdAt)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        c.status === "RESOLVED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        c.status === "IN_PROGRESS" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                      }`}>{c.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
