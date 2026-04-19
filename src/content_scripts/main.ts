import { createApp } from "vue";
import App from "./App.vue";
import { appState } from "./store";
import { createElement } from "../utils";

async function init() {
    const options = (await chrome.storage.local.get("options")).options || {};
    Object.assign(appState.options, options);

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
