package raj.solodiary.reactjs;

import android.content.Intent;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AssistantActions")
public class AssistantActionsPlugin extends Plugin {

    @PluginMethod
    public void checkLaunchIntent(PluginCall call) {
        Intent intent = getActivity() != null ? getActivity().getIntent() : null;
        JSObject ret = new JSObject();
        boolean shouldOpenForm = isAddEntryIntent(intent);
        boolean shouldOpenVoice = isVoiceFillIntent(intent);
        ret.put("openForm", shouldOpenForm);
        ret.put("openVoice", shouldOpenVoice);

        if (shouldOpenForm && intent != null) {
            intent.removeExtra("open_form");
            intent.removeExtra("action");
            if ("raj.solodiary.action.OPEN_ADD_ENTRY".equals(intent.getAction())) {
                intent.setAction(null);
            }
        }
        if (shouldOpenVoice && intent != null) {
            intent.removeExtra("open_voice");
            intent.removeExtra("action");
            if ("raj.solodiary.action.OPEN_VOICE_FILL".equals(intent.getAction())) {
                intent.setAction(null);
            }
        }
        call.resolve(ret);
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        if (isVoiceFillIntent(intent)) {
            JSObject data = new JSObject();
            data.put("openVoice", true);
            notifyListeners("openVoiceFill", data, true);
            return;
        }

        if (isAddEntryIntent(intent)) {
            JSObject data = new JSObject();
            data.put("openForm", true);
            notifyListeners("openAddEntry", data, true);
            return;
        }

        JSObject record = recordFromIntent(intent);
        if (record == null) return;

        notifyListeners("addRecord", record, true);
    }

    private boolean isVoiceFillIntent(Intent intent) {
        if (intent == null) return false;
        if ("raj.solodiary.action.OPEN_VOICE_FILL".equals(intent.getAction())) {
            return true;
        }
        if (intent.getBooleanExtra("open_voice", false)) {
            return true;
        }
        if ("voice_fill".equals(intent.getStringExtra("action"))) {
            return true;
        }
        return false;
    }

    private boolean isAddEntryIntent(Intent intent) {
        if (intent == null) return false;
        if ("raj.solodiary.action.OPEN_ADD_ENTRY".equals(intent.getAction())) {
            return true;
        }
        if (intent.getBooleanExtra("open_form", false)) {
            return true;
        }
        if ("add_entry".equals(intent.getStringExtra("action"))) {
            return true;
        }
        return false;
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