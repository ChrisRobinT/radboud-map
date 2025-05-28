const isMobile = window.innerWidth <= 768;

const desktopBounds = L.latLngBounds(
    [51.815, 5.844],  // South-West corner
    [51.828, 5.88]   // North-East corner
);

const mobileBounds = L.latLngBounds(
    [51.81, 5.844],  // South-West corner
    [51.83, 5.88]   // North-East corner
);

const smoothRenderer = L.canvas({
  padding: 1.0
});

const maxZoom = 21;
const desktopMinZoom = 16;
const mobileMinZoom = 15;

const map = L.map('map', {
  maxBounds: isMobile ? mobileBounds : desktopBounds,
  renderer: smoothRenderer,
  maxBoundsViscosity: 1.0,
  maxZoom: maxZoom,
  minZoom: isMobile ? mobileMinZoom : desktopMinZoom
}).setView([51.8215, 5.8637], (isMobile ? mobileMinZoom : desktopMinZoom));

const buildingLayer = L.featureGroup().addTo(map);

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
let current_room = null;

fetch('data/buildings.geojson')
    .then(response => response.json())
    .then(data => {
      fullList = data;
      L.geoJSON(fullList, {
        filter: function(feature){
          return feature.properties.type === "building" && feature.properties.floor === 0;
        },

        style: { // Default building style
          color: '#e3000b',
          weight: 1,
          fillColor: '#e3000b',
          fillOpacity: 0.5
        },

        onEachFeature: function (feature, layer) {
          layer.on('click', function() { // User clicks on something on the map
            const props = this.feature.properties;


            updateInfoPanel(`<strong>${props.name}</strong><br>
            Floor ${props.floor}<br>
            Code: ${props.code || "N/A"}`);

            if(roomLayer && current_building !== this){ // If there is a room layer currently displayed, remove it
              map.removeLayer(roomLayer);
            }

            if(current_building !== this){ // If the building currently in focus is not the thing that is clicked on, or none is in focus...
              updateInfoPanel(`<strong>${props.name}</strong><br>
              Floor ${props.floor}<br>
              Code: ${props.code || "N/A"}`);
              
              map.dragging.disable();
              map.flyToBounds(layer.getBounds(), {animate: true, duration: 0.6, maxZoom: 19});

              map.once('zoomend', () => {
                map.dragging.enable();
              });


              if(current_building){ // If there is a building currently in focus, set it back to its default style
                current_building.setStyle({
                  color: '#e3000b',
                  weight: 1,
                  fillColor: '#e3000b',
                  fillOpacity: 0.5
                });
              }

              this.setStyle({
                color: '#e3000b',
                weight: 1,
                fillColor: '#fbf7f5',
                fillOpacity: 1
              });

              roomLayer = L.geoJSON(fullList, {
                filter: function(room_feature){
                  return room_feature.properties.type === "room" && room_feature.properties.building_code === props.code && room_feature.properties.floor === props.floor;
                },
                style: { // Default room style
                  color: '#797777',
                  weight: 1,
                  fillColor: '#797777',
                  fillOpacity: 0.3
                },

                onEachFeature: function (room_feature, room_layer){
                  room_layer.on('click', function(e) {
                        const room_props = e.target.feature.properties;

                        updateInfoPanel(`<strong>${props.name}</strong><br>
                        Floor ${props.floor}<br>
                        Code: ${(room_props.building_code + " " + room_props.code) || "N/A"}`);

                        if(current_room){ // If there is a room currently displayed, set it back to its default style
                          current_room.setStyle({
                            color: '#797777',
                            weight: 1,
                            fillColor: '#797777',
                            fillOpacity: 0.3
                          });
                        }

                        if (current_room !== this){ // If the room currently in focus is not the room that is clicked on, or none is in focus...

                          const layer = this;
                          layer.setStyle({
                            color: '#cf3d2b',
                            weight: 1,
                            fillColor: '#cf3d2b',
                            fillOpacity: 1
                          });
                          current_room = this;
                        } else { // The case that the room currently in focus is the room that is clicked on
                          updateInfoPanel(`<strong>${props.name}</strong><br>
                          Floor ${props.floor}<br>
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
          buildingLayer.addLayer(layer); 
        }
      })

      map.on('zoomend', function () {
        const zoom = map.getZoom();

        if (zoom <= 16 && roomLayer && current_building) {
          map.removeLayer(roomLayer);
          current_building.setStyle({
            color: '#e3000b',
            weight: 1,
            fillColor: '#e3000b',
            fillOpacity: 0.5
          });
          updateInfoPanel(null);
          current_building = null;
        }
      });

      function setUpDownButtons() {
        if (fullList.features.find(feature => feature.properties.name === current_building.feature.properties.name && feature.properties.floor === current_building.feature.properties.floor+1)) {
          upButton.disabled = false;
        } else {
          upButton.disabled = true;
        }

        if (fullList.features.find(feature => feature.properties.name === current_building.feature.properties.name && feature.properties.floor === current_building.feature.properties.floor-1)) {
          downButton.disabled = false;
        } else {
          downButton.disabled = true;
        }
      }


      /* Floor change functionality */
      function floorChange(change) {
        if (change === 0) return;

        // if(current_room){ // If there is a room currently displayed, set it back to its default style
        //   current_room.setStyle({
        //     color: '#797777',
        //     weight: 1,
        //     fillColor: '#797777',
        //     fillOpacity: 0.3
        //   });
        //   current_room = null;
        // }

        map.removeLayer(roomLayer);

        buildingLayer.eachLayer(function(layer) {
          if (layer.feature && layer.feature.properties.name === current_building.feature.properties.name) {
            buildingLayer.removeLayer(layer);
          }
        });

        const targetBuilding = fullList.features.find(feature =>
          feature.properties.type === "building" &&
          feature.properties.name === current_building.feature.properties.name &&
          feature.properties.floor === current_building.feature.properties.floor + change
        );

        if (targetBuilding) {
          L.geoJSON(targetBuilding, {
            style: { // Default building style
              color: '#e3000b',
              weight: 1,
              fillColor: '#e3000b',
              fillOpacity: 0.5
            },

            onEachFeature: function (feature, layer) {
              layer.on('click', function() { // User clicks on something on the map
                const props = this.feature.properties;
                
                updateInfoPanel(`<strong>${props.name}</strong><br>
                Floor ${props.floor}<br>
                Code: ${props.code || "N/A"}`);

                if(roomLayer && current_building !== this){ // If there is a room layer currently displayed, remove it
                  map.removeLayer(roomLayer);
                }

                if(current_building !== this){ // If the building currently in focus is not the thing that is clicked on, or none is in focus...
                  updateInfoPanel(`<strong>${props.name}</strong><br>
                  Floor ${props.floor}<br>
                  Code: ${props.code || "N/A"}`);

                  if (!current_building || props.name !== current_building.feature.properties.name) {
                    map.dragging.disable();
                    map.flyToBounds(layer.getBounds(), {animate: true, duration: 0.6, maxZoom: 19});

                    map.once('zoomend', () => {
                      map.dragging.enable();
                    });
                  }

                  if(current_building){ // If there is a building currently in focus, set it back to its default style
                    current_building.setStyle({
                      color: '#e3000b',
                      weight: 1,
                      fillColor: '#e3000b',
                      fillOpacity: 0.5
                    });
                  }

                  this.setStyle({
                    color: '#e3000b',
                    weight: 1,
                    fillColor: '#fbf7f5',
                    fillOpacity: 1
                  });

                  roomLayer = L.geoJSON(fullList, {
                    filter: function(room_feature){
                      return room_feature.properties.type === "room" && room_feature.properties.building_code === props.code && room_feature.properties.floor === props.floor;
                    },
                    style: { // Default room style
                      color: '#797777',
                      weight: 1,
                      fillColor: '#797777',
                      fillOpacity: 0.3
                    },

                    onEachFeature: function (room_feature, room_layer){
                      room_layer.on('click', function(e) {
                            const room_props = e.target.feature.properties;

                            updateInfoPanel(`<strong>${props.name}</strong><br>
                            Floor ${props.floor}<br>
                            Code: ${(room_props.building_code + " " + room_props.code) || "N/A"}`);

                            if(current_room){ // If there is a room currently displayed, set it back to its default style
                              current_room.setStyle({
                                color: '#797777',
                                weight: 1,
                                fillColor: '#797777',
                                fillOpacity: 0.3
                              });
                            }

                            if (current_room !== this){ // If the room currently in focus is not the room that is clicked on, or none is in focus...

                              const layer = this;
                              layer.setStyle({
                                color: '#cf3d2b',
                                weight: 1,
                                fillColor: '#cf3d2b',
                                fillOpacity: 1
                              });
                              current_room = this;
                            } else { // The case that the room currently in focus is the room that is clicked on
                              updateInfoPanel(`<strong>${props.name}</strong><br>
                              Floor ${props.floor}<br>
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
              buildingLayer.addLayer(layer);
              targetLayer = layer;
            }
          })
        }

        if (targetLayer) {
          targetLayer.fire('click');
        }

        

        // current_building = fullList.features.find(feature => feature.properties.name === current_building.properties.name && feature.properties.floor === current_building.properties.floor+change);

        // updateInfoPanel(`<strong>${current_building.properties.name}</strong><br>
        // Floor ${current_building.properties.floor}<br>
        // Code: ${current_building.properties.code || "N/A"}`);

        // roomLayer = L.geoJSON(fullList, {
        //   filter: function(room_feature){
        //     return room_feature.properties.type === "room" && room_feature.properties.building_code === current_building.properties.code && room_feature.properties.floor === current_building.properties.floor;
        //   },
        //   style: { // Default room style
        //     color: '#797777',
        //     weight: 1,
        //     fillColor: '#797777',
        //     fillOpacity: 0.3
        //   },
          
        //   onEachFeature: function (room_feature, room_layer){
        //     room_layer.on('click', function(){ // The thing the user clicked on was a room
        //         const room_props = this.feature.properties;

        //         updateInfoPanel(`<strong>${current_building.properties.name}</strong><br>
        //         Floor ${current_building.properties.floor}<br>
        //         Code: ${(room_props.building_code + " " + room_props.code) || "N/A"}`);

        //         if(current_room){ // If there is a room currently displayed, set it back to its default style
        //           current_room.setStyle({
        //             color: '#797777',
        //             weight: 1,
        //             fillColor: '#797777',
        //             fillOpacity: 0.3
        //           });
        //         }

        //         if (current_room !== this){ // If the room currently in focus is not the room that is clicked on, or none is in focus...

        //           this.setStyle({
        //             color: '#e3000b',
        //             weight: 1,
        //             fillColor: '#e3000b',
        //             fillOpacity: 1
        //           });
        //           current_room = this;
        //         } else { // The case that the room currently in focus is the room that is clicked on
        //           updateInfoPanel(`<strong>${current_building.properties.name}</strong><br>
        //           Floor ${current_building.properties.floor}<br>
        //           Code: ${current_building.properties.code || "N/A"}`);

        //           current_room = null;
        //         }
        //       }
        //     )
        //   }
        // }).addTo(map);
        // setUpDownButtons();
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
      const floorSelect = document.getElementById('floorSelect');

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
          infoPanel.style.display = 'block';
          floorSelect.style.display = 'flex';
          infoPanel.innerHTML = content;
        } else {
          infoPanel.style.display = 'none';
          floorSelect.style.display = 'none';
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
            ((feature.properties.building_code || '') + " " + (feature.properties.code || '')).toLowerCase().includes(query) ||
            ((feature.properties.building_code || '') + (feature.properties.code || '')).toLowerCase().includes(query)
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
          if (feature.properties.floor === 0) {
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
          }
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

            //Change the floor if needed
            floorChange(feature.properties.floor - current_building.feature.properties.floor);

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