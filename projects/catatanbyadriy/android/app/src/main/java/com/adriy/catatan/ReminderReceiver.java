package com.adriy.catatan;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Dipanggil AlarmManager saat waktu pengingat tiba, juga setelah HP menyala ulang / aplikasi diperbarui. */
public class ReminderReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent i) {
        String a = i.getAction() == null ? "" : i.getAction();
        if (a.equals(Intent.ACTION_BOOT_COMPLETED) || a.equals(Intent.ACTION_MY_PACKAGE_REPLACED) || a.equals("android.intent.action.TIME_SET")) {
            Reminders.rescheduleAll(c);
            return;
        }
        String id = i.getStringExtra("id");
        if (id == null) return;
        Reminders.show(c, id, i.getStringExtra("title"), i.getStringExtra("body"), i.getStringExtra("open"));
        Reminders.remove(c, id);
    }
}
