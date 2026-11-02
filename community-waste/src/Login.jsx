import { useEffect, useState } from "react";

/**
 * CommunityCleanUp: full app (login, register, dashboard, reports, users).
 * Usage: <Login startOnRegister={false} onBack={() => go('home')} />
 * Data is kept in localStorage, same keys as the old index.html.
 */

/* ---------- storage helpers ---------- */
const L = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } };
const S = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
const now = () => new Date().toISOString();
const COLORS = ["#1a5fb4", "#26a269", "#e5a50a", "#c01c28", "#9141ac", "#1c71d8"];

const getUsers = () => {
  let u = L("cwm_users", null);
  if (!u) {
    u = [
      { id: 1, fullName: "Admin User", email: "admin@cwm.com", password: "123456", role: "admin", avatarColor: "#1a5fb4", joinDate: now() },
      { id: 2, fullName: "John Resident", email: "john@example.com", password: "123456", role: "resident", avatarColor: "#26a269", joinDate: now() },
      { id: 3, fullName: "Sarah Staff", email: "sarah@example.com", password: "123456", role: "staff", avatarColor: "#e5a50a", joinDate: now() },
    ];
    S("cwm_users", u);
  }
  return u;
};
const getReports = () => {
  let r = L("cwm_reports", null);
  if (!r) {
    r = [
      { id: 1, title: "Overflowing Recycling Bins at Central Park", description: "The recycling bins near the playground have been overflowing for two days. Need urgent attention.", type: "recyclable", location: "Central Park, Downtown", authorId: 2, authorName: "John Resident", status: "pending", priority: "high", date: "2026-10-15", upvotes: 12, comments: 2 },
      { id: 2, title: "Illegal Dumping of Construction Waste", description: "Someone dumped construction materials in the alley behind 5th Street. Includes hazardous materials.", type: "hazardous", location: "Alley behind 5th Street", authorId: 2, authorName: "John Resident", status: "in-progress", priority: "critical", date: "2026-10-14", upvotes: 8, comments: 1 },
      { id: 3, title: "Food Waste Accumulation Near Market", description: "Organic waste from the market is piling up and attracting pests. Needs proper composting setup.", type: "organic", location: "Farmers Market Area", authorId: 2, authorName: "John Resident", status: "resolved", priority: "medium", date: "2026-10-13", upvotes: 15, comments: 0 },
    ];
    S("cwm_reports", r);
  }
  return r;
};
const getComments = () => {
  let c = L("cwm_comments", null);
  if (!c) {
    c = [
      { id: 1, reportId: 1, userId: 2, userName: "John Resident", content: "This has been here for days! I reported it yesterday too.", timestamp: "2026-10-15T14:30:00", likes: 3 },
      { id: 2, reportId: 1, userId: 3, userName: "Sarah Staff", content: "I'll contact the local authorities about this.", timestamp: "2026-10-15T15:30:00", likes: 1 },
      { id: 3, reportId: 2, userId: 1, userName: "Admin User", content: "Assigned to cleanup crew. Will be resolved within 24 hours.", timestamp: "2026-10-14T10:15:00", likes: 5 },
    ];
    S("cwm_comments", c);
  }
  return c;
};

const EMPTY_REPORT = { title: "", type: "", loc: "", desc: "", pri: "medium" };
const nextId = (arr) => Math.max(0, ...arr.map((x) => x.id)) + 1;
const colorOf = (id) => (getUsers().find((u) => u.id === id) || {}).avatarColor || "#64748b";

