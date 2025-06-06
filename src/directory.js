// Store references locally
let fullListData = null;
let buildingLayerRef = null;
let currentBuildingLayerRef = null;
let currentRoomLayerRef = null;
let handleBuildingClickCallbackRef = null;

// Cache maps for storing building names and room types
const buildingNameCache = new Map();
const roomTypeCache = new Map();
const restroomCodes = new Set([
    // MERC toilets
    'MERC/00.42', 'MERC/00.42a', 'MERC/00.42b', 'MERC/00.43', 'MERC/00.43a', 'MERC/00.43b', 'MERC/00.44',
    'MERC/01.25', 'MERC/01.26', 'MERC/01.24', 'MERC/01.24a', 'MERC/01.24b',
    'MERC/02.22', 'MERC/02.22c', 'MERC/02.22d', 'MERC/02.21', 'MERC/02.21a', 'MERC/02.21b',
    'MERC/03.26', 'MERC/03.26c', 'MERC/03.26d', 'MERC/03.23', 'MERC/03.23a', 'MERC/03.23b',
    'MERC/04.25', 'MERC/04.25c', 'MERC/04.25d', 'MERC/04.24', 'MERC/04.24a', 'MERC/04.24b',
    'MERC/05.28', 'MERC/05.28c', 'MERC/05.28d', 'MERC/05.27', 'MERC/05.27a', 'MERC/05.27b',
    'MERC/06.26', 'MERC/06.26c', 'MERC/06.26d', 'MERC/06.25', 'MERC/06.25a', 'MERC/06.25b',

    // EOS toilets
    'EOS/00.850', 'EOS/00.840', 'EOS/00.830', 'EOS/00.820', 'EOS/00.866',
    'EOS/01.850', 'EOS/01.840', 'EOS/01.860', 'EOS/01.830', 'EOS/01.820',
    'EOS/02.810', 'EOS/02.820', 'EOS/02.830', 'EOS/restrooms 1', 'EOS/restrooms 2',

    // Huygens toilets
    'HG/00.088', 'HG/00.089', 'HG/00.008', 'HG/00.007', 'HG/restrooms 1', 'HG/restrooms 2',
    'HG/01.087', 'HG/01.088', 'HG/01.052', 'HG/01.051', 'HG/01.035', 'HG/01.034', 'HG/01.033', 'HG/01.008', 'HG/01.007',
    'HG/02.087', 'HG/02.088', 'HG/02.057', 'HG/02.058', 'HG/02.035', 'HG/02.034', 'HG/02.033', 'HG/02.008', 'HG/02.007',
    'HG/03.087', 'HG/03.088', 'HG/03.057', 'HG/03.058', 'HG/03.034', 'HG/03.033', 'HG/03.032', 'HG/03.008', 'HG/03.007',

    // Transitorium toilets
    'Transitorium/-1.003', 'Transitorium/-1.005', 'Transitorium/-1.005a', 'Transitorium/-1.005b', 'Transitorium/-1.005c',
    'Transitorium/00.002', 'Transitorium/00.002a', 'Transitorium/00.002b', 'Transitorium/00.003', 'Transitorium/00.003b', 'Transitorium/00.003c', 'Transitorium/00.003d'
]);

const cafeCodes = new Set([
    // EOS food
    'EOS/00.360', 'EOS/01.210',

    // Huygens food
    'HG/00.520', 'HG/00.533', 'HG/00.612'
]);

const lectureHallCodes = new Set([
    // EOS lecture halls
    'EOS/00.289', 'EOS/01.630', 'EOS/01.260', 'EOS/01.044',

    // Huygens lecture halls
    'HG/00.303', 'HG/00.304', 'HG/00.307'
]);

// Initializes the directory with building data and click handler
export function initializeDirectory(buildingData, buildingLayerReference, buildingClickHandler) {
    fullListData = buildingData;
    buildingLayerRef = buildingLayerReference;  // Add this line
    handleBuildingClickCallbackRef = buildingClickHandler;
    requestAnimationFrame(() => {
        populateDropdowns();
    });
}

// Updates the current building and room layer references
export function updateDirectoryState(building, rooms) {
    currentBuildingLayerRef = building;
    currentRoomLayerRef = rooms;
}

// Determines room type based on room properties and codes
function classifyRoom(props) {
    const cacheKey = props.building_code + '/' + props.code;
    if (roomTypeCache.has(cacheKey)) {
        return roomTypeCache.get(cacheKey);
    }

    if (props.facility_type) {
        roomTypeCache.set(cacheKey, props.facility_type);
        return props.facility_type;
    }

    const buildingRoomCode = `${props.building_code}/${props.code?.toLowerCase() || ''}`;

    if (restroomCodes.has(buildingRoomCode)) {
        roomTypeCache.set(cacheKey, 'restroom');
        return 'restroom';
    }

    if (cafeCodes.has(buildingRoomCode)) {
        roomTypeCache.set(cacheKey, 'cafe');
        return 'cafe';
    }

    if (lectureHallCodes.has(buildingRoomCode)) {
        roomTypeCache.set(cacheKey, 'lecturehall');
        return 'lecturehall';
    }

    return null;
}


