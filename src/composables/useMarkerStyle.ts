import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';

export function getMarkerStyle(enlarged: boolean) {
  return new Style({
    image: new Icon({
      src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
      scale: enlarged ? 0.06 : 0.05,
    }),
  });
}
