import { useState, useEffect, useCallback, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  where,
} from "firebase/firestore";

// ─── Firebase Config ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDDEOXH5FE-acR913T2hbjLDZN9t0q2iXA",
  authDomain: "gestion-hogar-d4397.firebaseapp.com",
  projectId: "gestion-hogar-d4397",
  storageBucket: "gestion-hogar-d4397.firebasestorage.app",
  messagingSenderId: "826037914996",
  appId: "1:826037914996:web:f0f6972e023b07d6283021",
};

const CLOUDINARY_CLOUD = "dmrcfwu26";
const CLOUDINARY_UPLOAD_PRESET = "casa_storage_unsigned";

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// ─── Constants ────────────────────────────────────────────────────────────────
const ROOM_ICONS = ["🛋️","🛏️","🍳","🚿","🚗","📦","🌿","🏠","📚","🧹"];
const FURNITURE_TYPES = ["Armario","Cajón","Estante","Caja","Cajón bajo cama","Cómoda","Zapatero","Nevera","Congelador","Trastero","Otro"];
const EXPENSE_CATEGORIES = [
  { id: "luz", label: "Luz", icon: "⚡" },
  { id: "agua", label: "Agua", icon: "💧" },
  { id: "gas", label: "Gas", icon: "🔥" },
  { id: "compras", label: "Compras", icon: "🛒" },
  { id: "coche", label: "Coche", icon: "🚗" },
  { id: "internet", label: "Internet", icon: "📡" },
  { id: "alquiler", label: "Alquiler/Hipoteca", icon: "🏠" },
  { id: "varios", label: "Varios", icon: "📋" },
];
const ITEM_TAGS = ["Ropa","Herramientas","Documentos","Electrónica","Medicamentos","Limpieza","Cocina","Deportes","Libros","Juguetes","Varios"];
const USER_COLORS = ["#e8715a","#5a9fe8","#5ae87a","#e8c95a","#c25ae8","#5ae8d4"];

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700;1,9..144,300&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0f0f11; --bg2: #17171a; --bg3: #1f1f24; --bg4: #27272e;
    --border: #2e2e38; --text: #f0f0f0; --text2: #9999aa; --text3: #666677;
    --accent: #e8715a; --accent2: #f0a090; --accent-bg: rgba(232,113,90,0.12);
    --green: #5ae87a; --blue: #5a9fe8; --yellow: #e8c95a;
    --radius: 14px; --radius-sm: 8px; --shadow: 0 4px 24px rgba(0,0,0,0.4);
    --font-display: 'Fraunces', serif; --font-body: 'DM Sans', sans-serif;
    --sidebar: 240px;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--font-body); min-height: 100vh; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
  .app-shell { display: flex; min-height: 100vh; }
  .sidebar { width: var(--sidebar); background: var(--bg2); border-right: 1px solid var(--border); display: flex; flex-direction: column; position: fixed; top: 0; left: 0; height: 100vh; z-index: 100; }
  .sidebar-logo { padding: 24px 20px 16px; border-bottom: 1px solid var(--border); }
  .sidebar-logo h1 { font-family: var(--font-display); font-size: 22px; font-weight: 700; color: var(--text); letter-spacing: -0.5px; }
  .sidebar-logo span { color: var(--accent); }
  .sidebar-logo p { font-size: 11px; color: var(--text3); margin-top: 2px; }
  .sidebar-nav { flex: 1; padding: 12px 0; overflow-y: auto; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 20px; cursor: pointer; transition: all 0.15s; font-size: 13.5px; color: var(--text2); font-weight: 400; border: none; background: none; width: 100%; text-align: left; }
  .nav-item:hover { background: var(--bg3); color: var(--text); }
  .nav-item.active { background: var(--accent-bg); color: var(--accent); font-weight: 500; }
  .nav-item .icon { font-size: 16px; width: 20px; text-align: center; }
  .sidebar-user { padding: 16px 20px; border-top: 1px solid var(--border); display: flex; align-items: center; gap: 10px; }
  .user-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; flex-shrink: 0; color: #fff; }
  .user-info { flex: 1; min-width: 0; }
  .user-name { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .user-role { font-size: 11px; color: var(--text3); }
  .logout-btn { background: none; border: none; color: var(--text3); cursor: pointer; padding: 4px; border-radius: 6px; transition: color 0.15s; font-size: 16px; display: flex; align-items: center; }
  .logout-btn:hover { color: var(--accent); }
  .main-content { margin-left: var(--sidebar); flex: 1; padding: 32px; min-height: 100vh; max-width: calc(100vw - var(--sidebar)); }
  .page-header { margin-bottom: 28px; }
  .page-title { font-family: var(--font-display); font-size: 32px; font-weight: 500; color: var(--text); letter-spacing: -1px; }
  .page-subtitle { font-size: 14px; color: var(--text2); margin-top: 4px; }
  .card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; transition: border-color 0.2s; }
  .card:hover { border-color: var(--bg4); }
  .card-sm { padding: 14px 16px; }
  .card-clickable { cursor: pointer; }
  .card-clickable:hover { border-color: var(--accent); background: var(--bg3); }
  .grid-2 { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 18px; border-radius: var(--radius-sm); font-family: var(--font-body); font-size: 13.5px; font-weight: 500; cursor: pointer; border: none; transition: all 0.15s; white-space: nowrap; }
  .btn-primary { background: var(--accent); color: #fff; }
  .btn-primary:hover { background: var(--accent2); transform: translateY(-1px); }
  .btn-ghost { background: var(--bg3); color: var(--text2); border: 1px solid var(--border); }
  .btn-ghost:hover { background: var(--bg4); color: var(--text); }
  .btn-danger { background: rgba(232,113,90,0.15); color: var(--accent); border: 1px solid var(--accent); }
  .btn-danger:hover { background: var(--accent); color: #fff; }
  .btn-sm { padding: 6px 12px; font-size: 12px; }
  .btn-icon { padding: 8px; border-radius: 8px; background: var(--bg3); border: 1px solid var(--border); color: var(--text2); cursor: pointer; transition: all 0.15s; font-size: 16px; display: inline-flex; align-items: center; }
  .btn-icon:hover { background: var(--bg4); color: var(--text); }
  .form-group { margin-bottom: 16px; }
  .form-label { display: block; font-size: 12px; font-weight: 500; color: var(--text2); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  .form-input { width: 100%; background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px 14px; color: var(--text); font-family: var(--font-body); font-size: 14px; transition: border-color 0.15s; outline: none; }
  .form-input:focus { border-color: var(--accent); }
  .form-input::placeholder { color: var(--text3); }
  select.form-input { cursor: pointer; }
  textarea.form-input { resize: vertical; min-height: 80px; }
  .search-wrapper { position: relative; }
  .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text3); font-size: 15px; }
  .search-input { padding-left: 38px !important; }
  .tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; background: var(--bg4); color: var(--text2); border: 1px solid var(--border); }
  .tag-accent { background: var(--accent-bg); color: var(--accent); border-color: rgba(232,113,90,0.3); }
  .tag-green { background: rgba(90,232,122,0.1); color: var(--green); border-color: rgba(90,232,122,0.3); }
  .tag-blue { background: rgba(90,159,232,0.1); color: var(--blue); border-color: rgba(90,159,232,0.3); }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.15s ease; }
  .modal { background: var(--bg2); border: 1px solid var(--border); border-radius: 18px; padding: 28px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; animation: slideUp 0.2s ease; box-shadow: var(--shadow); }
  .modal-lg { max-width: 620px; }
  .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
  .modal-title { font-family: var(--font-display); font-size: 22px; font-weight: 500; }
  .modal-close { background: none; border: none; color: var(--text3); cursor: pointer; font-size: 20px; padding: 4px; border-radius: 6px; transition: color 0.15s; }
  .modal-close:hover { color: var(--text); }
  .modal-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px; }
  .login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); padding: 20px; background-image: radial-gradient(ellipse at 20% 50%, rgba(232,113,90,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(90,159,232,0.05) 0%, transparent 50%); }
  .login-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 20px; padding: 40px; width: 100%; max-width: 400px; box-shadow: var(--shadow); }
  .login-logo { text-align: center; margin-bottom: 32px; }
  .login-logo h1 { font-family: var(--font-display); font-size: 36px; font-weight: 700; color: var(--text); }
  .login-logo span { color: var(--accent); }
  .login-logo p { color: var(--text2); font-size: 14px; margin-top: 6px; }
  .login-tabs { display: flex; background: var(--bg3); border-radius: 10px; padding: 3px; margin-bottom: 24px; }
  .login-tab { flex: 1; padding: 8px; text-align: center; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; color: var(--text2); transition: all 0.15s; border: none; background: none; }
  .login-tab.active { background: var(--bg2); color: var(--text); box-shadow: 0 1px 4px rgba(0,0,0,0.3); }
  .breadcrumb { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; font-size: 13px; color: var(--text3); }
  .breadcrumb-item { cursor: pointer; transition: color 0.15s; }
  .breadcrumb-item:hover { color: var(--text); }
  .breadcrumb-sep { color: var(--border); }
  .room-card { position: relative; }
  .room-icon { font-size: 36px; margin-bottom: 12px; display: block; }
  .room-name { font-family: var(--font-display); font-size: 18px; font-weight: 500; margin-bottom: 4px; }
  .room-meta { font-size: 12px; color: var(--text3); }
  .room-count { position: absolute; top: 14px; right: 14px; background: var(--bg4); border-radius: 20px; padding: 2px 10px; font-size: 11px; color: var(--text2); }
  .item-photo { width: 100%; height: 140px; border-radius: 10px; margin-bottom: 12px; background: var(--bg3); display: flex; align-items: center; justify-content: center; color: var(--text3); font-size: 32px; overflow: hidden; }
  .item-photo img { width: 100%; height: 100%; object-fit: cover; }
  .item-name { font-weight: 500; font-size: 15px; margin-bottom: 4px; }
  .item-location { font-size: 12px; color: var(--text2); margin-bottom: 8px; }
  .item-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
  .item-meta { font-size: 11px; color: var(--text3); display: flex; align-items: center; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border); }
  .expense-bar { height: 4px; background: var(--bg4); border-radius: 2px; margin-top: 8px; overflow: hidden; }
  .expense-bar-fill { height: 100%; background: var(--accent); border-radius: 2px; transition: width 0.5s ease; }
  .stat-card { text-align: center; padding: 20px; }
  .stat-value { font-family: var(--font-display); font-size: 36px; font-weight: 300; color: var(--accent); }
  .stat-label { font-size: 12px; color: var(--text3); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  .history-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); }
  .history-item:last-child { border-bottom: none; }
  .history-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); margin-top: 5px; flex-shrink: 0; }
  .history-text { font-size: 13px; color: var(--text2); flex: 1; }
  .history-text strong { color: var(--text); }
  .history-time { font-size: 11px; color: var(--text3); }
  .toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 24px; flex-wrap: wrap; }
  .toolbar-right { margin-left: auto; display: flex; gap: 8px; }
  .empty-state { text-align: center; padding: 60px 20px; color: var(--text3); }
  .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
  .empty-title { font-size: 16px; color: var(--text2); margin-bottom: 8px; }
  .empty-desc { font-size: 13px; }
  .toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 999; display: flex; flex-direction: column; gap: 8px; }
  .toast { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 12px 16px; font-size: 13px; display: flex; align-items: center; gap: 10px; box-shadow: var(--shadow); animation: slideUp 0.2s ease; max-width: 320px; }
  .toast-success { border-color: rgba(90,232,122,0.4); }
  .toast-error { border-color: rgba(232,113,90,0.4); }
  .photo-upload { border: 2px dashed var(--border); border-radius: var(--radius); padding: 24px; text-align: center; cursor: pointer; transition: all 0.2s; color: var(--text3); }
  .photo-upload:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-bg); }
  .photo-upload-icon { font-size: 32px; margin-bottom: 8px; }
  .photo-preview { position: relative; border-radius: var(--radius); overflow: hidden; }
  .photo-preview img { width: 100%; height: 200px; object-fit: cover; display: block; }
  .photo-remove { position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.6); border: none; color: #fff; border-radius: 6px; padding: 4px 8px; cursor: pointer; font-size: 12px; }
  .color-picker { display: flex; gap: 8px; flex-wrap: wrap; }
  .color-dot { width: 28px; height: 28px; border-radius: 50%; cursor: pointer; transition: transform 0.15s; border: 2px solid transparent; }
  .color-dot:hover { transform: scale(1.1); }
  .color-dot.selected { border-color: #fff; transform: scale(1.1); }
  .tabs { display: flex; border-bottom: 1px solid var(--border); margin-bottom: 24px; }
  .tab-item { padding: 10px 20px; font-size: 13.5px; cursor: pointer; color: var(--text3); border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.15s; }
  .tab-item:hover { color: var(--text); }
  .tab-item.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 500; }
  .month-nav { display: flex; align-items: center; gap: 12px; }
  .month-nav span { font-family: var(--font-display); font-size: 18px; font-weight: 500; min-width: 160px; text-align: center; }
  .summary-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border); font-size: 14px; }
  .summary-row:last-child { border-bottom: none; }
  .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text3); padding: 8px 20px; margin-top: 8px; }
  .flex { display: flex; } .items-center { align-items: center; } .justify-between { justify-content: space-between; }
  .w-full { width: 100%; } .font-medium { font-weight: 500; }
  .text-sm { font-size: 13px; } .text-xs { font-size: 11px; } .text-muted { color: var(--text2); }
  .mt-2 { margin-top: 8px; } .mt-3 { margin-top: 12px; } .gap-2 { gap: 8px; } .gap-3 { gap: 12px; }
  .spinner { width: 20px; height: 20px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.6s linear infinite; }
  .loading-page { display: flex; align-items: center; justify-content: center; min-height: 100vh; flex-direction: column; gap: 16px; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  .fade-in { animation: fadeIn 0.3s ease; }
  /* Mobile bottom nav */
  .bottom-nav {
    display: none;
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
    background: var(--bg2); border-top: 1px solid var(--border);
    padding: 8px 0 max(8px, env(safe-area-inset-bottom));
  }
  .bottom-nav-items { display: flex; justify-content: space-around; align-items: center; }
  .bottom-nav-item {
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    padding: 6px 16px; border-radius: 10px; cursor: pointer;
    border: none; background: none; color: var(--text3); transition: all 0.15s;
    font-family: var(--font-body); font-size: 10px; font-weight: 500;
    min-width: 64px;
  }
  .bottom-nav-item .nav-icon { font-size: 20px; line-height: 1; }
  .bottom-nav-item.active { color: var(--accent); }
  .bottom-nav-item.active .nav-icon { transform: scale(1.1); }
  @media (max-width: 768px) {
    :root { --sidebar: 0px; }
    .sidebar { display: none; }
    .bottom-nav { display: block; }
    .main-content { margin-left: 0; padding: 16px; padding-bottom: 90px; }
    .grid-2, .grid-3 { grid-template-columns: 1fr; }
    .toast-container { bottom: 90px; }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (ts) => {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
};
const formatTime = (ts) => {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) + " · " + d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
};
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
const monthLabel = (mk) => {
  const [y,m] = mk.split("-");
  return new Date(Number(y), Number(m)-1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
};

const compressImage = (file) => new Promise((resolve) => {
  const maxW = 800, maxH = 800, quality = 0.75;
  const img = new Image();
  img.onload = () => {
    let w = img.width, h = img.height;
    if (w > maxW || h > maxH) {
      const ratio = Math.min(maxW / w, maxH / h);
      w = Math.round(w * ratio); h = Math.round(h * ratio);
    }
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
  };
  img.src = URL.createObjectURL(file);
});

const uploadToCloudinary = async (file) => {
  const compressed = await compressImage(file);
  const fd = new FormData();
  fd.append("file", compressed);
  fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  fd.append("folder", "casa-storage");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: "POST", body: fd });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.secure_url;
};

