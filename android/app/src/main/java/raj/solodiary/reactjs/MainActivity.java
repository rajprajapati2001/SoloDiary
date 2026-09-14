package raj.solodiary.reactjs;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

	@Override
	public void onCreate(android.os.Bundle savedInstanceState) {
		registerPlugin(AssistantActionsPlugin.class);
		super.onCreate(savedInstanceState);
	}
}
