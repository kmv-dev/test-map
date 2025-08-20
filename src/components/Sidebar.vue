<script setup lang="ts">
import Menu from 'primevue/menu'
import { ref } from 'vue'

const items = ref([
  {
    separator: true,
  },
  {
    label: 'Инструменты',
    items: [
      {
        label: 'Добавить маркер',
        icon: 'pi pi-plus',
      },
      {
        label: 'Поиск',
        icon: 'pi pi-search',
      },
    ],
  },
  {
    separator: true,
  },
])
</script>

<template>
  <div class="card flex justify-center h-[100vh]">
    <Menu :model="items" class="w-full md:w-60">
      <template #start>
        <span class="inline-flex items-center gap-1 px-2 py-2">
          <span class="text-xl font-semibold">TEST<span class="text-primary">MAP</span></span>
        </span>
      </template>
      <template #submenulabel="{ item }">
        <span class="text-primary font-bold">{{ item.label }}</span>
      </template>
      <template #end>
        <button
          v-ripple
          class="relative overflow-hidden w-full border-0 bg-transparent flex items-start p-2 pl-4 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-none cursor-pointer transition-colors duration-200"
        >
          <span class="inline-flex flex-col items-start">
            <span class="text-sm">Admin</span>
          </span>
        </button>
      </template>
    </Menu>
  </div>
</template>

<style scoped></style>