const logHistory = async (userId, userName, action, details) => {
  try {
    await addDoc(collection(db, "history"), { userId, userName, action, details, timestamp: serverTimestamp() });
  } catch (e) { /* non-critical */ }
};

// ─── Toast ────────────────────────────────────────────────────────────────────
const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts, show };
};

const ToastContainer = ({ toasts }) => (
  <div className="toast-container">
    {toasts.map(t => (
      <div key={t.id} className={`toast toast-${t.type}`}>
        <span>{t.type === "success" ? "✓" : "✕"}</span>{t.msg}
      </div>
    ))}
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, large }) => (
  <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className={`modal ${large ? "modal-lg" : ""}`}>
      <div className="modal-header">
        <h2 className="modal-title">{title}</h2>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>
      {children}
    </div>
  </div>
);

// ─── Photo Upload ─────────────────────────────────────────────────────────────
const PhotoUpload = ({ value, onChange, uploading, setUploading }) => {
  const fileRef = useRef();
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      onChange(url);
    } catch (err) {
      alert("Error subiendo foto: " + err.message);
    } finally { setUploading(false); }
  };
  if (value) return (
    <div className="photo-preview">
      <img src={value} alt="preview" />
      <button className="photo-remove" onClick={() => onChange("")}>✕ Quitar</button>
    </div>
  );
  return (
    <div className="photo-upload" onClick={() => fileRef.current.click()}>
      <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile} />
      <div className="photo-upload-icon">{uploading ? "⏳" : "📷"}</div>
      <div style={{fontSize:13}}>{uploading ? "Comprimiendo y subiendo..." : "Click para añadir foto"}</div>
      <div style={{fontSize:11,marginTop:4,color:"var(--text3)"}}>Se comprime automáticamente</div>
    </div>
  );
};

