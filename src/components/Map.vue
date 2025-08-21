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
        <Button class="min-w-[120px]" @click="removeMarker">
          удалить <i class="pi pi-trash"></i>
        </Button>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import Feature from 'ol/Feature';
import Stroke from 'ol/style/Stroke';
import Overlay from 'ol/Overlay';
import LineString from 'ol/geom/LineString';
import { getLength } from 'ol/sphere';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import { format } from 'date-fns/format';
import { fromLonLat, toLonLat } from 'ol/proj';
import { useMarkerStore } from '@/stores/main';
import type Geometry from 'ol/geom/Geometry';
const markerStore = useMarkerStore();

// Генератор уникального ID
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

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

let map: Map;

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

  map = new Map({
    target: mapContainer.value,
    layers: [new TileLayer({ source: new OSM() }), vectorLayer],
    view: new View({
      center: fromLonLat([84.9552, 56.4879]),
      zoom: 12,
    }),
    controls: [],
  });

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

  // Добавление маркера
  map.on('click', (event) => {
    const target = event.originalEvent.target as HTMLElement;
    const feature = map.forEachFeatureAtPixel(event.pixel, (f) => f);

    if (feature && feature.getGeometry()?.getType() === 'Point') {
      selectedMarkers.value.push(feature as Feature);

      if (selectedMarkers.value.length === 2) {
        drawDistanceLine(
          selectedMarkers.value[0] as Feature<Geometry>,
          selectedMarkers.value[1] as Feature<Geometry>,
        );
        selectedMarkers.value = []; // сбрасываем выбор
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
      createdAt: format(new Date(), 'dd.MM.yyyy HH:mm'),
    });

    marker.setStyle(getMarkerStyle(false));
    vectorSource.addFeature(marker);
    saveMarker(marker);
  });

  // Наведение
  let lastMove = 0;
  map.on('pointermove', (event) => {
    const now = Date.now();
    if (now - lastMove < 50) return;
    lastMove = now;

    const pixel = event.pixel;
    const feature = map.forEachFeatureAtPixel(pixel, (f) => f);

    if (feature) {
      const text = feature.get('text');
      const id = feature.get('id');
      const coordinate = (feature.getGeometry() as Point).getCoordinates();
      const screenPos = map.getPixelFromCoordinate(coordinate!);

      popupContent.value = `<strong>${text}</strong><br><span>${toLonLat(coordinate)}</span>`;
      popupPosition.value = { x: screenPos[0], y: screenPos[1] - 140 };
      popupVisible.value = true;
      hoveringMarker.value = true;
      currentMarkerId.value = id;
      (feature as Feature).setStyle(getMarkerStyle(true));
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

// Сохранение маркера
const saveMarker = (feature: Feature) => {
  const stored = localStorage.getItem('markers');
  const markers = stored ? JSON.parse(stored) : [];
  markers.push({
    id: feature.get('id'),
    text: feature.get('text'),
    createdAt: feature.get('createdAt'),
    coordinates: toLonLat((feature.getGeometry() as Point).getCoordinates()),
  });
  localStorage.setItem('markers', JSON.stringify(markers));
  let Marker = {
    id: feature.get('id'),
    text: feature.get('text'),
    createdAt: feature.get('createdAt'),
    coordinates: toLonLat((feature.getGeometry() as Point).getCoordinates()),
  };
  markerStore.addMarker(Marker);
};

// Удаление маркера
const removeMarker = () => {
  if (!currentMarkerId.value) return;
  const features = vectorSource.getFeatures();
  const featureToRemove = features.find((f) => f.get('id') === currentMarkerId.value);
  if (featureToRemove) {
    vectorSource.removeFeature(featureToRemove);
    cleanStorage(currentMarkerId.value);
    popupVisible.value = false;
    currentMarkerId.value = null;
  }
};

// Очистка локалстор
const cleanStorage = (id: string) => {
  const stored = localStorage.getItem('markers');
  if (stored) {
    const markers = JSON.parse(stored);
    const updated = markers.filter((m: any) => m.id !== id);
    localStorage.setItem('markers', JSON.stringify(updated));
    markerStore.removeMarker(id);
  }
};

// Стиль маркера
const getMarkerStyle = (enlarged: boolean) => {
  return new Style({
    image: new Icon({
      src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
      scale: enlarged ? 0.06 : 0.05,
    }),
  });
};

const drawDistanceLine = (f1: Feature, f2: Feature) => {
  const coord1 = (f1.getGeometry() as Point).getCoordinates();
  const coord2 = (f2.getGeometry() as Point).getCoordinates();

  const line = new Feature(new LineString([coord1, coord2]));
  line.setStyle(
    new Style({
      stroke: new Stroke({ color: 'red', width: 2 }),
    }),
  );
  vectorSource.addFeature(line);

  const distance = getLength(new LineString([coord1, coord2])); // в метрах
  const midpoint = [(coord1[0] + coord2[0]) / 2, (coord1[1] + coord2[1]) / 2];

  const popup = document.createElement('div');
  popup.className = 'distance-popup';

  const closeBtn = document.createElement('span');
  closeBtn.style.fontSize = '30px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.color = 'red';
  });

  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.color = 'black';
  });
  closeBtn.className = 'close-btn';
  closeBtn.innerHTML = '&times;'; // крестик

  const text = document.createElement('span');
  text.style.fontWeight = 'bold';
  text.style.fontSize = '30px';
  text.textContent = `${(distance / 1000).toFixed(2)} км`;

  popup.appendChild(closeBtn);
  popup.appendChild(text);

  const overlay = new Overlay({
    element: popup,
    position: midpoint,
    positioning: 'center-center',
  });

  map.addOverlay(overlay);

  closeBtn.addEventListener('click', () => {
    map.removeOverlay(overlay);
  });
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
