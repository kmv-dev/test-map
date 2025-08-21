<script setup lang="ts">
import Sidebar from '@/components/Sidebar.vue';
import Map from '@/components/Map.vue';
</script>

<template>
  <main class="w-full flex justyfy-center gap-[20px]">
    <Sidebar class="w-[30%]" />
    <div class="h-[100vh] w-[70%]">
      <Map></Map>
    </div>
  </main>
</template>
