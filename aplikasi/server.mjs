// Adriy Studio: aplikasi web pembuat video Remotion dari naskah + suara lokal (VoxCPM2, pustaka suara AdriyMine).
import express from "express";
import multer from "multer";
import { spawn, execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8080);
const SANDI = process.env.SANDI || "";
const ROOT = path.resolve(process.env.ADRIY_ROOT || path.join(DIR, ".."));
const PY = process.env.PY || path.join(ROOT, ".venv-tts/bin/python");
const CHROME = process.env.CHROME || undefined;
const KONK = Number(process.env.KONKURENSI || 2);
const DATA = path.resolve(process.env.DATA || path.join(DIR, "data"));
const SUARA = ["mia", "adriy", "hasan", "ongky"], TEMA = ["bongkah", "bumi", "atom", "roda"];
if (!SANDI) { console.error("Isi variabel SANDI dulu (password aplikasi)."); process.exit(1); }
fs.mkdirSync(DATA, { recursive: true });

const app = express();
app.use(express.json({ limit: "2mb" }));
const izin = (req) => req.get("x-sandi") === SANDI || req.query.k === SANDI; // tanpa pengecualian localhost (di balik nginx semua tampak dari 127.0.0.1)
app.use("/api", (req, res, next) => (izin(req) ? next() : res.status(401).json({ galat: "Password salah" })));
app.use("/berkas", (req, res, next) => (izin(req) ? next() : res.status(401).end()), express.static(DATA));
app.use(express.static(path.join(DIR, "public")));

