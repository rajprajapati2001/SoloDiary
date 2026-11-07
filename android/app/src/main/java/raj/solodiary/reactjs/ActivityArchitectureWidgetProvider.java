package raj.solodiary.reactjs;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.os.Build;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

public class ActivityArchitectureWidgetProvider extends AppWidgetProvider {

    public static final String PREFS_NAME = "SoloDiaryWidgetPrefs";
    public static final String KEY_TIMELINE_DATA = "timeline_data";
    public static final String KEY_TIMELINE_COUNT = "timeline_count";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAllWidgets(Context context) {
        try {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName thisWidget = new ComponentName(context, ActivityArchitectureWidgetProvider.class);
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
        String timelineJson = prefs.getString(KEY_TIMELINE_DATA, "[]");

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_activity_architecture);

        // Render pure 24-hour timeline bar bitmap (1440px width = 1px per minute of the day)
        Bitmap timelineBitmap = renderTimelineBitmap(timelineJson, 1440, 160);
        if (timelineBitmap != null) {
            views.setImageViewBitmap(R.id.widget_arch_timeline_img, timelineBitmap);
        }

        // Click anywhere to launch app to Dashboard
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction(Intent.ACTION_MAIN);
        intent.addCategory(Intent.CATEGORY_LAUNCHER);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(context, 103, intent, flags);
        views.setOnClickPendingIntent(R.id.widget_arch_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    public static Bitmap renderTimelineBitmap(String timelineJson, int width, int height) {
        try {
            Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bitmap);

            // Clip track to rounded rectangle
            RectF trackRect = new RectF(0, 0, width, height);
            float cornerRadius = 22f;

            Path clipPath = new Path();
            clipPath.addRoundRect(trackRect, cornerRadius, cornerRadius, Path.Direction.CW);
            canvas.clipPath(clipPath);

            // Draw track background (Slate 900)
            Paint bgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            bgPaint.setColor(Color.parseColor("#0F172A"));
            canvas.drawRect(trackRect, bgPaint);

            JSONArray blocks = new JSONArray(timelineJson != null ? timelineJson : "[]");

            if (blocks.length() == 0) {
                // Empty state text
                Paint emptyPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
                emptyPaint.setColor(Color.parseColor("#64748B"));
                emptyPaint.setTextSize(34f);
                emptyPaint.setTextAlign(Paint.Align.CENTER);
                emptyPaint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.ITALIC));

                Paint.FontMetrics fm = emptyPaint.getFontMetrics();
                float y = (height / 2f) - ((fm.ascent + fm.descent) / 2f);
                canvas.drawText("No entries logged for today", width / 2f, y, emptyPaint);
            } else {
                Paint blockPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
                Paint textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
                textPaint.setColor(Color.WHITE);
                textPaint.setTextAlign(Paint.Align.CENTER);
                textPaint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
                textPaint.setShadowLayer(4f, 0f, 1.5f, Color.argb(220, 0, 0, 0));

                Paint borderPaint = new Paint();
                borderPaint.setColor(Color.argb(55, 0, 0, 0));
                borderPaint.setStrokeWidth(2f);

                for (int i = 0; i < blocks.length(); i++) {
                    JSONObject block = blocks.getJSONObject(i);
                    int startMin = block.optInt("startMin", 0);
                    int endMin = block.optInt("endMin", startMin + 25);
                    String colorHex = block.optString("color", "#3B82F6");
                    String rawCode = block.optString("code", "").trim();

                    float left = (startMin / 1440f) * width;
                    float right = (endMin / 1440f) * width;
                    if ((right - left) < 8f) {
                        right = Math.min((float) width, left + 8f);
                    }

                    int color;
                    try {
                        color = Color.parseColor(colorHex);
                    } catch (Exception e) {
                        color = Color.parseColor("#3B82F6");
                    }
                    blockPaint.setColor(color);

                    RectF rect = new RectF(left, 0, right, height);
                    canvas.drawRect(rect, blockPaint);

                    // Draw vertical divider between blocks
                    canvas.drawLine(right, 0, right, height, borderPaint);

                    // Draw proper code labels
                    float blockWidth = right - left;
                    float centerX = left + (blockWidth / 2f);

                    if (rawCode.length() > 0) {
                        if (blockWidth >= 42f) {
                            // Wide block: draw horizontal text centered
                            textPaint.setTextSize(36f);
                            Paint.FontMetrics fm = textPaint.getFontMetrics();
                            float textY = (height / 2f) - ((fm.ascent + fm.descent) / 2f);
                            canvas.drawText(rawCode, centerX, textY, textPaint);
                        } else if (blockWidth >= 20f) {
                            // Medium block: single letter or vertical stacking for 2 letters
                            if (rawCode.length() == 1) {
                                textPaint.setTextSize(32f);
                                Paint.FontMetrics fm = textPaint.getFontMetrics();
                                float textY = (height / 2f) - ((fm.ascent + fm.descent) / 2f);
                                canvas.drawText(rawCode, centerX, textY, textPaint);
                            } else {
                                textPaint.setTextSize(24f);
                                canvas.drawText(String.valueOf(rawCode.charAt(0)), centerX, (height / 2f) - 13f, textPaint);
                                canvas.drawText(String.valueOf(rawCode.charAt(1)), centerX, (height / 2f) + 17f, textPaint);
                            }
                        } else if (blockWidth >= 12f) {
                            // Narrow block: draw first character
                            textPaint.setTextSize(20f);
                            Paint.FontMetrics fm = textPaint.getFontMetrics();
                            float textY = (height / 2f) - ((fm.ascent + fm.descent) / 2f);
                            canvas.drawText(String.valueOf(rawCode.charAt(0)), centerX, textY, textPaint);
                        }
                    }
                }
            }

            // Draw border stroke
            Paint strokePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            strokePaint.setColor(Color.parseColor("#334155"));
            strokePaint.setStyle(Paint.Style.STROKE);
            strokePaint.setStrokeWidth(3f);
            canvas.drawRoundRect(trackRect, cornerRadius, cornerRadius, strokePaint);

            return bitmap;
        } catch (Exception e) {
            return null;
        }
    }
}
