package raj.solodiary.reactjs;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Binder;
import android.view.View;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class DailyActivitiesWidgetService extends RemoteViewsService {
    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new DailyActivitiesViewsFactory(this.getApplicationContext(), intent);
    }

    public static class DailyActivitiesViewsFactory implements RemoteViewsService.RemoteViewsFactory {
        private final Context context;
        private final List<JSONObject> items = new ArrayList<>();

        public DailyActivitiesViewsFactory(Context context, Intent intent) {
            this.context = context;
        }

        @Override
        public void onCreate() {
            final long identityToken = Binder.clearCallingIdentity();
            try {
                loadData();
            } finally {
                Binder.restoreCallingIdentity(identityToken);
            }
        }

        @Override
        public void onDataSetChanged() {
            final long identityToken = Binder.clearCallingIdentity();
            try {
                loadData();
            } finally {
                Binder.restoreCallingIdentity(identityToken);
            }
        }

        private void loadData() {
            items.clear();
            try {
                SharedPreferences prefs = context.getSharedPreferences(DailyActivitiesWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
                String json = prefs.getString(DailyActivitiesWidgetProvider.KEY_ACTIVITIES_LIST_JSON, "[]");
                if (json != null && !json.trim().isEmpty()) {
                    JSONArray array = new JSONArray(json);
                    for (int i = 0; i < array.length(); i++) {
                        JSONObject obj = array.optJSONObject(i);
                        if (obj != null) {
                            items.add(obj);
                        }
                    }
                }
            } catch (Exception e) {
                // ignore
            }
        }

        @Override
        public void onDestroy() {
            items.clear();
        }

        @Override
        public int getCount() {
            return items.size();
        }

        @Override
        public RemoteViews getViewAt(int position) {
            if (position < 0 || position >= items.size()) return null;

            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_daily_activity_item);
            try {
                JSONObject item = items.get(position);
                if (item == null) return null;

                String timeText = item.optString("timeText", "00:00");
                String name = item.optString("name", "").trim();
                if (name.isEmpty()) {
                    name = item.optString("code", "Activity").trim();
                }
                double debit = item.optDouble("debit", 0);
                double credit = item.optDouble("credit", 0);
                String debitText = item.optString("debitText", "").trim();
                String creditText = item.optString("creditText", "").trim();
                String pointsText = item.optString("pointsText", "+0 pts").trim();
                String description = item.optString("description", "").trim();
                boolean isGoal = item.optBoolean("isGoal", false);

                views.setTextViewText(R.id.item_time, timeText);
                // Do NOT show Activity code: show activity name only
                views.setTextViewText(R.id.item_activity, name);

                // Goal styling: "if any goal appere then text =Meal and pts becom green"
                if (isGoal) {
                    views.setTextColor(R.id.item_activity, 0xFF10B981); // Green
                    views.setTextColor(R.id.item_points, 0xFF10B981);   // Green
                } else {
                    views.setTextColor(R.id.item_activity, 0xFFFFFFFF); // White
                    views.setTextColor(R.id.item_points, 0xFF38BDF8);   // Blue
                }

                // Debit: "if debit = 0 then deont show"
                if (debit > 0 && !debitText.isEmpty()) {
                    views.setTextViewText(R.id.item_debit, debitText);
                    views.setViewVisibility(R.id.item_debit, View.VISIBLE);
                } else {
                    views.setViewVisibility(R.id.item_debit, View.GONE);
                }

                // Credit: "if credit = 0 then dont show the -0 or +0 text"
                if (credit > 0 && !creditText.isEmpty()) {
                    views.setTextViewText(R.id.item_credit, creditText);
                    views.setViewVisibility(R.id.item_credit, View.VISIBLE);
                } else {
                    views.setViewVisibility(R.id.item_credit, View.GONE);
                }

                // Points UI
                views.setTextViewText(R.id.item_points, pointsText);

                if (description.length() > 0) {
                    views.setTextViewText(R.id.item_description, description);
                    views.setViewVisibility(R.id.item_description, View.VISIBLE);
                } else {
                    views.setViewVisibility(R.id.item_description, View.GONE);
                }

                // Fill-in intent so clicking any row launches the app
                Intent fillInIntent = new Intent();
                views.setOnClickFillInIntent(R.id.widget_item_root, fillInIntent);

            } catch (Exception e) {
                // ignore
            }

            return views;
        }

        @Override
        public RemoteViews getLoadingView() {
            return null;
        }

        @Override
        public int getViewTypeCount() {
            return 1;
        }

        @Override
        public long getItemId(int position) {
            return position;
        }

        @Override
        public boolean hasStableIds() {
            return true;
        }
    }
}
