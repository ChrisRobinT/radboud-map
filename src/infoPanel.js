import {
    INFO_PANEL_ID,
    UP_BUTTON_ID,
    DOWN_BUTTON_ID
} from './config.js';

export function updateInfoPanel(content) {
    const infoPanel = document.getElementById(INFO_PANEL_ID);
    const upButton = document.getElementById(UP_BUTTON_ID);
    const downButton = document.getElementById(DOWN_BUTTON_ID);
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