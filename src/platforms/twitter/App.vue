<script setup lang="ts">
import PlatformShell from '../../shared/platform/PlatformShell.vue';
import { loadPlatformConfig, twitterDefinition } from './index';
</script>

<template>
  <PlatformShell :definition="twitterDefinition" :load-config="loadPlatformConfig" />
</template>
