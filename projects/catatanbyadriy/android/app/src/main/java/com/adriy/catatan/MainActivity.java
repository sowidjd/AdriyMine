package com.adriy.catatan;

import android.app.Activity;
import android.content.ClipData;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.util.Base64;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import org.json.JSONObject;
import java.io.OutputStream;

public class MainActivity extends Activity {
    private static final String HOST = "app.catatanbyadriy.local";
    private static final String ORIGIN = "https://" + HOST + "/";
    private static final int REQ_FILE = 1, REQ_SAVE = 2, REQ_NOTIF = 3;
    private String pendingOpen = null;

    private WebView web;
    private WebView printWeb;
    private ValueCallback<Uri[]> fileCb;
    private byte[] pendingBytes;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        Window w = getWindow();
        w.setStatusBarColor(Color.parseColor("#F4F7FE"));
        w.setNavigationBarColor(Color.parseColor("#FDFEFF"));
        int flags = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        if (Build.VERSION.SDK_INT >= 26) flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        w.getDecorView().setSystemUiVisibility(flags);

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#F4F7FE"));
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);
        web.addJavascriptInterface(new Bridge(), "Android");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (!HOST.equals(u.getHost())) return null;
                String p = u.getPath();
                if (p == null || p.equals("/") || p.isEmpty()) p = "/index.html";
                try {
                    InputStream in = getAssets().open(p.substring(1));
                    return new WebResourceResponse(mime(p), mime(p).startsWith("text") || p.endsWith(".js") ? "utf-8" : null, in);
                } catch (Exception e) {
                    return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", null, null);
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                String[] types = params.getAcceptTypes();
                java.util.ArrayList<String> mimes = new java.util.ArrayList<>();
                boolean any = types == null || types.length == 0;
                if (types != null) for (String t : types) {
                    if (t == null || t.trim().isEmpty()) continue;
                    for (String x : t.split(",")) { x = x.trim(); if (x.startsWith(".") || x.isEmpty()) any = true; else mimes.add(x); }
                }
                if (any || mimes.isEmpty()) i.setType("*/*");
                else if (mimes.size() == 1) i.setType(mimes.get(0));
                else { i.setType("*/*"); i.putExtra(Intent.EXTRA_MIME_TYPES, mimes.toArray(new String[0])); }
                if (params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                try {
                    startActivityForResult(Intent.createChooser(i, "Pilih berkas"), REQ_FILE);
                } catch (Exception e) {
                    fileCb = null;
                    return false;
                }
                return true;
            }
        });
        setContentView(web);
        Reminders.ensureChannel(this);
        pendingOpen = getIntent().getStringExtra("open");
        if (b != null) web.restoreState(b);
        else web.loadUrl(ORIGIN + "index.html");
    }

    @Override
    protected void onNewIntent(Intent i) {
        super.onNewIntent(i);
        String o = i.getStringExtra("open");
        if (o != null && !o.isEmpty()) web.evaluateJavascript("window.__openFrom&&window.__openFrom(" + JSONObject.quote(o) + ")", null);
    }

    private String notifState() {
        android.app.NotificationManager nm = (android.app.NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 33) {
            if (checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) == android.content.pm.PackageManager.PERMISSION_GRANTED)
                return nm.areNotificationsEnabled() ? "granted" : "denied";
            boolean asked = getSharedPreferences("cba_reminders", MODE_PRIVATE).getBoolean("asked", false);
            return asked && !shouldShowRequestPermissionRationale(android.Manifest.permission.POST_NOTIFICATIONS) ? "denied" : "default";
        }
        return nm.areNotificationsEnabled() ? "granted" : "denied";
    }

    @Override
    public void onRequestPermissionsResult(int req, String[] perms, int[] res) {
        super.onRequestPermissionsResult(req, perms, res);
        if (req == REQ_NOTIF) web.evaluateJavascript("window.__notifPerm&&window.__notifPerm(" + JSONObject.quote(notifState()) + ")", null);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.evaluateJavascript("window.__notifPerm&&window.__notifPerm(" + JSONObject.quote(notifState()) + ",true)", null);
    }

    private static String mime(String p) {
        p = p.toLowerCase();
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".js")) return "application/javascript";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".woff2")) return "font/woff2";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".mp4")) return "video/mp4";
        if (p.endsWith(".webm")) return "video/webm";
        if (p.endsWith(".json")) return "application/json";
        return "application/octet-stream";
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("(window.appBack&&window.appBack())?'1':'0'", v -> {
            if (v == null || !v.contains("1")) finish();
        });
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req == REQ_FILE) {
            if (fileCb == null) return;
            Uri[] out = null;
            if (res == RESULT_OK && data != null) {
                ClipData cd = data.getClipData();
                if (cd != null) {
                    out = new Uri[cd.getItemCount()];
                    for (int i = 0; i < cd.getItemCount(); i++) out[i] = cd.getItemAt(i).getUri();
                } else if (data.getData() != null) {
                    out = new Uri[]{data.getData()};
                }
            }
            fileCb.onReceiveValue(out);
            fileCb = null;
        } else if (req == REQ_SAVE) {
            if (res == RESULT_OK && data != null && data.getData() != null && pendingBytes != null) {
                try (OutputStream os = getContentResolver().openOutputStream(data.getData())) {
                    os.write(pendingBytes);
                    Toast.makeText(this, "Berkas tersimpan", Toast.LENGTH_SHORT).show();
                } catch (Exception e) {
                    Toast.makeText(this, "Gagal menyimpan berkas", Toast.LENGTH_SHORT).show();
                }
            }
            pendingBytes = null;
        }
    }

    private class Bridge {
        @JavascriptInterface
        public String notifPermission() { return notifState(); }

        @JavascriptInterface
        public void setDark(final boolean dark) {
            runOnUiThread(() -> {
                Window w = getWindow();
                w.setStatusBarColor(Color.parseColor(dark ? "#0B0F1C" : "#F4F7FE"));
                w.setNavigationBarColor(Color.parseColor(dark ? "#11162A" : "#FDFEFF"));
                int f = dark ? 0 : View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                if (Build.VERSION.SDK_INT >= 26 && !dark) f |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                w.getDecorView().setSystemUiVisibility(f);
                web.setBackgroundColor(Color.parseColor(dark ? "#0B0F1C" : "#F4F7FE"));
            });
        }

        @JavascriptInterface
        public void requestNotif() {
            runOnUiThread(() -> {
                if (Build.VERSION.SDK_INT >= 33 && !"granted".equals(notifState()) && !"denied".equals(notifState())) {
                    getSharedPreferences("cba_reminders", MODE_PRIVATE).edit().putBoolean("asked", true).apply();
                    requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIF);
                } else if (!"granted".equals(notifState())) {
                    openNotifSettings();
                } else web.evaluateJavascript("window.__notifPerm&&window.__notifPerm('granted')", null);
            });
        }

        @JavascriptInterface
        public void openNotifSettings() {
            runOnUiThread(() -> {
                Intent i = new Intent(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                i.putExtra(android.provider.Settings.EXTRA_APP_PACKAGE, getPackageName());
                try { startActivity(i); } catch (Exception e) {
                    startActivity(new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName())));
                }
            });
        }

        @JavascriptInterface
        public void syncReminders(String json) { Reminders.sync(MainActivity.this, json); }

        @JavascriptInterface
        public void testNotif(String title, String body) { Reminders.show(MainActivity.this, "test-" + System.currentTimeMillis(), title, body, "kalender"); }

        @JavascriptInterface
        public String takeOpen() { String o = pendingOpen; pendingOpen = null; return o == null ? "" : o; }

        @JavascriptInterface
        public String appVersion() {
            try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionName; } catch (Exception e) { return ""; }
        }

        /** Permintaan HTTP dari JS lewat jaringan Android (tanpa batasan CORS). Hasil dikirim ke window.__httpDone. */
        @JavascriptInterface
        public void httpRequest(final String id, final String method, final String url, final String headersJson, final String body, final int timeout) {
            new Thread(() -> {
                int status = 0; String text; JSONObject hdr = new JSONObject();
                HttpURLConnection c = null;
                try {
                    if (!url.startsWith("https://")) throw new Exception("Hanya https");
                    c = (HttpURLConnection) new URL(url).openConnection();
                    c.setRequestMethod(method);
                    c.setConnectTimeout(Math.min(timeout, 20000));
                    c.setReadTimeout(timeout);
                    c.setRequestProperty("User-Agent", "CatatanByAdriy/1.2 (Android)");
                    JSONObject h = new JSONObject(headersJson == null || headersJson.isEmpty() ? "{}" : headersJson);
                    Iterator<String> it = h.keys();
                    while (it.hasNext()) { String k = it.next(); c.setRequestProperty(k, h.getString(k)); }
                    if (body != null && !body.isEmpty()) {
                        c.setDoOutput(true);
                        try (OutputStream os = c.getOutputStream()) { os.write(body.getBytes("UTF-8")); }
                    }
                    status = c.getResponseCode();
                    InputStream in = status >= 400 ? c.getErrorStream() : c.getInputStream();
                    ByteArrayOutputStream bo = new ByteArrayOutputStream();
                    if (in != null) { byte[] buf = new byte[8192]; int n; while ((n = in.read(buf)) > 0) bo.write(buf, 0, n); in.close(); }
                    text = bo.toString("UTF-8");
                    for (Map.Entry<String, List<String>> e : c.getHeaderFields().entrySet())
                        if (e.getKey() != null && !e.getValue().isEmpty()) hdr.put(e.getKey().toLowerCase(), e.getValue().get(0));
                } catch (Exception e) {
                    status = 0; text = e.getClass().getSimpleName() + ": " + e.getMessage();
                } finally { if (c != null) c.disconnect(); }
                final String js = "window.__httpDone&&window.__httpDone(" + JSONObject.quote(id) + "," + status + "," + JSONObject.quote(text) + "," + JSONObject.quote(hdr.toString()) + ")";
                runOnUiThread(() -> web.evaluateJavascript(js, null));
            }).start();
        }

        @JavascriptInterface
        public void printHtml(final String title, final String html) {
            runOnUiThread(() -> {
                printWeb = new WebView(MainActivity.this);
                printWeb.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageFinished(WebView v, String url) {
                        PrintManager pm = (PrintManager) getSystemService(PRINT_SERVICE);
                        pm.print(title, v.createPrintDocumentAdapter(title),
                                new PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.ISO_A4).build());
                    }
                });
                printWeb.loadDataWithBaseURL(ORIGIN, html, "text/html", "utf-8", null);
            });
        }

        @JavascriptInterface
        public void saveFile(final String name, final String mime, final String b64) {
            runOnUiThread(() -> {
                try {
                    pendingBytes = Base64.decode(b64, Base64.DEFAULT);
                    Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    i.addCategory(Intent.CATEGORY_OPENABLE);
                    i.setType(mime == null || mime.isEmpty() ? "application/octet-stream" : mime);
                    i.putExtra(Intent.EXTRA_TITLE, name);
                    startActivityForResult(i, REQ_SAVE);
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Gagal menyimpan berkas", Toast.LENGTH_SHORT).show();
                }
            });
        }
    }
}
