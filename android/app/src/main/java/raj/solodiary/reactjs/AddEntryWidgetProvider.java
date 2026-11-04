package raj.solodiary.reactjs;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.widget.RemoteViews;

public class AddEntryWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_add_entry);

        // Intent to launch MainActivity with action to open EntryForm
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction("raj.solodiary.action.OPEN_ADD_ENTRY");
        intent.putExtra("open_form", true);
        intent.putExtra("action", "add_entry");
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                flags
        );

        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);
        views.setOnClickPendingIntent(R.id.widget_button, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
