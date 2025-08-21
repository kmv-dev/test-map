import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { toLonLat } from 'ol/proj';
import { useMarkerStore } from '@/stores/main';

export function useMarkers(vectorSource: any) {
  const markerStore = useMarkerStore();

  const saveMarker = (feature: Feature) => {
    const stored = localStorage.getItem('markers');
    const markers = stored ? JSON.parse(stored) : [];
    const markerData = {
      id: feature.get('id'),
      text: feature.get('text'),
      createdAt: feature.get('createdAt'),
      coordinates: toLonLat((feature.getGeometry() as Point).getCoordinates()),
    };
    markers.push(markerData);
    localStorage.setItem('markers', JSON.stringify(markers));
    markerStore.addMarker(markerData);
  };

  const removeMarker = (id: string) => {
    const feature = vectorSource.getFeatures().find((f: Feature) => f.get('id'));
    if (feature) vectorSource.removeFeature(feature);

    const stored = localStorage.getItem('markers');
    if (stored) {
      const markers = JSON.parse(stored);
      const updated = markers.filter((m: any) => m.id !== id);
      localStorage.setItem('markers', JSON.stringify(updated));
      markerStore.removeMarker(id);
    }
  };

  return { saveMarker, removeMarker };
}
