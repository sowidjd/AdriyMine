package id.adriymine.remotionsaku;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.graphics.Color;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import java.util.List;
import org.json.JSONObject;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Remotion Saku: WebView yang memuat aplikasi web dari assets lewat alamat https
 * (agar WebCodecs, IndexedDB dan fetch berjalan seperti di Chrome), plus jembatan
 * "SakuAndroid" untuk clipboard, simpan video, bagikan, dan layar tetap menyala.
 */
public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + HOST + "/index.html";
    private static final int FILE_REQ = 41;

    private WebView web;
    private ValueCallback<Uri[]> fileCallback;
    private String sharedText;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) WebView.setWebContentsDebuggingEnabled(true);

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#0e1116"));
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setTextZoom(100);
        s.setSupportZoom(false);
        s.setOffscreenPreRaster(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);

        web.addJavascriptInterface(new Bridge(), "SakuAndroid");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (!HOST.equals(u.getHost())) return null;
                String path = u.getPath();
                if (path == null || path.equals("/") || path.isEmpty()) path = "/index.html";
                try {
                    InputStream in = getAssets().open(path.substring(1));
                    WebResourceResponse r = new WebResourceResponse(mimeOf(path), "utf-8", in);
                    Map<String, String> h = new HashMap<>();
                    h.put("Cache-Control", "no-cache");
                    r.setResponseHeaders(h);
                    return r;
                } catch (Exception e) {
                    return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", null, null);
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (HOST.equals(u.getHost())) return false;
                openExternal(u.toString());
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = cb;
                try {
                    Intent i = params.createIntent();
                    i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);
                    startActivityForResult(Intent.createChooser(i, "Pilih file"), FILE_REQ);
                    return true;
                } catch (Exception e) {
                    fileCallback = null;
                    toast("Tidak ada aplikasi pemilih file");
                    return false;
                }
            }
        });

        readShared(getIntent());
        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl(START_URL);
    }

    private static String mimeOf(String p) {
        String l = p.toLowerCase();
        if (l.endsWith(".html")) return "text/html";
        if (l.endsWith(".js") || l.endsWith(".mjs")) return "text/javascript";
        if (l.endsWith(".css")) return "text/css";
        if (l.endsWith(".json")) return "application/json";
        if (l.endsWith(".png")) return "image/png";
        if (l.endsWith(".svg")) return "image/svg+xml";
        if (l.endsWith(".wasm")) return "application/wasm";
        return "application/octet-stream";
    }

    private void readShared(Intent intent) {
        if (intent != null && Intent.ACTION_SEND.equals(intent.getAction())) {
            CharSequence t = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
            if (t != null && t.length() > 0) sharedText = t.toString();
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        readShared(intent);
        if (sharedText != null && web != null) web.evaluateJavascript("window.__sakuIncoming && window.__sakuIncoming()", null);
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        if (web != null) web.saveState(out);
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req != FILE_REQ || fileCallback == null) return;
        Uri[] result = null;
        if (res == RESULT_OK && data != null) {
            if (data.getClipData() != null) {
                int n = data.getClipData().getItemCount();
                result = new Uri[n];
                for (int i = 0; i < n; i++) result[i] = data.getClipData().getItemAt(i).getUri();
            } else if (data.getData() != null) {
                result = new Uri[]{data.getData()};
            }
        }
        fileCallback.onReceiveValue(result);
        fileCallback = null;
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        moveTaskToBack(true); // jangan menutup aplikasi (kode & video tetap terbuka)
    }

    @Override
    protected void onDestroy() {
        if (web != null) { web.destroy(); web = null; }
        super.onDestroy();
    }

    private void toast(final String m) { runOnUiThread(() -> Toast.makeText(this, m, Toast.LENGTH_LONG).show()); }

    private void openExternal(String url) {
        try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Exception e) { toast("Tidak bisa membuka tautan"); }
    }

    /** Fungsi-fungsi yang bisa dipanggil JavaScript lewat window.SakuAndroid */
    private class Bridge {
        private final Map<String, File> temp = new HashMap<>();
        private final Map<String, OutputStream> outs = new HashMap<>();
        private final Map<String, String[]> meta = new HashMap<>();
        private Uri lastUri;
        private String lastMime;
        private int counter = 0;

        @JavascriptInterface
        public String readClipboard() {
            final AtomicReference<String> ref = new AtomicReference<>(null);
            final CountDownLatch latch = new CountDownLatch(1);
            runOnUiThread(() -> {
                try {
                    ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                    ClipData c = cm.getPrimaryClip();
                    if (c != null && c.getItemCount() > 0) {
                        CharSequence t = c.getItemAt(0).coerceToText(MainActivity.this);
                        if (t != null) ref.set(t.toString());
                    }
                } catch (Exception ignored) { }
                latch.countDown();
            });
            try { latch.await(3, TimeUnit.SECONDS); } catch (InterruptedException ignored) { }
            return ref.get();
        }

        private final ExecutorService pool = Executors.newCachedThreadPool();

        /** HTTP untuk AI: dijalankan di Android agar tidak terhalang aturan CORS. Hasil dikirim ke window.__sakuHttpDone. */
        @JavascriptInterface
        public void httpRequest(final String id, final String method, final String url, final String headersJson, final String body, final int timeoutMs) {
            pool.execute(() -> {
                int status = 0;
                String resp = "";
                String err = "";
                JSONObject hdrs = new JSONObject();
                HttpURLConnection c = null;
                try {
                    c = (HttpURLConnection) new URL(url).openConnection();
                    c.setRequestMethod(method == null || method.isEmpty() ? "GET" : method);
                    c.setConnectTimeout(Math.min(Math.max(timeoutMs, 5000), 30000));
                    c.setReadTimeout(Math.max(timeoutMs, 5000));
                    c.setRequestProperty("User-Agent", "RemotionSaku/3");
                    JSONObject h = new JSONObject(headersJson == null || headersJson.isEmpty() ? "{}" : headersJson);
                    Iterator<String> it = h.keys();
                    while (it.hasNext()) { String k = it.next(); c.setRequestProperty(k, h.optString(k)); }
                    if (body != null && !body.isEmpty() && !"GET".equalsIgnoreCase(method)) {
                        c.setDoOutput(true);
                        try (OutputStream o = c.getOutputStream()) { o.write(body.getBytes(StandardCharsets.UTF_8)); }
                    }
                    status = c.getResponseCode();
                    for (Map.Entry<String, List<String>> e : c.getHeaderFields().entrySet()) {
                        if (e.getKey() != null && e.getValue() != null && !e.getValue().isEmpty()) hdrs.put(e.getKey().toLowerCase(), e.getValue().get(0));
                    }
                    InputStream in = status >= 400 ? c.getErrorStream() : c.getInputStream();
                    if (in != null) {
                        ByteArrayOutputStream bo = new ByteArrayOutputStream();
                        byte[] buf = new byte[1 << 14];
                        int r;
                        while ((r = in.read(buf)) > 0) bo.write(buf, 0, r);
                        in.close();
                        resp = new String(bo.toByteArray(), StandardCharsets.UTF_8);
                    }
                } catch (Exception e) {
                    status = 0;
                    err = e.getClass().getSimpleName() + ": " + e.getMessage();
                } finally {
                    if (c != null) c.disconnect();
                }
                final String js = "window.__sakuHttpDone && window.__sakuHttpDone(" + JSONObject.quote(id) + "," + status + "," + JSONObject.quote(hdrs.toString()) + "," + JSONObject.quote(resp) + "," + JSONObject.quote(err) + ")";
                runOnUiThread(() -> { if (web != null) web.evaluateJavascript(js, null); });
            });
        }

        @JavascriptInterface
        public String takeSharedText() {
            String t = sharedText;
            sharedText = null;
            return t;
        }

        @JavascriptInterface
        public void writeClipboard(final String text) {
            runOnUiThread(() -> {
                try {
                    ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                    cm.setPrimaryClip(ClipData.newPlainText("Remotion Saku", text));
                } catch (Exception ignored) { }
            });
        }

        @JavascriptInterface
        public boolean openApp(String pkg) {
            try {
                Intent i = getPackageManager().getLaunchIntentForPackage(pkg);
                if (i == null) return false;
                startActivity(i);
                return true;
            } catch (Exception e) {
                return false;
            }
        }

        @JavascriptInterface
        public void keepScreenOn(final boolean on) {
            runOnUiThread(() -> {
                if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            });
        }

        @JavascriptInterface
        public void openUrl(String url) { openExternal(url); }

        @JavascriptInterface
        public synchronized String beginFile(String name, String mime) {
            try {
                String id = "f" + (++counter);
                File f = new File(getCacheDir(), id + ".part");
                temp.put(id, f);
                outs.put(id, new FileOutputStream(f));
                meta.put(id, new String[]{safeName(name), mime == null || mime.isEmpty() ? "video/mp4" : mime});
                return id;
            } catch (Exception e) {
                return null;
            }
        }

        @JavascriptInterface
        public synchronized boolean appendChunk(String id, String b64) {
            try {
                OutputStream o = outs.get(id);
                if (o == null) return false;
                o.write(Base64.decode(b64, Base64.DEFAULT));
                return true;
            } catch (Exception e) {
                return false;
            }
        }

        @JavascriptInterface
        public synchronized String finishFile(String id) {
            File f = temp.remove(id);
            OutputStream o = outs.remove(id);
            String[] m = meta.remove(id);
            if (f == null || o == null || m == null) return "ERROR: file tidak dikenal";
            try {
                o.close();
                String name = m[0], mime = m[1];
                boolean video = mime.startsWith("video/");
                String where;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentResolver cr = getContentResolver();
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
                    v.put(MediaStore.MediaColumns.MIME_TYPE, mime);
                    String dir = (video ? Environment.DIRECTORY_MOVIES : Environment.DIRECTORY_DOWNLOADS) + "/Remotion Saku";
                    v.put(MediaStore.MediaColumns.RELATIVE_PATH, dir);
                    v.put(MediaStore.MediaColumns.IS_PENDING, 1);
                    Uri col = video ? MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                            : MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
                    Uri uri = cr.insert(col, v);
                    if (uri == null) return "ERROR: tidak bisa membuat file di galeri";
                    try (InputStream in = new FileInputStream(f); OutputStream out = cr.openOutputStream(uri)) {
                        copy(in, out);
                    }
                    v.clear();
                    v.put(MediaStore.MediaColumns.IS_PENDING, 0);
                    cr.update(uri, v, null, null);
                    lastUri = uri;
                    where = dir + "/" + name;
                } else {
                    File dir = new File(getExternalFilesDir(video ? Environment.DIRECTORY_MOVIES : Environment.DIRECTORY_DOWNLOADS), "");
                    if (!dir.exists()) dir.mkdirs();
                    File dest = new File(dir, name);
                    try (InputStream in = new FileInputStream(f); OutputStream out = new FileOutputStream(dest)) {
                        copy(in, out);
                    }
                    MediaScannerConnection.scanFile(MainActivity.this, new String[]{dest.getAbsolutePath()}, new String[]{mime}, null);
                    lastUri = null;
                    where = dest.getAbsolutePath();
                }
                lastMime = mime;
                toast("Tersimpan: " + where);
                return where;
            } catch (Exception e) {
                return "ERROR: " + e.getMessage();
            } finally {
                //noinspection ResultOfMethodCallIgnored
                f.delete();
            }
        }

        @JavascriptInterface
        public boolean shareLast() {
            if (lastUri == null) return false;
            final Uri u = lastUri;
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_SEND);
                i.setType(lastMime != null ? lastMime : "video/mp4");
                i.putExtra(Intent.EXTRA_STREAM, u);
                i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                try { startActivity(Intent.createChooser(i, "Bagikan video")); } catch (Exception e) { toast("Tidak bisa membagikan"); }
            });
            return true;
        }

        private String safeName(String n) {
            String s = n == null ? "video.mp4" : n.replaceAll("[\\\\/:*?\"<>|]", "-").trim();
            return s.isEmpty() ? "video.mp4" : s;
        }

        private void copy(InputStream in, OutputStream out) throws java.io.IOException {
            byte[] buf = new byte[1 << 16];
            int r;
            while ((r = in.read(buf)) > 0) out.write(buf, 0, r);
        }
    }
}
