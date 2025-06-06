import {
    INFO_PANEL_ID
} from './config.js';

export function updateInfoPanel(content) {
    const infoPanel = document.getElementById(INFO_PANEL_ID);
    const buildingTools = document.getElementById('buildingTools');


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

export function changeHuygensFloor(name, floor) {
    if (name == 'Huygens Building' && floor === -1){
        return -2;
    }
    return floor;
}