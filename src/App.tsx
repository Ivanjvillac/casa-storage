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
  getDoc,
  setDoc,
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

// Fixed colors by nickname (case-insensitive)
const NAME_COLORS = {
  "patito": "#e8c95a",      // amarillo
  "brujito": "#5ae87a",     // verde
  "princi-pito": "#5a9fe8", // azul
  "princip-ito": "#5a9fe8", // typo variant
  "principito": "#5a9fe8",  // without hyphen variant
};
const colorForName = (name) => {
  if (!name) return null;
  return NAME_COLORS[name.toLowerCase().trim()] || null;
};
const EVENT_COLORS = [
  { id:"accent", color:"#e8715a", label:"Coral" },
  { id:"blue",   color:"#5a9fe8", label:"Azul" },
  { id:"green",  color:"#5ae87a", label:"Verde" },
  { id:"yellow", color:"#e8c95a", label:"Amarillo" },
  { id:"purple", color:"#c25ae8", label:"Morado" },
];
const WEEKDAYS_ES = ["L","M","X","J","V","S","D"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

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
  /* Calendar */
  .cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .cal-nav { display: flex; align-items: center; gap: 14px; }
  .cal-month-label { font-family: var(--font-display); font-size: 22px; font-weight: 500; min-width: 200px; text-align: center; text-transform: capitalize; }
  .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
  .cal-weekday { text-align: center; font-size: 11px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 8px; font-weight: 500; }
  .cal-day {
    aspect-ratio: 1; border-radius: 10px; background: var(--bg2); border: 1px solid var(--border);
    padding: 6px; cursor: pointer; transition: all 0.15s; display: flex; flex-direction: column;
    position: relative; overflow: hidden; min-height: 56px;
  }
  .cal-day:hover { border-color: var(--accent); background: var(--bg3); }
  .cal-day.other-month { opacity: 0.3; }
  .cal-day.today { border-color: var(--accent); border-width: 2px; }
  .cal-day-num { font-size: 12px; font-weight: 500; color: var(--text2); }
  .cal-day.today .cal-day-num { color: var(--accent); font-weight: 700; }
  .cal-day-dots { display: flex; flex-wrap: wrap; gap: 2px; margin-top: auto; }
  .cal-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
  .cal-day-events-mobile { display: none; }
  .upcoming-list { display: flex; flex-direction: column; gap: 10px; margin-top: 24px; }
  .event-row { display: flex; align-items: center; gap: 12px; }
  .event-color-bar { width: 4px; height: 36px; border-radius: 4px; flex-shrink: 0; }
  .event-date-badge {
    width: 44px; height: 44px; border-radius: 10px; background: var(--bg3); border: 1px solid var(--border);
    display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .event-date-badge .day { font-family: var(--font-display); font-size: 16px; font-weight: 600; line-height: 1; }
  .event-date-badge .mon { font-size: 9px; color: var(--text3); text-transform: uppercase; }

  /* Book club */
  .book-card { display: flex; gap: 16px; align-items: flex-start; }
  .book-spine { width: 56px; height: 80px; border-radius: 4px 8px 8px 4px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 2px 2px 8px rgba(0,0,0,0.3); }
  .proposal-slot {
    border: 2px dashed var(--border); border-radius: var(--radius); padding: 18px;
    display: flex; align-items: center; gap: 14px; transition: all 0.2s;
  }
  .proposal-slot.filled { border-style: solid; border-color: var(--border); background: var(--bg2); }
  .proposal-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; color: #fff; flex-shrink: 0; }
  .roulette-wrap { text-align: center; padding: 40px 20px; }
  .roulette-book { font-size: 64px; margin-bottom: 16px; display: inline-block; }
  .roulette-spinning { animation: rouletteShake 0.15s infinite; }
  @keyframes rouletteShake { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
  .progress-track { height: 10px; background: var(--bg4); border-radius: 6px; overflow: hidden; position: relative; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent2)); border-radius: 6px; transition: width 0.6s ease; }
  .milestone-row { display: flex; align-items: center; gap: 14px; padding: 12px 0; border-bottom: 1px solid var(--border); }
  .milestone-row:last-child { border-bottom: none; }
  .milestone-check {
    width: 26px; height: 26px; border-radius: 50%; border: 2px solid var(--border); flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; font-size: 13px;
  }
  .milestone-check.done { background: var(--green); border-color: var(--green); color: #0f0f11; }
  .milestone-check.overdue { border-color: var(--accent); }
  .milestone-info { flex: 1; }
  .milestone-date { font-size: 11px; color: var(--text3); }
  .milestone-label { font-size: 14px; font-weight: 500; }
  .milestone-label.done-text { text-decoration: line-through; color: var(--text3); }


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
    .cal-day { min-height: 42px; padding: 4px; }
    .cal-month-label { font-size: 17px; min-width: 140px; }
    .book-card { flex-direction: column; align-items: center; text-align: center; }
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

// Build a 6-week grid for a given month (Monday-first)
const buildCalendarGrid = (year, month) => {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday=0
  const gridStart = new Date(year, month, 1 - startOffset);
  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
};
const isoDate = (d) => {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
};
const isSameDay = (a,b) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();

// Distribute totalUnits (pages or chapters) across N milestones between startDate and endDate (inclusive), roughly every ~3 days
const generateMilestones = (totalUnits, startDate, endDate, unit) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.max(1, Math.round((end - start) / (1000*60*60*24)));
  const intervalDays = totalDays <= 7 ? 1 : totalDays <= 21 ? 2 : 3;
  const numMilestones = Math.max(1, Math.floor(totalDays / intervalDays));
  const unitLabel = unit === "chapters" ? "el capítulo" : "la página";
  const milestones = [];
  for (let i = 1; i <= numMilestones; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + Math.round((totalDays * i) / numMilestones));
    const goal = Math.round((totalUnits * i) / numMilestones);
    milestones.push({
      date: isoDate(d > end ? end : d),
      goal: Math.min(goal, totalUnits),
      label: `Hasta ${unitLabel} ${Math.min(goal, totalUnits)}`,
      done: false,
      doneBy: null,
      doneByName: null,
    });
  }
  // Ensure last milestone matches end date and totalUnits exactly
  milestones[milestones.length-1].date = isoDate(end);
  milestones[milestones.length-1].goal = totalUnits;
  return milestones;
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

  // Auto-assign color when a known name is typed
  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    const fixed = colorForName(val);
    if (fixed) setColor(fixed);
  };

  const fixedColor = colorForName(name); // truthy if name is known

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
            <input className="form-input" placeholder="Ej: Patito, Brujito, Princi-pito" value={name} onChange={handleNameChange} />
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
            {fixedColor ? (
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:fixedColor,border:"2px solid #fff"}}/>
                <span className="text-sm text-muted">Asignado automáticamente ✓</span>
              </div>
            ) : (
              <div className="color-picker">
                {USER_COLORS.map(c => (
                  <div key={c} className={`color-dot ${color===c?"selected":""}`} style={{background:c}} onClick={()=>setColor(c)} />
                ))}
              </div>
            )}
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

