import {
    MAP_CONTAINER_ID,
    BOUNDS,
    INITIAL_CENTER,
    INITIAL_ZOOM,
    MIN_ZOOM,
    MAX_ZOOM,
    CANVAS_PADDING,
} from './config.js';

export function initMap() {
    const leafletBounds = L.latLngBounds(BOUNDS[0], BOUNDS[1]);

    const smoothRenderer = L.canvas({
        padding: CANVAS_PADDING
    });

    const map = L.map(MAP_CONTAINER_ID, {
        maxBounds: leafletBounds,
        renderer: smoothRenderer,
        maxBoundsViscosity: 1.0,
        maxZoom: MAX_ZOOM,
        minZoom: MIN_ZOOM
    }).setView(INITIAL_CENTER, INITIAL_ZOOM);

    return map;
}