// ---------- naskah ----------
const pecah = (naskah) => {
  const bagian = [], kalimat = [];
  for (let b of naskah.split(/\r?\n/)) {
    b = b.replace(/\[[^\]]*\]/g, " ").trim();
    if (b.startsWith("#")) { bagian.push(b.replace(/^#+\s*/, "")); continue; }
    if (!b) continue;
    if (!bagian.length) bagian.push("");
    for (const s of b.split(/(?<=[.!?…])\s+/)) if (s.trim()) kalimat.push({ teks: s.trim(), bagian: bagian.length - 1 });
  }
  return { bagian, kalimat };
};

// ---------- antrean pekerjaan ----------
const kerja = new Map();
const simpan = (j) => fs.writeFileSync(path.join(DATA, j.id, "status.json"), JSON.stringify(j, null, 1));
for (const d of fs.readdirSync(DATA)) { try { const j = JSON.parse(fs.readFileSync(path.join(DATA, d, "status.json"))); if (!["selesai", "gagal"].includes(j.tahap)) j.tahap = "gagal", j.pesan = "Server dinyalakan ulang saat proses berjalan. Buat ulang."; kerja.set(j.id, j); } catch {} }
const antre = [];
let sibuk = false, berkas = null;
const jalan = async () => {
  if (sibuk || !antre.length) return; sibuk = true;
  const j = antre.shift();
  try { await proses(j); j.tahap = "selesai"; j.persen = 100; }
  catch (e) { j.tahap = "gagal"; j.pesan = String(e.message || e).slice(0, 400); console.error(e); }
  simpan(j); sibuk = false; jalan();
};

const proses = async (j) => {
  const d = path.join(DATA, j.id); const { bagian, kalimat } = pecah(j.naskah);
  // 1) suara: pustaka_suara.py (kalimat yang sudah ada di pustaka dipakai ulang)
  j.tahap = "suara"; j.persen = 0; simpan(j);
  const nk = path.join(d, "naskah.txt"); fs.writeFileSync(nk, j.naskah.split(/\r?\n/).filter((b) => !b.trim().startsWith("#")).join("\n"));
  await new Promise((ok, gagal) => {
    const p = spawn(PY, ["projects/suara/pustaka_suara.py", "naskah", nk, path.join(d, "suara"), "--suara", j.suara], { cwd: ROOT });
    let n = 0, log = "";
    const baca = (x) => { const s = x.toString(); log = (log + s).slice(-3000); n += (s.match(/^\s*(\+|♻)/gm) || []).length; j.persen = Math.min(99, Math.round((n / kalimat.length) * 100)); };
    p.stdout.on("data", baca); p.stderr.on("data", baca);
    p.on("close", (c) => (c === 0 && fs.existsSync(path.join(d, "suara/narasi.wav")) ? ok() : gagal(new Error("Suara gagal: " + log.slice(-400)))));
  });
  // 2) timeline dari durasi tiap kalimat
  const daftar = JSON.parse(fs.readFileSync(path.join(d, "suara/daftar.json")));
  const FPS = 30; let t = 0.4; const kal = [];
  // cocokkan tiap kalimat suara ke baris naskah asalnya (pustaka bisa memakai satu baris utuh)
  const baris = []; let bi = -1;
  for (const b of j.naskah.split(/\r?\n/)) { const x = b.replace(/\[[^\]]*\]/g, " ").replace(/\s+/g, " ").trim(); if (x.startsWith("#")) bi++; else if (x) baris.push({ x, bagian: Math.max(0, bi) }); }
  let pb = 0;
  daftar.forEach((e) => {
    while (pb < baris.length - 1 && !baris[pb].x.includes(e.teks.trim())) pb++;
    kal.push({ teks: e.teks, a: Math.round(t * FPS), b: Math.round((t + e.durasi) * FPS), bagian: baris[pb]?.bagian ?? 0 }); t += e.durasi + e.jeda_sesudah;
  });
  const durasi = Math.round((t + 1.5) * FPS);
  const bg = bagian.map((nama, i) => { const ks = kal.filter((k) => k.bagian === i); return { judul: nama, a: i ? ks[0]?.a ?? 0 : 0, b: 0 }; });
  bg.forEach((b, i) => (b.b = bg[i + 1]?.a ?? durasi));
  // 3) render Remotion
  j.tahap = "render"; j.persen = 0; simpan(j);
  berkas ||= await bundle({ entryPoint: path.join(DIR, "video/src/index.ts") });
  const props = { judul: j.judul, tema: j.tema, audio: `http://127.0.0.1:${PORT}/berkas/${j.id}/suara/narasi.wav?k=${encodeURIComponent(SANDI)}`, durasi, bagian: bg, kalimat: kal };
  const comp = await selectComposition({ serveUrl: berkas, id: "Materi", inputProps: props, browserExecutable: CHROME, chromiumOptions: { gl: "swangle" } });
  const mentah = path.join(d, "mentah.mp4");
  await renderMedia({ composition: comp, serveUrl: berkas, codec: "h264", outputLocation: mentah, inputProps: props, concurrency: KONK, browserExecutable: CHROME,
    chromiumOptions: { gl: "swangle" }, onProgress: ({ progress }) => { const p = Math.round(progress * 100); if (p !== j.persen) { j.persen = p; if (p % 5 === 0) simpan(j); } } });
  // 4) samakan kekerasan suara (-14 LUFS) untuk TikTok
  j.tahap = "akhir"; simpan(j);
  await new Promise((ok, gagal) => execFile("ffmpeg", ["-y", "-loglevel", "error", "-i", mentah, "-c:v", "copy", "-af", "loudnorm=I=-14:TP=-1.5", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", path.join(d, "video.mp4")], (e) => (e ? gagal(e) : ok())));
  fs.rmSync(mentah, { force: true });
};

// ---------- API ----------
app.get("/api/cek", (req, res) => res.json({ ok: true, suara: SUARA, tema: TEMA }));
app.post("/api/buat", (req, res) => {
  const { judul = "", naskah = "", suara = "mia", tema = "bongkah" } = req.body || {};
  if (!naskah.trim()) return res.status(400).json({ galat: "Naskah masih kosong" });
  if (!SUARA.includes(suara) || !TEMA.includes(tema)) return res.status(400).json({ galat: "Pilihan suara/tema tidak dikenal" });
  const n = pecah(naskah).kalimat.length;
  if (n > 400) return res.status(400).json({ galat: `Naskah terlalu panjang (${n} kalimat, maks 400)` });
  const id = new Date().toISOString().replace(/\D/g, "").slice(0, 14) + "-" + Math.random().toString(36).slice(2, 6);
  fs.mkdirSync(path.join(DATA, id), { recursive: true });
  const j = { id, judul: judul.trim() || "Adriy Project", naskah, suara, tema, kalimat: n, tahap: "antre", persen: 0, dibuat: Date.now() };
  kerja.set(id, j); simpan(j); antre.push(j); jalan();
  res.json({ id });
});
app.get("/api/daftar", (req, res) => res.json([...kerja.values()].sort((a, b) => b.dibuat - a.dibuat).map(({ naskah, ...j }) => j)));
app.delete("/api/kerja/:id", (req, res) => {
  const j = kerja.get(req.params.id); if (!j || !["selesai", "gagal"].includes(j.tahap)) return res.status(400).json({ galat: "Tidak bisa dihapus saat berjalan" });
  fs.rmSync(path.join(DATA, j.id), { recursive: true, force: true }); kerja.delete(j.id); res.json({ ok: true });
});
const unggah = multer({ storage: multer.memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } });
app.post("/api/pdf", unggah.single("pdf"), (req, res) => {
  if (!req.file) return res.status(400).json({ galat: "Tidak ada file" });
  const tmp = path.join(DATA, `pdf-${Date.now()}.pdf`); fs.writeFileSync(tmp, req.file.buffer);
  execFile("pdftotext", ["-layout", tmp, "-"], { maxBuffer: 20e6 }, (e, out) => { fs.rmSync(tmp, { force: true }); e ? res.status(500).json({ galat: "Gagal membaca PDF" }) : res.json({ teks: out }); });
});

app.listen(PORT, () => console.log(`Adriy Studio jalan di http://localhost:${PORT}`));