/* ---------- component ---------- */
export default function Login({ startOnRegister = false, onBack }) {
  const [cur, setCur] = useState(() => L("cwm_currentUser", null));
  const [page, setPage] = useState(() => L("cwm_page", "dash"));
  const [mode, setMode] = useState(startOnRegister ? "register" : "login");
  const [modal, setModal] = useState(null); // 'report' | 'detail' | 'comments'
  const [rid, setRid] = useState(null);
  const [toastS, setToastS] = useState(null);
  const [, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  const [lf, setLf] = useState({ email: "", password: "" });
  const [rf, setRf] = useState({ name: "", email: "", pass: "", role: "resident" });
  const [rep, setRep] = useState(() => ({ ...EMPTY_REPORT, ...L("cwm_draft", {}) }));
  const [photo, setPhoto] = useState("");
  const [cText, setCText] = useState("");
  const [filt, setFilt] = useState(() => ({ q: "", t: "", s: "", ...L("cwm_filters", {}) }));

  const isStaff = !!cur && (cur.role === "admin" || cur.role === "staff");
  const isAdmin = !!cur && cur.role === "admin";
  const isResident = !!cur && cur.role === "resident";

  const view =
    (page === "all" && isStaff) || (page === "users" && isAdmin) || (page === "mine" && isResident)
      ? page
      : "dash";

  /* Font Awesome (icons) */
  useEffect(() => {
    const id = "cwm-fa";
    if (document.getElementById(id)) return;
    const l = document.createElement("link");
    l.id = id;
    l.rel = "stylesheet";
    l.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
    document.head.appendChild(l);
  }, []);

  /* toast auto-hide */
  useEffect(() => {
    if (!toastS) return;
    const id = setTimeout(() => setToastS(null), 3000);
    return () => clearTimeout(id);
  }, [toastS]);

  const toast = (t, m, err) => setToastS({ t, m, err: !!err });
  const closeModal = () => setModal(null);
  const go = (p) => { setPage(p); S("cwm_page", p); };

  /* ---------- auth ---------- */
  const login = () => {
    const e = lf.email.trim().toLowerCase();
    const u = getUsers().find((x) => x.email.toLowerCase() === e && x.password === lf.password);
    if (!u) return toast("Error", "Invalid email or password", 1);
    const { password, ...safe } = u;
    setCur(safe); S("cwm_currentUser", safe);
    setLf({ email: "", password: "" });
    toast("Success", "Login successful!");
  };
  const register = () => {
    const name = rf.name.trim(), email = rf.email.trim(), pass = rf.pass;
    const role = rf.role === "staff" ? "staff" : "resident"; // admin cannot be self-registered
    if (!name || !email || !pass) return toast("Error", "Please fill in all fields", 1);
    if (pass.length < 6) return toast("Error", "Password must be at least 6 characters", 1);
    const u = getUsers();
    if (u.some((x) => x.email.toLowerCase() === email.toLowerCase())) return toast("Error", "Email already registered", 1);
    const n = { id: nextId(u), fullName: name, email, password: pass, role, avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)], joinDate: now() };
    u.push(n); S("cwm_users", u);
    const { password, ...safe } = n;
    setCur(safe); S("cwm_currentUser", safe);
    setRf({ name: "", email: "", pass: "", role: "resident" });
    toast("Success", "Registration successful!");
  };
  const logout = () => {
    localStorage.removeItem("cwm_currentUser");
    localStorage.removeItem("cwm_page");
    setCur(null); setPage("dash"); setModal(null);
    toast("Success", "Logged out successfully");
  };

  /* ---------- report form ---------- */
  const setField = (k, v) => { const n = { ...rep, [k]: v }; setRep(n); S("cwm_draft", n); };

  const pickPhoto = (e) => {
    const f = e.target.files[0];
    setPhoto("");
    if (!f) return;
    if (!f.type.startsWith("image/")) { e.target.value = ""; return toast("Error", "Please choose an image file", 1); }
    const img = new Image(), rd = new FileReader();
    rd.onload = () => {
      img.onload = () => {
        const k = Math.min(1, 800 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        setPhoto(c.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => toast("Error", "Could not read that image", 1);
      img.src = rd.result;
    };
    rd.readAsDataURL(f);
  };

  const submitReport = () => {
    const t = rep.title.trim(), lo = rep.loc.trim(), d = rep.desc.trim();
    if (!t || !rep.type || !lo || !d) return toast("Error", "Please fill in all required fields", 1);
    const r = getReports();
    r.unshift({ id: nextId(r), title: t, description: d, type: rep.type, location: lo, authorId: cur.id, authorName: cur.fullName, status: "pending", priority: rep.pri, date: new Date().toISOString().slice(0, 10), upvotes: 0, comments: 0, photo });
    if (!S("cwm_reports", r)) return toast("Error", "Storage is full. Try a smaller photo.", 1);
    localStorage.removeItem("cwm_draft");
    setRep(EMPTY_REPORT); setPhoto(""); setModal(null); go("dash");
    toast("Success", "Report submitted successfully!");
  };

  /* ---------- report actions ---------- */
  const upvote = (id) => {
    const r = getReports(), x = r.find((y) => y.id === id);
    if (!x) return;
    x.upvotes++; S("cwm_reports", r); refresh(); toast("Success", "Report upvoted!");
  };
  const setStatus = (id, s) => {
    if (!isStaff || !confirm(`Change this report status to "${s}"?`)) return;
    const r = getReports(), x = r.find((y) => y.id === id);
    if (!x) return;
    x.status = s; S("cwm_reports", r); refresh(); toast("Success", "Report marked as " + s);
  };
  const delReport = (id) => {
    if (!isAdmin || !confirm("Delete this report?")) return;
    S("cwm_reports", getReports().filter((x) => x.id !== id));
    S("cwm_comments", getComments().filter((c) => c.reportId !== id));
    refresh(); toast("Success", "Report deleted");
  };
  const delUser = (id) => {
    if (!isAdmin || id === cur.id || !confirm("Delete this user and their reports and comments? This cannot be undone.")) return;
    S("cwm_users", getUsers().filter((u) => u.id !== id));
    S("cwm_reports", getReports().filter((r) => r.authorId !== id));
    S("cwm_comments", getComments().filter((c) => c.userId !== id));
    refresh(); toast("Success", "User deleted");
  };

  /* ---------- comments ---------- */
  const viewReport = (id) => { setRid(id); setModal("detail"); };
  const openComments = (id) => {
    const target = id || rid;
    if (!target) return;
    setRid(target);
    const cd = L("cwm_cdraft", {});
    setCText(cd.id === target ? cd.t : "");
    setModal("comments");
  };
  const onCText = (v) => { setCText(v); S("cwm_cdraft", { id: rid, t: v }); };
  const addComment = () => {
    const t = cText.trim();
    if (!t) return toast("Error", "Please enter a comment", 1);
    const c = getComments();
    c.unshift({ id: nextId(c), reportId: rid, userId: cur.id, userName: cur.fullName, content: t, timestamp: now(), likes: 0 });
    S("cwm_comments", c);
    const r = getReports(), x = r.find((y) => y.id === rid);
    if (x) { x.comments++; S("cwm_reports", r); }
    setCText(""); localStorage.removeItem("cwm_cdraft");
    refresh(); toast("Success", "Comment added!");
  };
  const likeComment = (id) => {
    const c = getComments(), x = c.find((y) => y.id === id);
    if (x) { x.likes++; S("cwm_comments", c); refresh(); }
  };
  const delComment = (id) => {
    if (!confirm("Delete this comment?")) return;
    const c = getComments(), x = c.find((y) => y.id === id);
    if (!x) return;
    S("cwm_comments", c.filter((y) => y.id !== id));
    const r = getReports(), p = r.find((y) => y.id === x.reportId);
    if (p && p.comments > 0) { p.comments--; S("cwm_reports", r); }
    refresh(); toast("Success", "Comment deleted");
  };

  /* ---------- shared render helpers ---------- */
  const canSee = (r) => r.photo && cur && (isStaff || r.authorId === cur.id);
  const cc = (id) => getComments().filter((c) => c.reportId === id).length;

  const card = (r, full) => {
    const desc = full || r.description.length <= 110 ? r.description : r.description.slice(0, 110) + "...";
    return (
      <div className="rc" key={r.id} onClick={() => viewReport(r.id)}>
        <div className="rh">
          <span className={`tag t-${r.type}`}>{r.type}</span>
          <span className={`tag s-${r.status}`}>{r.status}</span>
        </div>
        {canSee(r) && <img src={r.photo} alt="Report photo" style={{ width: "100%", height: 170, objectFit: "cover", display: "block" }} />}
        <div className="rb">
          <h3>{r.title}</h3>
          <p>{desc}</p>
          <div className="loc"><i className="fas fa-map-marker-alt" /><span>{r.location}</span></div>
          <div className="loc">
            <span className={`tag p-${r.priority}`}>{r.priority}</span>
            <span><i className="fas fa-calendar" /> {r.date}</span>
          </div>
        </div>
        <div className="rf">
          <div className="au">
            <div className="av" style={{ background: colorOf(r.authorId) }}>{r.authorName[0]}</div>
            <div><strong>{r.authorName}</strong></div>
          </div>
          <div className="acts" onClick={(e) => e.stopPropagation()}>
            <button className="btn sm" onClick={() => upvote(r.id)}><i className="fas fa-thumbs-up" /> {r.upvotes}</button>
            <button className="btn sm bs" onClick={() => openComments(r.id)}><i className="fas fa-comment" /> {cc(r.id)}</button>
            {isStaff && r.status === "pending" && <button className="btn sm bw" title="Start working" onClick={() => setStatus(r.id, "in-progress")}><i className="fas fa-play" /></button>}
            {isStaff && r.status === "in-progress" && <button className="btn sm bs" title="Mark resolved" onClick={() => setStatus(r.id, "resolved")}><i className="fas fa-check" /></button>}
            {isAdmin && <button className="btn sm bd" title="Delete" onClick={() => delReport(r.id)}><i className="fas fa-trash" /></button>}
          </div>
        </div>
      </div>
    );
  };

  /* ---------- pages ---------- */
  const authPage = () => (
    <div className="auth">
      {mode === "login" ? (
        <div className="card">
          <h2>Welcome Back</h2>
          <p className="sub">Sign in to your account</p>
          <form onSubmit={(e) => { e.preventDefault(); login(); }}>
            <div className="fg"><label><i className="fas fa-envelope" /> Email Address</label>
              <input type="email" className="fc" placeholder="Enter your email" required value={lf.email} onChange={(e) => setLf({ ...lf, email: e.target.value })} /></div>
            <div className="fg"><label><i className="fas fa-lock" /> Password</label>
              <input type="password" className="fc" placeholder="Enter your password" required value={lf.password} onChange={(e) => setLf({ ...lf, password: e.target.value })} /></div>
            <button className="btn b1" style={{ width: "100%" }}><i className="fas fa-sign-in-alt" /> Sign In</button>
          </form>
          <div className="foot">Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); setMode("register"); }}>Register here</a></div>
        </div>
      ) : (
        <div className="card">
          <h2>Create Account</h2>
          <p className="sub">Join our community</p>
          <form onSubmit={(e) => { e.preventDefault(); register(); }}>
            <div className="fg"><label><i className="fas fa-user" /> Full Name</label>
              <input className="fc" placeholder="Enter your full name" required value={rf.name} onChange={(e) => setRf({ ...rf, name: e.target.value })} /></div>
            <div className="fg"><label><i className="fas fa-envelope" /> Email Address</label>
              <input type="email" className="fc" placeholder="Enter your email" required value={rf.email} onChange={(e) => setRf({ ...rf, email: e.target.value })} /></div>
            <div className="fg"><label><i className="fas fa-lock" /> Password</label>
              <input type="password" className="fc" placeholder="Create a password (min 6 characters)" required value={rf.pass} onChange={(e) => setRf({ ...rf, pass: e.target.value })} /></div>
            <div className="fg"><label><i className="fas fa-user-tag" /> Account Type</label>
              <select className="fc" value={rf.role} onChange={(e) => setRf({ ...rf, role: e.target.value })}>
                <option value="resident">Resident</option>
                <option value="staff">Staff Member</option>
              </select></div>
            <button className="btn b1" style={{ width: "100%" }}><i className="fas fa-user-plus" /> Create Account</button>
          </form>
          <div className="foot">Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setMode("login"); }}>Sign in here</a></div>
        </div>
      )}
    </div>
  );

  const dashPage = () => {
    const r = getReports();
    const c = (s) => r.filter((x) => x.status === s).length;
    return (
      <>
        <div className="ch">
          <h1><i className="fas fa-tachometer-alt" /> Dashboard Overview</h1>
          <p>Welcome back, {cur.fullName}! Here's what's happening in your community.</p>
        </div>
        <div className="grid">
          <div className="stat"><i className="fas fa-flag" /><b>{r.length}</b><span>Total Reports</span></div>
          <div className="stat"><i className="fas fa-clock" /><b>{c("pending")}</b><span>Pending</span></div>
          <div className="stat"><i className="fas fa-spinner" /><b>{c("in-progress")}</b><span>In Progress</span></div>
          <div className="stat"><i className="fas fa-check-circle" /><b>{c("resolved")}</b><span>Resolved</span></div>
        </div>
        <div className="card">
          <div className="card-h">
            <h2><i className="fas fa-history" /> Recent Reports</h2>
            {isStaff ? <button className="btn b1" onClick={() => go("all")}><i className="fas fa-eye" /> View All</button>
              : isResident ? <button className="btn b1" onClick={() => setModal("report")}><i className="fas fa-plus" /> New Report</button> : null}
          </div>
          <div className="rgrid">
            {r.length ? r.slice(0, 4).map((x) => card(x)) : <div className="empty">No reports yet</div>}
          </div>
        </div>
        {isAdmin && (
          <div className="card">
            <div className="card-h"><h2><i className="fas fa-chart-bar" /> Community Statistics</h2></div>
            <div className="grid" style={{ margin: 0 }}>
              <div className="stat"><b>{getUsers().length}</b><span>Total Users</span></div>
              <div className="stat"><b>{c("resolved")}</b><span>Issues Resolved</span></div>
              <div className="stat"><b>{c("pending")}</b><span>Active Issues</span></div>
            </div>
          </div>
        )}
      </>
    );
  };

  const setF = (k, v) => { const n = { ...filt, [k]: v }; setFilt(n); S("cwm_filters", n); };
  const allPage = () => {
    const q = filt.q.toLowerCase();
    const list = getReports().filter((r) => {
      const txt = (r.title + " " + r.description + " " + r.location + " " + r.authorName).toLowerCase();
      return (!q || txt.includes(q)) && (!filt.t || r.type === filt.t) && (!filt.s || r.status === filt.s);
    });
    return (
      <>
        <div className="ch"><h1><i className="fas fa-list" /> All Community Reports</h1><p>Browse and manage waste reports from the community</p></div>
        <div className="sf">
          <input className="fc" placeholder="Search reports..." style={{ flex: 2 }} value={filt.q} onChange={(e) => setF("q", e.target.value)} />
          <select className="fc" value={filt.t} onChange={(e) => setF("t", e.target.value)}>
            <option value="">All Types</option><option value="recyclable">Recyclable</option><option value="hazardous">Hazardous</option>
            <option value="organic">Organic</option><option value="electronic">Electronic</option><option value="general">General</option>
          </select>
          <select className="fc" value={filt.s} onChange={(e) => setF("s", e.target.value)}>
            <option value="">All Status</option><option value="pending">Pending</option><option value="in-progress">In Progress</option><option value="resolved">Resolved</option>
          </select>
        </div>
        <div className="rgrid">{list.map((x) => card(x, 1))}</div>
        {!list.length && <div className="empty"><i className="fas fa-search" /><h3>No reports found</h3></div>}
      </>
    );
  };

  const minePage = () => {
    const r = getReports().filter((x) => x.authorId === cur.id);
    return (
      <>
        <div className="ch"><h1><i className="fas fa-file-alt" /> My Reports</h1><p>View and manage your submitted waste reports</p></div>
        {r.length ? <div className="rgrid">{r.map((x) => card(x, 1))}</div> : (
          <div className="card"><div className="empty">
            <i className="fas fa-inbox" /><h3>No Reports Yet</h3><p>You haven't submitted any waste reports yet.</p>
            <button className="btn b1" style={{ marginTop: 18 }} onClick={() => setModal("report")}><i className="fas fa-plus" /> Submit Your First Report</button>
          </div></div>
        )}
      </>
    );
  };

  const usersPage = () => {
    const u = getUsers();
    const rc = { admin: "#c01c28", staff: "#1a5fb4", resident: "#26a269" };
    return (
      <>
        <div className="ch"><h1><i className="fas fa-users" /> User Management</h1><p>Manage system users</p></div>
        <div className="card">
          <div className="card-h"><h2><i className="fas fa-user-friends" /> All Users</h2><span style={{ color: "var(--mut)" }}>{u.length} users</span></div>
          <div className="tw"><table>
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {u.map((x) => (
                <tr key={x.id}>
                  <td>{x.id}</td>
                  <td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><div className="av" style={{ background: x.avatarColor }}>{x.fullName[0]}</div>{x.fullName}</div></td>
                  <td>{x.email}</td>
                  <td><span className="tag" style={{ background: rc[x.role] || "#64748b" }}>{x.role}</span></td>
                  <td>{new Date(x.joinDate).toLocaleDateString()}</td>
                  <td>{x.id !== cur.id
                    ? <button className="btn sm bd" onClick={() => delUser(x.id)}><i className="fas fa-trash" /> Delete</button>
                    : <span style={{ color: "var(--mut)" }}>Current User</span>}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      </>
    );
  };

  /* ---------- modals ---------- */
  const backdrop = (e) => { if (e.target === e.currentTarget) closeModal(); };
  const shown = rid ? getReports().find((x) => x.id === rid) : null;

  const reportModal = (
    <div className="modal" onClick={backdrop}><div className="mc">
      <div className="mh"><h3><i className="fas fa-plus-circle" /> Report Waste Issue</h3><button onClick={closeModal}>&times;</button></div>
      <div className="mbody">
        <form onSubmit={(e) => { e.preventDefault(); submitReport(); }}>
          <div className="fg"><label>Issue Title</label>
            <input className="fc" placeholder="e.g., Overflowing bins on Main Street" required value={rep.title} onChange={(e) => setField("title", e.target.value)} /></div>
          <div className="fg"><label>Waste Type</label>
            <select className="fc" required value={rep.type} onChange={(e) => setField("type", e.target.value)}>
              <option value="">Select waste type</option>
              <option value="recyclable">Recyclable (plastic, paper, glass)</option>
              <option value="hazardous">Hazardous (chemicals, batteries)</option>
              <option value="organic">Organic (food, garden waste)</option>
              <option value="electronic">Electronic Waste</option>
              <option value="general">General Waste</option>
            </select></div>
          <div className="fg"><label>Location</label>
            <input className="fc" placeholder="e.g., Near Central Park" required value={rep.loc} onChange={(e) => setField("loc", e.target.value)} /></div>
          <div className="fg"><label>Description</label>
            <textarea className="fc" rows={4} placeholder="Details about the waste issue..." required value={rep.desc} onChange={(e) => setField("desc", e.target.value)} /></div>
          <div className="fg"><label><i className="fas fa-camera" /> Photo (optional)</label>
            <input type="file" accept="image/*" className="fc" onChange={pickPhoto} />
            {photo && <img src={photo} alt="Preview" style={{ display: "block", maxWidth: "100%", maxHeight: 200, borderRadius: 10, marginTop: 10 }} />}</div>
          <div className="fg"><label>Priority</label>
            <select className="fc" value={rep.pri} onChange={(e) => setField("pri", e.target.value)}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
            </select></div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button type="button" className="btn b2" onClick={closeModal}>Cancel</button>
            <button className="btn b1"><i className="fas fa-paper-plane" /> Submit Report</button>
          </div>
        </form>
      </div>
    </div></div>
  );

  const detailModal = shown && (
    <div className="modal" onClick={backdrop}><div className="mc">
      <div className="mh"><h3><i className="fas fa-file-alt" /> Report Details</h3><button onClick={closeModal}>&times;</button></div>
      <div className="mbody">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          <span className={`tag t-${shown.type}`}>{shown.type}</span>
          <span className={`tag s-${shown.status}`}>{shown.status}</span>
          <span className={`tag p-${shown.priority}`}>{shown.priority}</span>
        </div>
        <h3 style={{ marginBottom: 14 }}>{shown.title}</h3>
        {canSee(shown) && <img src={shown.photo} alt="Report photo" style={{ width: "100%", maxHeight: 320, objectFit: "contain", background: "#0e1624", borderRadius: 12, marginBottom: 14 }} />}
        <div className="box"><h5><i className="fas fa-map-marker-alt" /> Location</h5>{shown.location}</div>
        <div className="box"><h5><i className="fas fa-file-alt" /> Description</h5>{shown.description}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="box"><h5><i className="fas fa-user" /> Reported By</h5><b>{shown.authorName}</b></div>
          <div className="box"><h5><i className="fas fa-calendar" /> Date</h5><b>{shown.date}</b></div>
          <div className="box" style={{ textAlign: "center" }}><b style={{ fontSize: "1.5rem", color: "var(--pl)" }}>{shown.upvotes}</b><div style={{ color: "var(--mut)" }}>Upvotes</div></div>
          <div className="box" style={{ textAlign: "center" }}><b style={{ fontSize: "1.5rem", color: "var(--info)" }}>{cc(shown.id)}</b><div style={{ color: "var(--mut)" }}>Comments</div></div>
        </div>
      </div>
      <div className="mf">
        <button className="btn b2" onClick={closeModal}>Close</button>
        <button className="btn b1" onClick={() => openComments()}><i className="fas fa-comment" /> View Comments</button>
      </div>
    </div></div>
  );

  const commentList = getComments()
    .filter((x) => x.reportId === rid)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const commentModal = (
    <div className="modal" onClick={backdrop}><div className="mc">
      <div className="mh"><h3><i className="fas fa-comments" /> Comments</h3><button onClick={closeModal}>&times;</button></div>
      <div className="mbody">
        <textarea className="fc" rows={3} placeholder="Add your comment..." value={cText} onChange={(e) => onCText(e.target.value)} />
        <button className="btn b1" style={{ marginTop: 10 }} onClick={addComment}><i className="fas fa-paper-plane" /> Post Comment</button>
        <div>
          {commentList.length ? commentList.map((x) => (
            <div className="cm" key={x.id}>
              <div className="cm-h">
                <div className="au">
                  <div className="av" style={{ background: colorOf(x.userId) }}>{x.userName[0]}</div>
                  <div><strong>{x.userName}</strong><div style={{ fontSize: ".78rem", color: "var(--mut)" }}>{new Date(x.timestamp).toLocaleString()}</div></div>
                </div>
                <div className="acts">
                  <button className="btn sm" onClick={() => likeComment(x.id)}><i className="fas fa-thumbs-up" /> {x.likes}</button>
                  {(x.userId === cur.id || isAdmin) && <button className="btn sm bd" onClick={() => delComment(x.id)}><i className="fas fa-trash" /></button>}
                </div>
              </div>
              {x.content}
            </div>
          )) : <div className="empty"><i className="fas fa-comment-slash" /><h4>No comments yet</h4><p>Be the first to comment</p></div>}
        </div>
      </div>
      <div className="mf"><button className="btn b2" onClick={closeModal}>Close</button></div>
    </div></div>
  );

  /* ---------- layout ---------- */
  const navLink = (p, ic, label, onClick) => (
    <li key={p}><a href="#" className={view === p && p !== "new" ? "on" : ""} onClick={(e) => { e.preventDefault(); onClick(); }}><i className={`fas fa-${ic}`} /> {label}</a></li>
  );

  return (
    <div className="cwm">
      <style>{css}</style>

      <header>
        <div className="container hc">
          <div className="logo"><i className="fas fa-recycle" /><span>CommunityCleanUp</span></div>
          {cur && (
            <nav>
              <ul>
                {navLink("dash", "home", "Dashboard", () => go("dash"))}
                {isResident && navLink("new", "plus-circle", "New Report", () => setModal("report"))}
                {isResident && navLink("mine", "file-alt", "My Reports", () => go("mine"))}
                {isStaff && navLink("all", "list", "All Reports", () => go("all"))}
                {isAdmin && navLink("users", "users", "Users", () => go("users"))}
              </ul>
            </nav>
          )}
          <div className="ui">
            {cur ? (
              <>
                <div className="ub">
                  <div className="av" style={{ background: cur.avatarColor }}>{cur.fullName[0]}</div>
                  <div><div style={{ fontWeight: 600 }}>{cur.fullName}</div><div style={{ fontSize: ".8rem", color: "var(--mut)" }}>{cur.role}</div></div>
                </div>
                <button className="btn bd sm" onClick={logout}><i className="fas fa-sign-out-alt" /> Logout</button>
              </>
            ) : onBack ? (
              <button className="btn b2 sm" onClick={onBack}><i className="fas fa-arrow-left" /> Back to home</button>
            ) : null}
          </div>
        </div>
      </header>

      <main>
        <div className="container">
          {!cur ? authPage()
            : view === "all" ? allPage()
            : view === "mine" ? minePage()
            : view === "users" ? usersPage()
            : dashPage()}
        </div>
      </main>

      {cur && modal === "report" && reportModal}
      {cur && modal === "detail" && detailModal}
      {cur && modal === "comments" && commentModal}

      {toastS && (
        <div className={"toast" + (toastS.err ? " err" : "")}>
          <i className={toastS.err ? "fas fa-exclamation-circle" : "fas fa-check-circle"} />
          <div><strong>{toastS.t}</strong><div>{toastS.m}</div></div>
        </div>
      )}
    </div>
  );
}

/* All rules are nested under .cwm (native CSS nesting) so they never leak into Home.jsx */
const css = `
.cwm{
  --p:#16a34a;--pl:#4ade80;--pd:#14532d;--txt:#e6edf3;--mut:#94a3b8;--card:#131c2b;--soft:#182235;--line:rgba(148,163,184,.18);--danger:#ef4444;--warn:#f59e0b;--info:#3b82f6;color-scheme:dark;
  font-family:'Segoe UI',Tahoma,sans-serif;background:radial-gradient(circle at top,#14213a 0%,#0b1220 55%,#070b14 100%) fixed;color:var(--txt);line-height:1.6;min-height:100vh;width:100%;text-align:left;

  *{margin:0;padding:0;box-sizing:border-box}
  .container{max-width:1400px;margin:0 auto;padding:0 20px}
  header{background:linear-gradient(135deg,#0f2a1a,#0b1220);border-bottom:1px solid rgba(74,222,128,.25);box-shadow:0 4px 24px rgba(0,0,0,.5);padding:1rem 0;position:sticky;top:0;z-index:1000}
  .hc{display:flex;justify-content:space-between;align-items:center;gap:15px;flex-wrap:wrap}
  .logo{display:flex;align-items:center;gap:12px;font-size:1.7rem;font-weight:700}
  .logo i{color:var(--pl);font-size:2rem}
  nav ul{display:flex;list-style:none;gap:8px;background:rgba(255,255,255,.06);padding:5px;border-radius:12px;flex-wrap:wrap}
  nav a{color:var(--txt);text-decoration:none;padding:9px 16px;border-radius:8px;display:flex;gap:8px;align-items:center;font-weight:500;transition:.2s}
  nav a:hover{background:rgba(255,255,255,.12);text-decoration:none}
  nav a.on{background:var(--p);color:#fff}
  .ui{display:flex;align-items:center;gap:12px}
  .ub{background:rgba(255,255,255,.08);padding:6px 14px;border-radius:25px;display:flex;align-items:center;gap:10px}
  .av{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;flex:none}
  main{padding:30px 0;min-height:calc(100vh - 120px)}
  .ch{margin-bottom:28px}
  .ch h1{font-size:2rem;display:flex;gap:10px;align-items:center}
  .ch p{color:var(--mut)}
  .card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:25px;margin-bottom:25px;box-shadow:0 8px 32px rgba(0,0,0,.45)}
  .card-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid var(--line)}
  .card-h h2{font-size:1.4rem;display:flex;gap:10px;align-items:center}
  .fg{margin-bottom:18px}
  .fg label{display:block;margin-bottom:7px;font-weight:600;font-size:.95rem}
  .fc{width:100%;padding:12px 16px;border:2px solid #26344a;border-radius:10px;font:inherit;background:#0e1624;color:var(--txt);transition:.2s}
  .fc::placeholder{color:#64748b}
  .fc:focus{outline:none;border-color:var(--pl);box-shadow:0 0 0 3px rgba(74,222,128,.18)}
  select.fc option{background:#0e1624;color:var(--txt)}
  .btn{padding:11px 22px;border:none;border-radius:10px;cursor:pointer;font:600 15px 'Segoe UI',Tahoma,sans-serif;display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#223046;color:var(--txt);transition:.2s}
  .btn:hover{transform:translateY(-2px)}
  .b1{background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff}
  .b1:hover{box-shadow:0 6px 20px rgba(34,197,94,.35)}
  .b2{background:transparent;border:2px solid var(--pl);color:var(--pl)}
  .b2:hover{background:var(--pl);color:#0b1220}
  .bi{background:#2563eb;color:#fff}
  .bw{background:#d97706;color:#fff}
  .bd{background:#dc2626;color:#fff}
  .bs{background:#16a34a;color:#fff}
  .sm{padding:7px 13px;font-size:14px;border-radius:8px}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:22px;margin-bottom:28px}
  .rgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:22px}
  .stat{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:24px;text-align:center;position:relative;overflow:hidden;transition:.3s}
  .stat:before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,var(--p),var(--pl))}
  .stat:hover,.rc:hover{transform:translateY(-4px);border-color:rgba(74,222,128,.4)}
  .stat i{font-size:2.6rem;color:var(--pl)}
  .stat b{display:block;font-size:2.4rem;margin:6px 0}
  .stat span{color:var(--mut)}
  .rc{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;transition:.3s;cursor:pointer;display:flex;flex-direction:column}
  .rh{padding:13px 15px;background:var(--soft);display:flex;justify-content:space-between;align-items:center}
  .rb{padding:15px;flex:1}
  .rb h3{font-size:1.15rem;margin-bottom:8px}
  .rb p{color:#b6c2d1;font-size:.95rem}
  .loc{display:flex;gap:8px;align-items:center;color:var(--mut);font-size:.9rem;margin-top:10px}
  .rf{padding:12px 15px;background:#101826;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
  .au{display:flex;align-items:center;gap:8px;font-size:.85rem}
  .au .av{width:30px;height:30px;font-size:.8rem}
  .acts{display:flex;gap:6px;flex-wrap:wrap}
  .tag{padding:5px 12px;border-radius:20px;font-size:.78rem;font-weight:600;color:#fff;text-transform:uppercase;letter-spacing:.4px;display:inline-block}
  .t-recyclable{background:#16a34a}.t-hazardous{background:#dc2626}.t-organic{background:#65a30d}.t-electronic{background:#2563eb}.t-general{background:#d97706}
  .s-pending{background:#ffd166;color:#5c4200}.s-in-progress{background:#0891b2}.s-resolved{background:#16a34a}
  .p-low{background:#475569}.p-medium{background:#2563eb}.p-high{background:#d97706}.p-critical{background:#dc2626}
  .tw{overflow-x:auto;border-radius:12px;border:1px solid var(--line)}
  table{width:100%;border-collapse:collapse}
  th{background:var(--soft);padding:14px;text-align:left}
  td{padding:14px;border-bottom:1px solid #1f2b3f}
  tr:hover td{background:#172134}
  .modal{display:flex;position:fixed;inset:0;background:rgba(2,6,14,.78);z-index:2000;align-items:center;justify-content:center;backdrop-filter:blur(5px)}
  .mc{background:var(--card);border:1px solid var(--line);border-radius:20px;width:92%;max-width:600px;max-height:90vh;overflow-y:auto;box-shadow:0 25px 50px rgba(0,0,0,.6)}
  .mh{padding:20px 26px;background:var(--soft);border-radius:20px 20px 0 0;display:flex;justify-content:space-between;align-items:center}
  .mh h3{font-size:1.3rem}
  .mh button{background:none;border:none;color:var(--mut);font-size:1.6rem;cursor:pointer}
  .mh button:hover{color:var(--danger)}
  .mbody{padding:26px}
  .mf{padding:16px 26px;background:var(--soft);border-radius:0 0 20px 20px;display:flex;justify-content:flex-end;gap:10px}
  .cm{background:#0e1624;border:1px solid var(--line);border-radius:12px;padding:14px;margin-top:12px}
  .cm-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:8px}
  .auth{max-width:440px;margin:50px auto}
  .auth .card{padding:42px}
  .auth h2{text-align:center;font-size:2rem}
  .auth .sub{text-align:center;color:var(--mut);margin-bottom:30px}
  .auth .foot{text-align:center;margin-top:24px;padding-top:20px;border-top:1px solid var(--line);color:var(--mut)}
  a{color:var(--pl);font-weight:600;text-decoration:none}
  a:hover{text-decoration:underline}
  .sf{display:flex;gap:14px;margin-bottom:24px;flex-wrap:wrap}
  .sf .fc{flex:1;min-width:180px}
  .empty{text-align:center;padding:50px 20px;color:var(--mut)}
  .empty i{font-size:3.5rem;opacity:.5;margin-bottom:14px}
  .box{background:var(--soft);padding:16px;border-radius:12px;margin-bottom:14px}
  .box h5{color:var(--mut);margin-bottom:6px}
  .toast{position:fixed;bottom:28px;right:28px;background:var(--soft);border:1px solid var(--line);padding:16px 22px;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.6);display:flex;align-items:center;gap:14px;z-index:3000;max-width:380px;border-left:5px solid var(--p)}
  .toast.err{border-left-color:var(--danger)}
  .toast i{font-size:1.5rem;color:var(--pl)}
  .toast.err i{color:var(--danger)}
  ::-webkit-scrollbar{width:10px;height:10px}
  ::-webkit-scrollbar-track{background:#0b1220}
  ::-webkit-scrollbar-thumb{background:#26344a;border-radius:8px}
  @media(max-width:600px){
    .rgrid{grid-template-columns:1fr}
    .auth .card{padding:26px}
  }
}
`;