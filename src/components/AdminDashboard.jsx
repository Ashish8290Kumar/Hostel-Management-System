import React, { useState, useEffect } from "react";


export default function AdminDashboard({ api, setToast }) {
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState("rooms");
  const [loading, setLoading] = useState(false);

  const [roomForm, setRoomForm] = useState({ roomNumber: "", roomType: "SINGLE", capacity: 1, pricePerMonth: "" });
  const [assignState, setAssignState] = useState({ studentId: "", roomNumber: "" });

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [inputRows, setInputRows] = useState([{ amount: "" }]);


  const [uploadingDoc, setUploadingDoc] = useState(false);


  const [editRoom, setEditRoom] = useState(null);
  const [editStudent, setEditStudent] = useState(null);
  const [editComplaint, setEditComplaint] = useState(null);


  const [deletingDoc, setDeletingDoc] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  // REFRESH-PROOF LOGS SYNCHRONIZER
  async function fetchAdminData() {
    setLoading(true);
    try {
      if (activeTab === "rooms") {
        const roomData = await api("/api/admin/rooms");
        setRooms(Array.isArray(roomData) ? roomData : []);
        const studentData = await api("/api/admin/students");
        setStudents(Array.isArray(studentData) ? studentData : []);
      } else if (activeTab === "students") {
        const studentData = await api("/api/admin/students");
        const verifiedStudents = Array.isArray(studentData) ? studentData : [];

        const studentsWithDocs = await Promise.all(
          verifiedStudents.map(async (st) => {
            try {
              const uName = st.userDetails?.username || st.rollNumber || "student";
              const docCheck = await fetch(`http://localhost:8090/api/v1/documents/check/${uName}`).then(res => res.json());
              const allDocs = await fetch(`http://localhost:8090/api/v1/documents/user/${uName}`).then(res => res.json());
              return {
                ...st,
                hasDocument: docCheck.hasDocument,
                documents: Array.isArray(allDocs) ? allDocs : [],
                // 🚀 NEW: Agar backend standard routing me installments key-value de raha hai toh yahan safely link ho jayegi
                installments: st.installments || []
              };
            } catch (e) {
              return {
                ...st,
                hasDocument: false,
                documents: [],
                installments: st.installments || [] // 🚀 Error handler me bhi safety mapping
              };
            }
          })
        );

        setStudents(studentsWithDocs);
        const roomData = await api("/api/admin/rooms");
        setRooms(Array.isArray(roomData) ? roomData : []);
      } else if (activeTab === "complaints") {
        const data = await api("/api/admin/complaints");
        setComplaints(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Data synchronization engine dropped:", error);
    } finally {
      setLoading(false);
    }
  }






  // part 2
  async function handleCreateRoom(e) {
    e.preventDefault();
    try {
      await api("/api/admin/rooms", {
        method: "POST",
        body: JSON.stringify({
          roomNumber: roomForm.roomNumber,
          roomType: roomForm.roomType,
          capacity: Number(roomForm.capacity),
          pricePerMonth: Number(roomForm.pricePerMonth),
          status: "AVAILABLE",
          currentOccupancy: 0
        }),
      });
      setToast("success", `Room ${roomForm.roomNumber} created successfully!`);
      setRoomForm({ roomNumber: "", roomType: "SINGLE", capacity: 1, pricePerMonth: "" });
      fetchAdminData();
    } catch (error) {
      setToast("error", error.message);
    }
  }

  async function handleAssignRoom(e) {
    e.preventDefault();
    try {
      await api(`/api/admin/students/${assignState.studentId}/assign-room?roomNumber=${assignState.roomNumber}`, {
        method: "PUT",
      });
      setToast("success", "Room assigned successfully!");
      setAssignState({ studentId: "", roomNumber: "" });
      fetchAdminData();
    } catch (error) {
      setToast("error", error.message);
    }
  }

  async function handleStatusUpdate(id, nextStatus) {
    try {
      await api(`/api/admin/complaints/${id}/status?status=${nextStatus}`, { method: "PUT" });
      setToast("success", `Complaint status updated to ${nextStatus}`);
      fetchAdminData();
    } catch (error) {
      setToast("error", error.message);
    }
  }

  function startEditRoom(room) {
    setEditRoom({
      id: room.id,
      roomNumber: room.roomNumber || "",
      roomType: room.roomType || "SINGLE",
      capacity: room.capacity || 1,
      pricePerMonth: room.pricePerMonth || "",
      status: room.status || "AVAILABLE",
      currentOccupancy: room.currentOccupancy || 0
    });
  }

  async function handleSaveRoomEdit() {
    if (!editRoom) return;
    try {
      await api(`/api/admin/rooms/${editRoom.id}`, {
        method: "PUT",
        body: JSON.stringify({
          roomNumber: editRoom.roomNumber,
          roomType: editRoom.roomType,
          capacity: Number(editRoom.capacity),
          pricePerMonth: Number(editRoom.pricePerMonth),
          status: editRoom.status || "AVAILABLE",
          currentOccupancy: Number(editRoom.currentOccupancy || 0)
        }),
      });
      setToast("success", "Room details updated successfully!");
      setEditRoom(null);
      fetchAdminData();
    } catch (error) {
      setToast("error", error.message);
    }
  }

  function startEditStudent(st, displayFullName) {
    const currentRoom = st.room?.roomNumber || st.roomNumber || "Unassigned";
    setEditStudent({
      id: st.id,
      fullName: displayFullName || "",
      email: st.userDetails?.email || st.email || "",
      roomNumber: currentRoom,
      oldRoomNumber: currentRoom
    });
  }

  // FIXED: DUAL-CHAIN PERMANENT ROOM DATABASE PERSISTENCE LOCK ENGINE
  async function handleSaveStudentEdit() {
    if (!editStudent) return;
    try {
      // 📡 Step 1: Student details update (Name/Email)
      await api(`/api/admin/students/${editStudent.id}`, {
        method: "PUT",
        body: JSON.stringify({
          fullName: editStudent.fullName,
          email: editStudent.email,
          roomNumber: editStudent.roomNumber,
          userDetails: {
            fullName: editStudent.fullName,
            email: editStudent.email
          }
        }),
      });

      // Step 2: Room assignment synchronization route link logic (Permanent Database Lock)
      const targetRoomNo = editStudent.roomNumber === "Unassigned" ? "" : editStudent.roomNumber;
      await api(`/api/admin/students/${editStudent.id}/assign-room?roomNumber=${targetRoomNo}`, {
        method: "PUT"
      });

      setToast("success", "Student details and room allocation locked permanently!");
      setEditStudent(null);
      fetchAdminData(); // Complete clean live UI sync reload
    } catch (error) {
      setToast("error", "Database Sync Failed: " + error.message);
    }
  }

  function startEditComplaint(c) {
    setEditComplaint({
      id: c.id,
      studentName: c.studentName || "Student Member",
      title: c.title,
      description: c.description,
      status: c.status,
      rollNumber: c.rollNumber
    });
  }

  async function handleSaveComplaintEdit() {
    if (!editComplaint) return;
    try {
      await api(`/api/admin/complaints/${editComplaint.id}`, {
        method: "PUT",
        body: JSON.stringify(editComplaint),
      });
      setToast("success", "Complaint updated successfully!");
      setEditComplaint(null);
      fetchAdminData();
    } catch (error) {
      setToast("error", error.message);
    }
  }

  async function handleDeleteDocument(docId) {
    if (!docId) return;
    const confirmed = window.confirm("Are you sure you want to delete this document?");
    if (!confirmed) return;

    setDeletingDoc(docId);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
      let response = await fetch(`http://localhost:8090/api/v1/documents/${docId}`, {
        method: "DELETE",
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        response = await fetch(`http://localhost:8090/api/v1/documents/delete/${docId}`, {
          method: "DELETE",
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
      }

      if (!response.ok) {
        throw new Error("Document delete request rejected by server.");
      }

      setToast("success", "Document deleted successfully!");
      fetchAdminData();
    } catch (error) {
      setToast("error", error.message);
    } finally {
      setDeletingDoc(false);
    }
  }

  async function handleBlockStudent(rollNumber) {
    try {
      await api(`/api/student/block/${rollNumber}`, { method: "PUT" });
      setToast("success", `Student ${rollNumber} has been successfully blocked.`);
      fetchAdminData();
    } catch (error) {
      setToast("error", "Failed to complete action: " + error.message);
    }
  }

  async function handleSaveInstallments(e) {
    e.preventDefault();
    if (!selectedStudent) return;
    const hasInvalidRow = inputRows.some(row => !row.amount || Number(row.amount) <= 0);
    if (hasInvalidRow) {
      setToast("error", "Please input valid billing amounts greater than zero.");
      return;
    }
    try {
      await api(`/api/payments/admin/set-installments/${selectedStudent.id}`, {
        method: "POST",
        body: JSON.stringify(inputRows)
      });
      setToast("success", "Installments updated successfully!");
      setSelectedStudent(null);
      setInputRows([{ amount: "" }]);
      fetchAdminData();
    } catch (err) {
      setToast("error", "Failed to update installments: " + err.message);
    }
  }




  // part 3
  // DOCUMENT UPLOAD HANDLER
  async function handleAdminUploadDoc(e, moduleName, studentUsername) {
    e.preventDefault();

    const fileInput = e.target.querySelector('input[type="file"]');
    const fileObj = fileInput && fileInput.files && fileInput.files.length > 0 ? fileInput.files.item(0) : null;

    if (!fileObj) {
      setToast("error", "Please select a file to upload first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", fileObj);
    formData.append("module", moduleName);
    formData.append("username", studentUsername);

    setUploadingDoc(true);
    try {
      // 🚀 FIXED: Fallback to parsing session storage variations safely
      const token = localStorage.getItem("token")
        || sessionStorage.getItem("token")
        || JSON.parse(localStorage.getItem("hostel_session") || "{}")?.jwtToken
        || "";

      // 🚀 FIXED: Removed hardcoded localhost! Now dynamically targets your active render cloud server
      const targetUrl = `${API_BASE || "https://hostel-management-system-backend-o16l.onrender.com"}/api/v1/documents/upload`;


      const response = await fetch(targetUrl, {
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
        body: formData // Browser safely configures boundaries automatically
      });

      // 🚀 FIXED: Safely reads the stream content before forcing a JSON transformation format
      const text = await response.text();
      let data = null;
      if (text) {
        try { data = JSON.parse(text); } catch { data = text; }
      }

      if (response.ok && data && (data.success || response.status === 200)) {
        setToast("success", "File uploaded successfully!");
        e.target.reset();

        // Auto-refresh your local list variables states seamlessly
        if (typeof fetchAdminData === "function") {
          fetchAdminData();
        }
        if (typeof fetchStudentsData === "function") {
          fetchStudentsData();
        }
      } else {
        const serverErrorMsg = typeof data === "string" ? data : data?.message || "Upload rejected by server configuration pipeline.";
        setToast("error", serverErrorMsg);
      }
    } catch (error) {
      // Provides targeted insight into the specific browser engine crash logs
      setToast("error", "Network error: Connection refused or file stream parsing failed.");
      console.error("Upload execution crash trace log:", error);
    } finally {
      setUploadingDoc(false);
    }
  }




  // part 4
  // INTERFACE RENDER LAYER & HOSTEL ROOMS MANAGER VIEWS
  return (
    <div className="space-y-8 w-full text-slate-900 font-sans p-1">
      <div className="w-full">

        {/* ROOMS MANAGEMENT CONTAINER */}
        {activeTab === "rooms" && (
          <div className="grid lg:grid-cols-[1fr_2.2fr] gap-8 w-full items-start">

            {/* Add Room Form Layout */}
            <form onSubmit={handleCreateRoom} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5 text-slate-900 w-full hover:shadow-md transition duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Add Hostel Room</h3>
                <p className="text-slate-400 text-[11px] font-medium mt-0.5">Create a new residential room in the system</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Room Code / Number</label>
                <input type="text" required placeholder="e.g. Room A-101" value={roomForm.roomNumber} onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs outline-none focus:border-slate-900 focus:bg-white font-medium text-slate-800 transition" />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Room Type</label>
                <select value={roomForm.roomType} onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs outline-none focus:border-slate-900 focus:bg-white cursor-pointer font-bold text-slate-700 transition">
                  <option value="SINGLE">Single Premium</option>
                  <option value="DOUBLE">Double Sharing</option>
                  <option value="DORMITORY">Dormitory Hub</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Max Bed Capacity</label>
                  <input type="number" min={1} required value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs outline-none focus:border-slate-900 focus:bg-white font-bold text-slate-800 transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Rate Per Month</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                    <input type="number" required placeholder="4500" value={roomForm.pricePerMonth} onChange={(e) => setRoomForm({ ...roomForm, pricePerMonth: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-6 pr-3 py-2.5 text-xs outline-none focus:border-slate-900 focus:bg-white font-bold text-slate-800 transition" />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full rounded-xl bg-slate-950 py-3 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 cursor-pointer shadow-sm mt-2">Add Room ✓</button>
            </form>



            {/* part 5 */}
            {/* Occupancy Inventory List Table Layout (Clean & Edit Removed) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm text-slate-900 w-full transition duration-300 hover:shadow-md px-1">
              <div className="p-5 px-6 border-b border-slate-200/60 bg-slate-50 flex items-center justify-between">
                <h4 className="text-sm font-semibold tracking-wide text-slate-700">Hostel Rooms Inventory</h4>
                <span className="text-xs bg-slate-900 text-white px-3 py-1 rounded-md font-medium font-mono">Total: {rooms.length} Rooms</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-xs font-semibold tracking-wider text-slate-600">
                      <th className="py-4 p-4 pl-6 w-[35%]">Room No & Occupants</th>
                      <th className="py-4 p-4 w-[15%]">Room Type</th>
                      <th className="py-4 p-4 w-[20%]">Bed Occupancy</th>
                      <th className="py-4 p-4 w-[15%]">Rate / Month</th>
                      <th className="py-4 p-4 pr-6 w-[15%] text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 text-sm">

                    {rooms.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-slate-400 font-medium italic">
                          No rooms available in the system yet.
                        </td>
                      </tr>
                    ) : (
                      rooms.map((room, index) => {
                        const occupants = (students || []).filter(st => (st.room?.roomNumber || st.roomNumber) === room.roomNumber);
                        const rowBgColor = index % 2 === 0 ? "bg-white" : "bg-slate-50/50";

                        return (
                          <tr key={room.id} className={`${rowBgColor} border-b border-slate-200/60 hover:bg-slate-100/60 transition-colors duration-200 group`}>

                            {/* Room Number & Occupants */}
                            <td className="py-5 p-4 pl-6 align-middle">
                              <p className="font-semibold text-slate-900 text-base tracking-tight">{room.roomNumber}</p>
                              <div className="flex flex-wrap gap-1.5 mt-2 max-w-xs">
                                {occupants.length === 0 ? (
                                  <span className="text-[10px] text-slate-400 font-medium bg-white border border-dashed border-slate-300 px-2.5 py-0.5 rounded-md shadow-sm">
                                    Vacant Room
                                  </span>
                                ) : (
                                  occupants.map((st) => (
                                    <span key={st.id} className="inline-flex items-center text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 rounded-lg shadow-sm">
                                      <span className="mr-1 text-[10px]">👤</span>
                                      {st.userDetails?.fullName || st.fullName || "Student"}
                                    </span>
                                  ))
                                )}
                              </div>
                            </td>

                            {/* Room Type Classification */}
                            <td className="py-5 p-4 align-middle text-slate-600">
                              <span className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium text-xs tracking-wide uppercase shadow-sm">
                                {room.roomType}
                              </span>
                            </td>

                            {/* Bed Occupancy Sliders */}
                            <td className="py-5 p-4 align-middle text-slate-600">
                              <div className="flex flex-col gap-1.5">
                                <span className="text-xs font-medium text-slate-700">{(room.currentOccupancy || 0)} / {room.capacity} Beds Filled</span>
                                <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/40">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${((room.currentOccupancy || 0) / room.capacity) >= 1 ? 'bg-emerald-600' : 'bg-emerald-500'}`}
                                    style={{ width: `${Math.min(((room.currentOccupancy || 0) / room.capacity) * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>




                            {/* part 6 */}
                            {/* Rent Per Month */}
                            <td className="py-5 p-4 align-middle font-semibold text-slate-900 text-sm">
                              ₹{room.pricePerMonth}
                            </td>

                            {/* Room Status & Actions (Edit Removed Stable View) */}
                            <td className="py-5 p-4 align-middle text-center pr-6">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border uppercase tracking-wider ${room.status === "AVAILABLE" || room.status === "Available"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}>
                                {room.status || "AVAILABLE"}
                              </span>
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* =============== TAB 2: STUDENTS LAYOUT DATA VIEWS =============== */}
        {activeTab === "students" && (
          <div className="grid lg:grid-cols-[1fr_2.5fr] gap-6 w-full items-start">

            {/* Room Allocation Form Layout */}
            <form onSubmit={handleAssignRoom} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-slate-900 w-full transition duration-300 hover:shadow-md sticky top-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-semibold tracking-wide text-slate-800">Allocation Desk</h3>
                <p className="text-slate-400 text-xs mt-0.5">Assign rooms to students instantly</p>
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Student Profile</label>
                  <select
                    required
                    value={assignState.studentId}
                    onChange={(e) => setAssignState({ ...assignState, studentId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100 text-slate-700 font-medium transition"
                  >
                    <option value="">Select Candidate</option>
                    {students.filter(st => !st.roomNumber || st.roomNumber === "Unassigned" || !st.room).map((st) => (
                      <option key={st.id} value={st.id}>{st.userDetails?.fullName || st.fullName} [Roll: {st.rollNumber}]</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Target Room</label>
                  <select
                    required
                    value={assignState.roomNumber}
                    onChange={(e) => setAssignState({ ...assignState, roomNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100 text-slate-700 font-medium transition"
                  >
                    <option value="">Select Bed Room</option>
                    {rooms.filter(r => (r.currentOccupancy || 0) < r.capacity).map((rm) => (
                      <option key={rm.id} value={rm.roomNumber}>{rm.roomNumber} ({rm.roomType})</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.95] cursor-pointer mt-2"
              >
                Assign Room
              </button>
            </form>


            {/* part 7 */}
            {/* Students Profiles Table Layout */}
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm text-slate-900 w-full transition duration-300 hover:shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-xs font-semibold tracking-wider text-slate-600">
                      <th className="py-4 p-4 pl-6 w-[40%]">Student Info & Verification Docs</th>
                      <th className="py-4 p-4 w-[15%]">Roll ID</th>
                      <th className="py-4 p-4 w-[15%]">Allotment</th>
                      <th className="py-4 p-4 w-[15%]">Billing Status</th>
                      <th className="py-4 p-4 pr-6 w-[15%] text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 text-sm">

                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-slate-400 font-medium italic">
                          No student profiles found.
                        </td>
                      </tr>
                    ) : (
                      students.map((st, index) => {
                        const displayFullName = st.userDetails?.fullName || st.fullName || "Candidate";
                        const studentUser = st.userDetails?.username || st.rollNumber || "student";

                        // Premium alternating clean grid design
                        const rowBgColor = index % 2 === 0 ? "bg-white" : "bg-slate-50/50";

                        return (
                          <tr key={st.id} className={`${rowBgColor} border-b border-slate-200/60 hover:bg-slate-100/60 transition-colors duration-200 group`}>

                            {/* Student Info & Verification Documents List */}
                            <td className="py-5 p-4 pl-6 align-top">
                              <div className="flex flex-col gap-1.5">

                                {editStudent?.id === st.id ? (
                                  <div className="space-y-1.5">
                                    <input
                                      type="text"
                                      value={editStudent.fullName}
                                      onChange={(e) => setEditStudent({ ...editStudent, fullName: e.target.value })}
                                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-slate-900 font-bold text-slate-900 capitalize"
                                    />
                                    <input
                                      type="email"
                                      value={editStudent.email}
                                      onChange={(e) => setEditStudent({ ...editStudent, email: e.target.value })}
                                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-slate-900 font-medium text-slate-600"
                                    />
                                  </div>
                                ) : (
                                  <>
                                    <p className="font-bold text-slate-900 text-lg tracking-tight capitalize">{displayFullName}</p>
                                    <p className="text-sm text-slate-500 font-medium -mt-0.5 mb-1">{st.userDetails?.email || st.email}</p>
                                  </>
                                )}

                                {/* Document Box Layout */}

                                <div className="mt-2 p-3 bg-white rounded-xl border border-slate-200 shadow-sm max-w-sm">
                                  <div className="border-b border-slate-100 pb-2 mb-2 flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Verification Archive</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${st.hasDocument ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                      {st.hasDocument ? 'Files Found' : 'Missing Docs'}
                                    </span>
                                  </div>

                                  {/* part 8 */}

                                  {/* Documents Grid View */}
                                  <div className="max-h-35 overflow-y-auto pr-1 grid grid-cols-1 gap-2 mb-3 scrollbar-thin">
                                    {st.documents && st.documents.length > 0 ? (
                                      st.documents.map((doc) => {
                                        // Dynamic file naming structure formatting 
                                        let cleanName = doc.originalName || doc.fileName || "View Document";
                                        if (cleanName.includes(".") && cleanName === doc.fileName) {
                                          cleanName = cleanName.replace(/\.[^/.]+$/, "");
                                          cleanName = cleanName.replace(/^(profiles|receipts|complaints)_/i, "").replace(new RegExp("^" + studentUser + "_", "i"), "");
                                          cleanName = cleanName.replace(/_[a-f0-9]{8}$/i, "");
                                        }
                                        cleanName = cleanName.replace(/[_-]/g, " ").trim();

                                        return (
                                          <div key={doc.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:border-indigo-300 hover:bg-indigo-50/40 transition group min-w-0 shadow-sm w-full" title={cleanName} >
                                            {/* 🚀 FIXED: Replaced hardcoded http://localhost:8090 with your dynamic API_BASE variable */}
                                            <a
                                              href={`${API_BASE || "https://onrender.com"}/api/v1/documents/view-by-id/${doc.id}?v=${Date.now()}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-2 min-w-0 flex-1"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <span className="text-base shrink-0">📄</span>
                                              <div className="flex flex-col min-w-0 flex-1">
                                                <span className="text-xs text-indigo-600 font-bold group-hover:underline truncate capitalize block">
                                                  {cleanName}
                                                </span>
                                                <span className="text-[9px] text-slate-400 font-semibold tracking-wide">View File ↗</span>
                                              </div>
                                            </a>
                                            <button type="button" disabled={deletingDoc === doc.id} onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc.id); }} className="shrink-0 text-[10px] text-rose-500 hover:text-rose-700 font-bold px-2 py-1 rounded bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-300 transition cursor-pointer disabled:opacity-50 h-fit" >
                                              {deletingDoc === doc.id ? "..." : "Delete"}
                                            </button>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <div className="col-span-1 flex items-center gap-2 p-1.5 text-slate-400">
                                        <span className="text-lg">⚠️</span>
                                        <span className="text-xs italic font-medium">No records found</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Upload Form */}
                                  <form onSubmit={async (e) => { e.preventDefault(); await handleAdminUploadDoc(e, "PROFILES", studentUser); }} className="pt-2 border-t border-slate-100 flex items-center gap-1.5" >
                                    <input type="file" required className="block text-[10px] text-slate-400 w-full file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border file:border-slate-100 file:text-[10px] file:font-bold file:text-slate-600 file:bg-slate-50 hover:file:bg-slate-100 cursor-pointer" />
                                    <button type="submit" disabled={uploadingDoc} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white transition active:scale-[0.95] cursor-pointer ${uploadingDoc ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800'}`} >
                                      {uploadingDoc ? '...' : 'Upload'}
                                    </button>
                                  </form>

                                </div>
                              </div>
                            </td>




                            {/* part9A */}
                            {/* Roll ID */}
                            <td className="py-5 p-4 align-top font-mono text-xs text-slate-600 font-semibold pt-6">
                              {st.rollNumber}
                            </td>


                            {/* Room Status Dropdown Option Fix */}
                            <td className="py-5 p-4 align-top pt-6">
                              {editStudent?.id === st.id ? (
                                <select
                                  value={editStudent.roomNumber || "Unassigned"}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditStudent(prev => ({
                                      ...prev,
                                      roomNumber: val
                                    }));
                                  }}
                                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-slate-900 font-medium text-slate-700 cursor-pointer"
                                >
                                  <option value="Unassigned">Unassigned</option>
                                  {rooms.map((rm) => (
                                    <option key={rm.id} value={rm.roomNumber}>
                                      {rm.roomNumber} ({rm.roomType})
                                    </option>
                                  ))}
                                </select>
                              ) : st.roomNumber && st.roomNumber !== "Unassigned" ? (
                                <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 text-xs">
                                  <span className="text-[10px]">🏠</span> {st.roomNumber}
                                </span>
                              ) : (
                                <span className="inline-block text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg font-medium text-xs">
                                  Unassigned
                                </span>
                              )}
                            </td>


                            {/* Fees Billing Status */}
                            <td className="py-5 p-4 align-top pt-6">
                              <div className="flex flex-col gap-1 items-start">
                                <span className={`px-2.5 py-0.5 rounded-md font-medium text-xs border uppercase tracking-wide ${st.feeStatus === "PAID" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                                  }`}>
                                  {st.feeStatus || "PENDING"}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => { setSelectedStudent({ id: st.id, name: displayFullName }); setInputRows([{ amount: "" }]); }}
                                  className="text-xs text-slate-400 hover:text-indigo-600 font-medium underline cursor-pointer mt-1.5 transition"
                                >
                                  Set Installment
                                </button>

                                {/* 🚀 PREMIUM RE-DESIGNED LIVE SYNC: Installments Framework UI Block */}
                                {st.installments && st.installments.length > 0 && (
                                  <div className="mt-3 w-40 flex flex-col gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 shadow-sm max-h-47.5 overflow-y-auto scrollbar-none">
                                    {/* Sorting so they display orderly 1, 2, 3 */}
                                    {[...st.installments]
                                      .sort((a, b) => (a.installmentNumber || 0) - (b.installmentNumber || 0))
                                      .map((inst, index) => {

                                        // 🛡️ Safe Variable Binding (Jackson Array and ISO string parser conversion setup)
                                        const rawDate = inst.paymentDate;
                                        let displayDate = "";

                                        if (inst.status === "PAID" && rawDate) {
                                          try {
                                            if (Array.isArray(rawDate)) {
                                              const [year, month, day, hour, minute] = rawDate;
                                              displayDate = new Date(year, month - 1, day, hour || 0, minute || 0).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
                                            } else {
                                              displayDate = new Date(rawDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
                                            }
                                          } catch (dateErr) {
                                            displayDate = String(rawDate);
                                          }
                                        }

                                        return (
                                          <div
                                            key={index}
                                            className="flex flex-col text-[11px] bg-white border border-slate-100 rounded-lg p-2 shadow-xs transition hover:border-indigo-100"
                                          >
                                            {/* Title Block using Installment word over Slot */}
                                            <div className="flex flex-col gap-1 items-start">
                                              <span className="font-bold text-slate-800 tracking-tight">
                                                Installment {inst.installmentNumber || (index + 1)}
                                              </span>

                                              <div className="w-full flex justify-between items-center gap-1 mt-0.5">
                                                <span className="font-semibold font-mono text-indigo-600 text-xs">₹{inst.amount}</span>
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-wide uppercase shadow-2xs ${inst.status === "PAID"
                                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                                  : "bg-amber-50 text-amber-600 border border-amber-100"
                                                  }`}>
                                                  {inst.status}
                                                </span>
                                              </div>
                                            </div>

                                            {/* Render formatted Dynamic Date parameters only if Paid */}
                                            {inst.status === "PAID" && displayDate && (
                                              <div className="text-slate-400 font-medium text-[9px] mt-1.5 pt-1 border-t border-slate-50 flex items-start gap-1 leading-tight">
                                                <span className="shrink-0 text-[10px]">📅</span>
                                                <span>{displayDate}</span>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                  </div>
                                )}



                              </div>
                            </td>


                            {/* Block & Edit Actions */}
                            <td className="py-5 p-4 pr-6 text-center align-top pt-6">
                              {editStudent?.id === st.id ? (
                                <div className="flex justify-center gap-1.5">
                                  {/* 🚀 FIXED: Executes our database double-chain save transaction correctly */}
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        // 🎯 STEP 1: Parse target room parameter safely using JavaScript standard syntax
                                        const currentRoomVal = editStudent.roomNumber || "";
                                        const cleanRoomParam = (currentRoomVal.toLowerCase() === "unassigned" || currentRoomVal.trim() === "")
                                          ? ""
                                          : currentRoomVal;

                                        // 📡 STEP 2: Name and Email push on update route 
                                        await api(`/api/admin/students/${st.id}`, {
                                          method: "PUT",
                                          body: JSON.stringify({
                                            id: st.id,
                                            fullName: editStudent.fullName,
                                            email: editStudent.email,
                                            rollNumber: editStudent.rollNumber,
                                            roomNumber: cleanRoomParam
                                          })
                                        });

                                        // 📡 STEP 3: Hit the Database relational assignment counter query parameters 
                                        await api(`/api/admin/students/${st.id}/assign-room?roomNumber=${cleanRoomParam}`, {
                                          method: "PUT"
                                        });


                                        {/* part9B */ }

                                        // 🎯 STEP 4: Live temporary screen layout variables override sync 
                                        const updatedStudents = students.map(s => s.id === st.id ? {
                                          ...s,
                                          fullName: editStudent.fullName,
                                          userDetails: s.userDetails ? {
                                            ...s.userDetails,
                                            fullName: editStudent.fullName,
                                            email: editStudent.email
                                          } : null,
                                          email: editStudent.email,
                                          rollNumber: editStudent.rollNumber,
                                          roomNumber: cleanRoomParam === "" ? "Unassigned" : cleanRoomParam,
                                          room: s.room ? { ...s.room, roomNumber: cleanRoomParam } : { roomNumber: cleanRoomParam }
                                        } : s);

                                        setStudents(updatedStudents);
                                        setEditStudent(null); // Close active input view elements cleanly
                                        setToast("success", "Student configuration synced permanently to PostgreSQL database!");

                                        // 🔄 STEP 5: Re-trigger dynamic data logs synchronizer to load fresh metadata copy
                                        if (typeof fetchAdminData === "function") {
                                          await fetchAdminData();
                                        }
                                      } catch (apiError) {
                                        setToast("error", "Database Sync Dropped: " + apiError.message);
                                      }
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition cursor-pointer"
                                  >
                                    Save
                                  </button>


                                  <button
                                    type="button"
                                    onClick={() => setEditStudent(null)}
                                    className="px-2.5 py-1.5 rounded-lg bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 text-xs font-medium transition active:scale-[0.95] cursor-pointer shadow-sm"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => startEditStudent(st, displayFullName)}
                                    className="px-3 py-1.5 rounded-lg bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 text-xs font-medium transition active:scale-[0.95] cursor-pointer shadow-sm"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleBlockStudent(st.rollNumber)}
                                    className="px-3 py-1.5 rounded-lg bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 hover:border-rose-300 text-xs font-medium transition active:scale-[0.95] cursor-pointer shadow-sm"
                                  >
                                    Block
                                  </button>
                                </div>
                              )}
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}



        {/* part10 */}

        {/* =============== TAB 3: COMPLAINTS TICKETS VIEW =============== */}
        {activeTab === "complaints" && (
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm text-slate-900 w-full transition duration-300 hover:shadow-md px-1">
            {/* Complaints Header Toolbar */}
            <div className="p-5 px-6 border-b border-slate-200/60 bg-slate-50 flex items-center justify-between">
              <h4 className="text-sm font-semibold tracking-wide text-slate-700">Complaints & Grievances</h4>
              <span className="text-xs bg-slate-900 text-white px-3 py-1 rounded-md font-medium font-mono">Pending: {complaints.filter(c => c.status !== "RESOLVED").length} Tickets</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-xs font-semibold tracking-wider text-slate-600">
                    <th className="py-4 p-4 pl-6 w-[40%]">Issue Details</th>
                    <th className="py-4 p-4 w-[20%]">Raised By</th>
                    <th className="py-4 p-4 w-[15%]">Status</th>
                    <th className="py-4 p-4 pr-6 w-[25%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 text-sm">

                  {complaints.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-slate-400 font-medium italic">
                        No complaints registered in the system.
                      </td>
                    </tr>
                  ) : (
                    complaints.map((c, index) => {
                      const rowBgColor = index % 2 === 0 ? "bg-white" : "bg-slate-50/50";

                      return (
                        <tr key={c.id} className={`${rowBgColor} border-b border-slate-200/60 hover:bg-slate-100/60 transition-colors duration-200 group`}>

                          {/* Issue Details with Premium Typography */}
                          <td className="py-5 p-4 pl-6 max-w-sm align-middle">
                            <p className="font-semibold text-slate-900 text-base tracking-tight">{c.title}</p>
                            <p className="text-slate-500 mt-1 text-xs leading-relaxed font-normal">{c.description}</p>
                          </td>

                          {/* Lodged By Student Info (Edit Box Removed) */}
                          <td className="py-5 p-4 align-middle text-slate-700">
                            <p className="font-semibold text-slate-900 text-sm capitalize">{c.studentName || "Student Member"}</p>
                            {c.rollNumber && (
                              <p className="text-xs text-slate-500 font-mono mt-1">
                                <span className="bg-white border border-slate-200 rounded px-1.5 py-0.5 font-medium shadow-sm">{c.rollNumber}</span>
                              </p>
                            )}
                          </td>

                          {/* Complaint Status Badges */}
                          <td className="py-5 p-4 align-middle">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border uppercase tracking-wider ${c.status === "RESOLVED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              c.status === "IN_PROGRESS" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                "bg-rose-50 text-rose-700 border-rose-200"
                              }`}>
                              {c.status || "OPEN"}
                            </span>
                          </td>





                          {/* part11 */}

                          {/* Action Buttons Layout (Complaints Edit Removed Stable View) */}
                          <td className="py-5 p-4 pr-6 align-middle text-right space-x-2.5 whitespace-nowrap">
                            {c.status !== "IN_PROGRESS" && c.status !== "RESOLVED" && (
                              <button
                                onClick={() => handleStatusUpdate(c.id, "IN_PROGRESS")}
                                className="bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg font-medium text-xs tracking-wide uppercase border border-slate-200 shadow-sm transition active:scale-[0.95] cursor-pointer"
                              >
                                Investigate
                              </button>
                            )}
                            {c.status !== "RESOLVED" && (
                              <button
                                onClick={() => handleStatusUpdate(c.id, "RESOLVED")}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg font-semibold text-xs tracking-wide uppercase shadow-sm transition active:scale-[0.95] cursor-pointer"
                              >
                                Mark Solved ✓
                              </button>
                            )}
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>




      {/* part 12 */}
      {/* ==========================================================
          DYNAMIC POP-UP MODAL WINDOW CONFIGURATOR & BOTTOM TOOLBAR
          ========================================================== */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition duration-300">
          <div className="bg-white p-6 rounded-xl border border-slate-200 w-full max-w-md shadow-xl max-h-[80vh] flex flex-col">
            <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold tracking-wide text-slate-800">Configure Installments</h3>
                <p className="text-xs text-slate-500 mt-0.5">Target Student: <span className="text-indigo-600 font-medium capitalize">{selectedStudent.name}</span></p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-slate-600 font-medium text-sm cursor-pointer p-1 rounded-md hover:bg-slate-50 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveInstallments} className="flex-1 overflow-y-auto space-y-4 pr-1">
              {inputRows.map((row, index) => (
                <div key={index} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/60 transition">
                  <span className="text-xs font-medium text-slate-500 w-14">Slot {index + 1}:</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-slate-400 text-sm font-medium">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Enter Amount"
                      value={row.amount}
                      onChange={(e) => {
                        const updated = [...inputRows];
                        updated[index].amount = e.target.value;
                        setInputRows(updated);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-md py-1.5 pl-7 pr-3 text-sm font-medium text-slate-800 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                    />
                  </div>
                  {inputRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setInputRows(inputRows.filter((_, i) => i !== index))}
                      className="text-rose-600 font-medium text-xs px-2 py-1 rounded-md hover:bg-rose-50 transition"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => setInputRows([...inputRows, { amount: "" }])}
                className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-lg text-xs font-medium text-slate-500 bg-slate-50 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50/20 transition duration-150 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>➕</span> Add Another Slot
              </button>

              <div className="border-t border-slate-100 pt-4 mt-4 flex gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition active:scale-[0.95] shadow-sm cursor-pointer"
                >
                  Save Matrix ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLOATING ACTION BOTTOM NAV BAR LAYOUTS */}
      <div className="fixed bottom-6 right-6 flex bg-slate-900/95 backdrop-blur-sm border border-slate-800 p-1 rounded-xl shadow-xl z-50">
        {["rooms", "students", "complaints"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-medium rounded-lg uppercase tracking-wider transition-all duration-200 cursor-pointer ${activeTab === tab
              ? "bg-emerald-500 text-slate-950 font-semibold shadow-sm"
              : "text-slate-400 hover:text-slate-200"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}






