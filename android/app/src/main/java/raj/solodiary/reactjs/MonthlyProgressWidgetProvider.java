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

public class MonthlyProgressWidgetProvider extends AppWidgetProvider {

    public static final String PREFS_NAME = "SoloDiaryWidgetPrefs";
    public static final String KEY_MONTH_POINTS = "month_points";
    public static final String KEY_MONTH_TARGET = "month_target";
    public static final String KEY_MONTH_NAME = "month_name";
    public static final String KEY_MONTH_PROGRESS = "month_progress";
    public static final String KEY_MONTH_SPACE_NAME = "month_space_name";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAllWidgets(Context context) {
        try {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName thisWidget = new ComponentName(context, MonthlyProgressWidgetProvider.class);
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

        int points = prefs.getInt(KEY_MONTH_POINTS, 0);
        int target = prefs.getInt(KEY_MONTH_TARGET, 3000);
        int progress = prefs.getInt(KEY_MONTH_PROGRESS, target > 0 ? Math.min((points * 100) / target, 100) : 0);
        String spaceName = prefs.getString(KEY_MONTH_SPACE_NAME, "Zero-G Cadence");

        String defaultMonth;
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("MMMM yyyy", Locale.getDefault());
            defaultMonth = sdf.format(new Date());
        } catch (Exception e) {
            defaultMonth = "This Month";
        }
        String monthText = prefs.getString(KEY_MONTH_NAME, defaultMonth);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_monthly_progress);

        views.setTextViewText(R.id.widget_monthly_date, monthText);
        views.setTextViewText(R.id.widget_monthly_percent_val, String.valueOf(progress));
        views.setTextViewText(R.id.widget_monthly_target_label, "Target: " + String.format(Locale.getDefault(), "%,d", target) + " pts");
        views.setTextViewText(R.id.widget_monthly_space_name, spaceName);
        views.setTextViewText(R.id.widget_monthly_points_label, String.format(Locale.getDefault(), "%,d", points) + " pts");
        views.setProgressBar(R.id.widget_monthly_progress_bar, 100, Math.min(progress, 100), false);

        // Click to launch app to Dashboard
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction(Intent.ACTION_MAIN);
        intent.addCategory(Intent.CATEGORY_LAUNCHER);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(context, 102, intent, flags);
        views.setOnClickPendingIntent(R.id.widget_monthly_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
