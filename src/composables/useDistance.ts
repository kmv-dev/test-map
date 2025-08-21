import LineString from 'ol/geom/LineString';
import Overlay from 'ol/Overlay';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { getLength } from 'ol/sphere';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';

export function useDistance(map: any, vectorSource: any) {
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

  return { drawDistanceLine };
}
