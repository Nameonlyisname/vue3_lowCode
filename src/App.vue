<template>
  <div class="app">
    <Editor v-model="state"></Editor>
  </div>
</template>
<script setup>
import { ref } from "vue";
import data from "./data.json";
import Editor from "../packages/editor";
const state = ref(data);
</script>

<style scoped lang="scss">
.app {
  position: fixed;
}
</style>
