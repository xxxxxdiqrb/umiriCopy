import { createApp } from "vue";
import App from "./App.vue";
import { appState, applyProvider } from "../../shared/store";
import { createElement } from "../../shared/utils";
import type { ProviderConfig } from "../../options/types";

async function init() {
    const stored = (await chrome.storage.local.get("options")).options;
    if (stored?.providers) {
        let providers: ProviderConfig[] = [];
        if (Array.isArray(stored.providers)) {
            providers = stored.providers;
        } else if (typeof stored.providers === "object") {
            providers = Object.values(stored.providers);
        }
        
        if (providers.length > 0) {
            const defaultId = stored.defaultProviderId;
            
            appState.providers = providers;
            appState.defaultProviderId = defaultId;
            
            const provider = providers.find((p) => p.id === defaultId) || providers[0];
            if (provider) {
                applyProvider(provider);
            }
        }
    }

    const globalHost = createElement(`
            <div id="instagram-copy-app" style="
              z-index: 20000; 
              position: fixed; 
              top: 0; 
              left: 0; 
              width: 0px; 
              height: 0px"
            ></div>
        `);
    document.body.appendChild(globalHost);
    createApp(App).mount(globalHost);
}

init();
