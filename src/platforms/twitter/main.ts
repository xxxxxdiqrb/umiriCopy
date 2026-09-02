import { bootstrapPlatform } from '../../shared/platform/bootstrapPlatform';
import App from './App.vue';
import { twitterDefinition } from './index';

void bootstrapPlatform(App, twitterDefinition, 'tweet-copy-app');
