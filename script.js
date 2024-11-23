let mapImgRoute = "media/TWSBlueprintBlank.png";

const map = new maplibregl.Map({
  container: "map",
  style: {
    version: 8,
    sources: {}, // Sin fuentes iniciales
    layers: [], // Sin capas iniciales
  },
  center: [0, 0], // Centro inicial
  zoom: 0, // Zoom inicial
  bearing: 0, // Sin rotación inicial
  pitch: 0, // Sin inclinación inicial
});

// Define hallways GeoJSON
const hallwaysGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [-5.445858323762025, -1.8276863801896752],
          [-5.437235900165973, 0.37071900936501834], // Replace with real coordinates
        ],
      },
      properties: {
        name: "Main Hallway",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [-5.785966145133614, 0.7285060344758705],
          [-8.226364593885108, 0.7153866542787313] // Replace with real coordinates
        ],
      },
      properties: {
        name: "2nd Hallway",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [-8.611499765151308, 0.6977849475529609],
          [-8.638305619919379, -1.4679502444844132] // Replace with real coordinates
        ],
      },
      properties: {
        name: "3nd Hallway",
      },
    }
  ],
};

//-----------------FOR TESTING------------------------
//hallway coordinates
document.getElementById("hallwayFocus").addEventListener("click", () => {
  // Get the coordinates of the hallway
  const hallwayCoordinates = hallwaysGeoJSON.features[1].geometry.coordinates;

  // Calculate the bounding box [minLng, minLat, maxLng, maxLat]
  const bounds = hallwayCoordinates.reduce(
    (bbox, coord) => [
      Math.min(bbox[0], coord[0]), // Min longitude
      Math.min(bbox[1], coord[1]), // Min latitude
      Math.max(bbox[2], coord[0]), // Max longitude
      Math.max(bbox[3], coord[1]), // Max latitude
    ],
    [Infinity, Infinity, -Infinity, -Infinity] // Initial values
  );

  // Fit the map to the bounds
  map.fitBounds(bounds, {
    padding: 20, // Optional: Padding around the focused area
    maxZoom: 18, // Optional: Set a maximum zoom level
    duration: 1000, // Optional: Animation duration in milliseconds
  });
});

// Function to enable coordinate extraction
function enableCoordinateExtraction(map) {
  map.on("click", (e) => {
    const coords = e.lngLat; // Get the longitude and latitude of the clicked point
    console.log(`Coordinates: [${coords.lng}, ${coords.lat}]`);
  });
}

// Ensure everything runs within a single "load" event
map.on("load", () => {
  // Add custom map image
  map.addSource("custom-map", {
    type: "image",
    url: mapImgRoute,
    coordinates: [
      [-10, 10], // Esquina superior izquierda [long, lat]
      [10, 10], // Esquina superior derecha
      [10, -10], // Esquina inferior derecha
      [-10, -10], // Esquina inferior izquierda
    ],
  });

  map.addLayer({
    id: "custom-map-layer",
    type: "raster",
    source: "custom-map",
  });

  // Fit bounds to the custom map image
  map.fitBounds([
    [-10, -10], // Esquina inferior izquierda
    [10, 10], // Esquina superior derecha
  ]);

  // Add hallways GeoJSON
  map.addSource("hallways", {
    type: "geojson",
    data: hallwaysGeoJSON,
  });

  map.addLayer({
    id: "hallways-layer",
    type: "line",
    source: "hallways",
    paint: {
      "line-color": "#FF0000", // Red
      "line-width": 3,
    },
  });

  // Enable coordinate extraction
  enableCoordinateExtraction(map);
});

// Add controls for zoom, rotation, and pan
map.addControl(new maplibregl.NavigationControl());

///-----------TEST FUNCTION--------------------------
//FOCUS ON HALLWAY WITH ROTATION ACORDING TO ORIENTATION

document.getElementById("hallwayFocus").addEventListener("click", () => {
  const hallwayCoordinates = hallwaysGeoJSON.features[1].geometry.coordinates;
  hallwaysGeoJSON.features[1].geometry.coordinates;

  // Calculate the bounding box [minLng, minLat, maxLng, maxLat]
  const bounds = hallwayCoordinates.reduce(
    (bbox, coord) => [
      Math.min(bbox[0], coord[0]),
      Math.min(bbox[1], coord[1]),
      Math.max(bbox[2], coord[0]),
      Math.max(bbox[3], coord[1]),
    ],
    [Infinity, Infinity, -Infinity, -Infinity]
  );

  // Calculate dimensions of the bounding box
  const width = bounds[2] - bounds[0]; // Longitude range
  const height = bounds[3] - bounds[1]; // Latitude range

  // Check orientation
  const isHorizontal = width > height;
  const targetBearing = isHorizontal ? 90 : 0;

  // Fit the map to the bounds
  map.fitBounds(bounds, {
    padding: 20,
    maxZoom: 18,
    duration: 1000,
    bearing: targetBearing,
  });
});
