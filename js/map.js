const bounds = L.latLngBounds(
  [51.815, 5.844],  // South-West corner
  [51.828, 5.88]   // North-East corner
);

const map = L.map('map', {
  maxBounds: bounds,
  maxBoundsViscosity: 1.0,
  maxZoom: 21,
  minZoom: 15
}).setView([51.8215, 5.8620], 16);

L.tileLayer('https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png', {
  maxZoom: 21,
  attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; OpenMapTiles &copy; OpenStreetMap contributors'
}).addTo(map);


let fullList;
let roomLayer;
let current_building = null;


fetch('data/buildings.geojson')
  .then(response => response.json())
  .then(data => {
    fullList = data;
    L.geoJSON(fullList, {
      filter: function(feature){
        return feature.properties.type === "building";
      },

      style: { // Default building style
        color: 'red',     
        weight: 2,
        fillColor: 'red',
        fillOpacity: 0.3  
      },

      onEachFeature: function (feature, layer) {
        layer.on('click', function() { // User clicks on something on the map
            const props = this.feature.properties;
            
            document.getElementById('infoPanel').innerHTML = 
            `<strong>${props.name}</strong><br>
            Code: ${props.code || "N/A"}`;

            if(roomLayer && current_building !== this){ // If there is a room layer currently displayed, remove it
              map.removeLayer(roomLayer);
            }


            if(current_building !== this){ // If the building currently in focus is not the thing that is clicked on, or none is in focus...
              map.fitBounds(layer.getBounds(), {maxZoom: 20});

              if(current_building){ // If there is a building currently in focus, set it back to its default style
                current_building.setStyle({
                  color: 'red',
                  weight: 2,
                  fillColor: 'red',
                  fillOpacity: 0.3
                });
              }

              this.setStyle({
                color: 'red',      
                weight: 2,
                fillColor: 'white',
                fillOpacity: 1 
              });

              let current_room = null;

              roomLayer = L.geoJSON(fullList, {
                filter: function(room_feature){
                  return room_feature.properties.type === "room" && room_feature.properties.building_code === props.code;
                },
                style: { // Default room style
                  color: 'grey',
                  weight: 1,
                  fillColor: 'grey',
                  fillOpacity: 0.3
                },
                
                onEachFeature: function (room_feature, room_layer){
                    room_layer.on('click', function(e){ // The thing the user clicked on was a room
                      const room_props = this.feature.properties;

                      document.getElementById('infoPanel').innerHTML = 
                      `<strong>${props.name}</strong><br>
                      Code: ${(room_props.building_code + " " + room_props.code) || "N/A"}`;
                      
                      if(current_room){ // If there is a room currently displayed, set it back to its default style
                        current_room.setStyle({
                          color: 'grey',
                          weight: 1,
                          fillColor: 'grey',
                          fillOpacity: 0.3
                        });
                      }

                      if (current_room !== this){ // If the room currently in focus is not the room that is clicked on, or none is in focus...
                        
                        this.setStyle({
                          color: 'red',      
                          weight: 1,
                          fillColor: 'red',
                          fillOpacity: 1 
                        });
                        current_room = this;
                      } else { // The case that the room currently in focus is the room that is clicked on
                        document.getElementById('infoPanel').innerHTML = 
                          `<strong>${props.name}</strong><br>
                          Code: ${props.code || "N/A"}`;

                        current_room = null;
                      }
                    }
                  )
                }
              }).addTo(map);

              current_building = this;
            }
        });
      }
  }).addTo(map);

    map.on('zoomend', function () {
      const zoom = map.getZoom();

      if (zoom <= 16 && map.hasLayer(roomLayer)) {
        map.removeLayer(roomLayer);
        current_building.setStyle({
          color: 'red',
          weight: 2,
          fillColor: 'red',
          fillOpacity: 0.3
        });
        current_building = null;
      }
    });

/* Search functionality */
const searchInput = document.getElementById('search');
const searchResults = document.getElementById('searchResults');

searchInput.addEventListener('focus', () => {
  searchResults.style.display = 'block';
});

searchResults.addEventListener('click', () => {
  searchResults.style.display = 'none';
});

searchInput.addEventListener('input', function() {
  const query = this.value.toLowerCase();
  searchResults.innerHTML = '';

  if (!query) return;

  const matches = fullList.features.filter(feature => 
    (feature.properties.name && feature.properties.name.toLowerCase().includes(query)) ||
    ((feature.properties.building_code || '') + " " + (feature.properties.code || '')).toLowerCase().includes(query)
  ); // Collect features matching what the user typed so far

  matches.forEach(feature => { // Iterate over the matched features...
    const li = document.createElement('li');
    if (feature.properties.type === 'building') { // ...and if the feature is a building, add an event listener to the listing that simulates a click on that building on the map...
      li.textContent = feature.properties.name;
      li.addEventListener('click', function() {
        searchResults.innerHTML = '';
        searchInput.value = feature.properties.name;
        map.eachLayer(layer => {
          if (layer.feature && layer.feature.properties.type === 'building' &&
              layer.feature.properties.code === feature.properties.code) {
            layer.fire('click');
          }
        });
      });
    } else { // ...and otherwise the feature is a room, so add an event listeners to the listing...
      li.textContent = (feature.properties.building_code || '') + " " + (feature.properties.code || '');
      li.addEventListener('click', function() {
        searchResults.innerHTML = '';
        searchInput.value = (feature.properties.building_code || '') + " " + (feature.properties.code || '');
          map.eachLayer(layer => {
            if (layer.feature && layer.feature.properties.type === 'building' &&
                layer.feature.properties.code === feature.properties.building_code && 
                (!current_building || (current_building && current_building.feature.properties.code !== feature.properties.building_code))) {
                  layer.fire('click'); // ...that fires a click on the building only if that building is not currently in focus...
            }
          });
        map.eachLayer(layer => {
          if (layer.feature && layer.feature.properties.type === 'room' &&
              layer.feature.properties.code === feature.properties.code) {
            layer.fire('click'); // ...and always fires a click on that room.
          }
        });
      });
    }
    li.style.cursor = 'pointer';
    li.style.padding = '5px';
    searchResults.appendChild(li);
  });
});

}).catch(error => console.error('Error loading GeoJSON:', error));
