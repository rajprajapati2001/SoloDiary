package raj.solodiary.reactjs;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.view.View;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class DailyActivitiesWidgetProvider extends AppWidgetProvider {

    public static final String PREFS_NAME = "SoloDiaryWidgetPrefs";
    public static final String KEY_ACTIVITIES_LIST_JSON = "activities_list_json";
    public static final String KEY_TODAY_DATE_FULL = "today_date_full";
    public static final String KEY_TODAY_DEBIT = "today_debit";
    public static final String KEY_TODAY_CREDIT = "today_credit";
    public static final String KEY_TODAY_POINTS = "today_points";
    public static final String KEY_CURRENCY_SYMBOL = "today_currency_symbol";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        if (appWidgetIds == null) return;
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
        super.onUpdate(context, appWidgetManager, appWidgetIds);
    }

    public static void updateAllWidgets(Context context) {
        try {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName thisWidget = new ComponentName(context, DailyActivitiesWidgetProvider.class);
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
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

            int debit = prefs.getInt(KEY_TODAY_DEBIT, 0);
            int credit = prefs.getInt(KEY_TODAY_CREDIT, 0);
            int points = prefs.getInt(KEY_TODAY_POINTS, 0);
            String currency = prefs.getString(KEY_CURRENCY_SYMBOL, "");

            String defaultDate;
            try {
                SimpleDateFormat sdf = new SimpleDateFormat("dd MMM yy", Locale.ENGLISH);
                defaultDate = sdf.format(new Date());
            } catch (Exception e) {
                defaultDate = "07 Nov 26";
            }
            // Date format: strictly dd MMM yy, e.g. "07 Nov 26" (Never dd MMMM yyyy, no "Today" prefix)
            String storedDate = prefs.getString(KEY_TODAY_DATE_FULL, null);
            String dateShort = defaultDate;
            if (storedDate != null && !storedDate.isEmpty()) {
                if (storedDate.length() <= 10 && !storedDate.toLowerCase().contains("today") && !storedDate.contains("202")) {
                    dateShort = storedDate;
                }
            }

            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_daily_activities);
            views.setTextViewText(R.id.widget_daily_header_date, dateShort);

            // Title bar: dd MMM yy then -0 +0 + 0 pts (0 values should be visible on title bar)
            String spendStr = "-" + currency + debit;
            views.setTextViewText(R.id.widget_daily_badge_spend, spendStr);
            views.setViewVisibility(R.id.widget_daily_badge_spend, View.VISIBLE);

            String creditStr = "+" + currency + credit;
            views.setTextViewText(R.id.widget_daily_badge_credit, creditStr);
            views.setViewVisibility(R.id.widget_daily_badge_credit, View.VISIBLE);

            // Points chip: Cyan/Blue UI (+0 pts or +points pts)
            String ptsStr = (points >= 0 ? "+" : "") + points + " pts";
            views.setTextViewText(R.id.widget_daily_badge_points, ptsStr);
            views.setViewVisibility(R.id.widget_daily_badge_points, View.VISIBLE);

            // Bind ListView to RemoteViewsService
            Intent serviceIntent = new Intent(context, DailyActivitiesWidgetService.class);
            serviceIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
            serviceIntent.setData(Uri.parse(serviceIntent.toUri(Intent.URI_INTENT_SCHEME)));
            views.setRemoteAdapter(R.id.widget_daily_activities_list, serviceIntent);
            views.setEmptyView(R.id.widget_daily_activities_list, R.id.widget_daily_empty_view);

            // Click on header launches MainActivity
            Intent launchIntent = new Intent(context, MainActivity.class);
            launchIntent.setAction(Intent.ACTION_MAIN);
            launchIntent.addCategory(Intent.CATEGORY_LAUNCHER);
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

            int headerFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                headerFlags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent headerPendingIntent = PendingIntent.getActivity(context, 104, launchIntent, headerFlags);
            views.setOnClickPendingIntent(R.id.widget_daily_header, headerPendingIntent);

            // On Android 12+ (API 31+), setPendingIntentTemplate MUST use FLAG_MUTABLE
            // because fillInIntent from list items will be combined with this base PendingIntent.
            int templateFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                templateFlags |= PendingIntent.FLAG_MUTABLE;
            }
            PendingIntent templatePendingIntent = PendingIntent.getActivity(context, 105, launchIntent, templateFlags);
            views.setPendingIntentTemplate(R.id.widget_daily_activities_list, templatePendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
            appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetId, R.id.widget_daily_activities_list);
        } catch (Exception e) {
            // ignore
        }
    }
}
