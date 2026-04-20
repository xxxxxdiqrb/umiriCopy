import { createApp } from "vue";
import App from "./App.vue";
import { appState } from "./store";
import { createElement } from "../utils";

async function init() {
    const stored = (await chrome.storage.local.get("options")).options;
    if (stored?.providers?.length) {
        const providers = stored.providers;
        const defaultId = stored.defaultProviderId;
        const provider = providers.find((p: any) => p.id === defaultId) || providers[0];
        if (provider) {
            const { apiKey, model, baseUrl, systemMessage, temperature, stream, maxTokens, topP } = provider;
            Object.assign(appState.options, { apiKey, model, baseUrl, systemMessage, otherParam: { temperature, stream, maxTokens, topP } });
        }
    }

    const globalHost = createElement(`
            <div id="tweet-copy-app" style="
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