// ─── Calendar ─────────────────────────────────────────────────────────────────
const CalendarPage = ({ user, onToast }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [editEvent, setEditEvent] = useState(null);
  const emptyForm = { title:"", date:isoDate(new Date()), description:"", color:"accent" };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const q = query(collection(db,"events"), orderBy("date","asc"));
    const unsub = onSnapshot(q, snap => { setEvents(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); });
    return unsub;
  }, []);

  const year = cursor.getFullYear(), month = cursor.getMonth();
  const grid = buildCalendarGrid(year, month);
  const today = new Date();

  const eventsByDate = events.reduce((acc, e) => {
    (acc[e.date] = acc[e.date] || []).push(e);
    return acc;
  }, {});

  const upcoming = events.filter(e => e.date >= isoDate(today)).slice(0, 8);

  const prevMonth = () => setCursor(new Date(year, month-1, 1));
  const nextMonth = () => setCursor(new Date(year, month+1, 1));

  const openAddForDay = (d) => {
    setForm({ ...emptyForm, date: isoDate(d) });
    setEditEvent(null);
    setShowAdd(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.date) return onToast("Pon título y fecha","error");
    const colorObj = EVENT_COLORS.find(c=>c.id===form.color) || EVENT_COLORS[0];
    if (editEvent) {
      await updateDoc(doc(db,"events",editEvent.id), { title:form.title.trim(), date:form.date, description:form.description, color:form.color });
      await logHistory(user.uid, user.displayName, "Editó evento", `"${form.title}" (${form.date})`);
      onToast("Evento actualizado");
    } else {
      await addDoc(collection(db,"events"), { title:form.title.trim(), date:form.date, description:form.description, color:form.color, createdBy:user.uid, createdByName:user.displayName, createdAt:serverTimestamp() });
      await logHistory(user.uid, user.displayName, "Añadió evento", `"${form.title}" (${form.date})`);
      onToast("Evento añadido");
    }
    setShowAdd(false); setEditEvent(null); setForm(emptyForm);
  };

  const handleEdit = (ev) => {
    setForm({ title:ev.title, date:ev.date, description:ev.description||"", color:ev.color||"accent" });
    setEditEvent(ev); setShowAdd(true);
  };

  const handleDelete = async (ev) => {
    if (!confirm(`¿Eliminar "${ev.title}"?`)) return;
    await deleteDoc(doc(db,"events",ev.id));
    await logHistory(user.uid, user.displayName, "Eliminó evento", ev.title);
    onToast("Evento eliminado");
    setSelectedDay(null);
  };

  if (loading) return <div className="loading-page"><div className="spinner"/></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Calendario</h1>
        <p className="page-subtitle">Eventos y fechas importantes de la casa</p>
      </div>

      <div className="cal-header">
        <div className="cal-nav">
          <button className="btn-icon" onClick={prevMonth}>←</button>
          <span className="cal-month-label">{MONTHS_ES[month]} {year}</span>
          <button className="btn-icon" onClick={nextMonth}>→</button>
        </div>
        <button className="btn btn-primary" onClick={()=>openAddForDay(today)}>+ Nuevo evento</button>
      </div>

      <div className="cal-grid">
        {WEEKDAYS_ES.map(w => <div key={w} className="cal-weekday">{w}</div>)}
        {grid.map((d, i) => {
          const inMonth = d.getMonth() === month;
          const dStr = isoDate(d);
          const dayEvents = eventsByDate[dStr] || [];
          return (
            <div key={i} className={`cal-day ${inMonth?"":"other-month"} ${isSameDay(d,today)?"today":""}`} onClick={()=>dayEvents.length ? setSelectedDay(dStr) : openAddForDay(d)}>
              <span className="cal-day-num">{d.getDate()}</span>
              {dayEvents.length > 0 && (
                <div className="cal-day-dots">
                  {dayEvents.slice(0,4).map(ev => (
                    <span key={ev.id} className="cal-dot" style={{background:(EVENT_COLORS.find(c=>c.id===ev.color)||EVENT_COLORS[0]).color}} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <h2 style={{fontFamily:"var(--font-display)",fontSize:18,fontWeight:500,marginTop:32,marginBottom:4}}>Próximos eventos</h2>
      {upcoming.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📅</div><div className="empty-title">Sin eventos próximos</div></div>
      ) : (
        <div className="upcoming-list">
          {upcoming.map(ev => {
            const colorObj = EVENT_COLORS.find(c=>c.id===ev.color) || EVENT_COLORS[0];
            const d = new Date(ev.date + "T00:00:00");
            return (
              <div key={ev.id} className="card card-sm event-row" onClick={()=>handleEdit(ev)} style={{cursor:"pointer"}}>
                <div className="event-color-bar" style={{background:colorObj.color}} />
                <div className="event-date-badge">
                  <span className="day">{d.getDate()}</span>
                  <span className="mon">{MONTHS_ES[d.getMonth()].slice(0,3)}</span>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="font-medium" style={{fontSize:14}}>{ev.title}</div>
                  {ev.description && <div className="text-xs text-muted">{ev.description}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedDay && (
        <Modal title={new Date(selectedDay+"T00:00:00").toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"})} onClose={()=>setSelectedDay(null)}>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
            {(eventsByDate[selectedDay]||[]).map(ev => {
              const colorObj = EVENT_COLORS.find(c=>c.id===ev.color) || EVENT_COLORS[0];
              return (
                <div key={ev.id} className="card card-sm" style={{borderLeft:`3px solid ${colorObj.color}`}}>
                  <div className="font-medium">{ev.title}</div>
                  {ev.description && <div className="text-sm text-muted mt-1">{ev.description}</div>}
                  <div style={{display:"flex",gap:6,marginTop:10}}>
                    <button className="btn btn-ghost btn-sm" style={{flex:1}} onClick={()=>{setSelectedDay(null);handleEdit(ev);}}>Editar</button>
                    <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(ev)}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="btn btn-primary w-full" style={{justifyContent:"center",width:"100%"}} onClick={()=>{openAddForDay(new Date(selectedDay+"T00:00:00"));setSelectedDay(null);}}>+ Añadir otro evento este día</button>
        </Modal>
      )}

      {showAdd && (
        <Modal title={editEvent ? "Editar evento" : "Nuevo evento"} onClose={()=>{setShowAdd(false);setEditEvent(null);}}>
          <div className="form-group">
            <label className="form-label">Título</label>
            <input className="form-input" placeholder="Ej: Cumpleaños de Ana, Revisión caldera..." value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input className="form-input" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción (opcional)</label>
            <input className="form-input" placeholder="Detalles del evento..." value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div className="color-picker">
              {EVENT_COLORS.map(c => (
                <div key={c.id} className={`color-dot ${form.color===c.id?"selected":""}`} style={{background:c.color}} onClick={()=>setForm(f=>({...f,color:c.id}))} title={c.label} />
              ))}
            </div>
          </div>
          <div className="modal-footer">
            {editEvent && <button className="btn btn-danger" onClick={()=>handleDelete(editEvent)} style={{marginRight:"auto"}}>Eliminar</button>}
            <button className="btn btn-ghost" onClick={()=>{setShowAdd(false);setEditEvent(null);}}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave}>{editEvent?"Guardar cambios":"Añadir evento"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── Book Club ────────────────────────────────────────────────────────────────
const BOOK_SPINE_COLORS = ["#e8715a","#5a9fe8","#5ae87a","#e8c95a","#c25ae8"];

const BookClubPage = ({ user, onToast }) => {
  const [proposals, setProposals] = useState([]); // status: proposed | pending
  const [current, setCurrent] = useState(null);
  const [pastBooks, setPastBooks] = useState([]);
  const [ratings, setRatings] = useState([]); // all ratings, filtered per book in UI
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPropose, setShowPropose] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showFinish, setShowFinish] = useState(false);
  const [showHistoryBook, setShowHistoryBook] = useState(null);
  const [editMilestoneIdx, setEditMilestoneIdx] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [spinPool, setSpinPool] = useState([]);
  const [proposalForm, setProposalForm] = useState({ title:"", author:"", units:"", unit:"pages" });
  const [setupForm, setSetupForm] = useState({ days:"21", unit:"" }); // unit "" means inherit from book
  const [finishForm, setFinishForm] = useState({ rating:0, comment:"" });
  const [editMilestoneForm, setEditMilestoneForm] = useState({ date:"", goal:"" });
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    const unsub1 = onSnapshot(query(collection(db,"bookclubProposals"), orderBy("createdAt","asc")), snap => {
      setProposals(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    const unsub2 = onSnapshot(doc(db,"bookclub","current"), snap => {
      setCurrent(snap.exists() ? snap.data() : null);
      setLoading(false);
    });
    const unsub3 = onSnapshot(query(collection(db,"bookclubHistory"), orderBy("finishedAt","desc")), snap => {
      setPastBooks(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    const unsub4 = onSnapshot(collection(db,"bookclubRatings"), snap => {
      setRatings(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    const unsub5 = onSnapshot(query(collection(db,"bookclubNotes"), orderBy("createdAt","asc")), snap => {
      setNotes(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); };
  }, []);

  const pendingProposals = proposals.filter(p => p.status === "pending"); // lost a previous draw, waiting their turn
  const myProposal = proposals.find(p => p.proposedBy === user.uid);
  const isReading = !!(current && current.title);
  const currentNotes = notes.filter(n => n.bookKey === (current?.chosenAtKey || ""));

  // Pool to draw from: if there's a current book being read, you can't draw again.
  const drawPool = proposals;
  const canDraw = !isReading && drawPool.length >= 2;

  // Reader badges: how many books each person has seen finished by the group (everyone counts equally)
  const readerCounts = pastBooks.reduce((acc, b) => {
    // every group member gets credit for every finished book — count unique proposers seen via ratings instead would under-count,
    // so we credit based on who actually rated it (participated) — fallback to proposer if nobody rated yet
    const raters = ratings.filter(r => r.bookHistoryId === b.id);
    const names = raters.length ? raters.map(r=>r.userName) : [b.proposedByName].filter(Boolean);
    names.forEach(n => { acc[n] = (acc[n]||0) + 1; });
    return acc;
  }, {});

  const unitLabel = (u) => u === "chapters" ? "capítulos" : "páginas";
  const unitLabelSingular = (u) => u === "chapters" ? "capítulo" : "página";

  const handlePropose = async () => {
    if (!proposalForm.title.trim() || !proposalForm.units) return onToast(`Pon título y número de ${unitLabel(proposalForm.unit)}`,"error");
    if (myProposal) {
      // Can always edit title/author/units/unit — whether proposed or pending
      await updateDoc(doc(db,"bookclubProposals",myProposal.id), { title:proposalForm.title.trim(), author:proposalForm.author.trim(), units:Number(proposalForm.units), unit:proposalForm.unit });
      onToast("Propuesta actualizada");
    } else {
      await addDoc(collection(db,"bookclubProposals"), { title:proposalForm.title.trim(), author:proposalForm.author.trim(), units:Number(proposalForm.units), unit:proposalForm.unit, proposedBy:user.uid, proposedByName:user.displayName, status:"proposed", createdAt:serverTimestamp() });
      onToast("Libro propuesto");
    }
    setShowPropose(false); setProposalForm({ title:"", author:"", units:"", unit:"pages" });
  };

  const handleRemoveProposal = async (p) => {
    if (p.status === "pending") return onToast("No puedes quitar un libro que ya está en la rotación","error");
    if (!confirm(`¿Quitar "${p.title}" de las propuestas?`)) return;
    await deleteDoc(doc(db,"bookclubProposals",p.id));
    onToast("Propuesta eliminada");
  };

  const handleSpin = () => {
    if (!canDraw) return;
    setSpinning(true);
    setSpinResult(null);
    setSpinPool(drawPool);
    let count = 0;
    const interval = setInterval(() => {
      setSpinResult(drawPool[Math.floor(Math.random()*drawPool.length)]);
      count++;
      if (count > 14) {
        clearInterval(interval);
        const winner = drawPool[Math.floor(Math.random()*drawPool.length)];
        setSpinResult(winner);
        setSpinning(false);
        setShowSetup(true);
      }
    }, 120);
  };

  const handleConfirmSetup = async () => {
    const days = Number(setupForm.days);
    if (!days || days < 1) return onToast("Pon un número de días válido","error");
    const start = new Date();
    const end = new Date(); end.setDate(start.getDate() + days);
    // setupForm.unit overrides the book's unit if the user wants to switch; fallback to book's unit
    const unit = setupForm.unit || spinResult.unit || "pages";
    const milestones = generateMilestones(spinResult.units, start, end, unit);
    const bookKey = `${spinResult.id}-${Date.now()}`;

    await setDoc(doc(db,"bookclub","current"), {
      title: spinResult.title, author: spinResult.author, totalUnits: spinResult.units, unit,
      proposedByName: spinResult.proposedByName,
      startDate: isoDate(start), endDate: isoDate(end),
      milestones, chosenAt: serverTimestamp(), chosenAtKey: bookKey,
      roundBooks: spinPool.map(p=>({title:p.title, proposedByName:p.proposedByName})),
    });

    // Winner leaves the proposals pool. The rest become "pending" — waiting their turn, kept until read.
    await deleteDoc(doc(db,"bookclubProposals",spinResult.id));
    for (const p of spinPool) {
      if (p.id !== spinResult.id) {
        await updateDoc(doc(db,"bookclubProposals",p.id), { status:"pending" });
      }
    }

    await logHistory(user.uid, user.displayName, "Sorteó libro", `"${spinResult.title}" elegido para el club`);
    onToast("¡Libro elegido! Plazos generados");
    setShowSetup(false); setSpinResult(null); setSpinPool([]);
  };

  const toggleMilestone = async (idx) => {
    const updated = [...current.milestones];
    const wasDone = updated[idx].done;
    updated[idx] = { ...updated[idx], done: !wasDone, doneBy: !wasDone ? user.uid : null, doneByName: !wasDone ? user.displayName : null };
    await updateDoc(doc(db,"bookclub","current"), { milestones: updated });
  };

  const openEditMilestone = (idx) => {
    setEditMilestoneForm({ date: current.milestones[idx].date, goal: String(current.milestones[idx].goal) });
    setEditMilestoneIdx(idx);
  };

  const handleSaveMilestone = async () => {
    if (!editMilestoneForm.date || !editMilestoneForm.goal) return onToast("Rellena fecha y objetivo","error");
    const updated = [...current.milestones];
    updated[editMilestoneIdx] = {
      ...updated[editMilestoneIdx],
      date: editMilestoneForm.date,
      goal: Number(editMilestoneForm.goal),
      label: `Hasta ${current.unit === "chapters" ? "el capítulo" : "la página"} ${editMilestoneForm.goal}`,
    };
    await updateDoc(doc(db,"bookclub","current"), { milestones: updated });
    onToast("Hito actualizado");
    setEditMilestoneIdx(null);
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    await addDoc(collection(db,"bookclubNotes"), {
      bookKey: current.chosenAtKey, bookTitle: current.title,
      userId: user.uid, userName: user.displayName,
      text: noteText.trim(), createdAt: serverTimestamp(),
    });
    setNoteText("");
  };

  const handleFinishBook = async () => {
    if (!finishForm.rating) return onToast("Pon tu puntuación antes de terminar","error");
    const historyRef = await addDoc(collection(db,"bookclubHistory"), {
      ...current, finishedAt: serverTimestamp(), startedAt: current.chosenAt || null,
    });
    await addDoc(collection(db,"bookclubRatings"), {
      bookHistoryId: historyRef.id, bookTitle: current.title,
      userId: user.uid, userName: user.displayName,
      rating: finishForm.rating, comment: finishForm.comment.trim(),
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db,"bookclub","current"), {});
    await logHistory(user.uid, user.displayName, "Terminó libro", current.title);
    onToast("¡Felicidades por terminarlo! 📚");
    setShowFinish(false); setFinishForm({ rating:0, comment:"" });
  };

  const handleRateExisting = async (bookHistoryId, bookTitle) => {
    const existing = ratings.find(r => r.bookHistoryId === bookHistoryId && r.userId === user.uid);
    if (existing) return onToast("Ya has puntuado este libro","error");
    if (!finishForm.rating) return onToast("Pon tu puntuación","error");
    await addDoc(collection(db,"bookclubRatings"), {
      bookHistoryId, bookTitle, userId: user.uid, userName: user.displayName,
      rating: finishForm.rating, comment: finishForm.comment.trim(), createdAt: serverTimestamp(),
    });
    onToast("Puntuación guardada");
    setFinishForm({ rating:0, comment:"" });
  };

  if (loading) return <div className="loading-page"><div className="spinner"/></div>;

  const doneCount = current?.milestones?.filter(m=>m.done).length || 0;
  const totalMilestones = current?.milestones?.length || 0;
  const progressPct = totalMilestones ? Math.round((doneCount/totalMilestones)*100) : 0;
  const nextMilestone = current?.milestones?.find(m => !m.done);
  const daysToNext = nextMilestone ? Math.ceil((new Date(nextMilestone.date) - new Date(isoDate(new Date()))) / (1000*60*60*24)) : null;

  const StarPicker = ({ value, onChange }) => (
    <div style={{display:"flex",gap:4}}>
      {[1,2,3,4,5].map(n => (
        <span key={n} onClick={()=>onChange(n)} style={{fontSize:26,cursor:"pointer",color: n<=value ? "var(--yellow)" : "var(--bg4)"}}>★</span>
      ))}
    </div>
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Club de lectura</h1>
        <p className="page-subtitle">Proponed libros, sorteamos y leemos los 3, por turnos</p>
      </div>

      {Object.keys(readerCounts).length > 0 && (
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:28}}>
          {Object.entries(readerCounts).sort((a,b)=>b[1]-a[1]).map(([name, count]) => (
            <div key={name} className="card card-sm" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px"}}>
              <span style={{fontSize:18}}>🏅</span>
              <div>
                <div className="font-medium" style={{fontSize:13}}>{name}</div>
                <div className="text-xs text-muted">{count} libro{count!==1?"s":""} leído{count!==1?"s":""}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isReading ? (
        <>
          <div className="card" style={{marginBottom:24}}>
            <div className="book-card">
              <div className="book-spine" style={{background:BOOK_SPINE_COLORS[0]}}>📖</div>
              <div style={{flex:1}}>
                <div className="text-xs text-muted" style={{textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Leyendo ahora · propuesto por {current.proposedByName}</div>
                <div style={{fontFamily:"var(--font-display)",fontSize:24,fontWeight:500}}>{current.title}</div>
                {current.author && <div className="text-sm text-muted mt-1">{current.author}</div>}
                <div className="text-xs text-muted mt-2">{current.totalUnits} {unitLabel(current.unit)} · hasta {formatDate(current.endDate)}</div>
                <div style={{marginTop:14}}>
                  <div className="flex justify-between" style={{marginBottom:6}}>
                    <span className="text-xs text-muted">{doneCount}/{totalMilestones} hitos completados</span>
                    <span className="text-xs font-medium" style={{color:"var(--accent)"}}>{progressPct}%</span>
                  </div>
                  <div className="progress-track"><div className="progress-fill" style={{width:`${progressPct}%`}} /></div>
                </div>
                {nextMilestone && (
                  <div className="callout-next-milestone" style={{marginTop:14,background:"var(--accent-bg)",border:"1px solid rgba(232,113,90,0.3)",borderRadius:10,padding:"10px 14px"}}>
                    <span className="text-xs" style={{color:"var(--accent)",fontWeight:600}}>📍 Próximo hito: {nextMilestone.label}</span>
                    <div className="text-xs text-muted mt-1">
                      {formatDate(nextMilestone.date)} · {daysToNext > 0 ? `quedan ${daysToNext} día${daysToNext!==1?"s":""}` : daysToNext===0 ? "es hoy" : "atrasado"}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{marginTop:16}} onClick={()=>setShowFinish(true)}>✓ Marcar como terminado</button>
          </div>

          <h2 style={{fontFamily:"var(--font-display)",fontSize:18,fontWeight:500,marginBottom:12}}>Plazos de lectura</h2>
          <div className="card">
            {current.milestones.map((m, idx) => {
              const overdue = !m.done && m.date < isoDate(new Date());
              return (
                <div key={idx} className="milestone-row">
                  <div className={`milestone-check ${m.done?"done":""} ${overdue?"overdue":""}`} onClick={()=>toggleMilestone(idx)}>
                    {m.done ? "✓" : ""}
                  </div>
                  <div className="milestone-info">
                    <div className={`milestone-label ${m.done?"done-text":""}`}>{m.label}</div>
                    <div className="milestone-date">
                      {formatDate(m.date)} {overdue ? "· atrasado" : ""}
                      {m.done && m.doneByName && <> · marcado por {m.doneByName}</>}
                    </div>
                  </div>
                  <button className="btn-icon" style={{fontSize:12,padding:"5px 9px"}} onClick={()=>openEditMilestone(idx)} title="Editar hito">✎</button>
                </div>
              );
            })}
          </div>

          <h2 style={{fontFamily:"var(--font-display)",fontSize:18,fontWeight:500,marginTop:32,marginBottom:12}}>Notas de lectura</h2>
          <div className="card">
            <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:currentNotes.length?16:0,maxHeight:320,overflowY:"auto"}}>
              {currentNotes.length === 0 && <div className="text-sm text-muted">Sin notas todavía — comparte por dónde vas o qué te ha parecido</div>}
              {currentNotes.map(n => (
                <div key={n.id} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                  <div className="user-avatar" style={{width:28,height:28,fontSize:11,flexShrink:0,background:USER_COLORS[n.userName.charCodeAt(0)%USER_COLORS.length]}}>{n.userName[0].toUpperCase()}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                      <span className="font-medium" style={{fontSize:12.5}}>{n.userName}</span>
                      <span className="text-xs text-muted">{formatDate(n.createdAt)}</span>
                    </div>
                    <div className="text-sm" style={{color:"var(--text)",marginTop:2}}>{n.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:8}}>
              <input className="form-input" placeholder="Escribe una nota..." value={noteText} onChange={e=>setNoteText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAddNote()} />
              <button className="btn btn-primary btn-sm" onClick={handleAddNote}>Enviar</button>
            </div>
          </div>

          {pendingProposals.length > 0 && (
            <>
              <h2 style={{fontFamily:"var(--font-display)",fontSize:18,fontWeight:500,marginTop:32,marginBottom:12}}>En espera de turno</h2>
              <div className="grid-3">
                {pendingProposals.map(p => (
                  <div key={p.id} className="card card-sm">
                    <div className="font-medium" style={{fontSize:14}}>{p.title}</div>
                    {p.author && <div className="text-xs text-muted">{p.author}</div>}
                    <div className="text-xs text-muted mt-1">{p.units} {unitLabel(p.unit)} · propuesto por {p.proposedByName}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="grid-3" style={{marginBottom:8}}>
            {[0,1,2].map(i => {
              const p = proposals[i];
              const isMine = p && p.proposedBy === user.uid;
              return (
                <div key={i} className={`proposal-slot ${p?"filled":""}`}>
                  {p ? (
                    <>
                      <div className="proposal-avatar" style={{background:USER_COLORS[i%USER_COLORS.length]}}>{p.proposedByName[0].toUpperCase()}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div className="font-medium" style={{fontSize:14}}>{p.title}</div>
                        {p.author && <div className="text-xs text-muted">{p.author}</div>}
                        <div className="text-xs text-muted">{p.units} {unitLabel(p.unit)} · {p.proposedByName}</div>
                        {p.status === "pending" && <span className="tag tag-blue" style={{marginTop:4}}>En espera de turno</span>}
                      </div>
                      {isMine && p.status !== "pending" && <button className="btn-icon" style={{fontSize:11,padding:"4px 8px"}} onClick={()=>handleRemoveProposal(p)}>✕</button>}
                    </>
                  ) : (
                    <div className="text-sm text-muted" style={{textAlign:"center",width:"100%"}}>Esperando propuesta...</div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{marginTop:20,display:"flex",gap:10,flexWrap:"wrap"}}>
            {!myProposal ? (
              <button className="btn btn-primary" onClick={()=>setShowPropose(true)}>+ Proponer mi libro</button>
            ) : (
              <button className="btn btn-ghost" onClick={()=>{setProposalForm({title:myProposal.title,author:myProposal.author||"",units:String(myProposal.units),unit:myProposal.unit||"pages"});setShowPropose(true);}}>Editar mi propuesta</button>
            )}
          </div>

          {canDraw && (
            <div className="card roulette-wrap" style={{marginTop:28}}>
              <div className={`roulette-book ${spinning?"roulette-spinning":""}`}>📚</div>
              {spinResult && !spinning && (
                <div style={{marginBottom:16}}>
                  <div className="text-xs text-muted" style={{textTransform:"uppercase",letterSpacing:0.5}}>Elegido</div>
                  <div style={{fontFamily:"var(--font-display)",fontSize:22,fontWeight:500,marginTop:4}}>{spinResult.title}</div>
                </div>
              )}
              {spinning && <div className="text-muted" style={{marginBottom:16}}>{spinResult?.title || "Sorteando..."}</div>}
              {!spinResult && (
                <>
                  <div style={{fontFamily:"var(--font-display)",fontSize:18,marginBottom:6}}>
                    {drawPool.length >= 3 ? "¡Las 3 propuestas están listas!" : "Hay 2 libros listos para sortear"}
                  </div>
                  <div className="text-sm text-muted" style={{marginBottom:20}}>Sortead cuál leéis primero — los demás se leerán después, por turnos</div>
                </>
              )}
              <button className="btn btn-primary" onClick={handleSpin} disabled={spinning}>
                {spinning ? <span className="spinner"/> : "🎲 Sortear libro"}
              </button>
            </div>
          )}

          {!canDraw && drawPool.length === 1 && (
            <div className="empty-state" style={{padding:30}}>
              <div className="empty-desc">Falta al menos 1 propuesta más para poder sortear</div>
            </div>
          )}
        </>
      )}

      {pastBooks.length > 0 && (
        <>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:18,fontWeight:500,marginTop:32,marginBottom:12}}>Leídos anteriormente</h2>
          <div className="grid-3">
            {pastBooks.map(b => {
              const bookRatings = ratings.filter(r => r.bookHistoryId === b.id);
              const avg = bookRatings.length ? (bookRatings.reduce((s,r)=>s+r.rating,0)/bookRatings.length).toFixed(1) : null;
              const iRated = bookRatings.some(r => r.userId === user.uid);
              return (
                <div key={b.id} className="card card-sm card-clickable" onClick={()=>{setShowHistoryBook(b); setFinishForm({rating:0,comment:""});}}>
                  <div className="font-medium" style={{fontSize:14}}>{b.title}</div>
                  {b.author && <div className="text-xs text-muted">{b.author}</div>}
                  <div className="text-xs text-muted mt-1">{b.totalUnits} {unitLabel(b.unit)} · {formatDate(b.startedAt)} → {formatDate(b.finishedAt)}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8}}>
                    {avg ? <span className="tag" style={{color:"var(--yellow)"}}>★ {avg} ({bookRatings.length}/3)</span> : <span className="tag">Sin puntuar</span>}
                    {!iRated && <span className="tag tag-accent">Falta tu valoración</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {showPropose && (
        <Modal title={myProposal ? "Editar mi propuesta" : "Proponer un libro"} onClose={()=>setShowPropose(false)}>
          <div className="form-group">
            <label className="form-label">Título</label>
            <input className="form-input" placeholder="Ej: Cien años de soledad" value={proposalForm.title} onChange={e=>setProposalForm(f=>({...f,title:e.target.value}))} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Autor (opcional)</label>
            <input className="form-input" placeholder="Ej: Gabriel García Márquez" value={proposalForm.author} onChange={e=>setProposalForm(f=>({...f,author:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Medir el progreso por</label>
            <div style={{display:"flex",gap:8}}>
              <div onClick={()=>setProposalForm(f=>({...f,unit:"pages"}))} style={{flex:1,textAlign:"center",padding:"9px 14px",borderRadius:8,cursor:"pointer",fontSize:13,background:proposalForm.unit==="pages"?"var(--accent-bg)":"var(--bg3)",border:`1px solid ${proposalForm.unit==="pages"?"var(--accent)":"var(--border)"}`,color:proposalForm.unit==="pages"?"var(--accent)":"var(--text2)"}}>Páginas</div>
              <div onClick={()=>setProposalForm(f=>({...f,unit:"chapters"}))} style={{flex:1,textAlign:"center",padding:"9px 14px",borderRadius:8,cursor:"pointer",fontSize:13,background:proposalForm.unit==="chapters"?"var(--accent-bg)":"var(--bg3)",border:`1px solid ${proposalForm.unit==="chapters"?"var(--accent)":"var(--border)"}`,color:proposalForm.unit==="chapters"?"var(--accent)":"var(--text2)"}}>Capítulos</div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Número de {unitLabel(proposalForm.unit)}</label>
            <input className="form-input" type="number" min="1" placeholder={proposalForm.unit==="chapters"?"Ej: 24":"Ej: 320"} value={proposalForm.units} onChange={e=>setProposalForm(f=>({...f,units:e.target.value}))} />
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={()=>setShowPropose(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handlePropose}>{myProposal?"Guardar cambios":"Proponer"}</button>
          </div>
        </Modal>
      )}

      {showSetup && spinResult && (
        <Modal title="Organizar la lectura" onClose={()=>setShowSetup(false)}>
          <div className="card card-sm" style={{marginBottom:18,background:"var(--bg3)"}}>
            <div className="font-medium">{spinResult.title}</div>
            <div className="text-xs text-muted mt-1">{spinResult.units} {unitLabel(spinResult.unit)} · propuesto por {spinResult.proposedByName}</div>
          </div>
          <div className="form-group">
            <label className="form-label">¿Dividir el progreso por?</label>
            <div style={{display:"flex",gap:8}}>
              {[{v:"pages",l:"Páginas"},{v:"chapters",l:"Capítulos"}].map(({v,l}) => {
                const active = (setupForm.unit || spinResult.unit || "pages") === v;
                return (
                  <div key={v} onClick={()=>setSetupForm(f=>({...f,unit:v}))}
                    style={{flex:1,textAlign:"center",padding:"9px 14px",borderRadius:8,cursor:"pointer",fontSize:13,
                      background:active?"var(--accent-bg)":"var(--bg3)",
                      border:`1px solid ${active?"var(--accent)":"var(--border)"}`,
                      color:active?"var(--accent)":"var(--text2)"}}>
                    {l}
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-muted mt-2">El libro tiene {spinResult.units} {unitLabel(setupForm.unit || spinResult.unit || "pages")} — podéis cambiarlo a la otra unidad si preferís.</div>
          </div>
          <div className="form-group">
            <label className="form-label">¿En cuántos días lo leéis?</label>
            <input className="form-input" type="number" min="1" value={setupForm.days} onChange={e=>setSetupForm(f=>({...f,days:e.target.value}))} />
            <div className="text-xs text-muted mt-2">Se generarán plazos automáticos. Podréis ajustar cada hito a mano luego.</div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={()=>setShowSetup(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleConfirmSetup}>Empezar a leer</button>
          </div>
        </Modal>
      )}

      {editMilestoneIdx !== null && (
        <Modal title="Editar hito" onClose={()=>setEditMilestoneIdx(null)}>
          <div className="form-group">
            <label className="form-label">Fecha límite</label>
            <input className="form-input" type="date" value={editMilestoneForm.date} onChange={e=>setEditMilestoneForm(f=>({...f,date:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Hasta {unitLabelSingular(current?.unit)} número</label>
            <input className="form-input" type="number" min="1" value={editMilestoneForm.goal} onChange={e=>setEditMilestoneForm(f=>({...f,goal:e.target.value}))} />
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={()=>setEditMilestoneIdx(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSaveMilestone}>Guardar</button>
          </div>
        </Modal>
      )}

      {showFinish && (
        <Modal title={`Terminar "${current?.title}"`} onClose={()=>setShowFinish(false)}>
          <div className="text-sm text-muted" style={{marginBottom:16}}>Pon tu puntuación y comentario. Joan y Chris podrán añadir el suyo después desde el historial.</div>
          <div className="form-group">
            <label className="form-label">Tu puntuación</label>
            <StarPicker value={finishForm.rating} onChange={r=>setFinishForm(f=>({...f,rating:r}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Tu comentario (opcional)</label>
            <textarea className="form-input" placeholder="¿Qué te ha parecido?" value={finishForm.comment} onChange={e=>setFinishForm(f=>({...f,comment:e.target.value}))} />
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={()=>setShowFinish(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleFinishBook}>Terminar libro</button>
          </div>
        </Modal>
      )}

      {showHistoryBook && (
        <Modal title={showHistoryBook.title} onClose={()=>setShowHistoryBook(null)}>
          <div className="text-xs text-muted" style={{marginBottom:16}}>
            {showHistoryBook.author && <>{showHistoryBook.author} · </>}{showHistoryBook.totalUnits} {unitLabel(showHistoryBook.unit)} · {formatDate(showHistoryBook.startedAt)} → {formatDate(showHistoryBook.finishedAt)}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
            {ratings.filter(r=>r.bookHistoryId===showHistoryBook.id).map(r => (
              <div key={r.id} className="card card-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium" style={{fontSize:13}}>{r.userName}</span>
                  <span style={{color:"var(--yellow)"}}>{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</span>
                </div>
                {r.comment && <div className="text-sm text-muted mt-1">{r.comment}</div>}
              </div>
            ))}
            {ratings.filter(r=>r.bookHistoryId===showHistoryBook.id).length === 0 && (
              <div className="text-sm text-muted">Nadie ha puntuado este libro todavía</div>
            )}
          </div>

          {!ratings.some(r=>r.bookHistoryId===showHistoryBook.id && r.userId===user.uid) ? (
            <>
              <div className="form-group">
                <label className="form-label">Tu puntuación</label>
                <StarPicker value={finishForm.rating} onChange={r=>setFinishForm(f=>({...f,rating:r}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Tu comentario (opcional)</label>
                <textarea className="form-input" placeholder="¿Qué te ha parecido?" value={finishForm.comment} onChange={e=>setFinishForm(f=>({...f,comment:e.target.value}))} />
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={()=>setShowHistoryBook(null)}>Cerrar</button>
                <button className="btn btn-primary" onClick={()=>handleRateExisting(showHistoryBook.id, showHistoryBook.title)}>Guardar mi puntuación</button>
              </div>
            </>
          ) : (
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setShowHistoryBook(null)}>Cerrar</button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

const NAV_ITEMS = [
  { id:"search", icon:"🔍", label:"Buscar" },
  { id:"rooms",  icon:"🏠", label:"Estancias" },
  { id:"calendar", icon:"📅", label:"Calendario" },
  { id:"bookclub", icon:"📚", label:"Club lectura" },
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
const BOTTOM_NAV_PRIMARY = ["search","rooms","calendar","expenses"];

const BottomNav = ({ user, page, onNavigate }) => {
  const [showMore, setShowMore] = useState(false);
  const color = user.photoURL && USER_COLORS.includes(user.photoURL) ? user.photoURL : USER_COLORS[0];
  const initial = (user.displayName||user.email||"?")[0].toUpperCase();
  const primaryItems = NAV_ITEMS.filter(i => BOTTOM_NAV_PRIMARY.includes(i.id));
  const moreItems = NAV_ITEMS.filter(i => !BOTTOM_NAV_PRIMARY.includes(i.id));
  const moreActive = moreItems.some(i => i.id === page);

  return (
    <>
      <nav className="bottom-nav">
        <div className="bottom-nav-items">
          {primaryItems.map(item => (
            <button key={item.id} className={`bottom-nav-item ${page===item.id?"active":""}`} onClick={()=>onNavigate(item.id)}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
          <button className={`bottom-nav-item ${moreActive?"active":""}`} onClick={()=>setShowMore(true)}>
            <span className="nav-icon">⋯</span>
            Más
          </button>
        </div>
      </nav>
      {showMore && (
        <Modal title="Más opciones" onClose={()=>setShowMore(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {moreItems.map(item => (
              <button key={item.id} className={`nav-item ${page===item.id?"active":""}`} style={{borderRadius:10,padding:"12px 14px"}} onClick={()=>{onNavigate(item.id);setShowMore(false);}}>
                <span className="icon" style={{fontSize:18}}>{item.icon}</span>{item.label}
              </button>
            ))}
            <button className="nav-item" style={{borderRadius:10,padding:"12px 14px",marginTop:8,borderTop:"1px solid var(--border)",paddingTop:16}} onClick={()=>signOut(auth)}>
              <div className="icon" style={{width:20,height:20,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:600,color:"#fff"}}>{initial}</div>
              Cerrar sesión
            </button>
          </div>
        </Modal>
      )}
    </>
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
      case "calendar":  return <CalendarPage user={user} onToast={toast}/>;
      case "bookclub":  return <BookClubPage user={user} onToast={toast}/>;
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