// Gets building name from building code using cache
function getBuildingName(buildingCode) {
    if (!buildingCode || !fullListData) {
        return null;
    }

    if (buildingNameCache.has(buildingCode)) {
        return buildingNameCache.get(buildingCode);
    }

    const building = fullListData.features.find(feature =>
        feature.properties.type === 'building' &&
        feature.properties.code === buildingCode
    );

    const name = building ? building.properties.name : buildingCode;
    buildingNameCache.set(buildingCode, name);
    return name;
}

// Populates dropdown menus with buildings grouped by type
function populateDropdowns() {
    if (!fullListData) {
        return;
    }

    const buildingsByType = {
        cafe: new Set(),
        restroom: new Set(),
        lecturehall: new Set()
    };


    const rooms = fullListData.features.filter(feature => feature.properties.type === 'room');

    for (let i = 0; i < rooms.length; i++) {
        const feature = rooms[i];
        const props = feature.properties;
        const type = classifyRoom(props);
        const name = getBuildingName(props.building_code);

        if (buildingsByType[type] && name) {
            buildingsByType[type].add(name);
        }
    }

    const categories = document.querySelectorAll('.category');
    categories.forEach(category => {
        const type = category.dataset.type;
        const buildings = Array.from(buildingsByType[type] || []).sort();

        const dropdown = category.querySelector('.room-dropdown');
        if (dropdown) {
            const fragment = document.createDocumentFragment();

            for (let i = 0; i < buildings.length; i++) {
                const building = buildings[i];
                const div = document.createElement('div');
                div.className = 'room-dropdown-item';
                div.textContent = building;
                div.setAttribute('data-type', type);
                div.setAttribute('data-building', building);
                div.addEventListener('click', function () {
                    selectBuilding(type, building, this);
                });
                fragment.appendChild(div);
            }

            dropdown.innerHTML = '';
            dropdown.appendChild(fragment);
        }
    });
}

// Toggles visibility of dropdown menu
export function toggleDropdown(header) {
    const dropdown = header.parentElement.querySelector('.room-dropdown');
    const isActive = dropdown.classList.contains('show');

    document.querySelectorAll('.room-dropdown.show').forEach(d => {
        d.classList.remove('show');
    });

    if (!isActive) {
        dropdown.classList.add('show');
    }
}

// Handles building selection in dropdown menu
export function selectBuilding(type, name, element) {
    const category = element.closest('.category');
    const label = category.querySelector('.selected-building');
    const dropdown = category.querySelector('.room-dropdown');

    if (element.classList.contains('selected')) {
        element.classList.remove('selected');
        label.textContent = '';
        dropdown.classList.remove('show');
        clearSpecificTypeHighlights(type);
        return;
    }

    // Check if user is selecting a different building
    const currentBuilding = getCurrentlySelectedBuilding();
    if (currentBuilding && currentBuilding !== name) {
        // Clear all selections when switching buildings
        document.querySelectorAll('.selected-building').forEach(l => {
            l.textContent = '';
        });
        document.querySelectorAll('.room-dropdown-item').forEach(i => {
            i.classList.remove('selected');
        });
        clearAllSelections();
    }

    element.classList.add('selected');
    label.textContent = ` ${name}`;
    dropdown.classList.remove('show');

    // Go to the selected building first
    goToBuilding(name);

    // Then highlight the room type after a delay
    setTimeout(() => {
        highlightRoomsInCurrentBuilding(type);
    }, 300);
}

// Centers map view on selected building
function goToBuilding(buildingName) {
    if (!buildingLayerRef || !handleBuildingClickCallbackRef) {
        console.error('Building layer or click handler not available');
        return;
    }

    let found = false;
    buildingLayerRef.eachLayer(layer => {
        if (found) return;

        if (layer.feature &&
            layer.feature.properties.type === 'building' &&
            layer.feature.properties.name === buildingName &&
            layer.feature.properties.floor === 0) {

            // Trigger the building click
            layer.fire('click');
            found = true;
        }
    });

    if (!found) {
        console.warn(`Building "${buildingName}" not found`);
    }
}

