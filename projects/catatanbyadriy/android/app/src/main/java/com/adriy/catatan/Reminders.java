package com.adriy.catatan;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

/** Penjadwal pengingat: disimpan di SharedPreferences agar bisa dijadwalkan ulang setelah HP restart. */
public final class Reminders {
    static final String CH = "pengingat";
    private static final String PREF = "cba_reminders";

    private Reminders() { }

    static int code(String id) { return id.hashCode() & 0x7fffffff; }

    private static PendingIntent pi(Context c, JSONObject r, boolean create) {
        Intent i = new Intent(c, ReminderReceiver.class);
        i.setAction("com.adriy.catatan.REMIND." + r.optString("id"));
        i.putExtra("id", r.optString("id"));
        i.putExtra("title", r.optString("title"));
        i.putExtra("body", r.optString("body"));
        i.putExtra("open", r.optString("open"));
        int flags = PendingIntent.FLAG_IMMUTABLE | (create ? PendingIntent.FLAG_UPDATE_CURRENT : PendingIntent.FLAG_NO_CREATE);
        return PendingIntent.getBroadcast(c, code(r.optString("id")), i, flags);
    }

    /** Ganti seluruh jadwal dengan daftar baru (JSON array {id, at, title, body, open}). */
    static synchronized void sync(Context c, String json) {
        try {
            AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
            SharedPreferences sp = c.getSharedPreferences(PREF, Context.MODE_PRIVATE);
            JSONArray old = new JSONArray(sp.getString("list", "[]"));
            for (int k = 0; k < old.length(); k++) {
                PendingIntent p = pi(c, old.getJSONObject(k), false);
                if (p != null) { am.cancel(p); p.cancel(); }
            }
            JSONArray next = new JSONArray(json == null || json.isEmpty() ? "[]" : json);
            JSONArray kept = new JSONArray();
            long now = System.currentTimeMillis();
            for (int k = 0; k < next.length(); k++) {
                JSONObject r = next.getJSONObject(k);
                if (r.optLong("at") > now) { schedule(c, am, r); kept.put(r); }
            }
            sp.edit().putString("list", kept.toString()).apply();
        } catch (Exception ignored) { }
    }

    static void rescheduleAll(Context c) {
        SharedPreferences sp = c.getSharedPreferences(PREF, Context.MODE_PRIVATE);
        sync(c, sp.getString("list", "[]"));
    }

    static void remove(Context c, String id) {
        try {
            SharedPreferences sp = c.getSharedPreferences(PREF, Context.MODE_PRIVATE);
            JSONArray old = new JSONArray(sp.getString("list", "[]")), keep = new JSONArray();
            for (int k = 0; k < old.length(); k++) if (!id.equals(old.getJSONObject(k).optString("id"))) keep.put(old.getJSONObject(k));
            sp.edit().putString("list", keep.toString()).apply();
        } catch (Exception ignored) { }
    }

    private static void schedule(Context c, AlarmManager am, JSONObject r) {
        PendingIntent p = pi(c, r, true);
        long at = r.optLong("at");
        if (Build.VERSION.SDK_INT >= 31 && !am.canScheduleExactAlarms()) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, p);
        else am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, p);
    }

    static void ensureChannel(Context c) {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm.getNotificationChannel(CH) == null) {
                NotificationChannel ch = new NotificationChannel(CH, "Pengingat", NotificationManager.IMPORTANCE_HIGH);
                ch.setDescription("Pengingat agenda, jadwal, dan catatan");
                ch.enableVibration(true);
                ch.setLightColor(Color.parseColor("#1A66E6"));
                nm.createNotificationChannel(ch);
            }
        }
    }

    static void show(Context c, String id, String title, String body, String open) {
        ensureChannel(c);
        Intent i = new Intent(c, MainActivity.class);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        i.putExtra("open", open == null ? "" : open);
        PendingIntent tap = PendingIntent.getActivity(c, code(id), i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        android.app.Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new android.app.Notification.Builder(c, CH) : new android.app.Notification.Builder(c);
        b.setSmallIcon(R.drawable.ic_notif).setColor(Color.parseColor("#1A66E6"))
                .setContentTitle(title).setContentText(body)
                .setStyle(new android.app.Notification.BigTextStyle().bigText(body))
                .setAutoCancel(true).setContentIntent(tap).setWhen(System.currentTimeMillis()).setShowWhen(true);
        if (Build.VERSION.SDK_INT < 26) b.setPriority(android.app.Notification.PRIORITY_HIGH).setDefaults(android.app.Notification.DEFAULT_ALL);
        try { ((NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE)).notify(code(id), b.build()); } catch (SecurityException ignored) { }
    }
}
