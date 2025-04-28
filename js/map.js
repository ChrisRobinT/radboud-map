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
      style: {
        color: 'red',     
        weight: 2,
        fillOpacity: 0.3  
      },
      onEachFeature: function (feature, layer) {


        layer.on('click', function(e) {
            
            const props = this.feature.properties;
            
            document.getElementById('infoPanel').innerHTML = 
            `<strong>${props.name}</strong><br>
            Code: ${props.code || "N/A"}`;

            

            if(roomLayer){
              map.removeLayer(roomLayer);
            }
            
            if(current_building){
              current_building.setStyle({
                color: 'red',      
                weight: 2,
                fillColor: 'red',
                fillOpacity: 0.3 
              });
            }

            if(current_building !== this){
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
                style: {
                  color: 'grey',
                  weight: 1,
                  fillOpacity: 0.3
                },
                
                onEachFeature: function (room_feature, room_layer){
                    room_layer.on('click', function(e){
                      const room_props = this.feature.properties;

                      document.getElementById('infoPanel').innerHTML = 
                      `<strong>${props.name}</strong><br>
                      Code: ${(room_props.building_code + " " + room_props.code) || "N/A"}`;
                      
                      if(current_room){
                        current_room.setStyle({
                          color: 'grey',
                          weight: 1,
                          fillColor: 'grey',
                          fillOpacity: 0.3
                        });
                      }

                      if (current_room !== this){
                        this.setStyle({
                          color: 'red',      
                          weight: 1,
                          fillColor: 'red',
                          fillOpacity: 1 
                        });
                        current_room = this;
                      }else{
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
            } else{
              map.setView([51.8215, 5.8620], 16);
              document.getElementById('infoPanel').innerHTML = "Click a building";
              current_building = null;
            }
            
        });
      }
  }).addTo(map);
}).catch(error => console.error('Error loading GeoJSON:', error));

