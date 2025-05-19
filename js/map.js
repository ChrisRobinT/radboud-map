const bounds = L.latLngBounds(
    [51.815, 5.844],  // South-West corner
    [51.828, 5.88]   // North-East corner
);

const smoothRenderer = L.canvas({
  padding: 1.0
});

const maxZoom = 21;
const minZoom = 16;

const map = L.map('map', {
  maxBounds: bounds,
  renderer: smoothRenderer,
  maxBoundsViscosity: 1.0,
  maxZoom: maxZoom,
  minZoom: minZoom
}).setView([51.8215, 5.8620], 16);

map.zoomControl.remove();

const plusButton = document.getElementById('plusButton');
const minusButton = document.getElementById('minusButton');

plusButton.addEventListener('click', () => {
  map.zoomIn();
});

minusButton.addEventListener('click', () => {
  map.zoomOut();
});

map.on('zoomend', function () {
  if (map.getZoom() === maxZoom) {
    plusButton.disabled = true;
  } else {
    plusButton.disabled = false;
  }

  if (map.getZoom() === minZoom) {
    minusButton.disabled = true;
  } else {
    minusButton.disabled = false;
  }
});

L.tileLayer('https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png', {
  maxZoom: 21,
  attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; OpenMapTiles &copy; OpenStreetMap contributors',
  keepBuffer: 4,
  edgeBufferTiles: 3,
  edgeBufferPx: 1000,
  updateWhenIdle: false,
  updateWhenZooming: true
}).addTo(map);

const upButton = document.getElementById('upButton');
const downButton = document.getElementById('downButton');

let fullList;
let roomLayer;
let current_building = null;
let current_floor = null;
let current_room = null;

function setUpDownButtons() {
  if (current_building.feature.properties.floors.includes(current_floor+1)) {
    upButton.disabled = false;
  } else {
    upButton.disabled = true;
  }

  if (current_building.feature.properties.floors.includes(current_floor-1)) {
    downButton.disabled = false;
  } else {
    downButton.disabled = true;
  }
}

