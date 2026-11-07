package raj.solodiary.reactjs;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.widget.RemoteViews;

public class VoiceFillWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_voice_fill);

        // Intent to launch MainActivity with action to open Voice Fill modal
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction("raj.solodiary.action.OPEN_VOICE_FILL");
        intent.putExtra("open_voice", true);
        intent.putExtra("action", "voice_fill");
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                1,
                intent,
                flags
        );

        views.setOnClickPendingIntent(R.id.widget_voice_root, pendingIntent);
        views.setOnClickPendingIntent(R.id.widget_voice_button, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
