<template>
  <BasicLayout />
</template>

<script setup lang="ts">
import BasicLayout from "@/layout/BasicLayout.vue";
</script>

<style>
html,
body,
#app {
  margin: 0;
  min-height: 100%;
  background:
    radial-gradient(circle at top left, rgba(69, 179, 157, 0.18), transparent 28%),
    radial-gradient(circle at right center, rgba(255, 165, 87, 0.14), transparent 24%),
    linear-gradient(180deg, #f5fbfa 0%, #eef5f7 100%);
  color: #173b38;
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
}

* {
  box-sizing: border-box;
}
</style>