fetch('data/buildings.geojson')
    .then(response => response.json())
    .then(data => {
      fullList = data;
      L.geoJSON(fullList, {
        filter: function(feature){
          return feature.properties.type === "building";
        },

        style: { // Default building style
          color: '#e74c3c',
          weight: 2,
          fillColor: '#e74c3c',
          fillOpacity: 0.3
        },

        onEachFeature: function (feature, layer) {
          layer.on('click', function() { // User clicks on something on the map
            const props = this.feature.properties;

            updateInfoPanel(`<strong>${props.name}</strong><br>
            Floor ${current_floor}<br>
            Code: ${props.code || "N/A"}`);

            if(roomLayer && current_building !== this){ // If there is a room layer currently displayed, remove it
              map.removeLayer(roomLayer);
            }

            if(current_building !== this){ // If the building currently in focus is not the thing that is clicked on, or none is in focus...
              current_floor = 0;
              updateInfoPanel(`<strong>${props.name}</strong><br>
              Floor ${current_floor}<br>
              Code: ${props.code || "N/A"}`);
              
              map.dragging.disable();

              map.flyToBounds(layer.getBounds(), {animate: true, duration: 0.6, maxZoom: 19});

              map.once('moveend', () => {
                map.dragging.enable();
              });

              if(current_building){ // If there is a building currently in focus, set it back to its default style
                current_building.setStyle({
                  color: '#e74c3c',
                  weight: 2,
                  fillColor: '#e74c3c',
                  fillOpacity: 0.3
                });
              }

              this.setStyle({
                color: '#e74c3c',
                weight: 2,
                fillColor: 'white',
                fillOpacity: 1
              });

              roomLayer = L.geoJSON(fullList, {
                filter: function(room_feature){
                  return room_feature.properties.type === "room" && room_feature.properties.building_code === props.code && room_feature.properties.floor === current_floor;
                },
                style: { // Default room style
                  color: '#7f8c8d',
                  weight: 1,
                  fillColor: '#7f8c8d',
                  fillOpacity: 0.3
                },

                onEachFeature: function (room_feature, room_layer){
                  room_layer.on('click', function(e){ // The thing the user clicked on was a room
                        const room_props = this.feature.properties;

                        updateInfoPanel(`<strong>${props.name}</strong><br>
                        Floor ${current_floor}<br>
                        Code: ${(room_props.building_code + " " + room_props.code) || "N/A"}`);

                        if(current_room){ // If there is a room currently displayed, set it back to its default style
                          current_room.setStyle({
                            color: '#7f8c8d',
                            weight: 1,
                            fillColor: '#7f8c8d',
                            fillOpacity: 0.3
                          });
                        }

                        if (current_room !== this){ // If the room currently in focus is not the room that is clicked on, or none is in focus...

                          this.setStyle({
                            color: '#e74c3c',
                            weight: 1,
                            fillColor: '#e74c3c',
                            fillOpacity: 1
                          });
                          current_room = this;
                        } else { // The case that the room currently in focus is the room that is clicked on
                          updateInfoPanel(`<strong>${props.name}</strong><br>
                          Floor ${current_floor}<br>
                          Code: ${props.code || "N/A"}`);

                          current_room = null;
                        }
                      }
                  )
                }
              }).addTo(map);

              current_building = this;
              setUpDownButtons();
            }
          });
        }
      }).addTo(map);

      map.on('zoomend', function () {
        const zoom = map.getZoom();

        if (zoom <= 16 && map.hasLayer(roomLayer)) {
          map.removeLayer(roomLayer);
          current_building.setStyle({
            color: '#e74c3c',
            weight: 2,
            fillColor: '#e74c3c',
            fillOpacity: 0.3
          });
          current_building = null;
          current_floor = null;
        }
      });



      /* Floor change functionality */
      function floorChange(change) {
        if(current_room){ // If there is a room currently displayed, set it back to its default style
          current_room.setStyle({
            color: '#7f8c8d',
            weight: 1,
            fillColor: '#7f8c8d',
            fillOpacity: 0.3
          });
          current_room = null;
        }

        map.removeLayer(roomLayer);
        current_floor = current_floor + change;

        updateInfoPanel(`<strong>${current_building.feature.properties.name}</strong><br>
        Floor ${current_floor}<br>
        Code: ${current_building.feature.properties.code || "N/A"}`);

        roomLayer = L.geoJSON(fullList, {
          filter: function(room_feature){
            return room_feature.properties.type === "room" && room_feature.properties.building_code === current_building.feature.properties.code && room_feature.properties.floor === current_floor;
          },
          style: { // Default room style
            color: '#7f8c8d',
            weight: 1,
            fillColor: '#7f8c8d',
            fillOpacity: 0.3
          },
          
          onEachFeature: function (room_feature, room_layer){
            room_layer.on('click', function(e){ // The thing the user clicked on was a room
                const room_props = this.feature.properties;

                updateInfoPanel(`<strong>${current_building.feature.properties.name}</strong><br>
                Floor ${current_floor}<br>
                Code: ${(room_props.building_code + " " + room_props.code) || "N/A"}`);

                if(current_room){ // If there is a room currently displayed, set it back to its default style
                  current_room.setStyle({
                    color: '#7f8c8d',
                    weight: 1,
                    fillColor: '#7f8c8d',
                    fillOpacity: 0.3
                  });
                }

                if (current_room !== this){ // If the room currently in focus is not the room that is clicked on, or none is in focus...

                  this.setStyle({
                    color: '#e74c3c',
                    weight: 1,
                    fillColor: '#e74c3c',
                    fillOpacity: 1
                  });
                  current_room = this;
                } else { // The case that the room currently in focus is the room that is clicked on
                  updateInfoPanel(`<strong>${current_building.feature.properties.name}</strong><br>
                  Floor ${current_floor}<br>
                  Code: ${current_building.feature.properties.code || "N/A"}`);

                  current_room = null;
                }
              }
            )
          }
        }).addTo(map);
        setUpDownButtons();
      }

      upButton.addEventListener('click', function() {
        floorChange(1);
      });


      downButton.addEventListener('click', function() {
        floorChange(-1);
      });



      /* Search functionality */
      const searchInput = document.getElementById('search');
      const searchResults = document.getElementById('searchResults');
      const buildingTools = document.getElementById('buildingTools');
      const infoPanel = document.getElementById('infoPanel');

      // Show search results when input is focused
      searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim() !== '') {
          searchResults.style.display = 'block';
        }
      });

      // Hide search results when clicking outside
      document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
          searchResults.style.display = 'none';
        }
      });

      // Update infoPanel display
      function updateInfoPanel(content) {
        if (content) {
          buildingTools.style.display = 'flex';
          infoPanel.innerHTML = content;
        } else {
          buildingTools.style.display = 'none';
        }
      }

      // Handle search input
      searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        searchResults.innerHTML = '';

        if (!query) {
          searchResults.style.display = 'none';
          return;
        }

        searchResults.style.display = 'block';

        const matches = fullList.features.filter(feature =>
            (feature.properties.name && feature.properties.name.toLowerCase().includes(query)) ||
            ((feature.properties.building_code || '') + " " + (feature.properties.code || '')).toLowerCase().includes(query)
        );

        if (matches.length === 0) {
          const li = document.createElement('li');
          li.textContent = 'No results found';
          li.style.fontStyle = 'italic';
          li.style.color = '#999';
          searchResults.appendChild(li);
          return;
        }

        // Display buildings first, then rooms
        const buildings = matches.filter(feature => feature.properties.type === 'building');
        const rooms = matches.filter(feature => feature.properties.type === 'room');

        // Sort by relevance (starting with the query gets priority)
        buildings.sort((a, b) => {
          const aName = a.properties.name.toLowerCase();
          const bName = b.properties.name.toLowerCase();

          const aStartsWith = aName.startsWith(query);
          const bStartsWith = bName.startsWith(query);

          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;
          return aName.localeCompare(bName);
        });

        // Add buildings
        buildings.forEach(feature => {
          const li = document.createElement('li');
          li.textContent = feature.properties.name;
          li.addEventListener('click', function() {
            searchResults.style.display = 'none';
            searchInput.value = feature.properties.name;
            map.eachLayer(layer => {
              if (layer.feature && layer.feature.properties.type === 'building' &&
                  layer.feature.properties.code === feature.properties.code) {
                layer.fire('click');
              }
            });
          });
          searchResults.appendChild(li);
        });

        // Add rooms
        rooms.forEach(feature => {
          const li = document.createElement('li');
          const roomCode = (feature.properties.building_code || '') + " " + (feature.properties.code || '');
          li.textContent = roomCode;
          li.addEventListener('click', function() {
            searchResults.style.display = 'none';
            searchInput.value = roomCode;

            // First click on the building if needed
            map.eachLayer(layer => {
              if (layer.feature && layer.feature.properties.type === 'building' &&
                  layer.feature.properties.code === feature.properties.building_code &&
                  (!current_building || (current_building && current_building.feature.properties.code !== feature.properties.building_code))) {
                layer.fire('click');
              }
            });

            // Then click on the room
            setTimeout(() => {
              map.eachLayer(layer => {
                if (layer.feature && layer.feature.properties.type === 'room' &&
                    layer.feature.properties.code === feature.properties.code) {
                  layer.fire('click');
                }
              });
            }, 100); // Small delay to ensure building click completes first
          });
          searchResults.appendChild(li);
        });
      });

    }).catch(error => console.error('Error loading GeoJSON:', error));