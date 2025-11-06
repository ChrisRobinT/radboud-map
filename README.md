# Campus Map RU

> Interactive campus navigation Progressive Web App for Radboud University

[Live Demo] https://radboud-map-52cbb1.pages.science.ru.nl/ | [Project Report] Project Report R&D Team-21.pdf

## 📱 Overview

Mobile-friendly web application helping 200+ Computing Science students navigate Radboud University campus, featuring searchable building/room database and detailed floor plans for 28 buildings (800+ rooms).

## ✨ Features

- 🗺️ Interactive map with zoom-based rendering
- 🔍 Real-time search for buildings and rooms
- 📍 Room-level navigation with detailed floor plans
- 📱 Progressive Web App with offline support
- 🎯 Optimized for mobile devices

## 🛠️ Tech Stack

- **Frontend:** JavaScript (ES6 modules), Leaflet.js, HTML/CSS
- **Data:** GeoJSON, manually digitized using QGIS
- **Deployment:** Progressive Web App (PWA)
- **Version Control:** Git (4-person collaborative workflow)

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ (or any local server)
- Modern web browser

### Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/ChrisRobinT/campus-map-ru.git
cd campus-map-ru

# Install dependencies (if any)
npm install

# Run locally
npm start
# Or simply open index.html in your browser
\`\`\`

### Usage

1. Open the app in your browser
2. Use the search bar to find buildings or rooms (e.g., "HG 00.304")
3. Click on buildings to view detailed floor plans
4. Zoom in to see room-level details

## 📸 Screenshots

### Campus Overview
<img src="/assets/screenshots/screenshot1.png" alt="A screenshot showing several red buildings on top of a map of the Radboud Campus" width="250"/>

### Room-Level Detail
<img src="/assets/screenshots/screenshot2.png" alt="A screenshot showing several rooms inside a building on a map of the Radboud Campus" width="250"/>

## 🎯 Key Achievements

- Digitized 28 buildings and 800+ individual rooms using QGIS
- Reduced average room-finding time compared to static PDF maps
- Implemented zoom-based rendering for optimal mobile performance
- Built with modular architecture supporting future building additions

## 👥 Team

Developed collaboratively in a 4-person team over 8 weeks:
- Robin Strik
- Gregor Bujda
- Björn Smith
- Chris-Robin Talts

## 🏗️ Architecture

- **Data Layer:** GeoJSON files for buildings and rooms
- **Rendering:** Leaflet.js with custom zoom-level triggers
- **Search:** JavaScript filtering on building/room properties
- **Offline:** Service worker for PWA functionality

## 📝 Data Attribution

Background map data provided by OpenStreetMap contributors.
Building floor plans manually digitized from Radboud University evacuation plans.

## 📄 License

MIT License - Built as a student project for Radboud University (2024)

## 🔗 Links

- [Live Demo]https://radboud-map-52cbb1.pages.science.ru.nl/
- [Project Documentation](link-to-full-report.pdf)
- [Radboud University](https://www.ru.nl)

---

⭐ If you find this project useful, please give it a star!





<table>
  <tr>
    <td><img src="/assets/screenshots/screenshot1.png" alt="A screenshot showing several red buildings on top of a map of the Radboud Campus" width="250"/></td>
    <td><img src="/assets/screenshots/screenshot2.png" alt="A screenshot showing several rooms inside a building on a map of the Radboud Campus" width="250"/></td>
  </tr>
</table>

