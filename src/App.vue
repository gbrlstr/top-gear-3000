<script setup lang="ts">
import { ref } from 'vue';
import type { MainMenu } from './game/scenes/MainMenu';
import PhaserGame from './PhaserGame.vue';

// The sprite can only be moved in the MainMenu Scene
const canMoveSprite = ref();

// Event emitted from the PhaserGame component
const currentScene = (scene: MainMenu) => {
    canMoveSprite.value = (scene.scene.key !== "MainMenu");
}

</script>

<template>
    <PhaserGame ref="phaserRef" @current-active-scene="currentScene" />
</template>
