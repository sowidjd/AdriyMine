// Uji Node.js: (A) Node mini bawaan, (B) jembatan Node.js asli (saku-bridge) + paket npm sembarang.
const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const FILE = 'file://' + path.resolve(__dirname, '../dist/remotion-saku.html');
const PROYEK = `// remotion.config.ts
import { Config } from '@remotion/cli/config';
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);

// src/data.json
{ "judul": "Data dari JSON", "angka": [3, 4, 5] }

// src/Video.tsx
import { AbsoluteFill } from 'remotion';
import fs from 'node:fs';
import path from 'path';
import { Buffer } from 'buffer';
import { EventEmitter } from 'events';
import crypto from 'crypto';
import os from 'os';
import data from './data.json';

const teks = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));
const em = new EventEmitter();
let pesan = '';
em.on('hai', (x) => { pesan = x; });
em.emit('hai', 'event-ok');
const hash = crypto.createHash('sha256').update('abc').digest('hex').slice(0, 8);

export const NodeVideo = () => (
  <AbsoluteFill style={{ background: '#123', color: 'white', fontSize: 50, padding: 60 }}>
    <div>{data.judul} | {teks.angka.reduce((a, b) => a + b, 0)}</div>
    <div>{path.basename('/a/b/klip.mp4', '.mp4')} | {Buffer.from('hai').toString('base64')} | {pesan}</div>
    <div>{process.env.NODE_ENV} | {os.platform()} | {hash} | {typeof fs.existsSync === 'function' && fs.existsSync('./data.json') ? 'ada' : 'tidak'}</div>
  </AbsoluteFill>
);`;
(async () => {
  const res = []; const ok = (n, c, x = '') => res.push(`${c ? 'LULUS' : 'GAGAL'}  ${n} ${x}`);
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['Pixel 7'], permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => res.push('PAGEERROR ' + e.message));
  await page.goto(FILE);
  await page.waitForSelector('.stage', { timeout: 30000 });
  const paste = async (code) => {
    await page.click('.tabs button:nth-child(1)');
    await page.evaluate((t) => navigator.clipboard.writeText(t), code);
    await page.click('button:has-text("Tempel")');
    await page.click('.run');
    await page.waitForFunction(() => !document.querySelector('.run.busy'), null, { timeout: 300000 });
    await page.waitForTimeout(1500);
    return page.evaluate(() => ({ stage: document.querySelector('.stage')?.innerText || '', issues: [...document.querySelectorAll('.issues li')].map((l) => l.innerText.replace(/\n/g, ' ')), warn: document.querySelector('.card.warn')?.innerText || '' }));
  };
  // ---- A. Node mini ----
  let r = await paste(PROYEK);
  ok('Node mini: fs, path, process, Buffer, events, crypto, os, data.json, remotion.config.ts',
    /Data dari JSON \| 12/.test(r.stage) && /klip \| aGFp \| event-ok/.test(r.stage) && /production \| android \| ba7816bf \| ada/.test(r.stage) && !r.issues.length,
    JSON.stringify(r.stage.split('\n').slice(0, 3)) + (r.issues.length ? ' laporan: ' + r.issues.join(' | ') : ''));
  // ---- B. Node.js asli lewat jembatan ----
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'saku-bridge-'));
  const br = spawn(process.execPath, [path.resolve(__dirname, '../bridge/saku-bridge.mjs')], { env: { ...process.env, SAKU_HOME: home, SAKU_TOKEN: '246810' } });
  let log = ''; br.stdout.on('data', (d) => { log += d; }); br.stderr.on('data', (d) => { log += d; });
  for (let i = 0; i < 60 && !/esbuild siap|esbuild belum/.test(log); i++) await new Promise((x) => setTimeout(x, 1000));
  ok('jembatan berjalan + kode sambung tampil', /KODE SAMBUNG:\s+246810/.test(log) && /esbuild siap/.test(log), log.split('\n').filter((l) => /Node|esbuild|KODE/.test(l)).map((l) => l.trim()).join(' / '));
  await page.click('.tabs button:nth-child(4)');
  await page.click('summary:has-text("Node.js")');
  await page.fill('#kode-sambung', '111111');
  await page.click('button:has-text("Sambungkan")');
  await page.waitForTimeout(800);
  const wrong = await page.locator('.toast').innerText().catch(() => '');
  ok('kode sambung salah ditolak', /salah/i.test(wrong), wrong);
  await page.fill('#kode-sambung', '246810');
  await page.click('button:has-text("Sambungkan")');
  await page.waitForSelector('.node .st.ok:has-text("tersambung")', { timeout: 10000 }).catch(() => {});
  const chip = await page.locator('.node .prov li:nth-child(2) .st').innerText().catch(() => '');
  ok('Node.js asli tersambung', /tersambung · Node v\d+/.test(chip), chip);
  await page.click('button:has-text("Jalankan di Node.js")');
  await page.waitForSelector('.node-out', { timeout: 60000 }).catch(() => {});
  const out = await page.locator('.node-out').innerText().catch(() => '');
  ok('skrip berjalan di Node.js asli', /Halo dari Node\.js v\d+/.test(out), out.replace(/\n/g, ' ').slice(0, 120));
  r = await paste(`import { AbsoluteFill } from 'remotion';
import { Rocket, Atom } from 'lucide-react';
export const Ikon = () => <AbsoluteFill style={{ background: '#0b1324', color: 'white', fontSize: 60, justifyContent: 'center', alignItems: 'center' }}><Rocket size={300} color="#ffd166" /><Atom size={200} color="#4d8dff" /><div>Paket npm OK</div></AbsoluteFill>;`);
  const svgs = await page.evaluate(() => document.querySelectorAll('.stage svg.lucide').length);
  ok('paket npm sembarang (lucide-react) dipasang lewat Node.js asli', /Paket npm OK/.test(r.stage) && svgs >= 2 && /Termux/.test(r.warn), `svg=${svgs} · ${r.warn.replace(/\n/g, ' ').slice(0, 120)}${r.issues.length ? ' laporan: ' + r.issues.join(' | ') : ''}`);
  await page.locator('.stage').screenshot({ path: (process.env.SHOTS || os.tmpdir()) + '/node-lucide.png' });
  br.kill();
  console.log(res.join('\n'));
  await b.close();
  process.exit(res.some((x) => !x.startsWith('LULUS')) ? 1 : 0);
})();
