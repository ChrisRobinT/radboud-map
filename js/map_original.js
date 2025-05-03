const map = L.map('map').setView([51.8215, 5.8620], 16);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
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
        layer.on('click', function(e) { // User clicks on something on the map
            const props = this.feature.properties;
            
            document.getElementById('infoPanel').innerHTML = 
            `<strong>${props.name}</strong><br>
            Code: ${props.code || "N/A"}`;

            if(roomLayer){ // If there is a room layer currently displayed, remove it
              map.removeLayer(roomLayer);
            }
            
            if(current_building){ // If there is a building currently in focus, set it back to its default style
              current_building.setStyle({
                color: 'red',      
                weight: 2,
                fillColor: 'red',
                fillOpacity: 0.3 
              });
            }

            if(current_building !== this){ // If the building currently in focus is not the thing that is clicked on, or none is in focus...
              map.fitBounds(layer.getBounds(), {maxZoom: 18});
              
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
                      } else { // The case that the room currently 
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
            } else {
              map.setView([51.8215, 5.8620], 16);
              document.getElementById('infoPanel').innerHTML = "Click a building";
              current_building = null;
            }
        });
      }
  }).addTo(map);

const searchInput = document.getElementById('search');
const searchResults = document.getElementById('searchResults');

searchInput.addEventListener('input', function() {
  const query = this.value.toLowerCase();
  searchResults.innerHTML = '';

  if (!query) return;

  const matches = fullList.features.filter(feature => 
    (feature.properties.name && feature.properties.name.toLowerCase().includes(query)) ||
    ((feature.properties.building_code || '') + (feature.properties.code || '')).toLowerCase().includes(query)
  );

  matches.forEach(feature => {
    const li = document.createElement('li');
    if (feature.properties.type == 'building') {
      li.textContent = feature.properties.name;
      li.addEventListener('click', function() {
        const bounds = L.geoJSON(feature).getBounds();
        map.fitBounds(bounds, { maxZoom: 18 });
        searchResults.innerHTML = '';
        searchInput.value = feature.properties.name;
      });
    } else {
      li.textContent = (feature.properties.building_code || '') + (feature.properties.code || '');
      li.addEventListener('click', function() {
        const bounds = L.geoJSON(feature).getBounds();
        map.fitBounds(bounds, { maxZoom: 18 });
        searchResults.innerHTML = '';
        searchInput.value = (feature.properties.building_code || '') + (feature.properties.code || '');
      });
    }
    li.style.cursor = 'pointer';
    li.style.padding = '5px';
    searchResults.appendChild(li);
  });

});

}).catch(error => console.error('Error loading GeoJSON:', error));
