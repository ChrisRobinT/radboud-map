import {
    GEOJSON_BACKGROUND_URL,
    GEOJSON_BUILDINGS_URL,
    CANVAS_PADDING,
    COLORS,
    GEOJSON_PROPERTY_TYPE,
    BUILDING_TYPE_VALUE,
    ROOM_TYPE_VALUE,
    GEOJSON_PROPERTY_FLOOR,
    GEOJSON_PROPERTY_CODE
} from './config.js';

const BACKGROUND_PANE = 'background';

export function createBackgroundPane(map) {
    map.createPane(BACKGROUND_PANE);
    map.getPane(BACKGROUND_PANE).style.zIndex = 200;
    map.getPane(BACKGROUND_PANE).style.pointerEvents = 'none';
    return L.canvas({
        pane: BACKGROUND_PANE,
        padding: CANVAS_PADDING
    });
}


function styleFeature(feature) {
    const tags = feature.properties || {};

    if (tags.building) {
        return {
            color: '#999',
            weight: 1,
            fillColor: '#d0c0b0',
            fillOpacity: 0.7
        };
    }
    if (tags.landuse) {
        return {
            color: '#a0d080',
            weight: 1,
            fillColor: '#d0f0c0',
            fillOpacity: 0.4
        };
    }
    if (tags.leisure) {
        return {
            color: '#6bc26b',
            weight: 1,
            fillColor: '#b6f2b6',
            fillOpacity: 0.4
        };
    }
    if (tags.natural) {
        return {
            color: '#77ccee',
            weight: 1,
            fillColor: '#aadaff',
            fillOpacity: 0.5
        };
    }
    if (tags.waterway) {
        return {
            color: '#3399ff',
            weight: 1.5,
            fillOpacity: 0
        };
    }

    // Default fallback style
    return {
        color: '#666',
        weight: 1,
        fillOpacity: 0.3
    };
}

export function loadBackgroundGeoJSON(map, renderer) {
    fetch(GEOJSON_BACKGROUND_URL)
        .then((res) => res.json())
        .then((data) => {
            L.geoJSON(data, {
                pane: BACKGROUND_PANE,
                style: styleFeature,
                renderer
            }).addTo(map);
        })
        .catch((err) => {
            console.error('Error loading background GeoJSON:', err);
        });
}

export function createBuildingLayer(map) {
    return L.featureGroup().addTo(map);
}

export function addGroundFloorBuildings(fullList, buildingLayer, onBuildingClick) {
    L.geoJSON(fullList, {
        filter: (feature) => {
            return (
                feature.properties[GEOJSON_PROPERTY_TYPE] === BUILDING_TYPE_VALUE &&
                feature.properties[GEOJSON_PROPERTY_FLOOR] === 0
            );
        },
        style: {
            color: COLORS.BUILDING_BORDER,
            weight: 1,
            fillColor: COLORS.BUILDING_FILL,
            fillOpacity: COLORS.BUILDING_OPACITY
        },
        onEachFeature: (feature, layer) => {
            layer.on('click', () => onBuildingClick(layer));
            buildingLayer.addLayer(layer);
        }
    });
}

export function createBuildingFeatureLayer(feature, onBuildingClick) {
  const tempGroup = L.geoJSON(feature, {

    style: (feature) => ({
      color: COLORS.BUILDING_BORDER,
      weight: 1,
      fillColor: COLORS.BUILDING_FILL,
      fillOpacity: COLORS.BUILDING_OPACITY,
    }),

    onEachFeature: (feature, layer) => {
      layer.on('click', () => {
        onBuildingClick(layer);
      });
    }
  });


  const children = tempGroup.getLayers();
  if (!children || children.length === 0) {

    return tempGroup;
  }


  const polygonLayer = children[0];

  return polygonLayer;
}

export function createRoomLayer(fullList, buildingCode, floor, onRoomClick) {
    return L.geoJSON(fullList, {
        filter: (feature) => {
            return (
                feature.properties[GEOJSON_PROPERTY_TYPE] === ROOM_TYPE_VALUE &&
                feature.properties.building_code === buildingCode &&
                feature.properties[GEOJSON_PROPERTY_FLOOR] === floor
            );
        },
        style: {
            color: COLORS.ROOM_BORDER,
            weight: 1,
            fillColor: COLORS.ROOM_FILL,
            fillOpacity: COLORS.ROOM_OPACITY
        },
        onEachFeature: (feature, layer) => {
            layer.on('click', () => onRoomClick(layer));
        }
    });
}


