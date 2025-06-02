
// MAP BOUNDS
export const BOUNDS = [
    [51.815,  5.846], // South-West lat/lng
    [51.828,  5.884]  // North-East lat/lng
];


// INITIAL CENTER AND ZOOM
export const INITIAL_CENTER = [51.8215, 5.865];
export const INITIAL_ZOOM   = 16;

// MAX AND MIN ZOOM
export const MIN_ZOOM = 16;
export const MAX_ZOOM = 21;

//─────────────────────────────────────────────────────────────────────────────
// GEOJSON
//─────────────────────────────────────────────────────────────────────────────

// MAP BACKGROUND
export const GEOJSON_BACKGROUND_URL = 'data/map.geojson';

// BUILDINGS
export const GEOJSON_BUILDINGS_URL = 'data/buildings.geojson';

//─────────────────────────────────────────────────────────────────────────────
// CANVAS
//─────────────────────────────────────────────────────────────────────────────

// PADDING
export const CANVAS_PADDING = 1.0;

//─────────────────────────────────────────────────────────────────────────────
// IDs
//─────────────────────────────────────────────────────────────────────────────

// MAP
export const MAP_CONTAINER_ID = 'map';

// INFO PANEL
export const INFO_PANEL_ID = 'info-panel';

// UP & DOWN FLOOR BUTTONS
export const UP_BUTTON_ID   = 'upButton';
export const DOWN_BUTTON_ID = 'downButton';

// ZOOM IN & OUT BUTTONS
export const PLUS_BUTTON_ID  = 'plusButton';
export const MINUS_BUTTON_ID = 'minusButton';

// SEARCH
export const SEARCH_INPUT_ID = 'searchInput';
export const SEARCH_RESULTS_ID = 'searchResults';

//─────────────────────────────────────────────────────────────────────────────
// PROPERTY NAMES
//─────────────────────────────────────────────────────────────────────────────

// FEATURE TYPE
export const GEOJSON_PROPERTY_TYPE = 'type';
export const BUILDING_TYPE_VALUE  = 'building';
export const ROOM_TYPE_VALUE      = 'room';

// FLOOR KEY
export const GEOJSON_PROPERTY_FLOOR = 'floor';

// CODE KEY
export const GEOJSON_PROPERTY_CODE = 'code';

// NAME KEY
export const GEOJSON_PROPERTY_NAME = 'name';

//─────────────────────────────────────────────────────────────────────────────
// FLOORS
//─────────────────────────────────────────────────────────────────────────────

export const BUILDING_FLOORS = {
    HG: [-2,0,1,2,3],
    MERC: [0,1,2,3,4,5,6],
    Transitorium: [-2,-1,0,1],
    LIN: [-1,0,1],
    EOS: [-1,0,1,2]
};

//─────────────────────────────────────────────────────────────────────────────
// COLORS
//─────────────────────────────────────────────────────────────────────────────

export const COLORS = {
    // Building footprint default
    BUILDING_BORDER: '#e3000b',
    BUILDING_FILL:   '#e3000b',
    BUILDING_OPACITY: 0.5,

    // Building highlight
    BUILDING_HIGHLIGHT_BORDER: '#cf3d2b',
    BUILDING_HIGHLIGHT_FILL:   '#cf3d2b',
    BUILDING_HIGHLIGHT_OPACITY: 1.0,

    // Room default style
    ROOM_BORDER: '#555',
    ROOM_FILL:   '#999',
    ROOM_OPACITY: 0.4,

    // Room highlight
    ROOM_HIGHLIGHT_BORDER: '#cf3d2b',
    ROOM_HIGHLIGHT_FILL:   '#cf3d2b',
    ROOM_HIGHLIGHT_OPACITY: 1.0,
};