// Highlights rooms of selected type in current building
function highlightRoomsInCurrentBuilding(type) {
    if (!currentBuildingLayerRef || !currentRoomLayerRef) {
        return;
    }

    const colors = {
        cafe: '#f39c12',
        lecturehall: '#2ecc71',
        restroom: '#9b59b6'
    };

    // Get the current building name
    const currentBuildingName = currentBuildingLayerRef.feature.properties.name;

    // Get selected building from directory
    const selectedBuildingName = getCurrentlySelectedBuilding();

    // Only highlight if we're in the selected building
    if (currentBuildingName !== selectedBuildingName) {
        return;
    }

    const selectedTypes = new Set();
    document.querySelectorAll('.room-dropdown-item.selected').forEach(item => {
        const selectedBuildingFromItem = item.textContent;
        // Only count selections for the current building
        if (selectedBuildingFromItem === currentBuildingName) {
            selectedTypes.add(item.closest('.category').dataset.type);
        }
    });

    if (selectedTypes.size === 0) return;

    const currentSelectedRoom = getCurrentlySelectedRoom();

    currentRoomLayerRef.eachLayer(layer => {
        if (!layer.feature || layer.feature.properties.type !== 'room') {
            return;
        }

        const roomType = classifyRoom(layer.feature.properties);
        const shouldHighlight = selectedTypes.has(roomType);

        if (layer === currentSelectedRoom) return;

        if (shouldHighlight) {
            const color = colors[roomType] || '#3498db';

            layer.setStyle({
                color: color,
                weight: 1,
                fillColor: color,
                fillOpacity: 0.7
            });

            layer._isHighlighted = true;
            layer._highlightType = roomType;
            layer._highlightColor = color;
        } else if (layer._isHighlighted) {
            layer.setStyle({
                color: '#797777',
                weight: 1,
                fillColor: '#797777',
                fillOpacity: 0.3
            });

            layer._isHighlighted = false;
            delete layer._highlightType;
            delete layer._highlightColor;
        }
    });
}

// Clears highlights for rooms of a specific type
function clearSpecificTypeHighlights(type) {
    if (!currentBuildingLayerRef || !currentRoomLayerRef) {
        return;
    }

    const selectedTypes = new Set();
    document.querySelectorAll('.room-dropdown-item.selected').forEach(item => {
        const selectedType = item.closest('.category').dataset.type;
        if (selectedType !== type) {
            selectedTypes.add(selectedType);
        }
    });

    const currentSelectedRoom = getCurrentlySelectedRoom();

    currentRoomLayerRef.eachLayer(layer => {
        if (!layer.feature ||
            layer.feature.properties.type !== 'room' ||
            layer === currentSelectedRoom) {
            return;
        }

        const roomType = classifyRoom(layer.feature.properties);
        if (roomType === type) {
            const shouldKeepHighlight = selectedTypes.has(roomType);

            if (!shouldKeepHighlight && layer._isHighlighted) {
                layer.setStyle({
                    color: '#797777',
                    weight: 1,
                    fillColor: '#797777',
                    fillOpacity: 0.3
                });

                layer._isHighlighted = false;
                delete layer._highlightType;
                delete layer._highlightColor;
            }
        }
    });
}

// Returns currently selected building name
function getCurrentlySelectedBuilding() {
    const selected = document.querySelector('.room-dropdown-item.selected');
    return selected ? selected.textContent : null;
}

// Clears all room selections and highlights
export function clearAllSelections() {
    document.querySelectorAll('.selected-building').forEach(label => {
        label.textContent = '';
    });

    document.querySelectorAll('.room-dropdown-item').forEach(item => {
        item.classList.remove('selected');
    });

    document.querySelectorAll('.room-dropdown').forEach(dropdown => {
        dropdown.classList.remove('show');
    });

    if (currentRoomLayerRef) {
        currentRoomLayerRef.eachLayer(layer => {
            if (layer.feature && layer.feature.properties.type === 'room') {
                layer.setStyle({
                    color: '#797777',
                    weight: 1,
                    fillColor: '#797777',
                    fillOpacity: 0.3
                });
                layer._isHighlighted = false;
                delete layer._highlightType;
                delete layer._highlightColor;
            }
        });
    }
}

// Returns currently selected room
function getCurrentlySelectedRoom() {
    if (currentRoomLayerRef) {
        let selectedRoom = null;
        currentRoomLayerRef.eachLayer(layer => {
            if (layer._isCurrentRoom) {
                selectedRoom = layer;
            }
        });
        return selectedRoom;
    }
    return null;
}


// Restores room highlights after state changes
export function restoreRoomHighlights() {
    const selectedItems = document.querySelectorAll('.room-dropdown-item.selected');
    if (selectedItems.length > 0) {
        setTimeout(() => {
            const types = new Set();
            selectedItems.forEach(item => {
                types.add(item.closest('.category').dataset.type);
            });

            types.forEach(type => {
                highlightRoomsInCurrentBuilding(type);
            });
        }, 200);
    }
}

// Sets up event handlers on page load
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', () => toggleDropdown(header));
    });

    window.toggleDropdown = undefined;
    window.selectBuilding = undefined;

    window.fullList = () => fullListData;
    window.currentBuildingLayer = () => currentBuildingLayerRef;
    window.currentRoomLayer = () => currentRoomLayerRef;
});