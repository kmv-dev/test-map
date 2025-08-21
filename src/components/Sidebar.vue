<script setup lang="ts">
import { ref, computed } from 'vue';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import { useMarkerStore } from '@/stores/main';
import Panel from 'primevue/panel';

const markerStore = useMarkerStore();
const isSearchLoading = ref(false);
const query = ref('');

const computedList = computed(() => {
  const words = query.value.trim().toLowerCase().split(/\s+/);
  return markerStore.markers.filter((item) => {
    const text = item.text.toLowerCase();
    return words.every((word) => text.includes(word));
  });
});

const toggle = (event: object) => {
  toggle(event);
};
</script>

<template>
  <div class="sidebar p-5">
    <div class="card flex flex-wrap justify-center w-full">
      <IconField class="w-full">
        <InputIcon class="pi pi-search" />
        <InputText v-model="query" placeholder="Search" class="w-full" />
        <InputIcon v-if="isSearchLoading" class="pi pi-spin pi-spinner" />
      </IconField>
    </div>
    <TransitionGroup name="list">
      <Panel
        toggleable
        collapsed
        v-for="(marker, index) in computedList"
        :key="marker.id"
        :data-index="index"
        class="my-2 min-h-[50px]"
      >
        <template #header>
          <div class="flex items-center gap-2">
            <span class="font-bold">{{ marker.text }}</span>
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
        <p class="m-0">{{ marker.coordinates }}</p>
      </Panel>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}
.list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.list-leave-active {
  position: absolute;
  width: calc(100% - 30px);
}
</style>
