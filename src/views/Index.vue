<script setup lang="ts">
import Sidebar from '@/components/Sidebar.vue'
import Map from '@/components/Map.vue'
</script>

<template>
  <main class="w-full flex justyfy-center gap-[20px]">
    <Sidebar />
    <div class="h-[100vh] w-full">
      <Map></Map>
    </div>
  </main>
</template>
