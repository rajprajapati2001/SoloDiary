package raj.solodiary.reactjs;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class TodayPointsWidgetProvider extends AppWidgetProvider {

    public static final String PREFS_NAME = "SoloDiaryWidgetPrefs";
    public static final String KEY_TODAY_POINTS = "today_points";
    public static final String KEY_TODAY_TARGET = "today_target";
    public static final String KEY_TODAY_DATE = "today_date";
    public static final String KEY_TODAY_PROGRESS = "today_progress";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAllWidgets(Context context) {
        try {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName thisWidget = new ComponentName(context, TodayPointsWidgetProvider.class);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget);
            if (appWidgetIds != null && appWidgetIds.length > 0) {
                for (int id : appWidgetIds) {
                    updateAppWidget(context, appWidgetManager, id);
                }
            }
        } catch (Exception e) {
            // ignore
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        int points = prefs.getInt(KEY_TODAY_POINTS, 0);
        int target = prefs.getInt(KEY_TODAY_TARGET, 100);
        int progress = prefs.getInt(KEY_TODAY_PROGRESS, target > 0 ? Math.min((points * 100) / target, 100) : 0);

        String defaultDate;
try {
    SimpleDateFormat sdf = new SimpleDateFormat("dd MMMM yy", Locale.getDefault());
    String formattedDate = sdf.format(new Date());
    defaultDate = formattedDate; 
} catch (Exception e) {
    defaultDate = "Today";
}
        String dateText = prefs.getString(KEY_TODAY_DATE, defaultDate);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_today_points);

        views.setTextViewText(R.id.widget_today_date, dateText);
        views.setTextViewText(R.id.widget_today_points_val, String.valueOf(points));
        views.setTextViewText(R.id.widget_today_target_label, "Daily Target: " + target + " pts");
        views.setTextViewText(R.id.widget_today_percent, progress + "%");
        views.setProgressBar(R.id.widget_today_progress_bar, 100, Math.min(progress, 100), false);

        // Click to launch app to Dashboard
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction(Intent.ACTION_MAIN);
        intent.addCategory(Intent.CATEGORY_LAUNCHER);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(context, 101, intent, flags);
        views.setOnClickPendingIntent(R.id.widget_today_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
