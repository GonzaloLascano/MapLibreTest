let mapImgRoute = "media/TWSBlueprintBlank.png";

const map = new maplibregl.Map({
  container: "map",
  style: {
    version: 8,
    sources: {}, // No initial sources or layers
    layers: [], // 
  },
  center: [0, 0], // Starting Center
  zoom: 0, // Starting Zoom 
  bearing: 0, // Starting x y rotation
  pitch: 0, // Starting z rotation
});

// Define hallways as individual LineString features in GeoJSON 
const hallwaysGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [-5.445858323762025, -1.8276863801896752],
          [-5.437235900165973, 0.37071900936501834], 
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
          [-8.226364593885108, 0.7153866542787313]
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
          [-8.638305619919379, -1.4679502444844132]
        ],
      },
      properties: {
        name: "3nd Hallway",
      },
    }
  ],
};

//----Simulating backend response with path to unit: each value in the array represents the hallwaysGeoJSON index for the hallway to walk----
let response = [0, 1, 2, 1];

let responseFocusIndex = 0; // Keeps track of the current index in "response" where it's value references a feature of "hallwaysGeoJSON" 
let previousBearing = 0;

// UTILITARY FUNCTIONS: meaning functions for other functions---------------------------

// Function to enable coordinate extraction. (this is just for creating test halways)
function enableCoordinateExtraction(map) {
  map.on("click", (e) => {
    const coords = e.lngLat; // Get the longitude and latitude of the clicked point
    console.log(`Coordinates: [${coords.lng}, ${coords.lat}]`);
  });
}

function calculateTurnJSON(originHallway, destinyHallway) {
  if (originHallway === undefined) {
    return 'straight';
  }
  // Get origin hallway endpoints
  const originCoords = originHallway.geometry.coordinates;
  const originStart = originCoords[0];
  const originEnd = originCoords[originCoords.length - 1];

  // Get destination hallway endpoints
  const destinyCoords = destinyHallway.geometry.coordinates;
  const destinyStart = destinyCoords[0];
  const destinyEnd = destinyCoords[destinyCoords.length - 1];

  // Determine the closest connection point between origin and destination
  const distStartToStart = coordsGeoDistance(originEnd, destinyStart);
  const distStartToEnd = coordsGeoDistance(originEnd, destinyEnd);
  const connection = distStartToStart < distStartToEnd ? destinyStart : destinyEnd;

  // Calculate cross product in geographic coordinates
  const crossProduct =
    (connection[0] - originEnd[0]) * (originEnd[1] - originStart[1]) -
    (connection[1] - originEnd[1]) * (originEnd[0] - originStart[0]);

  if (crossProduct > 0) {
    return "left";
  } else if (crossProduct < 0) {
    return "right";
  } else {
    return "straight";
  }
}

// Aux function to calculate distance in geographic coordinates 
function coordsGeoDistance(coordA, coordB) {
  const deltaLng = coordB[0] - coordA[0];
  const deltaLat = coordB[1] - coordA[1];
  return Math.sqrt(deltaLng ** 2 + deltaLat ** 2);
}
//---------------------------------------------

// Ensure everything runs within a single "load" event to avoid overwriting
map.on("load", () => {
  // Add custom map image
  map.addSource("custom-map", {
    type: "image",
    url: mapImgRoute,
    coordinates: [
      [-10, 10], // top left
      [10, 10], // top right
      [10, -10], // bottom right
      [-10, -10], // bottom left
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
      "line-color": "black",
      "line-width": 3,
    },
  });

  // Enable coordinate extraction
  enableCoordinateExtraction(map);
});

// Add controls for zoom, rotation, and pan
map.addControl(new maplibregl.NavigationControl());

///----------- MAIN FUNCTIONS --------------

//FOCUS ON A SPECIFIC HALLWAY (with rotation acording to orientation)
function pathFocuser(resIndex) {
  responseFocusIndex = resIndex;
 
  let i = response[resIndex];
  
  map.setPaintProperty('hallways-layer', 'line-color', "black"); //Resets the color property of every line in "hallways" layer
  
  const prevStepHallway = hallwaysGeoJSON.features[i -1]; //We get the hallway from the previous step of the way
  
  const currentStepHallway = hallwaysGeoJSON.features[i]; //The hallway we are focused on now
  const hallwayCoordinates = currentStepHallway.geometry.coordinates;
  let focusedHName = currentStepHallway.properties.name;

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

  /* 
  // Calculate dimensions of the bounding box --- Replaced by calculateTurnJSON
  const width = bounds[2] - bounds[0]; // Longitude range
  const height = bounds[3] - bounds[1]; // Latitude range  
  const isHorizontal = width > height; --- Replaced by calculateTurnJSON */

  // Check orientation
  let turn = calculateTurnJSON(prevStepHallway, currentStepHallway);
  let targetBearing = 0;
  if ( -180 >= previousBearing || 180 <= previousBearing){
    previousBearing = 0;
  } 
  if(turn == 'right'){
    targetBearing = previousBearing -= 90
  } else if (turn == 'left') {
    targetBearing = previousBearing += 90
  } else if (turn == 'straight') {
    previousBearing = targetBearing;
  };

  // Fit the map to the bounds
  map.fitBounds(bounds, {
    padding: 20,
    maxZoom: 18,
    duration: 1000,
    bearing: targetBearing,
  });

  setTimeout(() => {
    map.setPaintProperty('hallways-layer', 'line-color', [
    'case',
    ['==', ['get', 'name'], focusedHName],
    'red',
    'black',
    ]);
  }, 500);
};

//Focus on the next step in the "response" array
function focusNext() {  
  responseFocusIndex++
  if (responseFocusIndex > response.length - 1) {
    responseFocusIndex = 0;
  }
  pathFocuser(responseFocusIndex);
}

//Focus on the previous step in the "response" array
function focusPrev() {  
  responseFocusIndex--
  if (responseFocusIndex < 0) {
    responseFocusIndex = response.length - 1;
  }
  pathFocuser(responseFocusIndex);
}

// ------------ LISTENING DOM EVENTS ----------------
document.getElementById("hallwayFocus").addEventListener("click", () => pathFocuser(0));
document.getElementById("nxtStep").addEventListener("click", () => focusNext());
document.getElementById("prvStep").addEventListener("click", () => focusPrev());
document.getElementById("resetMap").addEventListener("click", () => {
  map.setPaintProperty('hallways-layer', 'line-color', "black"); //reset navigation
  map.fitBounds([
    [-10, -10],
    [10, 10], 
  ], {
    padding: 0,
    maxZoom: 10,
    duration: 1000,
    bearing: 0,
  });
  previousBearing = 0;
  responseFocusIndex = 0;
})

//---------- TESTING Approach: Create a new layer on map object with JUST the focused hallway for easy access and customization----------

/*
let focusedJson = {...hallwaysGeoJSON}
  focusedJson.features = hallwaysGeoJSON.features.filter(f => f.properties.name == '2nd Hallway');

map.addSource("focusedHallway", {
    type: "geojson",
    data: focusedJson,
  });

  map.addLayer({
    id: "focus",
    type: "line",
    source: "focusedHallway",
    paint: {
      "line-color": "red",
      "line-width": 10,
    },
  }); */
