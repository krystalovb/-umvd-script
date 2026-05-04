// ==UserScript==
// @name         UMVD by Gudin Lite
// @namespace    https://forum.blackrussia.online
// @version      21.3
// @description  Lite version of UMVD helper
// @author       Gudin
// @match        https://forum.blackrussia.online/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Простая проверка: если панель появилась — скрипт работает.
    function createUI() {
        if (document.getElementById('gudin-panel')) return;
        
        const panel = document.createElement('div');
        panel.id = 'gudin-panel';
        panel.style = "position:fixed; top:20%; right:20px; width:150px; background:#1e1e27; border:2px solid #3b82f6; border-radius:10px; z-index:99999; padding:10px; color:white; text-align:center; font-family:sans-serif;";
        panel.innerHTML = `
            <b style="font-size:12px;">UMVD by Gudin</b>
            <hr style="border:0.5px solid #333">
            <button id="test-btn" style="width:100%; margin-top:5px; background:#3b82f6; color:white; border:none; border-radius:5px; cursor:pointer; padding:5px;">ПРОВЕРКА</button>
        `;
        document.body.appendChild(panel);

        document.getElementById('test-btn').onclick = () => alert('Скрипт работает! Теперь настрой его через шестеренку в полной версии.');
    }

    // Запуск через 2 секунды после загрузки
    setTimeout(createUI, 2000);
})();
