<template>
  <div ref="mapContainer" class="map-container">
    <Transition name="bounce">
      <div
        ref="popup"
        class="popup"
        v-show="popupVisible"
        :style="{ left: popupPosition.x + 'px', top: popupPosition.y + 'px' }"
        @mouseenter="hoveringPopup = true"
        @mouseleave="hoveringPopup = false"
      >
        <div v-html="popupContent"></div>
        <Button
          class="min-w-[120px]"
          @click="(removeMarker(currentMarkerId!), (popupVisible = false))"
        >
          удалить <i class="pi pi-trash"></i>
        </Button>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Map from 'ol/Map';
import type Geometry from 'ol/geom/Geometry';
import { fromLonLat, toLonLat } from 'ol/proj';
import { useMarkerStore } from '@/stores/main';

import { useMap } from '@/composables/useMap';
import { useMarkers } from '@/composables/useMarkers';
import { useDistance } from '@/composables/useDistance';
import { getMarkerStyle } from '@/composables/useMarkerStyle';
import { generateId } from '@/composables/utils';

const markerStore = useMarkerStore();

const mapContainer = ref<HTMLDivElement | null>(null);
const popup = ref<HTMLDivElement | null>(null);
const popupContent = ref('');
const popupVisible = ref(false);
const popupPosition = ref({ x: 0, y: 0 });
const hoveringPopup = ref(false);
const hoveringMarker = ref(false);
const currentMarkerId = ref<string | null>(null);
const selectedMarkers = ref<Feature[]>([]);

const vectorSource = new VectorSource();
const vectorLayer = new VectorLayer({ source: vectorSource });

const { saveMarker, removeMarker } = useMarkers(vectorSource);
let map: Map;

// Центрирование по выбранному маркеру
watch(
  () => markerStore.selectedMarker,
  (marker) => {
    if (marker && map) {
      map.getView().animate({
        center: fromLonLat(marker.coordinates),
        zoom: 14,
        duration: 1000,
      });
    }
  },
);

// Слежение за удалением маркеров
watch(
  () => markerStore.markers.slice(), // slice() чтобы отслеживать изменения массива
  (newMarkers, oldMarkers) => {
    const oldIds = oldMarkers.map((m) => m.id);
    const newIds = newMarkers.map((m) => m.id);

    const removedIds = oldIds.filter((id: string) => !newIds.includes(id));

    removedIds.forEach((id: string) => {
      const feature = vectorSource.getFeatures().find((f) => f.get('id') === id);
      if (feature) {
        cleanStorage(id);
        vectorSource.removeFeature(feature);
      }
    });
  },
  { deep: true },
);

onMounted(() => {
  if (!mapContainer.value) return;
  map = useMap(mapContainer.value, vectorLayer);
  const { drawDistanceLine } = useDistance(map, vectorSource);

  // Загрузка маркеров из localStorage
  const stored = localStorage.getItem('markers');
  if (stored) {
    const markers = JSON.parse(stored);
    markers.forEach((m: any) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat(m.coordinates)),
        text: m.text,
        id: m.id,
        createdAt: m.createdAt,
      });
      feature.setStyle(getMarkerStyle(false));
      vectorSource.addFeature(feature);
    });
  }

  // Клик по карте
  map.on('click', (event: any) => {
    const target = event.originalEvent.target as HTMLElement;
    const feature = map.forEachFeatureAtPixel(event.pixel, (f: any) => f);

    if (feature && feature.getGeometry()?.getType() === 'Point') {
      selectedMarkers.value.push(feature as Feature);
      if (selectedMarkers.value.length === 2) {
        drawDistanceLine(
          selectedMarkers.value[0] as Feature<Geometry>,
          selectedMarkers.value[1] as Feature<Geometry>,
        );
        selectedMarkers.value = [];
      }
    }

    if (target.closest('.popup') || feature) return;

    const coordinate = event.coordinate;
    const text = prompt('Введите текст для маркера:');
    if (!text) return;

    const id = generateId();
    const marker = new Feature({
      geometry: new Point(coordinate),
      text,
      id,
      createdAt: new Date().toLocaleString(),
    });

    marker.setStyle(getMarkerStyle(false));
    vectorSource.addFeature(marker);
    saveMarker(marker);
  });

  // Наведение
  let lastMove = 0;
  map.on('pointermove', (event: any) => {
    const now = Date.now();
    if (now - lastMove < 50) return;
    lastMove = now;

    const pixel = event.pixel;
    const feature = map.forEachFeatureAtPixel(pixel, (f: any) => f);

    if (feature) {
      const text = feature.get('text');
      const id = feature.get('id');
      const coordinate = (feature.getGeometry() as Point).getCoordinates();
      const screenPos = map.getPixelFromCoordinate(coordinate);

      popupContent.value = `<strong>${text}</strong><br><span>${toLonLat(coordinate)}</span>`;
      popupPosition.value = { x: screenPos[0], y: screenPos[1] - 140 };
      popupVisible.value = true;
      hoveringMarker.value = true;
      currentMarkerId.value = id;
      feature.setStyle(getMarkerStyle(true));
    } else {
      hoveringMarker.value = false;
      setTimeout(() => {
        if (!hoveringPopup.value && !hoveringMarker.value) {
          popupVisible.value = false;
          currentMarkerId.value = null;
        }
      }, 200);

      vectorSource.getFeatures().forEach((f) => f.setStyle(getMarkerStyle(false)));
    }
  });
});

const cleanStorage = (id: string) => {
  const stored = localStorage.getItem('markers');
  if (stored) {
    const markers = JSON.parse(stored);
    const updated = markers.filter((m: any) => m.id !== id);
    localStorage.setItem('markers', JSON.stringify(updated));
    markerStore.removeMarker(id);
  }
};
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100vh;
  position: relative;
}

.popup {
  position: absolute;
  display: flex;
  flex-direction: column;
  background: white;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-size: 14px;
  max-width: 200px;
  white-space: nowrap;
  z-index: 1000;
  pointer-events: auto;
  transition: opacity 0.2s ease;
  word-wrap: break-word;
  white-space: normal;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.bounce-enter-active {
  animation: bounce-in 0.3s ease-out;
}
.bounce-leave-active {
  animation: bounce-in 0.3s reverse;
}
@keyframes bounce-in {
  0% {
    transform: translateY(-100%);
  }
  30% {
    transform: translateY(5%);
  }
  65% {
    transform: translateY(-2%);
  }
  100% {
    transform: translateY(0%);
  }
}
</style>
