import { bootstrapPlatform } from '../../shared/platform/bootstrapPlatform';
import App from './App.vue';
import { instagramPlatform } from './platform';
void bootstrapPlatform(App, instagramPlatform, 'instagram-copy-app');
