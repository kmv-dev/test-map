<script setup lang="ts">
import { ref } from 'vue'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'

const isSearchLoading = ref(false)
const searchData = ref(null)
</script>

<template>
  <div class="sidebar p-5">
    <div class="card flex flex-wrap justify-center">
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText v-model="searchData" placeholder="Search" />
        <InputIcon v-if="isSearchLoading" class="pi pi-spin pi-spinner" />
      </IconField>
    </div>
  </div>
</template>

<style scoped></style>
