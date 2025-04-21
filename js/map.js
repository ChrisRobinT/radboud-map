const map = L.map('map').setView([51.8226, 5.8642], 16); // Radboud center

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

L.marker([51.8226, 5.8642])
  .addTo(map)
  .bindPopup('Radboud University')
  .openPopup();
