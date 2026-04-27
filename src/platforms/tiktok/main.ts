import { createApp } from "vue";
import App from "./App.vue";
import { createElement } from "../../shared/utils";

async function init() {
  const globalHost = createElement(`
    <div id="tiktok-copy-app" style="
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
