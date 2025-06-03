import {
    PLUS_BUTTON_ID,
    MINUS_BUTTON_ID,
    MIN_ZOOM,
    MAX_ZOOM,
    UP_BUTTON_ID,
    DOWN_BUTTON_ID,
    SEARCH_INPUT_ID,
    SEARCH_RESULTS_ID
} from './config.js';

// ZOOM CONTROLS

export function setupZoomControls(map) {
    const plusButton  = document.getElementById(PLUS_BUTTON_ID);
    const minusButton = document.getElementById(MINUS_BUTTON_ID);

    map.zoomControl.remove();

    plusButton.addEventListener('click', () => {
        map.zoomIn();
    });
    minusButton.addEventListener('click', () => {
        map.zoomOut();
    });

    map.on('zoomend', () => {
        const zoom = map.getZoom();
        plusButton.disabled  = (zoom === MAX_ZOOM);
        minusButton.disabled = (zoom === MIN_ZOOM);
    });

    const initialZoom = map.getZoom();
    plusButton.disabled  = (initialZoom === MAX_ZOOM);
    minusButton.disabled = (initialZoom === MIN_ZOOM);
}

// FLOOR CHANGE

export function setupFloorButtons(onFloorUp, onFloorDown) {
    const upButton   = document.getElementById(UP_BUTTON_ID);
    const downButton = document.getElementById(DOWN_BUTTON_ID);

    upButton.addEventListener('click', () => {
        onFloorUp();
    });
    downButton.addEventListener('click', () => {
        onFloorDown();
    });
}

// SEARCH

export function setupSearch(fullList, map, onBuildingSelect, onRoomSelect) {
    const searchInput   = document.getElementById(SEARCH_INPUT_ID);
    const searchResults = document.getElementById(SEARCH_RESULTS_ID);

    // Show results list when input is focused (and non-empty)
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim() !== '') {
            searchResults.style.display = 'block';
        }
    });

    // Hide results when clicking outside the input or results
    document.addEventListener('click', (e) => {
        if (
            !searchInput.contains(e.target) &&
            !searchResults.contains(e.target)
        ) {
            searchResults.style.display = 'none';
        }
    });

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        searchResults.innerHTML = '';

        if (!query) {
            searchResults.style.display = 'none';
            return;
        }
        searchResults.style.display = 'block';

        // Find matches in fullList.features by name or building_code+code
        const matches = fullList.features.filter((feature) => {
            const nameMatch = feature.properties.name?.toLowerCase().includes(query);
            const codeConcat =
                (feature.properties.building_code || '') +
                (feature.properties.code || '');
            const codeMatch = codeConcat.toLowerCase().includes(query);
            return nameMatch || codeMatch;
        });

        if (matches.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No results found';
            li.style.fontStyle = 'italic';
            li.style.color = '#999';
            searchResults.appendChild(li);
            return;
        }

        // Separate into buildings vs. rooms
        const buildings = matches.filter(
            (f) => f.properties.type === 'building' && f.properties.floor === 0
        );
        const rooms = matches.filter((f) => f.properties.type === 'room');

        // Sort buildings by relevance
        buildings.sort((a, b) => {
            const aName = a.properties.name.toLowerCase();
            const bName = b.properties.name.toLowerCase();
            const aStarts = aName.startsWith(query);
            const bStarts = bName.startsWith(query);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return aName.localeCompare(bName);
        });

        // Add building results
        buildings.forEach((feature) => {
            const li = document.createElement('li');
            li.textContent = feature.properties.name;
            li.addEventListener('click', () => {
                searchResults.style.display = 'none';
                searchInput.value = feature.properties.name;
                onBuildingSelect(feature.properties);
            });
            searchResults.appendChild(li);
        });

        // Add room results
        rooms.forEach((feature) => {
            const li = document.createElement('li');
            const roomCode =
                `${feature.properties.building_code} ${feature.properties.code}`;
            li.textContent = roomCode;
            li.addEventListener('click', () => {
                searchResults.style.display = 'none';
                searchInput.value = roomCode;
                onRoomSelect(feature.properties);
            });
            searchResults.appendChild(li);
        });
    });
}
