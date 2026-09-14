package raj.solodiary.reactjs;

import android.content.Intent;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AssistantActions")
public class AssistantActionsPlugin extends Plugin {
    @Override
    protected void handleOnNewIntent(Intent intent) {
        JSObject record = recordFromIntent(intent);
        if (record == null) return;

        notifyListeners("addRecord", record, true);
    }

    private JSObject recordFromIntent(Intent intent) {
        if (intent == null || !"raj.solodiary.intent.ADD_RECORD".equals(intent.getAction())) {
            return null;
        }

        JSObject record = new JSObject();
        for (String key : new String[] {
                "activity", "name", "code", "points", "cash", "debit", "credit",
                "currency", "description", "date", "time", "secondTime", "toDate", "toTime"
        }) {
            Object value = intent.getExtras() == null ? null : intent.getExtras().get(key);
            if (value != null) record.put(key, value);
        }
        return record.length() == 0 ? null : record;
    }
}