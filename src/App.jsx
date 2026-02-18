import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import {
  collection, doc, getDocs, setDoc, deleteDoc, onSnapshot, orderBy, query
} from "firebase/firestore";

// ─── Palette & fonts loaded via @import in style tag below ───────────────────
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0c0c0f;
    --surface: #141418;
    --surface2: #1c1c22;
    --surface3: #242430;
    --border: #2a2a38;
    --accent: #6c63ff;
    --accent2: #ff6b6b;
    --accent3: #43d9ad;
    --text: #e8e8f0;
    --text2: #9090a8;
    --text3: #5a5a72;
    --radius: 12px;
    --radius-lg: 20px;
  }

  html, body, #root { height: 100%; width: 100%; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--surface); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

  h1,h2,h3,h4 { font-family: 'Syne', sans-serif; }

  .app {
    display: grid;
    grid-template-columns: 260px 1fr;
    grid-template-rows: 56px 1fr;
    height: 100vh;
    overflow: hidden;
  }

  /* ── MOBILE ── */
  @media (max-width: 768px) {
    .app {
      grid-template-columns: 1fr;
      grid-template-rows: 56px auto 1fr;
    }
    .sidebar {
      grid-column: 1;
      grid-row: 2;
      border-right: none;
      border-bottom: 1px solid var(--border);
      flex-direction: row;
      overflow-x: auto;
      overflow-y: hidden;
      height: auto;
      max-height: 140px;
    }
    .sidebar-section { border-bottom: none; border-right: 1px solid var(--border); padding: 10px; flex-shrink: 0; }
    .ideas-list { display: flex; flex-direction: row; gap: 6px; padding: 8px; overflow-x: auto; overflow-y: hidden; }
    .idea-item { min-width: 160px; margin-bottom: 0; }
    .main { grid-column: 1; grid-row: 3; }
    .idea-detail { padding: 16px; }
    .detail-header { flex-wrap: wrap; }
    .detail-actions { width: 100%; }
    .swot-grid { grid-template-columns: 1fr; }
    .score-grid { grid-template-columns: repeat(2, 1fr); }
    .topbar-sub { display: none; }
    .modal { width: 95vw; padding: 20px; }
    .form-row { flex-direction: column; }
  }

  /* ── TOPBAR ── */
  .topbar {
    grid-column: 1 / -1;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    padding: 0 24px;
    gap: 16px;
    z-index: 10;
  }
  .topbar-logo {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 18px;
    letter-spacing: -0.5px;
    background: linear-gradient(135deg, var(--accent), var(--accent3));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    flex-shrink: 0;
  }
  .topbar-sub {
    color: var(--text3);
    font-size: 12px;
    border-left: 1px solid var(--border);
    padding-left: 16px;
  }
  .topbar-spacer { flex: 1; }
  .topbar-user {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text2);
    font-size: 13px;
    cursor: pointer;
  }
  .avatar {
    width: 30px; height: 30px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: white;
    flex-shrink: 0;
  }
  .avatar.sm { width: 24px; height: 24px; font-size: 10px; }

  /* ── SIDEBAR ── */
  .sidebar {
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .sidebar-section {
    padding: 16px;
    border-bottom: 1px solid var(--border);
  }
  .sidebar-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text3);
    margin-bottom: 10px;
  }
  .ideas-list { overflow-y: auto; flex: 1; padding: 8px; }
  .idea-item {
    padding: 10px 12px;
    border-radius: var(--radius);
    cursor: pointer;
    transition: background 0.15s;
    margin-bottom: 4px;
    border: 1px solid transparent;
  }
  .idea-item:hover { background: var(--surface2); }
  .idea-item.active {
    background: var(--surface2);
    border-color: var(--accent);
  }
  .idea-item-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px;
  }
  .idea-item-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--text3);
  }
  .score-badge {
    padding: 1px 7px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 700;
    font-family: 'Syne', sans-serif;
  }
  .score-high { background: #43d9ad22; color: var(--accent3); }
  .score-med { background: #ffd16622; color: #ffd166; }
  .score-low { background: #ff6b6b22; color: var(--accent2); }

  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 9px 18px;
    border-radius: var(--radius);
    border: none;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.15s;
  }
  .btn-primary {
    background: var(--accent);
    color: white;
  }
  .btn-primary:hover { background: #7d75ff; }
  .btn-ghost {
    background: transparent;
    color: var(--text2);
    border: 1px solid var(--border);
  }
  .btn-ghost:hover { background: var(--surface2); color: var(--text); }
  .btn-sm { padding: 6px 14px; font-size: 13px; }
  .btn-danger { background: #ff6b6b22; color: var(--accent2); border: 1px solid #ff6b6b33; }
  .btn-danger:hover { background: #ff6b6b44; }
  .btn-success { background: #43d9ad22; color: var(--accent3); border: 1px solid #43d9ad33; }
  .btn-success:hover { background: #43d9ad44; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── MAIN ── */
  .main {
    overflow-y: auto;
    background: var(--bg);
  }

  /* ── EMPTY STATE ── */
  .empty-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 100%;
    text-align: center;
    padding: 40px;
  }
  .empty-icon {
    width: 80px; height: 80px;
    border-radius: 24px;
    background: linear-gradient(135deg, var(--accent)22, var(--accent3)22);
    border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 32px;
    margin-bottom: 24px;
  }
  .empty-state h2 { font-size: 22px; margin-bottom: 8px; }
  .empty-state p { color: var(--text2); max-width: 320px; margin-bottom: 24px; }

  /* ── IDEA DETAIL ── */
  .idea-detail { padding: 32px; max-width: 900px; margin: 0 auto; }
  .detail-header {
    display: flex; align-items: flex-start; gap: 16px;
    margin-bottom: 28px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--border);
  }
  .detail-icon {
    width: 56px; height: 56px; border-radius: 16px;
    background: linear-gradient(135deg, var(--accent), var(--accent3));
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; flex-shrink: 0;
  }
  .detail-title { font-size: 24px; font-weight: 800; margin-bottom: 6px; }
  .detail-meta { color: var(--text2); font-size: 13px; display: flex; gap: 16px; flex-wrap: wrap; }
  .detail-meta span { display: flex; align-items: center; gap: 5px; }
  .detail-actions { margin-left: auto; display: flex; gap: 8px; flex-shrink: 0; }

  .tabs {
    display: flex; gap: 4px; margin-bottom: 24px;
    background: var(--surface);
    padding: 4px;
    border-radius: var(--radius);
    width: fit-content;
  }
  .tab {
    padding: 8px 18px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    color: var(--text2);
    transition: all 0.15s;
    border: none;
    background: transparent;
    font-family: 'DM Sans', sans-serif;
  }
  .tab.active {
    background: var(--surface3);
    color: var(--text);
  }
  .tab:hover:not(.active) { color: var(--text); }

  /* ── CARD ── */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 24px;
    margin-bottom: 20px;
  }
  .card-title {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--text3);
    margin-bottom: 16px;
    display: flex; align-items: center; gap: 8px;
  }

  /* ── DOCUMENT VIEWER ── */
  .doc-preview {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
    font-size: 13px;
    color: var(--text2);
    line-height: 1.7;
    max-height: 300px;
    overflow-y: auto;
    white-space: pre-wrap;
    font-family: 'DM Mono', 'Courier New', monospace;
  }

  /* ── SCORING ── */
  .score-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
  }
  .score-card {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
    text-align: center;
  }
  .score-number {
    font-family: 'Syne', sans-serif;
    font-size: 32px;
    font-weight: 800;
    margin-bottom: 4px;
  }
  .score-label { font-size: 11px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.5px; }
  .score-stars { font-size: 16px; margin-bottom: 4px; }

  .rating-row {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 12px;
  }
  .rating-label { width: 130px; font-size: 13px; color: var(--text2); flex-shrink: 0; }
  .stars-input { display: flex; gap: 4px; }
  .star {
    font-size: 20px;
    cursor: pointer;
    transition: transform 0.1s;
    filter: grayscale(1) opacity(0.4);
  }
  .star.on { filter: none; }
  .star:hover { transform: scale(1.2); }

  /* ── COMMENTS ── */
  .comment {
    display: flex; gap: 12px;
    padding: 14px 0;
    border-bottom: 1px solid var(--border);
  }
  .comment:last-child { border-bottom: none; }
  .comment-body { flex: 1; }
  .comment-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .comment-author { font-size: 13px; font-weight: 600; }
  .comment-time { font-size: 11px; color: var(--text3); }
  .comment-text { font-size: 14px; color: var(--text2); line-height: 1.6; }
  .comment-tag {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 600;
  }
  .tag-pro { background: #43d9ad22; color: var(--accent3); }
  .tag-con { background: #ff6b6b22; color: var(--accent2); }
  .tag-question { background: #6c63ff22; color: var(--accent); }
  .tag-neutral { background: var(--surface3); color: var(--text2); }

  .comment-input-area {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 14px;
    margin-top: 16px;
  }
  .comment-input-area textarea {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    resize: none;
    line-height: 1.6;
  }
  .comment-input-area textarea::placeholder { color: var(--text3); }
  .comment-actions-row {
    display: flex; align-items: center; gap: 8px; margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--border);
  }
  .tag-selector {
    display: flex; gap: 6px; flex: 1; flex-wrap: wrap;
  }
  .tag-btn {
    padding: 3px 12px; border-radius: 20px;
    font-size: 11px; font-weight: 600;
    cursor: pointer; border: 1px solid;
    transition: all 0.15s;
  }

  /* ── AI ANALYSIS ── */
  .ai-section { }
  .ai-loading {
    display: flex; align-items: center; gap: 12px;
    color: var(--text2); font-size: 14px; padding: 20px 0;
  }
  .spinner {
    width: 20px; height: 20px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .ai-output {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
    font-size: 14px;
    color: var(--text2);
    line-height: 1.8;
    white-space: pre-wrap;
  }
  .ai-output strong { color: var(--text); }

  .swot-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 16px;
  }
  .swot-card {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
  }
  .swot-title {
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 10px;
    display: flex; align-items: center; gap: 6px;
  }
  .swot-card ul { list-style: none; }
  .swot-card li {
    font-size: 13px; color: var(--text2); padding: 3px 0;
    display: flex; gap: 6px; align-items: flex-start;
  }
  .swot-card li::before { content: '—'; color: var(--text3); flex-shrink: 0; }

  /* ── MODAL ── */
  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.7);
    display: flex; align-items: center; justify-content: center;
    z-index: 100;
    backdrop-filter: blur(4px);
    animation: fadeIn 0.15s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } }
  .modal {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 32px;
    width: 520px;
    max-width: 95vw;
    animation: slideUp 0.2s ease;
  }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } }
  .modal h3 { font-size: 20px; margin-bottom: 20px; }
  .form-group { margin-bottom: 16px; }
  .form-label { font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: var(--text3); margin-bottom: 6px; display: block; }
  .form-input {
    width: 100%;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 10px 14px;
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    outline: none;
    transition: border-color 0.15s;
  }
  .form-input:focus { border-color: var(--accent); }
  .form-input::placeholder { color: var(--text3); }
  .form-row { display: flex; gap: 12px; }
  .form-row .form-group { flex: 1; }

  .upload-zone {
    border: 2px dashed var(--border);
    border-radius: var(--radius);
    padding: 32px;
    text-align: center;
    cursor: pointer;
    transition: all 0.15s;
  }
  .upload-zone:hover, .upload-zone.drag { border-color: var(--accent); background: var(--accent)08; }
  .upload-zone-icon { font-size: 32px; margin-bottom: 10px; }
  .upload-zone p { color: var(--text2); font-size: 13px; }
  .upload-zone span { color: var(--accent); font-weight: 500; }
  .file-chosen {
    display: flex; align-items: center; gap: 10px;
    background: var(--surface3);
    border-radius: var(--radius);
    padding: 10px 14px;
    font-size: 13px; color: var(--text2);
    margin-top: 10px;
  }

  .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }

  /* ── MEMBERS ── */
  .members-input {
    display: flex; gap: 8px; margin-bottom: 12px;
  }
  .member-chip {
    display: flex; align-items: center; gap: 6px;
    background: var(--surface3);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 4px 12px 4px 6px;
    font-size: 12px;
    margin-bottom: 6px;
    display: inline-flex;
    margin-right: 6px;
  }
  .member-remove { cursor: pointer; color: var(--text3); font-size: 14px; line-height: 1; }
  .member-remove:hover { color: var(--accent2); }

  /* ── USER SELECTOR ── */
  .user-select-area {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 12px;
    margin-bottom: 16px;
  }
  .user-select-label { font-size: 12px; color: var(--text3); margin-bottom: 8px; }
  .user-chips { display: flex; gap: 6px; flex-wrap: wrap; }
  .user-chip {
    display: flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 20px;
    font-size: 12px; cursor: pointer;
    border: 1px solid var(--border);
    background: var(--surface3);
    color: var(--text2);
    transition: all 0.12s;
  }
  .user-chip.selected { border-color: var(--accent); background: var(--accent)22; color: var(--accent); }

  /* ── OVERALL SCORE ── */
  .overall-ring {
    display: flex; align-items: center; justify-content: center;
    flex-direction: column;
    width: 90px; height: 90px;
    border-radius: 50%;
    border: 3px solid var(--accent);
    background: var(--accent)11;
    flex-shrink: 0;
  }
  .overall-ring .num {
    font-family: 'Syne', sans-serif;
    font-size: 28px; font-weight: 800;
    color: var(--accent);
    line-height: 1;
  }
  .overall-ring .lbl { font-size: 9px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.5px; }

  .verdict-chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 14px; border-radius: 20px;
    font-size: 12px; font-weight: 700;
    font-family: 'Syne', sans-serif;
  }
  .verdict-go { background: #43d9ad22; color: var(--accent3); border: 1px solid #43d9ad44; }
  .verdict-caution { background: #ffd16622; color: #ffd166; border: 1px solid #ffd16644; }
  .verdict-no { background: #ff6b6b22; color: var(--accent2); border: 1px solid #ff6b6b44; }

  /* ── PROGRESS BAR ── */
  .progress-bar {
    height: 6px; border-radius: 3px;
    background: var(--surface3);
    overflow: hidden;
    flex: 1;
  }
  .progress-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; }

  .criteria-row {
    display: flex; align-items: center; gap: 12px; margin-bottom: 10px;
  }
  .criteria-label { width: 140px; font-size: 13px; color: var(--text2); flex-shrink: 0; }
  .criteria-val { width: 32px; font-size: 13px; font-weight: 600; text-align: right; flex-shrink: 0; }

  /* ── MEETINGS ── */
  .meeting-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px 20px;
    margin-bottom: 10px;
    display: flex; align-items: center; gap: 16px;
    transition: border-color 0.15s;
  }
  .meeting-card:hover { border-color: var(--accent); }
  .meeting-date-box {
    width: 52px; height: 52px; border-radius: 12px;
    background: var(--surface2);
    border: 1px solid var(--border);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .meeting-date-box .day { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; line-height: 1; }
  .meeting-date-box .month { font-size: 10px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.5px; }
  .meeting-info { flex: 1; }
  .meeting-title { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
  .meeting-meta { font-size: 12px; color: var(--text2); display: flex; gap: 12px; }
  .meeting-actions { display: flex; gap: 8px; flex-shrink: 0; }
  .meeting-past { opacity: 0.55; }
  .cal-btn {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 12px; border-radius: 8px;
    font-size: 12px; font-weight: 500; cursor: pointer;
    border: 1px solid var(--border);
    background: var(--surface2); color: var(--text2);
    transition: all 0.15s; text-decoration: none;
  }
  .cal-btn:hover { border-color: var(--accent); color: var(--accent); }


    -webkit-appearance: none;
    width: 100%;
    height: 6px;
    background: var(--surface3);
    border-radius: 3px;
    outline: none;
    flex: 1;
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px; height: 16px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
  }

  .api-key-bar {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 10px 14px;
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 20px;
    font-size: 13px;
  }
  .api-key-bar input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--text2);
    font-family: monospace;
    font-size: 13px;
  }
  .api-key-bar input::placeholder { color: var(--text3); }

  .pill {
    display: inline-flex; align-items: center;
    padding: 2px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 600;
    background: var(--surface3);
    color: var(--text2);
  }
