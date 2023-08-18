<template>
  <div class="app">
    <Editor v-model="state" :formData="formData"></Editor>
  </div>
</template>
<script setup>
import { provide, ref } from "vue";
import data from "./data.json";
import Editor from "./packages/editor";
import { registerConfig as config } from "./utils/editor-config.jsx";

const state = ref(data);
provide("config", config);

const formData = ref({
  username: "阿巴阿巴",
  password: "1111",
  start: 0,
  end: 100,
});
</script>

<style scoped lang="scss">
.app {
  position: fixed;
  top: 20px;
  left: 20px;
  right: 20px;
  bottom: 20px;
}
</style>
