<script setup lang="ts">
import { onMounted, ref } from 'vue';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import { useMarkerStore } from '@/stores/main';
import Panel from 'primevue/panel';
const markerStore = useMarkerStore();
const isSearchLoading = ref(false);
const searchData = ref(null);
type Marker = {
  id: string;
  text: string;
  coordinates: [number, number];
};
const markers = ref<Marker[]>([]);

onMounted(() => {});

const toggle = (event: object) => {
  toggle(event);
};
</script>

<template>
  <div class="sidebar p-5">
    <div class="card flex flex-wrap justify-center w-full">
      <IconField class="w-full">
        <InputIcon class="pi pi-search" />
        <InputText v-model="searchData" placeholder="Search" class="w-full" />
        <InputIcon v-if="isSearchLoading" class="pi pi-spin pi-spinner" />
      </IconField>
    </div>
    <Panel toggleable collapsed v-for="marker in markerStore.markers" class="my-2">
      <template #header>
        <div class="flex items-center gap-2">
          <span class="font-bold">id: {{ marker.id }}</span>
        </div>
      </template>
      <template #footer>
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <Button
              icon="pi pi-trash"
              rounded
              @click="markerStore.removeMarker(marker.id)"
            ></Button>
          </div>
          <span class="text-surface-500 dark:text-surface-400">{{ marker.createdAt }}</span>
        </div>
      </template>
      <template #icons>
        <Button
          icon="pi pi-map-marker"
          severity="secondary"
          rounded
          text
          @click="markerStore.selectMarker(marker)"
        />
      </template>
      <p class="m-0">текст: {{ marker.text }}</p>
    </Panel>
  </div>
</template>

<style scoped>
.p-panel-content-container {
  display: none !important;
}
</style>
