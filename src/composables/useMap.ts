import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';

export function useMap(container: HTMLElement, vectorLayer: VectorLayer) {
  return new Map({
    target: container,
    layers: [new TileLayer({ source: new OSM() }), vectorLayer],
    view: new View({
      center: fromLonLat([84.9552, 56.4879]),
      zoom: 12,
    }),
    controls: [],
  });
}
