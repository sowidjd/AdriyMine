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
    private static final int REQ_FILE = 1, REQ_SAVE = 2;

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
                String t = (types != null && types.length > 0 && types[0] != null && !types[0].isEmpty()) ? types[0] : "*/*";
                if (t.startsWith(".")) t = "*/*";
                i.setType(t);
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
        if (b != null) web.restoreState(b);
        else web.loadUrl(ORIGIN + "index.html");
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
