import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export type Marker = {
  id: string;
  text: string;
  coordinates: number[];
  createdAt: string;
};

export const useMarkerStore = defineStore('marker', {
  state: () => ({
    markers: (() => {
      const raw = localStorage.getItem('markers');
      return raw ? (JSON.parse(raw) as Marker[]) : [];
    })(),
    selectedMarker: null as Marker | null,
  }),
  actions: {
    addMarker(marker: Marker) {
      this.markers.push(marker);
    },
    removeMarker(id: string) {
      this.markers = this.markers.filter((m) => m.id !== id);
    },
    selectMarker(marker: Marker) {
      this.selectedMarker = marker;
    },
    clearMarkers() {
      this.markers = [];
    },
  },
});
