import { initMap } from './mapInit.js';
import {
    createBackgroundPane,
    loadBackgroundGeoJSON,
    createBuildingLayer,
    addGroundFloorBuildings,
    createBuildingFeatureLayer,
    createRoomLayer
} from './layers.js';
import { updateInfoPanel } from './infoPanel.js';
import {
    setupZoomControls,
    setupFloorButtons,
    setupSearch
} from './ui.js';
import {
    GEOJSON_BUILDINGS_URL,
    COLORS,
    MIN_ZOOM,
    UP_BUTTON_ID,
    DOWN_BUTTON_ID
} from './config.js';


// INITIALIZE MAP

const map = initMap();

const bgRenderer = createBackgroundPane(map);
loadBackgroundGeoJSON(map, bgRenderer);


// SET UP LAYERS

const buildingLayer = createBuildingLayer(map);

let fullList = null;

let currentBuildingLayer = null;
let currentRoomLayer = null;
let currentRoomFeatureLayer = null;


// BUILDING CLICK

function handleBuildingClick(buildingLayerInstance) {

    const props = buildingLayerInstance.feature.properties;

    // if clicked on a new layer
    if(currentBuildingLayer !== buildingLayerInstance){

        // if there was a layer selected before, change it to default style
        if (currentBuildingLayer) {
            currentBuildingLayer.setStyle({
                color: COLORS.BUILDING_BORDER,
                weight: 1,
                fillColor: COLORS.BUILDING_FILL,
                fillOpacity: COLORS.BUILDING_OPACITY
            });
        }

        // change new layer to highlighted style
        buildingLayerInstance.setStyle({
            color: COLORS.BUILDING_HIGHLIGHT_BORDER,
            weight: 1,
            fillColor: COLORS.BUILDING_HIGHLIGHT_FILL,
            fillOpacity: COLORS.BUILDING_HIGHLIGHT_OPACITY
        });

        // fly to the building if there is a new building selected (don't fly if it's the same building but different floor)
        if(!currentBuildingLayer || currentBuildingLayer.feature.properties.code != props.code || props.code == null){
            map.dragging.disable();
            map.flyToBounds(buildingLayerInstance.getBounds(), {
                animate: true,
                duration: 0.6,
                maxZoom: 19
            });
            map.once('zoomend', () => {
                map.dragging.enable();
            });
        } 
        currentBuildingLayer = buildingLayerInstance;  

        // update info panel with new building info
        updateInfoPanel(`
        <strong>${props.name}</strong><br>
        Floor ${props.floor}<br>
        Code: ${props.code || 'N/A'}
    `);

        // if there was a room layer, remove it
        if (currentRoomLayer) {
            map.removeLayer(currentRoomLayer);
            currentRoomLayer = null;
            currentRoomFeatureLayer = null;
        }

        // create new room layer
        currentRoomLayer = createRoomLayer(
            fullList,
            props.code,
            props.floor,
            (roomLayerInstance) => {
                
                const roomProps = roomLayerInstance.feature.properties;
                const roomCode  = `${roomProps.building_code} ${roomProps.code}`;

                // reset old room
                if (
                    currentRoomFeatureLayer &&
                    currentRoomFeatureLayer !== roomLayerInstance
                ) {
                    currentRoomFeatureLayer.setStyle({
                        color: COLORS.ROOM_BORDER,
                        weight: 1,
                        fillColor: COLORS.ROOM_FILL,
                        fillOpacity: COLORS.ROOM_OPACITY
                    });
                }

                // highlight new room
                roomLayerInstance.setStyle({
                    color: COLORS.ROOM_HIGHLIGHT_BORDER,
                    weight: 1,
                    fillColor: COLORS.ROOM_HIGHLIGHT_FILL,
                    fillOpacity: COLORS.ROOM_HIGHLIGHT_OPACITY
                });
                currentRoomFeatureLayer = roomLayerInstance;

                // update info panel to show room code
                updateInfoPanel(`
            <strong>${props.name}</strong><br>
            Floor ${props.floor}<br>
            Code: ${roomCode || 'N/A'}
        `);
            }
        );

        // add room layer to map
        currentRoomLayer.addTo(map);

        // enable/disable floor buttons
        updateFloorButtonStates();
    }
}



// fetch buildings.geojson & draw initial building setup

fetch(GEOJSON_BUILDINGS_URL)
    .then((res) => res.json())
    .then((data) => {
        fullList = data;

        // Draw every building with properties.type === "building" && floor === 0
        addGroundFloorBuildings(fullList, buildingLayer, handleBuildingClick);
    })
    .catch((err) => {
        console.error('Error loading buildings.geojson:', err);
    });



// reset buildings on zoomout