`;

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const CRITERIA = [
  { key: "market", label: "Market Size", color: "#6c63ff" },
  { key: "innovation", label: "Innovation", color: "#43d9ad" },
  { key: "feasibility", label: "Feasibility", color: "#ffd166" },
  { key: "revenue", label: "Revenue Model", color: "#ff6b6b" },
  { key: "competition", label: "Competition", color: "#a78bfa" },
];

// no demo users — name is freely entered by each user

const COMMENT_TAGS = [
  { key: "pro", label: "✅ Pro", cls: "tag-pro" },
  { key: "con", label: "⚠️ Con", cls: "tag-con" },
  { key: "question", label: "🔍 Domanda", cls: "tag-question" },
  { key: "neutral", label: "💬 Nota", cls: "tag-neutral" },
];

const EMOJIS = ["💡", "🚀", "🏪", "🤖", "🌱", "💊", "🎯", "🔧", "📱", "🌍", "💰", "🎮"];

function hashColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ["#6c63ff","#43d9ad","#ff6b6b","#ffd166","#a78bfa","#38bdf8","#fb7185","#34d399"];
  return colors[Math.abs(hash) % colors.length];
}

function getScoreColor(score) {
  if (score >= 7) return "#43d9ad";
  if (score >= 5) return "#ffd166";
  return "#ff6b6b";
}

function getScoreClass(score) {
  if (score >= 7) return "score-high";
  if (score >= 5) return "score-med";
  return "score-low";
}

function getVerdict(score) {
  if (score >= 7.5) return { label: "🟢 Go", cls: "verdict-go" };
  if (score >= 5) return { label: "🟡 Da approfondire", cls: "verdict-caution" };
  return { label: "🔴 Stop", cls: "verdict-no" };
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
}

function initials(name) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

// ─── STORAGE (Firebase) ──────────────────────────────────────────────────────

function subscribeIdeas(callback) {
  const q = query(collection(db, "ideas"), orderBy("createdAt", "desc"));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

async function saveIdea(idea) {
  await setDoc(doc(db, "ideas", idea.id), idea);
}

async function removeIdea(id) {
  await deleteDoc(doc(db, "ideas", id));
}

function subscribeMeetings(callback) {
  const q = query(collection(db, "meetings"), orderBy("date", "asc"));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

async function saveMeeting(meeting) {
  await setDoc(doc(db, "meetings", meeting.id), meeting);
}

async function removeMeeting(id) {
  await deleteDoc(doc(db, "meetings", id));
}

// ─── AI ANALYSIS ─────────────────────────────────────────────────────────────

async function runAIAnalysis(idea, apiKey) {
  const docText = idea.docText || "(nessun documento caricato)";
  const prompt = `Sei un consulente strategico senior. Analizza questa idea di business in modo strutturato e conciso.

