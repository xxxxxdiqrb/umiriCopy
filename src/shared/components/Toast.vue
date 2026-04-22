<script setup lang="ts">
import { watch } from "vue";
import { appState } from "../store";

watch(
    () => appState.toast.visible,
    (visible) => {
        if (visible) {
            setTimeout(() => {
                appState.toast.visible = false;
            }, 3000);
        }
    },
);
</script>

<template>
    <Transition name="toast">
        <div v-if="appState.toast.visible" class="toast-wrapper">
            <div class="toast-banner" :class="appState.toast.type">
                <span class="toast-icon">{{ appState.toast.type === "success" ? "✓" : "✕" }}</span>
                {{ appState.toast.message }}
            </div>
        </div>
    </Transition>
</template>

<style lang="scss" scoped>
.toast-wrapper {
    position: fixed;
    top: 20px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    z-index: 30000;
    pointer-events: none;
}

.toast-banner {
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    background-color: rgb(21, 22, 23);
    border: 1px solid rgb(47, 51, 54);
    color: rgb(239, 243, 244);
    display: flex;
    align-items: center;
    gap: 6px;
}

.toast-icon {
    font-size: 14px;
    font-weight: 700;
    flex-shrink: 0;
}

.toast-enter-active {
    animation: fadeIn 0.3s ease-out;
}

.toast-leave-active {
    animation: fadeOut 0.3s ease-in;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeOut {
    from {
        opacity: 1;
        transform: translateY(0);
    }
    to {
        opacity: 0;
        transform: translateY(-10px);
    }
}
</style>