// ─── Login ────────────────────────────────────────────────────────────────────
const LoginPage = ({ onToast }) => {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState(USER_COLORS[0]);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try { await signInWithEmailAndPassword(auth, email, password); }
    catch (e) { onToast("Email o contraseña incorrectos", "error"); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!email || !password || !name) return onToast("Rellena todos los campos", "error");
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name, photoURL: color });
    } catch (e) {
      onToast(e.message.includes("already") ? "Email ya registrado" : e.message, "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-card fade-in">
        <div className="login-logo">
          <h1>Casa<span>.</span></h1>
          <p>Tu hogar, organizado</p>
        </div>
        <div className="login-tabs">
          <button className={`login-tab ${tab==="login"?"active":""}`} onClick={()=>setTab("login")}>Entrar</button>
          <button className={`login-tab ${tab==="register"?"active":""}`} onClick={()=>setTab("register")}>Registrarse</button>
        </div>
        {tab === "register" && (
          <div className="form-group">
            <label className="form-label">Tu nombre</label>
            <input className="form-input" placeholder="Ej: Ana" value={name} onChange={e=>setName(e.target.value)} />
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="hola@casa.com" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Contraseña</label>
          <input className="form-input" type="password" placeholder="••••••••" value={password}
            onChange={e=>setPassword(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&(tab==="login"?handleLogin():handleRegister())} />
        </div>
        {tab === "register" && (
          <div className="form-group">
            <label className="form-label">Tu color</label>
            <div className="color-picker">
              {USER_COLORS.map(c => (
                <div key={c} className={`color-dot ${color===c?"selected":""}`} style={{background:c}} onClick={()=>setColor(c)} />
              ))}
            </div>
          </div>
        )}
        <button className="btn btn-primary w-full" style={{justifyContent:"center",padding:"12px",width:"100%"}}
          onClick={tab==="login"?handleLogin:handleRegister} disabled={loading}>
          {loading ? <span className="spinner"/> : tab==="login" ? "Entrar" : "Crear cuenta"}
        </button>
      </div>
    </div>
  );
};

// ─── Rooms ────────────────────────────────────────────────────────────────────
const RoomsPage = ({ user, onToast, onNavigate }) => {
  const [rooms, setRooms] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name:"", icon:"🛋️" });
  const [furnitureCounts, setFurnitureCounts] = useState({});

  useEffect(() => {
    const q = query(collection(db, "rooms"), orderBy("createdAt","asc"));
    const unsub = onSnapshot(q, async snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRooms(data); setLoading(false);
      const counts = {};
      for (const room of data) {
        const fs = await getDocs(query(collection(db,"furniture"), where("roomId","==",room.id)));
        counts[room.id] = fs.size;
      }
      setFurnitureCounts(counts);
    });
    return unsub;
  }, []);

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    await addDoc(collection(db,"rooms"), { name:form.name.trim(), icon:form.icon, createdBy:user.uid, createdByName:user.displayName, createdAt:serverTimestamp(), updatedAt:serverTimestamp() });
    await logHistory(user.uid, user.displayName, "Creó estancia", form.name.trim());
    onToast("Estancia creada"); setShowAdd(false); setForm({ name:"", icon:"🛋️" });
  };

  const handleDelete = async (room) => {
    if (!confirm(`¿Eliminar "${room.name}"?`)) return;
    await deleteDoc(doc(db,"rooms",room.id));
    await logHistory(user.uid, user.displayName, "Eliminó estancia", room.name);
    onToast("Estancia eliminada");
  };

  if (loading) return <div className="loading-page"><div className="spinner"/></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Estancias</h1>
        <p className="page-subtitle">Las habitaciones y zonas de vuestra casa</p>
      </div>
      <div className="toolbar">
        <button className="btn btn-primary" onClick={()=>setShowAdd(true)}>+ Nueva estancia</button>
      </div>
      {rooms.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🏠</div><div className="empty-title">Aún no hay estancias</div><div className="empty-desc">Crea tu primera habitación</div></div>
      ) : (
        <div className="grid-2">
          {rooms.map(room => (
            <div key={room.id} className="card card-clickable room-card" onClick={()=>onNavigate("furniture",room)}>
              <span className="room-count">{furnitureCounts[room.id]||0} muebles</span>
              <span className="room-icon">{room.icon}</span>
              <div className="room-name">{room.name}</div>
              <div className="room-meta">Por {room.createdByName} · {formatDate(room.createdAt)}</div>
              <div style={{display:"flex",gap:8,marginTop:14}} onClick={e=>e.stopPropagation()}>
                <button className="btn btn-ghost btn-sm" onClick={()=>onNavigate("furniture",room)}>Ver muebles →</button>
                <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(room)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showAdd && (
        <Modal title="Nueva estancia" onClose={()=>setShowAdd(false)}>
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input className="form-input" placeholder="Ej: Salón, Dormitorio..." value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Icono</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {ROOM_ICONS.map(ic => (
                <span key={ic} onClick={()=>setForm(f=>({...f,icon:ic}))}
                  style={{fontSize:24,cursor:"pointer",padding:6,borderRadius:8,background:form.icon===ic?"var(--accent-bg)":"var(--bg3)",border:`1px solid ${form.icon===ic?"var(--accent)":"var(--border)"}`}}>
                  {ic}
                </span>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={()=>setShowAdd(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleAdd}>Crear estancia</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── Furniture ────────────────────────────────────────────────────────────────
const FurniturePage = ({ user, room, onToast, onNavigate }) => {
  const [furniture, setFurniture] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name:"", type:"Armario", description:"" });
  const [itemCounts, setItemCounts] = useState({});

  useEffect(() => {
    const q = query(collection(db,"furniture"), where("roomId","==",room.id), orderBy("createdAt","asc"));
    const unsub = onSnapshot(q, async snap => {
      const data = snap.docs.map(d=>({id:d.id,...d.data()}));
      setFurniture(data); setLoading(false);
      const counts = {};
      for (const f of data) {
        const is = await getDocs(query(collection(db,"items"), where("furnitureId","==",f.id)));
        counts[f.id] = is.size;
      }
      setItemCounts(counts);
    });
    return unsub;
  }, [room.id]);

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    await addDoc(collection(db,"furniture"), { name:form.name.trim(), type:form.type, description:form.description, roomId:room.id, roomName:room.name, createdBy:user.uid, createdByName:user.displayName, createdAt:serverTimestamp(), updatedAt:serverTimestamp() });
    await logHistory(user.uid, user.displayName, "Añadió mueble", `${form.name} en ${room.name}`);
    onToast("Mueble añadido"); setShowAdd(false); setForm({ name:"", type:"Armario", description:"" });
  };

  const handleDelete = async (f) => {
    if (!confirm(`¿Eliminar "${f.name}"?`)) return;
    await deleteDoc(doc(db,"furniture",f.id));
    await logHistory(user.uid, user.displayName, "Eliminó mueble", f.name);
    onToast("Mueble eliminado");
  };

  if (loading) return <div className="loading-page"><div className="spinner"/></div>;

  return (
    <div className="fade-in">
      <div className="breadcrumb">
        <span className="breadcrumb-item" onClick={()=>onNavigate("rooms")}>🏠 Estancias</span>
        <span className="breadcrumb-sep">›</span>
        <span style={{color:"var(--text)"}}>{room.icon} {room.name}</span>
      </div>
      <div className="page-header">
        <h1 className="page-title">{room.icon} {room.name}</h1>
        <p className="page-subtitle">Muebles y ubicaciones en esta estancia</p>
      </div>
      <div className="toolbar">
        <button className="btn btn-primary" onClick={()=>setShowAdd(true)}>+ Nuevo mueble</button>
      </div>
      {furniture.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🪑</div><div className="empty-title">Sin muebles aún</div><div className="empty-desc">Añade armarios, cajones, estantes...</div></div>
      ) : (
        <div className="grid-2">
          {furniture.map(f => (
            <div key={f.id} className="card card-clickable" onClick={()=>onNavigate("items",room,f)}>
              <div className="flex justify-between items-center" style={{marginBottom:10}}>
                <span className="tag">{f.type}</span>
                <span className="text-xs text-muted">{itemCounts[f.id]||0} objetos</span>
              </div>
              <div className="room-name" style={{fontSize:16}}>{f.name}</div>
              {f.description && <div className="room-meta" style={{marginTop:4}}>{f.description}</div>}
              <div className="room-meta" style={{marginTop:8}}>Por {f.createdByName} · {formatDate(f.createdAt)}</div>
              <div style={{display:"flex",gap:8,marginTop:14}} onClick={e=>e.stopPropagation()}>
                <button className="btn btn-ghost btn-sm" onClick={()=>onNavigate("items",room,f)}>Ver objetos →</button>
                <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(f)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showAdd && (
        <Modal title="Nuevo mueble" onClose={()=>setShowAdd(false)}>
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input className="form-input" placeholder="Ej: Armario grande, Cajón derecho..." value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select className="form-input" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
              {FURNITURE_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Descripción (opcional)</label>
            <input className="form-input" placeholder="Ej: El de la derecha al entrar" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={()=>setShowAdd(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleAdd}>Añadir mueble</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── Items ────────────────────────────────────────────────────────────────────
const ItemsPage = ({ user, room, furniture, onToast, onNavigate }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [uploading, setUploading] = useState(false);
  const emptyForm = { name:"", description:"", tags:[], photoUrl:"" };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const q = query(collection(db,"items"), where("furnitureId","==",furniture.id), orderBy("updatedAt","desc"));
    const unsub = onSnapshot(q, snap => { setItems(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); });
    return unsub;
  }, [furniture.id]);

  const filtered = items.filter(it => {
    const ms = !search || it.name.toLowerCase().includes(search.toLowerCase()) || (it.description||"").toLowerCase().includes(search.toLowerCase());
    const mt = !filterTag || (it.tags||[]).includes(filterTag);
    return ms && mt;
  });

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (editItem) {
      await updateDoc(doc(db,"items",editItem.id), { name:form.name.trim(), description:form.description, tags:form.tags, photoUrl:form.photoUrl, updatedBy:user.uid, updatedByName:user.displayName, updatedAt:serverTimestamp() });
      await logHistory(user.uid, user.displayName, "Editó objeto", `"${form.name}" en ${furniture.name} (${room.name})`);
      onToast("Objeto actualizado");
    } else {
      await addDoc(collection(db,"items"), { name:form.name.trim(), description:form.description, tags:form.tags, photoUrl:form.photoUrl, furnitureId:furniture.id, furnitureName:furniture.name, roomId:room.id, roomName:room.name, createdBy:user.uid, createdByName:user.displayName, updatedBy:user.uid, updatedByName:user.displayName, createdAt:serverTimestamp(), updatedAt:serverTimestamp() });
      await logHistory(user.uid, user.displayName, "Añadió objeto", `"${form.name}" en ${furniture.name} (${room.name})`);
      onToast("Objeto añadido");
    }
    setShowAdd(false); setEditItem(null); setForm(emptyForm);
  };

  const handleEdit = (item) => {
    setForm({ name:item.name, description:item.description||"", tags:item.tags||[], photoUrl:item.photoUrl||"" });
    setEditItem(item); setShowAdd(true);
  };

  const handleDelete = async (item) => {
    if (!confirm(`¿Eliminar "${item.name}"?`)) return;
    await deleteDoc(doc(db,"items",item.id));
    await logHistory(user.uid, user.displayName, "Eliminó objeto", `"${item.name}" de ${furniture.name}`);
    onToast("Objeto eliminado");
  };

  const toggleTag = (tag) => setForm(f=>({ ...f, tags: f.tags.includes(tag) ? f.tags.filter(t=>t!==tag) : [...f.tags,tag] }));

  if (loading) return <div className="loading-page"><div className="spinner"/></div>;

  return (
    <div className="fade-in">
      <div className="breadcrumb">
        <span className="breadcrumb-item" onClick={()=>onNavigate("rooms")}>🏠 Estancias</span>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-item" onClick={()=>onNavigate("furniture",room)}>{room.icon} {room.name}</span>
        <span className="breadcrumb-sep">›</span>
        <span style={{color:"var(--text)"}}>{furniture.name}</span>
      </div>
      <div className="page-header">
        <h1 className="page-title">{furniture.name}</h1>
        <p className="page-subtitle">{room.icon} {room.name} · {furniture.type}</p>
      </div>
      <div className="toolbar">
        <div className="search-wrapper" style={{flex:1,maxWidth:320}}>
          <span className="search-icon">🔍</span>
          <input className="form-input search-input" placeholder="Buscar objeto..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select className="form-input" style={{width:"auto"}} value={filterTag} onChange={e=>setFilterTag(e.target.value)}>
          <option value="">Todas las categorías</option>
          {ITEM_TAGS.map(t=><option key={t}>{t}</option>)}
        </select>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={()=>{setForm(emptyForm);setEditItem(null);setShowAdd(true)}}>+ Añadir objeto</button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📦</div><div className="empty-title">{items.length===0?"Sin objetos aún":"Sin resultados"}</div></div>
      ) : (
        <div className="grid-3">
          {filtered.map(item => (
            <div key={item.id} className="card">
              <div className="item-photo">{item.photoUrl ? <img src={item.photoUrl} alt={item.name}/> : "📦"}</div>
              <div className="item-name">{item.name}</div>
              {item.description && <div className="item-location">{item.description}</div>}
              {(item.tags||[]).length>0 && <div className="item-tags">{item.tags.map(t=><span key={t} className="tag tag-accent">{t}</span>)}</div>}
              <div className="item-meta">
                <span>✏️ {item.updatedByName||item.createdByName}</span>
                <span>{formatDate(item.updatedAt)}</span>
              </div>
              <div style={{display:"flex",gap:6,marginTop:12}}>
                <button className="btn btn-ghost btn-sm" style={{flex:1}} onClick={()=>handleEdit(item)}>Editar</button>
                <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(item)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showAdd && (
        <Modal title={editItem?"Editar objeto":"Nuevo objeto"} onClose={()=>{setShowAdd(false);setEditItem(null);}} large>
          <div className="form-group">
            <label className="form-label">Nombre del objeto</label>
            <input className="form-input" placeholder="Ej: Pasaporte, Destornillador..." value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción (opcional)</label>
            <input className="form-input" placeholder="Ej: El rojo, el grande..." value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Categorías</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {ITEM_TAGS.map(tag => (
                <span key={tag} className={`tag ${form.tags.includes(tag)?"tag-accent":""}`} style={{cursor:"pointer"}} onClick={()=>toggleTag(tag)}>{tag}</span>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Foto (opcional)</label>
            <PhotoUpload value={form.photoUrl} onChange={url=>setForm(f=>({...f,photoUrl:url}))} uploading={uploading} setUploading={setUploading} />
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={()=>{setShowAdd(false);setEditItem(null);}}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={uploading}>
              {uploading ? <span className="spinner"/> : editItem?"Guardar cambios":"Añadir objeto"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── Search ───────────────────────────────────────────────────────────────────
const SearchPage = ({ onNavigate }) => {
  const [query_, setQuery_] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [filterTag, setFilterTag] = useState("");

  const handleSearch = async () => {
    if (!query_.trim()) return;
    setLoading(true); setSearched(true);
    const snap = await getDocs(collection(db,"items"));
    const q = query_.toLowerCase();
    const all = snap.docs.map(d=>({id:d.id,...d.data()}));
    setResults(all.filter(it =>
      (it.name||"").toLowerCase().includes(q) ||
      (it.description||"").toLowerCase().includes(q) ||
      (it.tags||[]).some(t=>t.toLowerCase().includes(q)) ||
      (it.furnitureName||"").toLowerCase().includes(q) ||
      (it.roomName||"").toLowerCase().includes(q)
    ).filter(it => !filterTag || (it.tags||[]).includes(filterTag)));
    setLoading(false);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">¿Dónde está?</h1>
        <p className="page-subtitle">Busca cualquier objeto en toda la casa</p>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap"}}>
        <div className="search-wrapper" style={{flex:1,minWidth:200}}>
          <span className="search-icon">🔍</span>
          <input className="form-input search-input" placeholder="Busca: pasaporte, destornillador..." value={query_} onChange={e=>setQuery_(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSearch()} autoFocus />
        </div>
        <select className="form-input" style={{width:"auto"}} value={filterTag} onChange={e=>setFilterTag(e.target.value)}>
          <option value="">Todas las categorías</option>
          {ITEM_TAGS.map(t=><option key={t}>{t}</option>)}
        </select>
        <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>{loading?<span className="spinner"/>:"Buscar"}</button>
      </div>
      {!searched && <div className="empty-state"><div className="empty-icon">🔍</div><div className="empty-title">Escribe algo para buscar</div><div className="empty-desc">Busca por nombre, descripción, categoría o ubicación</div></div>}
      {searched && results.length===0 && !loading && <div className="empty-state"><div className="empty-icon">😕</div><div className="empty-title">No encontrado</div></div>}
      {results.length>0 && (
        <>
          <div className="text-sm text-muted" style={{marginBottom:16}}>{results.length} resultado{results.length!==1?"s":""}</div>
          <div className="grid-2">
            {results.map(item => (
              <div key={item.id} className="card">
                <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
                  {item.photoUrl
                    ? <img src={item.photoUrl} alt={item.name} style={{width:64,height:64,objectFit:"cover",borderRadius:8,flexShrink:0}}/>
                    : <div style={{width:64,height:64,background:"var(--bg3)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>📦</div>
                  }
                  <div style={{flex:1,minWidth:0}}>
                    <div className="item-name">{item.name}</div>
                    {item.description && <div className="item-location">{item.description}</div>}
                    <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6,flexWrap:"wrap"}}>
                      <span className="tag tag-green">📍 {item.roomName}</span>
                      <span className="tag tag-blue">🪑 {item.furnitureName}</span>
                    </div>
                    {(item.tags||[]).length>0 && <div className="item-tags" style={{marginTop:6}}>{item.tags.map(t=><span key={t} className="tag tag-accent">{t}</span>)}</div>}
                  </div>
                </div>
                <div className="item-meta" style={{marginTop:12}}>
                  <span>✏️ {item.updatedByName}</span>
                  <span>{formatDate(item.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Expenses ─────────────────────────────────────────────────────────────────
const ExpensesPage = ({ user, onToast }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [currentMonth, setCurrentMonth] = useState(monthKey(new Date()));
  const [form, setForm] = useState({ amount:"", category:"compras", description:"", date:new Date().toISOString().split("T")[0] });

  useEffect(() => {
    const q = query(collection(db,"expenses"), orderBy("date","desc"));
    const unsub = onSnapshot(q, snap => { setExpenses(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); });
    return unsub;
  }, []);

  const monthExpenses = expenses.filter(e=>e.date&&e.date.startsWith(currentMonth));
  const total = monthExpenses.reduce((s,e)=>s+Number(e.amount),0);
  const byCategory = EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    total: monthExpenses.filter(e=>e.category===cat.id).reduce((s,e)=>s+Number(e.amount),0),
    count: monthExpenses.filter(e=>e.category===cat.id).length,
  })).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);

  const prevMonth = () => { const [y,m]=currentMonth.split("-").map(Number); setCurrentMonth(monthKey(new Date(y,m-2))); };
  const nextMonth = () => { const [y,m]=currentMonth.split("-").map(Number); setCurrentMonth(monthKey(new Date(y,m))); };

  const handleAdd = async () => {
    if (!form.amount||!form.description.trim()) return onToast("Rellena importe y descripción","error");
    await addDoc(collection(db,"expenses"), { amount:Number(form.amount), category:form.category, description:form.description.trim(), date:form.date, paidBy:user.uid, paidByName:user.displayName, createdAt:serverTimestamp() });
    await logHistory(user.uid, user.displayName, "Añadió gasto", `${form.description} - ${form.amount}€`);
    onToast("Gasto registrado"); setShowAdd(false);
    setForm({ amount:"", category:"compras", description:"", date:new Date().toISOString().split("T")[0] });
  };

  const handleDelete = async (e) => {
    if (!confirm("¿Eliminar este gasto?")) return;
    await deleteDoc(doc(db,"expenses",e.id)); onToast("Gasto eliminado");
  };

  if (loading) return <div className="loading-page"><div className="spinner"/></div>;

  return (
    <div className="fade-in">
      <div className="page-header"><h1 className="page-title">Gastos</h1><p className="page-subtitle">Control de gastos del hogar</p></div>
      <div className="toolbar">
        <div className="month-nav">
          <button className="btn-icon" onClick={prevMonth}>←</button>
          <span>{monthLabel(currentMonth)}</span>
          <button className="btn-icon" onClick={nextMonth}>→</button>
        </div>
        <div className="toolbar-right"><button className="btn btn-primary" onClick={()=>setShowAdd(true)}>+ Añadir gasto</button></div>
      </div>
      <div className="grid-3" style={{marginBottom:24}}>
        <div className="card stat-card"><div className="stat-value">{total.toFixed(2)}€</div><div className="stat-label">Total del mes</div></div>
        <div className="card stat-card"><div className="stat-value" style={{color:"var(--blue)"}}>{monthExpenses.length}</div><div className="stat-label">Registros</div></div>
        <div className="card stat-card"><div className="stat-value" style={{color:"var(--green)"}}>{byCategory.length}</div><div className="stat-label">Categorías</div></div>
      </div>
      <div className="tabs">
        {["list","summary"].map(t=>(
          <div key={t} className={`tab-item ${activeTab===t?"active":""}`} onClick={()=>setActiveTab(t)}>{t==="list"?"Detalle":"Resumen por categoría"}</div>
        ))}
      </div>
      {activeTab==="summary" && (
        <div className="card">
          {byCategory.length===0 ? <div className="empty-state" style={{padding:40}}><div className="empty-icon">💸</div><div className="empty-title">Sin gastos este mes</div></div>
          : byCategory.map(cat=>(
            <div key={cat.id} className="summary-row">
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:20}}>{cat.icon}</span>
                <div><div className="font-medium">{cat.label}</div><div className="text-xs text-muted">{cat.count} registro{cat.count!==1?"s":""}</div></div>
              </div>
              <div style={{textAlign:"right",minWidth:100}}>
                <div className="font-medium">{cat.total.toFixed(2)}€</div>
                <div className="expense-bar" style={{width:80,marginLeft:"auto"}}><div className="expense-bar-fill" style={{width:`${Math.round(cat.total/total*100)}%`}}/></div>
                <div className="text-xs text-muted">{Math.round(cat.total/total*100)}%</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {activeTab==="list" && (
        monthExpenses.length===0
          ? <div className="empty-state"><div className="empty-icon">💸</div><div className="empty-title">Sin gastos este mes</div></div>
          : <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {monthExpenses.map(e=>{
                const cat=EXPENSE_CATEGORIES.find(c=>c.id===e.category);
                return (
                  <div key={e.id} className="card card-sm flex items-center gap-3" style={{display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:22}}>{cat?.icon||"📋"}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div className="font-medium" style={{fontSize:14}}>{e.description}</div>
                      <div className="text-xs text-muted">{cat?.label} · {e.paidByName} · {e.date}</div>
                    </div>
                    <div style={{fontFamily:"var(--font-display)",fontSize:18,fontWeight:500,color:"var(--accent)",whiteSpace:"nowrap"}}>{Number(e.amount).toFixed(2)}€</div>
                    <button className="btn-icon" style={{fontSize:12,padding:"4px 8px"}} onClick={()=>handleDelete(e)}>✕</button>
                  </div>
                );
              })}
            </div>
      )}
      {showAdd && (
        <Modal title="Nuevo gasto" onClose={()=>setShowAdd(false)}>
          <div className="form-group">
            <label className="form-label">Categoría</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {EXPENSE_CATEGORIES.map(cat=>(
                <div key={cat.id} onClick={()=>setForm(f=>({...f,category:cat.id}))}
                  style={{padding:"8px 14px",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:13,background:form.category===cat.id?"var(--accent-bg)":"var(--bg3)",border:`1px solid ${form.category===cat.id?"var(--accent)":"var(--border)"}`,color:form.category===cat.id?"var(--accent)":"var(--text2)"}}>
                  {cat.icon} {cat.label}
                </div>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <input className="form-input" placeholder="Ej: Mercadona semana 2..." value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} autoFocus />
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div className="form-group">
              <label className="form-label">Importe (€)</label>
              <input className="form-input" type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha</label>
              <input className="form-input" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={()=>setShowAdd(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleAdd}>Registrar gasto</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── History ──────────────────────────────────────────────────────────────────
const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db,"history"), orderBy("timestamp","desc"));
    const unsub = onSnapshot(q, snap => { setHistory(snap.docs.map(d=>({id:d.id,...d.data()})).slice(0,100)); setLoading(false); });
    return unsub;
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner"/></div>;

  return (
    <div className="fade-in">
      <div className="page-header"><h1 className="page-title">Historial</h1><p className="page-subtitle">Últimas 100 acciones en la casa</p></div>
      <div className="card">
        {history.length===0
          ? <div className="empty-state" style={{padding:40}}><div className="empty-icon">📋</div><div className="empty-title">Sin actividad aún</div></div>
          : history.map(h=>(
            <div key={h.id} className="history-item">
              <div className="history-dot"/>
              <div style={{flex:1}}>
                <div className="history-text"><strong>{h.userName}</strong> {h.action.toLowerCase()}: <strong>{h.details}</strong></div>
                <div className="history-time">{formatTime(h.timestamp)}</div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id:"search", icon:"🔍", label:"Buscar" },
  { id:"rooms",  icon:"🏠", label:"Estancias" },
  { id:"expenses",icon:"💸", label:"Gastos" },
  { id:"history", icon:"📋", label:"Historial" },
];

const Sidebar = ({ user, page, onNavigate }) => {
  const color = user.photoURL && USER_COLORS.includes(user.photoURL) ? user.photoURL : USER_COLORS[0];
  const initial = (user.displayName||user.email||"?")[0].toUpperCase();
  return (
    <div className="sidebar">
      <div className="sidebar-logo"><h1>Casa<span>.</span></h1><p>Gestión del hogar</p></div>
      <div className="sidebar-nav">
        <div className="section-title">Navegación</div>
        {NAV_ITEMS.map(item=>(
          <button key={item.id} className={`nav-item ${page===item.id?"active":""}`} onClick={()=>onNavigate(item.id)}>
            <span className="icon">{item.icon}</span>{item.label}
          </button>
        ))}
      </div>
      <div className="sidebar-user">
        <div className="user-avatar" style={{background:color}}>{initial}</div>
        <div className="user-info">
          <div className="user-name">{user.displayName||user.email}</div>
          <div className="user-role">Miembro del hogar</div>
        </div>
        <button className="logout-btn" onClick={()=>signOut(auth)} title="Cerrar sesión">⎋</button>
      </div>
    </div>
  );
};

// ─── Bottom Nav (mobile) ──────────────────────────────────────────────────────
const BottomNav = ({ user, page, onNavigate }) => {
  const color = user.photoURL && USER_COLORS.includes(user.photoURL) ? user.photoURL : USER_COLORS[0];
  const initial = (user.displayName||user.email||"?")[0].toUpperCase();
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-items">
        {NAV_ITEMS.map(item => (
          <button key={item.id} className={`bottom-nav-item ${page===item.id?"active":""}`} onClick={()=>onNavigate(item.id)}>
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
        <button className="bottom-nav-item" onClick={()=>signOut(auth)}>
          <div className="nav-icon" style={{width:22,height:22,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:"#fff"}}>{initial}</div>
          Salir
        </button>
      </div>
    </nav>
  );
};

// ─── App Shell ────────────────────────────────────────────────────────────────
const AuthedApp = ({ user }) => {
  const { toasts, show: toast } = useToast();
  const [page, setPage] = useState("search");
  const [navState, setNavState] = useState({});

  const navigate = (p, room, furniture) => {
    setPage(p);
    if (room) setNavState(s=>({...s,room}));
    if (furniture) setNavState(s=>({...s,furniture}));
  };

  const activePage = ["furniture","items"].includes(page) ? "rooms" : page;

  const renderPage = () => {
    switch(page) {
      case "search":    return <SearchPage onNavigate={navigate}/>;
      case "rooms":     return <RoomsPage user={user} onToast={toast} onNavigate={navigate}/>;
      case "furniture": return navState.room ? <FurniturePage user={user} room={navState.room} onToast={toast} onNavigate={navigate}/> : <RoomsPage user={user} onToast={toast} onNavigate={navigate}/>;
      case "items":     return (navState.room&&navState.furniture) ? <ItemsPage user={user} room={navState.room} furniture={navState.furniture} onToast={toast} onNavigate={navigate}/> : <RoomsPage user={user} onToast={toast} onNavigate={navigate}/>;
      case "expenses":  return <ExpensesPage user={user} onToast={toast}/>;
      case "history":   return <HistoryPage/>;
      default:          return <SearchPage onNavigate={navigate}/>;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar user={user} page={activePage} onNavigate={navigate}/>
      <main className="main-content">{renderPage()}</main>
      <BottomNav user={user} page={activePage} onNavigate={navigate}/>
      <ToastContainer toasts={toasts}/>
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(undefined);
  const { toasts, show: toast } = useToast();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u||null));
    return unsub;
  }, []);

  return (
    <>
      <style>{styles}</style>
      {user===undefined && <div className="loading-page"><div className="spinner" style={{width:32,height:32,borderWidth:3}}/><div style={{color:"var(--text3)",fontSize:14}}>Cargando...</div></div>}
      {user===null && <LoginPage onToast={toast}/>}
      {user && <AuthedApp user={user}/>}
      <ToastContainer toasts={toasts}/>
    </>
  );
}