TITOLO: ${idea.title}
DESCRIZIONE: ${idea.description}
DOCUMENTO: ${docText.slice(0, 3000)}

Rispondi SOLO in JSON con questa struttura:
{
  "executive_summary": "2-3 frasi che catturano l'essenza e il potenziale dell'idea",
  "market_opportunity": "Analisi del mercato e dimensione stimata",
  "business_model": "Come genera revenue, unit economics",
  "go_to_market": "Strategia di ingresso al mercato",
  "key_risks": ["rischio 1", "rischio 2", "rischio 3"],
  "swot": {
    "strengths": ["punto 1", "punto 2"],
    "weaknesses": ["punto 1", "punto 2"],
    "opportunities": ["punto 1", "punto 2"],
    "threats": ["punto 1", "punto 2"]
  },
  "quick_wins": ["azione 0-3 mesi 1", "azione 0-3 mesi 2"],
  "structural_initiatives": ["iniziativa 6-18 mesi 1", "iniziativa 6-18 mesi 2"],
  "ai_score": {
    "market": 7.5,
    "innovation": 8,
    "feasibility": 6,
    "revenue": 7,
    "competition": 6.5
  },
  "verdict": "Una frase di verdetto finale"
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const text = data.content.map(c => c.text || "").join("");
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Stars({ value, onChange, max = 10 }) {
  const [hover, setHover] = useState(null);
  const display = hover ?? value;
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: max }, (_, i) => i + 1).map(i => (
        <span
          key={i}
          className={`star ${i <= display ? "on" : ""}`}
          style={{ fontSize: 16 }}
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
        >★</span>
      ))}
    </div>
  );
}

