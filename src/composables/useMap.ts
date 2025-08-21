import { ref, reactive } from 'vue'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import Overlay from 'ol/Overlay'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Style from 'ol/style/Style'
import Icon from 'ol/style/Icon'
import { fromLonLat, toLonLat } from 'ol/proj'

export function useMap(mapContainer: HTMLElement, popupEl: HTMLElement) {
  const popupContent = ref('')
  const popupVisible = ref(false)
  const popupPosition = ref({ x: 0, y: 0 })
  const hoveringPopup = ref(false)
  const hoveringMarker = ref(false)

  const vectorSource = new VectorSource()
  const vectorLayer = new VectorLayer({ source: vectorSource })

  const map = new Map({
    target: mapContainer,
    layers: [new TileLayer({ source: new OSM() }), vectorLayer],
    view: new View({
      center: fromLonLat([13.405, 52.52]),
      zoom: 12,
    }),
  })

  const popupOverlay = new Overlay({
    element: popupEl,
    positioning: 'top-center',
    stopEvent: false,
    offset: [0, -10],
  })
  map.addOverlay(popupOverlay)

  map.on('click', (event) => {
    const coordinate = event.coordinate
    const text = prompt('Введите текст для маркера:')
    if (!text) return

    const marker = new Feature({
      geometry: new Point(coordinate),
      text,
    })

    marker.setStyle(
      new Style({
        image: new Icon({
          src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
          scale: 0.05,
        }),
      }),
    )

    vectorSource.addFeature(marker)
  })

  map.on('pointermove', (event) => {
    const pixel = event.pixel
    const feature = map.forEachFeatureAtPixel(pixel, (f) => f)

    if (feature) {
      const text = feature.get('text')
      const coordinate = feature.getGeometry()?.getCoordinates()
      const screenPos = map.getPixelFromCoordinate(coordinate!)

      popupContent.value = `<strong>${text}</strong>`
      popupPosition.value = { x: screenPos[0], y: screenPos[1] - 30 }
      popupVisible.value = true
      hoveringMarker.value = true

      feature.setStyle(
        new Style({
          image: new Icon({
            src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
            scale: 0.06,
          }),
        }),
      )
    } else {
      hoveringMarker.value = false
      setTimeout(() => {
        if (!hoveringPopup.value && !hoveringMarker.value) {
          popupVisible.value = false
        }
      }, 200)

      vectorSource.getFeatures().forEach((f) =>
        f.setStyle(
          new Style({
            image: new Icon({
              src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
              scale: 0.05,
            }),
          }),
        ),
      )
    }
  })

  return reactive({
    popupContent,
    popupVisible,
    popupPosition,
    hoveringPopup,
  })
}
