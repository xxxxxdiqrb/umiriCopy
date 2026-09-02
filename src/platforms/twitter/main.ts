import { bootstrapPlatform } from '../../shared/platform/bootstrapPlatform';
import App from './App.vue';
import { twitterPlatform } from './platform';

void bootstrapPlatform(App, twitterPlatform, 'tweet-copy-app');