function NewIdeaModal({ onClose, onCreate, currentUser }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [emoji, setEmoji] = useState("💡");
  const [file, setFile] = useState(null);
  const [docText, setDocText] = useState("");
  const [drag, setDrag] = useState(false);
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setDocText(e.target.result);
    reader.readAsText(f);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreate({
      id: Date.now().toString(),
      title: title.trim(),
      description: desc.trim(),
      emoji,
      docText,
      fileName: file?.name || null,
      createdBy: currentUser,
      createdAt: Date.now(),
      comments: [],
      ratings: {},
      aiAnalysis: null,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>➕ Nuova Idea di Business</h3>
        <div className="form-row">
          <div className="form-group" style={{ flex: "0 0 auto" }}>
            <label className="form-label">Icona</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, width: 160 }}>
              {EMOJIS.map(e => (
                <span
                  key={e}
                  onClick={() => setEmoji(e)}
                  style={{
                    fontSize: 22, cursor: "pointer", padding: "4px 6px", borderRadius: 8,
                    background: emoji === e ? "var(--accent)33" : "transparent",
                    border: emoji === e ? "1px solid var(--accent)" : "1px solid transparent",
                  }}
                >{e}</span>
              ))}
            </div>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Titolo *</label>
            <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="es. Marketplace B2B per PMI" />
            <label className="form-label" style={{ marginTop: 12 }}>Descrizione</label>
            <textarea className="form-input" rows={3} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief dell'idea..." style={{ resize: "none" }} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Documento (opzionale)</label>
          <div
            className={`upload-zone ${drag ? "drag" : ""}`}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
          >
            <div className="upload-zone-icon">📄</div>
            <p>Trascina qui un file o <span>sfoglia</span></p>
            <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>PDF, TXT, MD, DOC</p>
          </div>
          <input ref={fileRef} type="file" style={{ display: "none" }} accept=".txt,.md,.pdf,.doc,.docx" onChange={e => handleFile(e.target.files[0])} />
          {file && (
            <div className="file-chosen">
              <span>📎</span>
              <span>{file.name}</span>
              <span style={{ color: "var(--accent3)", fontSize: 11, marginLeft: "auto" }}>✓ caricato</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={!title.trim()}>Crea Idea</button>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ idea, currentUser, onUpdate }) {
  const allRatings = Object.values(idea.ratings || {});
  const avgByCriteria = CRITERIA.map(c => {
    const vals = allRatings.map(r => r[c.key]).filter(Boolean);
    return { ...c, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0 };
  });
  const overallAvg = avgByCriteria.reduce((s, c) => s + c.avg, 0) / CRITERIA.length;
  const myRating = idea.ratings?.[currentUser] || {};

  const updateMyRating = (key, val) => {
    const updated = {
      ...idea,
      ratings: { ...idea.ratings, [currentUser]: { ...myRating, [key]: val } }
    };
    onUpdate(updated);
  };

  const verdict = getVerdict(overallAvg);
  const numRaters = allRatings.length;

  return (
    <div>
      {/* AGGREGATE SCORE */}
      <div className="card">
        <div className="card-title">📊 Score Aggregato</div>
        <div style={{ display: "flex", gap: 24, alignItems: "center", marginBottom: 20 }}>
          <div className="overall-ring">
            <div className="num">{overallAvg.toFixed(1)}</div>
            <div className="lbl">/10</div>
          </div>
          <div>
            <div style={{ marginBottom: 8 }}>
              <span className={`verdict-chip ${verdict.cls}`}>{verdict.label}</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--text2)" }}>
              Basato su {numRaters} valutazion{numRaters === 1 ? "e" : "i"}
            </div>
          </div>
        </div>
        {avgByCriteria.map(c => (
          <div className="criteria-row" key={c.key}>
            <div className="criteria-label">{c.label}</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${c.avg * 10}%`, background: c.color }} />
            </div>
            <div className="criteria-val" style={{ color: c.color }}>{c.avg.toFixed(1)}</div>
          </div>
        ))}
      </div>

      {/* MY RATING */}
      <div className="card">
        <div className="card-title">⭐ La Mia Valutazione ({currentUser})</div>
        {CRITERIA.map(c => (
          <div className="rating-row" key={c.key}>
            <div className="rating-label">{c.label}</div>
            <input
              type="range" min={0} max={10} step={0.5}
              value={myRating[c.key] || 0}
              onChange={e => updateMyRating(c.key, parseFloat(e.target.value))}
            />
            <div style={{ width: 32, textAlign: "right", fontSize: 13, fontWeight: 600, color: c.color }}>
              {(myRating[c.key] || 0).toFixed(1)}
            </div>
          </div>
        ))}
      </div>

      {/* DESCRIPTION */}
      {idea.description && (
        <div className="card">
          <div className="card-title">📝 Descrizione</div>
          <p style={{ color: "var(--text2)", lineHeight: 1.7, fontSize: 14 }}>{idea.description}</p>
        </div>
      )}

      {/* DOC PREVIEW */}
      {idea.docText && (
        <div className="card">
          <div className="card-title">📄 Documento — {idea.fileName}</div>
          <div className="doc-preview">{idea.docText.slice(0, 1500)}{idea.docText.length > 1500 ? "\n\n[…troncato per anteprima]" : ""}</div>
        </div>
      )}
    </div>
  );
}

function CommentsTab({ idea, currentUser, onUpdate }) {
  const [text, setText] = useState("");
  const [tag, setTag] = useState("neutral");

  const addComment = () => {
    if (!text.trim()) return;
    const c = { id: Date.now().toString(), author: currentUser, text: text.trim(), tag, ts: Date.now() };
    onUpdate({ ...idea, comments: [...(idea.comments || []), c] });
    setText("");
  };

  const deleteComment = (id) => {
    onUpdate({ ...idea, comments: idea.comments.filter(c => c.id !== id) });
  };

  const comments = idea.comments || [];

  return (
    <div>
      <div className="card">
        <div className="card-title">💬 Discussione ({comments.length})</div>
        {comments.length === 0 && (
          <p style={{ color: "var(--text3)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
            Nessun commento ancora. Inizia la discussione!
          </p>
        )}
        {comments.map(c => {
          const t = COMMENT_TAGS.find(x => x.key === c.tag) || COMMENT_TAGS[3];
          return (
            <div className="comment" key={c.id}>
              <div className="avatar sm" style={{ background: `linear-gradient(135deg, ${hashColor(c.author)}, ${hashColor(c.author + "2")})` }}>
                {initials(c.author)}
              </div>
              <div className="comment-body">
                <div className="comment-header">
                  <span className="comment-author">{c.author}</span>
                  <span className={`comment-tag ${t.cls}`}>{t.label}</span>
                  <span className="comment-time">{formatDate(c.ts)}</span>
                  {c.author === currentUser && (
                    <span style={{ marginLeft: "auto", cursor: "pointer", color: "var(--text3)", fontSize: 12 }} onClick={() => deleteComment(c.id)}>✕</span>
                  )}
                </div>
                <div className="comment-text">{c.text}</div>
              </div>
            </div>
          );
        })}

        <div className="comment-input-area">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Aggiungi un commento..."
            rows={3}
            onKeyDown={e => { if (e.key === "Enter" && e.metaKey) addComment(); }}
          />
          <div className="comment-actions-row">
            <div className="tag-selector">
              {COMMENT_TAGS.map(t => (
                <span
                  key={t.key}
                  className={`tag-btn ${t.cls}`}
                  style={{
                    opacity: tag === t.key ? 1 : 0.45,
                    borderColor: "currentColor",
                  }}
                  onClick={() => setTag(t.key)}
                >{t.label}</span>
              ))}
            </div>
            <button className="btn btn-primary btn-sm" onClick={addComment} disabled={!text.trim()}>
              Invia
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AITab({ idea, onUpdate }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("anthropic_key") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const analysis = idea.aiAnalysis;

  const saveKey = (k) => {
    setApiKey(k);
    localStorage.setItem("anthropic_key", k);
  };

  const run = async () => {
    if (!apiKey.trim()) { setError("Inserisci la tua Anthropic API key"); return; }
    setLoading(true); setError("");
    try {
      const result = await runAIAnalysis(idea, apiKey.trim());
      onUpdate({ ...idea, aiAnalysis: result });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="api-key-bar">
        <span style={{ color: "var(--text3)", fontSize: 12 }}>🔑</span>
        <input
          type="password"
          value={apiKey}
          onChange={e => saveKey(e.target.value)}
          placeholder="sk-ant-... (Anthropic API Key)"
        />
        {apiKey && <span style={{ color: "var(--accent3)", fontSize: 11 }}>✓ salvata</span>}
      </div>

      {!analysis && !loading && (
        <div className="card" style={{ textAlign: "center", padding: "40px 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
          <h3 style={{ marginBottom: 8, fontSize: 18 }}>AI Business Analysis</h3>
          <p style={{ color: "var(--text2)", marginBottom: 20, fontSize: 14 }}>
            Claude analizzerà l'idea, valuterà il potenziale di mercato, identificherà rischi e quick wins, e genererà una SWOT completa.
          </p>
          <button className="btn btn-primary" onClick={run}>🚀 Avvia Analisi AI</button>
          {error && <p style={{ color: "var(--accent2)", marginTop: 12, fontSize: 13 }}>{error}</p>}
        </div>
      )}

      {loading && (
        <div className="card">
          <div className="ai-loading">
            <div className="spinner" />
            <span>Claude sta analizzando l'idea...</span>
          </div>
        </div>
      )}

      {analysis && !loading && (
        <>
          {/* Executive Summary */}
          <div className="card">
            <div className="card-title">🎯 Executive Summary</div>
            <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.7, marginBottom: 12 }}>{analysis.executive_summary}</p>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--text3)" }}>Verdetto AI:</span>
              <span style={{ fontSize: 13, color: "var(--text)", fontStyle: "italic" }}>{analysis.verdict}</span>
            </div>
          </div>

          {/* AI Scores */}
          {analysis.ai_score && (
            <div className="card">
              <div className="card-title">📊 Score AI</div>
              {CRITERIA.map(c => {
                const v = analysis.ai_score?.[c.key] || 0;
                return (
                  <div className="criteria-row" key={c.key}>
                    <div className="criteria-label">{c.label}</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${v * 10}%`, background: c.color }} />
                    </div>
                    <div className="criteria-val" style={{ color: c.color }}>{v}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Market + Business Model */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="card">
              <div className="card-title">🌍 Market Opportunity</div>
              <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.7 }}>{analysis.market_opportunity}</p>
            </div>
            <div className="card">
              <div className="card-title">💰 Business Model</div>
              <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.7 }}>{analysis.business_model}</p>
            </div>
          </div>

          {/* Go to Market */}
          <div className="card">
            <div className="card-title">🚀 Go-to-Market</div>
            <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.7 }}>{analysis.go_to_market}</p>
          </div>

          {/* SWOT */}
          {analysis.swot && (
            <div className="card">
              <div className="card-title">🔲 SWOT Analysis</div>
              <div className="swot-grid">
                {[
                  { key: "strengths", label: "💪 Strengths", color: "var(--accent3)" },
                  { key: "weaknesses", label: "⚠️ Weaknesses", color: "var(--accent2)" },
                  { key: "opportunities", label: "🌱 Opportunities", color: "var(--accent)" },
                  { key: "threats", label: "🌩️ Threats", color: "#ffd166" },
                ].map(({ key, label, color }) => (
                  <div className="swot-card" key={key}>
                    <div className="swot-title" style={{ color }}>{label}</div>
                    <ul>{(analysis.swot[key] || []).map((item, i) => <li key={i}>{item}</li>)}</ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="card">
              <div className="card-title">⚡ Quick Wins (0–3 mesi)</div>
              <ul style={{ listStyle: "none" }}>
                {(analysis.quick_wins || []).map((q, i) => (
                  <li key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 13, color: "var(--text2)" }}>
                    <span style={{ color: "var(--accent3)", flexShrink: 0 }}>→</span> {q}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              <div className="card-title">🏗️ Iniziative Strutturali (6–18 mesi)</div>
              <ul style={{ listStyle: "none" }}>
                {(analysis.structural_initiatives || []).map((s, i) => (
                  <li key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 13, color: "var(--text2)" }}>
                    <span style={{ color: "var(--accent)", flexShrink: 0 }}>→</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Key Risks */}
          <div className="card">
            <div className="card-title">🚨 Key Risks</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(analysis.key_risks || []).map((r, i) => (
                <span key={i} style={{ background: "#ff6b6b11", color: "var(--accent2)", border: "1px solid #ff6b6b33", borderRadius: 8, padding: "6px 12px", fontSize: 13 }}>⚠️ {r}</span>
              ))}
            </div>
          </div>

          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <button className="btn btn-ghost btn-sm" onClick={run}>🔄 Rigenera Analisi</button>
          </div>
        </>
      )}
    </div>
  );
}

function IdeaDetail({ idea, currentUser, onUpdate, onDelete }) {
  const [tab, setTab] = useState("overview");
  const allRatings = Object.values(idea.ratings || {});
  const avgCriteria = CRITERIA.map(c => {
    const vals = allRatings.map(r => r[c.key]).filter(Boolean);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  });
  const overallScore = avgCriteria.reduce((a, b) => a + b, 0) / CRITERIA.length;
  const verdict = getVerdict(overallScore);

  return (
    <div className="idea-detail">
      <div className="detail-header">
        <div className="detail-icon">{idea.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="detail-title">{idea.title}</div>
          <div className="detail-meta">
            <span>👤 {idea.createdBy}</span>
            <span>📅 {formatDate(idea.createdAt)}</span>
            <span>💬 {(idea.comments || []).length} commenti</span>
            <span>⭐ {allRatings.length} valutazioni</span>
            {overallScore > 0 && <span className={`verdict-chip ${verdict.cls}`}>{verdict.label}</span>}
          </div>
        </div>
        <div className="detail-actions">
          <button className="btn btn-danger btn-sm" onClick={onDelete}>🗑 Elimina</button>
        </div>
      </div>

      <div className="tabs">
        {[["overview", "📊 Overview"], ["comments", "💬 Discussione"], ["ai", "🤖 AI Analysis"]].map(([k, l]) => (
          <button key={k} className={`tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab idea={idea} currentUser={currentUser} onUpdate={onUpdate} />}
      {tab === "comments" && <CommentsTab idea={idea} currentUser={currentUser} onUpdate={onUpdate} />}
      {tab === "ai" && <AITab idea={idea} onUpdate={onUpdate} />}
    </div>
  );
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────

function subscribeReports(callback) {
  const q = query(collection(db, "reports"), orderBy("uploadedAt", "desc"));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

async function saveReport(report) {
  await setDoc(doc(db, "reports", report.id), report);
}

async function removeReport(id) {
  await deleteDoc(doc(db, "reports", id));
}

function ReportsPage({ currentUser }) {
  const [reports, setReports] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    const unsub = subscribeReports(setReports);
    return () => unsub();
  }, []);

  const handleFile = async (f) => {
    if (!f) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const report = {
        id: Date.now().toString(),
        name: f.name,
        size: f.size,
        type: f.type,
        content: e.target.result,
        uploadedBy: currentUser,
        uploadedAt: Date.now(),
      };
      await saveReport(report);
      setUploading(false);
    };
    reader.readAsDataURL(f);
  };

  const downloadReport = (report) => {
    const a = document.createElement("a");
    a.href = report.content;
    a.download = report.name;
    a.click();
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (name) => {
    const ext = name.split(".").pop().toLowerCase();
    if (["pdf"].includes(ext)) return "📄";
    if (["doc", "docx"].includes(ext)) return "📝";
    if (["xls", "xlsx"].includes(ext)) return "📊";
    if (["ppt", "pptx"].includes(ext)) return "📋";
    if (["png", "jpg", "jpeg", "gif"].includes(ext)) return "🖼️";
    return "📎";
  };

  return (
    <div style={{ padding: 32, maxWidth: 860, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>📁 Report</h2>
          <p style={{ color: "var(--text2)", fontSize: 14 }}>Carica e condividi documenti con il tuo team</p>
        </div>
        <button
          className="btn btn-primary"
          style={{ marginLeft: "auto" }}
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "⏳ Caricamento..." : "⬆️ Carica Report"}
        </button>
        <input
          ref={fileRef} type="file" style={{ display: "none" }}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.png,.jpg,.jpeg"
          onChange={e => handleFile(e.target.files[0])}
        />
      </div>

      {reports.length === 0 && !uploading && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📁</div>
          <h3 style={{ color: "var(--text2)", marginBottom: 8 }}>Nessun report ancora</h3>
          <p style={{ color: "var(--text3)", marginBottom: 24, fontSize: 14 }}>Carica documenti che il tuo team potrà scaricare.</p>
          <button className="btn btn-primary" onClick={() => fileRef.current?.click()}>⬆️ Carica il primo report</button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {reports.map(r => (
          <div key={r.id} style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", padding: "16px 20px",
            display: "flex", alignItems: "center", gap: 16,
            transition: "border-color 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
          >
            <div style={{ fontSize: 28, flexShrink: 0 }}>{getFileIcon(r.name)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
              <div style={{ fontSize: 12, color: "var(--text3)", display: "flex", gap: 12 }}>
                <span>👤 {r.uploadedBy}</span>
                <span>📅 {formatDate(r.uploadedAt)}</span>
                <span>💾 {formatSize(r.size)}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button className="btn btn-success btn-sm" onClick={() => downloadReport(r)}>⬇️ Scarica</button>
              {r.uploadedBy === currentUser && (
                <button className="btn btn-danger btn-sm" onClick={() => removeReport(r.id)}>✕</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── EDIT MEETING MODAL ───────────────────────────────────────────────────────

function EditMeetingModal({ meeting, onClose, onSave }) {
  const [title, setTitle] = useState(meeting.title);
  const [date, setDate] = useState(meeting.date);
  const [time, setTime] = useState(meeting.time);
  const [duration, setDuration] = useState(meeting.duration);
  const [notes, setNotes] = useState(meeting.notes || "");
  const [participants, setParticipants] = useState((meeting.participants || []).join(", "));

  const handleSave = () => {
    if (!title.trim() || !date) return;
    onSave({
      ...meeting,
      title: title.trim(), date, time,
      duration: parseInt(duration),
      notes: notes.trim(),
      participants: participants.split(",").map(e => e.trim()).filter(Boolean),
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>✏️ Modifica Meeting</h3>
        <div className="form-group">
          <label className="form-label">Titolo *</label>
          <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Data *</label>
            <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Ora</label>
            <input className="form-input" type="time" value={time} onChange={e => setTime(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Durata (min)</label>
            <input className="form-input" type="number" value={duration} onChange={e => setDuration(e.target.value)} min={15} step={15} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Partecipanti (email separate da virgola)</label>
          <input className="form-input" value={participants} onChange={e => setParticipants(e.target.value)} placeholder="marco@email.com, giulia@email.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Note / Agenda</label>
          <textarea className="form-input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: "none" }} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!title.trim() || !date}>Salva</button>
        </div>
      </div>
    </div>
  );
}

// ─── HOME PAGE ───────────────────────────────────────────────────────────────

function HomePage({ ideas, onSelect, onNew, getIdeaScore }) {
  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: 26, marginBottom: 6 }}>👋 Benvenuto su Idealmente</h2>
          <p style={{ color: "var(--text2)", fontSize: 14 }}>Seleziona un'idea da approfondire o creane una nuova.</p>
        </div>
        <button className="btn btn-primary" onClick={onNew}>➕ Nuova Idea</button>
      </div>

      {ideas.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>💡</div>
          <h3 style={{ marginBottom: 8, color: "var(--text2)" }}>Nessuna idea ancora</h3>
          <p style={{ color: "var(--text3)", marginBottom: 24, fontSize: 14 }}>Crea la prima idea e inizia a collaborare con il tuo team.</p>
          <button className="btn btn-primary" onClick={onNew}>➕ Crea la prima idea</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {ideas.map(idea => {
            const score = getIdeaScore(idea);
            const verdict = score !== null ? getVerdict(score) : null;
            const allRatings = Object.values(idea.ratings || {});
            const avgByCriteria = CRITERIA.map(c => {
              const vals = allRatings.map(r => r[c.key]).filter(Boolean);
              return { ...c, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0 };
            });

            return (
              <div
                key={idea.id}
                onClick={() => onSelect(idea.id)}
                style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)", padding: 24, cursor: "pointer",
                  transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 16,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                    background: "linear-gradient(135deg, var(--accent)33, var(--accent3)22)",
                    border: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                  }}>{idea.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{idea.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>👤 {idea.createdBy} · {formatDate(idea.createdAt)}</div>
                  </div>
                  {verdict && <span className={`verdict-chip ${verdict.cls}`} style={{ fontSize: 10, flexShrink: 0 }}>{verdict.label}</span>}
                </div>

                {/* Description */}
                {idea.description && (
                  <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {idea.description}
                  </p>
                )}

                {/* Score bars */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {avgByCriteria.map(c => (
                    <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 80, fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.3px", flexShrink: 0 }}>{c.label.slice(0, 10)}</div>
                      <div className="progress-bar" style={{ height: 4 }}>
                        <div className="progress-fill" style={{ width: `${c.avg * 10}%`, background: c.color }} />
                      </div>
                      <div style={{ width: 24, fontSize: 11, color: c.color, fontWeight: 600, textAlign: "right", flexShrink: 0 }}>{c.avg > 0 ? c.avg.toFixed(1) : "—"}</div>
                    </div>
                  ))}
                </div>

                {/* Footer stats */}
                <div style={{ display: "flex", gap: 12, paddingTop: 8, borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--text3)" }}>
                  <span>💬 {(idea.comments || []).length} commenti</span>
                  <span>⭐ {allRatings.length} valutazioni</span>
                  {idea.aiAnalysis && <span style={{ color: "var(--accent)", marginLeft: "auto" }}>🤖 AI analizzata</span>}
                  {idea.fileName && <span>📎 doc</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── MEETINGS ────────────────────────────────────────────────────────────────

async function loadMeetings() {
  try {
    const r = await window.storage.get("meetings_v1");
    return r ? JSON.parse(r.value) : [];
  } catch { return []; }
}

async function saveMeetings(meetings) {
  try { await window.storage.set("meetings_v1", JSON.stringify(meetings)); } catch {}
}

function googleCalendarUrl({ title, date, time, duration, notes }) {
  const dt = new Date(`${date}T${time || "10:00"}`);
  const end = new Date(dt.getTime() + (duration || 60) * 60000);
  const fmt = d => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${fmt(dt)}/${fmt(end)}&details=${encodeURIComponent(notes || "")}`;
}

function outlookCalendarUrl({ title, date, time, duration, notes }) {
  const dt = new Date(`${date}T${time || "10:00"}`);
  const end = new Date(dt.getTime() + (duration || 60) * 60000);
  return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(title)}&startdt=${dt.toISOString()}&enddt=${end.toISOString()}&body=${encodeURIComponent(notes || "")}`;
}

function NewMeetingModal({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState("");
  const [participants, setParticipants] = useState("");

  const handleCreate = () => {
    if (!title.trim() || !date) return;
    onCreate({
      id: Date.now().toString(),
      title: title.trim(),
      date, time,
      duration: parseInt(duration),
      notes: notes.trim(),
      participants: participants.split(",").map(e => e.trim()).filter(Boolean),
      createdAt: Date.now(),
      minutes: null,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>📅 Nuovo Meeting</h3>
        <div className="form-group">
          <label className="form-label">Titolo *</label>
          <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Es. Review Q1 — Idee Business" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Data *</label>
            <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Ora</label>
            <input className="form-input" type="time" value={time} onChange={e => setTime(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Durata (min)</label>
            <input className="form-input" type="number" value={duration} onChange={e => setDuration(e.target.value)} min={15} step={15} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Partecipanti (email separate da virgola)</label>
          <input className="form-input" value={participants} onChange={e => setParticipants(e.target.value)} placeholder="marco@email.com, giulia@email.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Note / Agenda</label>
          <textarea className="form-input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Punti da discutere..." style={{ resize: "none" }} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={!title.trim() || !date}>Crea Meeting</button>
        </div>
      </div>
    </div>
  );
}

function MeetingsPage() {
  const [meetings, setMeetings] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const minutesRefs = useRef({});

  useEffect(() => {
    const unsub = subscribeMeetings(setMeetings);
    return () => unsub();
  }, []);

  const createMeeting = async (m) => { await saveMeeting(m); };
  const deleteMeeting = async (id) => { await removeMeeting(id); };
  const updateMeeting = async (m) => { await saveMeeting(m); };

  const addMinutes = async (id, text, fileName) => {
    const m = meetings.find(x => x.id === id);
    if (!m) return;
    await saveMeeting({ ...m, minutes: { text, fileName, uploadedAt: Date.now() } });
  };

  const today = new Date().toISOString().split("T")[0];
  const upcoming = meetings.filter(m => m.date >= today).sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = meetings.filter(m => m.date < today).sort((a, b) => new Date(b.date) - new Date(a.date));
  const nextMeeting = upcoming[0] || null;

  const fmtDate = (date) => new Date(date + "T12:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const daysUntil = (date) => {
    const diff = Math.ceil((new Date(date + "T12:00") - new Date()) / 86400000);
    if (diff === 0) return "oggi";
    if (diff === 1) return "domani";
    return `tra ${diff} giorni`;
  };

  return (
    <div style={{ padding: 32, maxWidth: 860, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>📅 Meeting</h2>
          <p style={{ color: "var(--text2)", fontSize: 14 }}>Pianifica sessioni di review con il tuo team</p>
        </div>
        <button className="btn btn-primary" style={{ marginLeft: "auto" }} onClick={() => setShowNew(true)}>➕ Nuovo Meeting</button>
      </div>

      {/* NEXT MEETING BANNER */}
      {nextMeeting ? (
        <div style={{
          background: "linear-gradient(135deg, var(--accent)18, var(--accent3)10)",
          border: "1px solid var(--accent)44",
          borderRadius: "var(--radius-lg)", padding: "20px 24px",
          marginBottom: 28, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: "var(--accent)22",
            border: "1px solid var(--accent)44",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>
              {new Date(nextMeeting.date + "T12:00").getDate()}
            </div>
            <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase" }}>
              {new Date(nextMeeting.date + "T12:00").toLocaleDateString("it-IT", { month: "short" })}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
              🔔 Prossimo Meeting — {daysUntil(nextMeeting.date)}
            </div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{nextMeeting.title}</div>
            <div style={{ fontSize: 13, color: "var(--text2)", display: "flex", gap: 16, flexWrap: "wrap" }}>
              <span>📅 {fmtDate(nextMeeting.date)}</span>
              <span>🕐 {nextMeeting.time}</span>
              <span>⏱ {nextMeeting.duration} min</span>
              {nextMeeting.participants?.length > 0 && (
                <span>👥 {nextMeeting.participants.length} partecipanti</span>
              )}
            </div>
            {nextMeeting.notes && (
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--text3)", fontStyle: "italic" }}>📝 {nextMeeting.notes}</div>
            )}
            {nextMeeting.participants?.length > 0 && (
              <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {nextMeeting.participants.map((p, i) => (
                  <span key={i} style={{ fontSize: 11, background: "var(--surface3)", borderRadius: 20, padding: "2px 10px", color: "var(--text2)" }}>{p}</span>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <a className="cal-btn" href={googleCalendarUrl(nextMeeting)} target="_blank" rel="noreferrer">📅 Google</a>
            <a className="cal-btn" href={outlookCalendarUrl(nextMeeting)} target="_blank" rel="noreferrer">📆 Outlook</a>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditingMeeting(nextMeeting)}>✏️</button>
            <button className="btn btn-danger btn-sm" onClick={() => deleteMeeting(nextMeeting.id)}>✕</button>
          </div>
        </div>
      ) : (
        <div style={{
          background: "var(--surface)", border: "1px dashed var(--border)",
          borderRadius: "var(--radius-lg)", padding: "20px 24px", marginBottom: 28,
          textAlign: "center", color: "var(--text3)", fontSize: 14,
        }}>
          Nessun meeting pianificato. <span style={{ color: "var(--accent)", cursor: "pointer" }} onClick={() => setShowNew(true)}>Creane uno →</span>
        </div>
      )}

      {/* OTHER UPCOMING (se ce ne sono più di 1) */}
      {upcoming.length > 1 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">🗓 Prossimi Meeting</div>
          {upcoming.slice(1).map(m => (
            <div key={m.id} className="meeting-card">
              <div className="meeting-date-box" style={{ borderColor: "var(--accent)44" }}>
                <div className="day">{new Date(m.date + "T12:00").getDate()}</div>
                <div className="month">{new Date(m.date + "T12:00").toLocaleDateString("it-IT", { month: "short" })}</div>
              </div>
              <div className="meeting-info">
                <div className="meeting-title">{m.title}</div>
                <div className="meeting-meta">
                  <span>🕐 {m.time}</span>
                  <span>⏱ {m.duration} min</span>
                  {m.participants?.length > 0 && <span>👥 {m.participants.length}</span>}
                </div>
              </div>
              <div className="meeting-actions">
                <a className="cal-btn" href={googleCalendarUrl(m)} target="_blank" rel="noreferrer">📅</a>
                <a className="cal-btn" href={outlookCalendarUrl(m)} target="_blank" rel="noreferrer">📆</a>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingMeeting(m)}>✏️</button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteMeeting(m.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAST MEETINGS */}
      {past.length > 0 && (
        <div className="card">
          <div className="card-title">🕘 Meeting Passati ({past.length})</div>
          {past.map(m => (
            <div key={m.id} className="meeting-card meeting-past" style={{ flexDirection: "column", alignItems: "stretch", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div className="meeting-date-box">
                  <div className="day">{new Date(m.date + "T12:00").getDate()}</div>
                  <div className="month">{new Date(m.date + "T12:00").toLocaleDateString("it-IT", { month: "short" })}</div>
                </div>
                <div className="meeting-info">
                  <div className="meeting-title">{m.title}</div>
                  <div className="meeting-meta">
                    <span>📅 {fmtDate(m.date)}</span>
                    <span>⏱ {m.duration} min</span>
                    {m.participants?.length > 0 && <span>👥 {m.participants.map(p => p.split("@")[0]).join(", ")}</span>}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingMeeting(m)}>✏️</button>
                <button className="btn btn-danger btn-sm" style={{ marginLeft: "auto", flexShrink: 0 }} onClick={() => deleteMeeting(m.id)}>✕</button>
              </div>
              {/* Notes */}
              {m.notes && <div style={{ fontSize: 13, color: "var(--text3)", paddingLeft: 68, fontStyle: "italic" }}>📝 {m.notes}</div>}
              {/* Minutes */}
              <div style={{ paddingLeft: 68 }}>
                {m.minutes ? (
                  <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ fontSize: 12, color: "var(--accent3)", marginBottom: 6, fontWeight: 600 }}>📋 Minute — {m.minutes.fileName}</div>
                    <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 120, overflow: "auto" }}>
                      {m.minutes.text.slice(0, 600)}{m.minutes.text.length > 600 ? "…" : ""}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--text3)" }}>Nessuna minute allegata</span>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => minutesRefs.current[m.id]?.click()}
                    >📎 Allega Minute</button>
                    <input
                      type="file" style={{ display: "none" }} accept=".txt,.md,.pdf,.doc,.docx"
                      ref={el => minutesRefs.current[m.id] = el}
                      onChange={e => {
                        const f = e.target.files[0];
                        if (!f) return;
                        const reader = new FileReader();
                        reader.onload = ev => addMinutes(m.id, ev.target.result, f.name);
                        reader.readAsText(f);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {meetings.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text3)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
          <p>Nessun meeting ancora. Creane uno!</p>
        </div>
      )}

      {showNew && <NewMeetingModal onClose={() => setShowNew(false)} onCreate={createMeeting} />}
      {editingMeeting && <EditMeetingModal meeting={editingMeeting} onClose={() => setEditingMeeting(null)} onSave={updateMeeting} />}
    </div>
  );
}

// ─── ONBOARDING ──────────────────────────────────────────────────────────────

function OnboardingScreen({ onEnter }) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleEnter = () => {
    const trimmed = name.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    // Small delay ensures React flushes state before parent re-renders
    setTimeout(() => onEnter(trimmed), 50);
  };

  return (
    <div style={{
      height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg)", flexDirection: "column", gap: 0,
    }}>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", padding: "48px 40px", width: 420,
        textAlign: "center", boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20, margin: "0 auto 24px",
          background: "linear-gradient(135deg, var(--accent), var(--accent3))",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
        }}>💡</div>
        <h2 style={{ fontSize: 26, marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>Idealmente</h2>
        <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 32 }}>
          Il tuo spazio collaborativo per valutare idee di business con il tuo team.
        </p>
        <div style={{ textAlign: "left", marginBottom: 20 }}>
          <label className="form-label">Come ti chiami?</label>
          <input
            className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleEnter()}
            placeholder="Es. Marco Rossi"
            autoFocus
            style={{ fontSize: 15 }}
          />
        </div>
        <button
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: 15 }}
          onClick={handleEnter}
          disabled={!name.trim() || submitting}
        >
          {submitting ? "Caricamento..." : "Entra →"}
        </button>
      </div>
      <p style={{ color: "var(--text3)", fontSize: 12, marginTop: 20 }}>
        Il nome viene salvato solo nel tuo browser
      </p>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [ideas, setIdeas] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [page, setPage] = useState("ideas"); // "ideas" | "meetings"
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem("idealmente_username") || "");
  const [loaded, setLoaded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  const handleEnterName = (name) => {
    localStorage.setItem("idealmente_username", name);
    setCurrentUser(name);
  };

  // Show onboarding if no name set
  if (!currentUser) {
    return (
      <>
        <style>{STYLE}</style>
        <OnboardingScreen onEnter={handleEnterName} />
      </>
    );
  }

  useEffect(() => {
    setLoaded(false);
    const unsub = subscribeIdeas(data => {
      setIdeas(data);
      setLoaded(true);
    });
    return () => unsub();
  }, []);

  const createIdea = async (idea) => {
    await saveIdea(idea);
    setSelectedId(idea.id);
  };

  const updateIdea = async (updated) => {
    await saveIdea(updated);
    setIdeas(prev => prev.map(i => i.id === updated.id ? updated : i));
  };

  const deleteIdea = async (id) => {
    await removeIdea(id);
    setSelectedId(null);
  };

  const selected = ideas.find(i => i.id === selectedId);

  const getIdeaScore = (idea) => {
    const allR = Object.values(idea.ratings || {});
    if (!allR.length) return null;
    const avg = CRITERIA.map(c => {
      const vals = allR.map(r => r[c.key]).filter(Boolean);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }).reduce((a, b) => a + b, 0) / CRITERIA.length;
    return avg;
  };

  return (
    <>
      <style>{STYLE}</style>
      <div className="app">
        {/* TOPBAR */}
        <div className="topbar">
          <div className="topbar-logo">Idealmente</div>
          <div className="topbar-spacer" />
          {/* NAV IN TOPBAR */}
          <div style={{ display: "flex", gap: 4 }}>
            {[
              ["ideas", "💡", "Idee"],
              ["meetings", "📅", "Meeting"],
              ["reports", "📁", "Report"],
            ].map(([key, icon, label]) => (
              <button
                key={key}
                onClick={() => { setPage(key); if (key === "ideas") setSelectedId(null); }}
                style={{
                  background: page === key ? "var(--surface3)" : "transparent",
                  border: page === key ? "1px solid var(--border)" : "1px solid transparent",
                  borderRadius: 8, padding: "6px 14px",
                  color: page === key ? "var(--text)" : "var(--text2)",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: 6,
                  transition: "all 0.15s",
                }}
              >{icon} {label}</button>
            ))}
          </div>
          <div className="topbar-spacer" />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {editingName ? (
              <>
                <input
                  className="form-input"
                  value={tempName}
                  onChange={e => setTempName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && tempName.trim()) {
                      const n = tempName.trim();
                      setCurrentUser(n);
                      localStorage.setItem("idealmente_username", n);
                      setEditingName(false);
                    }
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  style={{ padding: "4px 10px", fontSize: 13, width: 150 }}
                  autoFocus
                />
                <button className="btn btn-ghost btn-sm" onClick={() => {
                  if (tempName.trim()) {
                    const n = tempName.trim();
                    setCurrentUser(n);
                    localStorage.setItem("idealmente_username", n);
                  }
                  setEditingName(false);
                }}>✓</button>
              </>
            ) : (
              <span
                style={{ fontSize: 13, color: "var(--text2)", cursor: "pointer" }}
                title="Clicca per cambiare nome"
                onClick={() => { setTempName(currentUser); setEditingName(true); }}
              >
                {currentUser} <span style={{ color: "var(--text3)", fontSize: 11 }}>✎</span>
              </span>
            )}
          </div>
          <div className="avatar" style={{ background: `linear-gradient(135deg, ${hashColor(currentUser)}, ${hashColor(currentUser + "2")})` }}>
            {initials(currentUser)}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="sidebar-section">
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => { setPage("ideas"); setShowNew(true); }}>
              ➕ Nuova Idea
            </button>
          </div>
          {page === "ideas" && (
          <div className="ideas-list">
            {!loaded && <div style={{ color: "var(--text3)", fontSize: 13, textAlign: "center", padding: 20 }}>Caricamento...</div>}
            {loaded && ideas.length === 0 && <div style={{ color: "var(--text3)", fontSize: 13, textAlign: "center", padding: 20 }}>Nessuna idea ancora</div>}
            {ideas.map(idea => {
              const score = getIdeaScore(idea);
              return (
                <div
                  key={idea.id}
                  className={`idea-item ${selectedId === idea.id ? "active" : ""}`}
                  onClick={() => setSelectedId(idea.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>{idea.emoji}</span>
                    <div className="idea-item-title">{idea.title}</div>
                  </div>
                  <div className="idea-item-meta">
                    <span>👤 {idea.createdBy}</span>
                    {score !== null && (
                      <span className={`score-badge ${getScoreClass(score)}`}>{score.toFixed(1)}</span>
                    )}
                    {idea.aiAnalysis && <span title="AI analizzata">🤖</span>}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* MAIN */}
        <div className="main">
          {page === "meetings" ? (
            <MeetingsPage />
          ) : page === "reports" ? (
            <ReportsPage currentUser={currentUser} />
          ) : selectedId && selected ? (
            <IdeaDetail
              key={selected.id}
              idea={selected}
              currentUser={currentUser}
              onUpdate={updateIdea}
              onDelete={() => deleteIdea(selected.id)}
            />
          ) : (
            <HomePage ideas={ideas} onSelect={(id) => setSelectedId(id)} onNew={() => setShowNew(true)} getIdeaScore={getIdeaScore} />
          )}
        </div>
      </div>

      {showNew && <NewIdeaModal onClose={() => setShowNew(false)} onCreate={createIdea} currentUser={currentUser} />}
    </>
  );
}