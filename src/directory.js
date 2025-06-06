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
    '00.42', '00.42a', '00.42b', '00.43', '00.43a', '00.43b', '00.44',
    '01.25', '01.26', '01.24', '01.24a', '01.24b',
    '02.22', '02.22c', '02.22d', '02.21', '02.21a', '02.21b',
    '03.26', '03.26c', '03.26d', '03.23', '03.23a', '03.23b',
    '04.25', '04.25c', '04.25d', '04.24', '04.24a', '04.24b',
    '05.28', '05.28c', '05.28d', '05.27', '05.27a', '05.27b',
    '06.26', '06.26c', '06.26d', '06.25', '06.25a', '06.25b',
    '00.850', '00.840', '00.830', '00.820', '00.866',
    '01.850', '01.840', '01.860', '01.830', '01.820',
    '02.810', '02.820', '02.830',
    '00.088', '00.089', '00.008', '00.007',
    '01.087', '01.088', '01.052', '01.051', '01.035', '01.034', '01.033', '01.008', '01.007',
    '02.087', '02.088', '02.057', '02.058', '02.035', '02.034', '02.033', '02.008', '02.007',
    '03.087', '03.088', '03.057', '03.058', '03.034', '03.033', '03.032', '03.008', '03.007',
    'restrooms', '-1.003', '-1.005', '-1.005A', '-1.005B', '-1.005C', '00.002', '00.002A',
    '00.002B', '00.003', '00.003B', '00.003C', '00.003D'
]);
const cafeCodes = new Set([
    '00.520', '00.533', '00.612', '00.360', '01.210'
]);
const lectureHallCodes = new Set([
    '00.303', '00.304', '00.307', '00.289', '01.630', '01.260', '01.044'
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

    let code = props.code ? props.code.toLowerCase() : '';

    if (restroomCodes.has(code)) {
        roomTypeCache.set(cacheKey, 'restroom');
        return 'restroom';
    }

    if (cafeCodes.has(code)) {
        roomTypeCache.set(cacheKey, 'cafe');
        return 'cafe';
    }

    if (lectureHallCodes.has(code)) {
        roomTypeCache.set(cacheKey, 'lecturehall');
        return 'lecturehall';
    }

    // Default to null
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