map.on('zoomend', () => {
    if (map.getZoom() <= MIN_ZOOM && currentBuildingLayer) {
        // if there is a room layer, remove it
        if (currentRoomLayer) {
            map.removeLayer(currentRoomLayer);
            currentRoomLayer = null;
            currentRoomFeatureLayer = null;
        }
        // reset the building style
        currentBuildingLayer.setStyle({
            color: COLORS.BUILDING_BORDER,
            weight: 1,
            fillColor: COLORS.BUILDING_FILL,
            fillOpacity: COLORS.BUILDING_OPACITY
        });
        currentBuildingLayer = null;
        // hide the info panel
        updateInfoPanel(null);
    }
});


// floor change logic

// enable/disable floor buttons based on whether it is possible to go to a higher/lower floor
function updateFloorButtonStates() {
    if (!currentBuildingLayer) {
        document.getElementById(UP_BUTTON_ID).disabled   = true;
        document.getElementById(DOWN_BUTTON_ID).disabled = true;
        return;
    }

    const props = currentBuildingLayer.feature.properties;

    // is there a building feature with the same name but floor + 1 ?
    const hasUp = fullList.features.some((f) => {
        return (
            f.properties.type === 'building' &&
            f.properties.name === props.name &&
            f.properties.floor === props.floor + 1
        );
    });

    // is there a building feature with the same name but floor - 1 ?
    const hasDown = fullList.features.some((f) => {
        return (
            f.properties.type === 'building' &&
            f.properties.name === props.name &&
            f.properties.floor === props.floor - 1
        );
    });

    document.getElementById(UP_BUTTON_ID).disabled   = !hasUp;
    document.getElementById(DOWN_BUTTON_ID).disabled = !hasDown;
}

// change the building floor by delta
function floorChange(delta) {
    if (!currentBuildingLayer || delta === 0) return;

    const oldProps = currentBuildingLayer.feature.properties;
    const targetFloor = oldProps.floor + delta;

    // find the building matching this building’s name & target floor
    const nextFeature = fullList.features.find((f) => {
        return (
            f.properties.type === 'building' &&
            f.properties.name === oldProps.name &&
            f.properties.floor === targetFloor
        );
    });
    if (!nextFeature) return; // no such floor exists

    // remove the old building layer from buildingLayer
    buildingLayer.removeLayer(currentBuildingLayer);

    // if there’s a room layer, remove it
    if (currentRoomLayer) {
        map.removeLayer(currentRoomLayer);
        currentRoomLayer = null;
        currentRoomFeatureLayer = null;
    }

    // create a new L.GeoJSON for that feature
    const newBuildingLayer = createBuildingFeatureLayer(
        nextFeature,
        handleBuildingClick
    );

    // add it into the buildingLayer group
    buildingLayer.addLayer(newBuildingLayer);

    
    newBuildingLayer.fire('click');

    currentBuildingLayer = newBuildingLayer;

    // enable/disable floor buttons
    updateFloorButtonStates();
}


// ui controls wire

// replace default zoom UI with our buttons
setupZoomControls(map);

// wire floor Up/Down buttons to call floorChange(+1) / floorChange(-1)
setupFloorButtons(
    () => floorChange(+1),
    () => floorChange(-1)
);

// once fullList is loaded, wire up the search autocomplete.
const waitForFullList = setInterval(() => {
    if (!fullList) return;

    clearInterval(waitForFullList);

    setupSearch(
        fullList,
        map,

        // user clicked a building name in the search list
        (buildingProps) => {
            // find any building layer that has the same name.
            buildingLayer.eachLayer((layer) => {
                const p = layer.feature.properties;
                if (
                    p.type === 'building' &&
                    p.name === buildingProps.name
                ) {
                    layer.fire('click');
                }
            });
        },

        // user clicked a room
        (roomProps) => {
            // if the building for this room isn’t already selected, click it
            const buildingCode = roomProps.building_code;
            if (
                !currentBuildingLayer ||
                currentBuildingLayer.feature.properties.code !== buildingCode
            ) {
                // click the building layer with matching code
                buildingLayer.eachLayer((layer) => {
                    const p = layer.feature.properties;
                    if (
                        p.type === 'building' &&
                        p.code === buildingCode
                    ) {
                        layer.fire('click');
                        currentBuildingLayer = layer;
                    }
                });
            }

            // if that building is on a different floor, switch floors
            const desiredFloor = roomProps.floor;
            const currentFloor = currentBuildingLayer.feature.properties.floor;
            const floorDiff = desiredFloor - currentFloor;
            if (floorDiff !== 0) {
                floorChange(floorDiff);
            }

            // after a delay, click the exact room
            setTimeout(() => {
                if (!currentRoomLayer) return;
                currentRoomLayer.eachLayer((roomLayerInstance) => {
                    if (roomLayerInstance.feature.properties.code === roomProps.code) {
                        roomLayerInstance.fire('click');
                    }
                });
            }, 150);
        }
    );
}, 100);
