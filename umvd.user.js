// ==UserScript==
// @name         UMVD Minimal Helper (Quote Edition)
// @namespace    https://forum.blackrussia.online
// @version      3.0
// @description  Минималистичный помощник УМВД с функцией авто-цитирования
// @author       Adaptive AI
// @match        https://forum.blackrussia.online/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const RANKS = ["Рядовой", "Сержант", "Старший Сержант", "Прапорщик", "Лейтенант", "Старший Лейтенант", "Капитан", "Майор", "Подполковник", "Полковник"];

    const getSettings = () => ({
        nick: localStorage.getItem('umvd_nick') || "Nick_Name",
        rank: localStorage.getItem('umvd_rank') || "Полковник"
    });

    // Функция вставки с предварительным нажатием кнопки "Ответить"
    async function quoteAndInsert(text) {
        // 1. Ищем кнопку "Ответить" (цитирование) в последнем сообщении или текущем открытом
        // Обычно на форуме кнопка имеет класс .u-concealed или содержит data-xf-click="quote"
        const quoteBtn = document.querySelector('.message:last-child [data-xf-click="quote"]') || 
                         document.querySelector('[data-xf-click="quote"]');

        if (quoteBtn) {
            quoteBtn.click(); // Инициируем цитату
        }

        // Ждем небольшую задержку, чтобы редактор подгрузил цитату
        setTimeout(() => {
            const editor = document.querySelector('.fr-element.fr-view');
            if (!editor) {
                alert('✗ Редактор не найден. Сначала нажмите кнопку "Ответить" вручную.');
                return;
            }
            editor.focus();
            document.execCommand('insertHTML', false, text);
        }, 300);
    }

    const buildMsg = (status) => {
        const data = getSettings();
        const date = new Date().toLocaleDateString('ru-RU');
        
        let statusBlock = '';
        if (status === "ОДОБРЕНО") statusBlock = `Вердикт: [B][COLOR=rgb(34, 197, 94)]ОДОБРЕНО[/COLOR][/B]<br>`;
        if (status === "ОТКАЗАНО") statusBlock = `Вердикт: [B][COLOR=rgb(239, 68, 68)]ОТКАЗАНО[/COLOR][/B]<br>`;
        if (status === "БЛАГОДАРНОСТЬ") statusBlock = `Благодарю за ваше теплое пожелание!<br>`;
        if (status === "РАССМОТРЕНИЕ") statusBlock = `Статус: [B][COLOR=rgb(251, 191, 36)]НА РАССМОТРЕНИИ[/COLOR][/B]<br>`;

        return `<br>[FONT=times new roman][SIZE=4]Здравия желаю!<br><br>` +
               `${statusBlock}[/SIZE][/FONT]<br>` +
               `[RIGHT][B]Дата:[/B] ${date}<br>` +
               `[B]${data.rank} ${data.nick}[/B][/RIGHT]`;
    };

    function createUI() {
        if (document.getElementById('umvd-helper-main')) return;

        const fab = document.createElement('div');
        fab.id = 'umvd-helper-trigger';
        fab.innerHTML = '🚔';
        fab.style = "position: fixed; bottom: 25px; right: 25px; width: 50px; height: 50px; background: #1e90ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10001; font-size: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); transition: 0.3s;";
        document.body.appendChild(fab);

        const panel = document.createElement('div');
        panel.id = 'umvd-helper-main';
        panel.style = "position: fixed; bottom: 85px; right: 25px; width: 220px; background: #1e1e27; border-radius: 10px; z-index: 10000; display: none; flex-direction: column; box-shadow: 0 10px 30px rgba(0,0,0,0.6); border: 1px solid #334155; overflow: hidden; font-family: sans-serif;";
        panel.innerHTML = `
            <div style="background: #0f172a; padding: 10px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #fff; font-size: 11px; font-weight: bold;">УМВД МЕНЮ</span>
                <span id="umvd-settings-btn" style="cursor:pointer;">⚙️</span>
            </div>
            <div style="padding: 10px; display: flex; flex-direction: column; gap: 8px;">
                <div class="umvd-opt" data-res="ok" style="background:#22c55e; color:white; padding:8px; border-radius:5px; cursor:pointer; font-size:12px; text-align:center;">ОДОБРИТЬ</div>
                <div class="umvd-opt" data-res="no" style="background:#ef4444; color:white; padding:8px; border-radius:5px; cursor:pointer; font-size:12px; text-align:center;">ОТКАЗАТЬ</div>
                <div class="umvd-opt" data-res="thanks" style="background:#6366f1; color:white; padding:8px; border-radius:5px; cursor:pointer; font-size:12px; text-align:center;">БЛАГОДАРНОСТЬ</div>
                <div class="umvd-opt" data-res="wait" style="background:#fbbf24; color:white; padding:8px; border-radius:5px; cursor:pointer; font-size:12px; text-align:center;">РАССМОТРЕНИЕ</div>
            </div>
        `;
        document.body.appendChild(panel);

        fab.onclick = () => panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';

        document.querySelectorAll('.umvd-opt').forEach(item => {
            item.onclick = () => {
                const type = item.getAttribute('data-res');
                let status = "ОДОБРЕНО";
                if(type === 'no') status = "ОТКАЗАНО";
                if(type === 'thanks') status = "БЛАГОДАРНОСТЬ";
                if(type === 'wait') status = "РАССМОТРЕНИЕ";
                
                quoteAndInsert(buildMsg(status));
                panel.style.display = 'none';
            };
        });

        document.getElementById('umvd-settings-btn').onclick = () => {
            const data = getSettings();
            const nick = prompt("Ваш Ник (Name_Surname):", data.nick);
            const rankMsg = "Выберите ваше звание (цифра):\n" + RANKS.map((r, i) => `${i+1}. ${r}`).join("\n");
            const rankIdx = prompt(rankMsg, "10");
            const rank = RANKS[parseInt(rankIdx)-1] || data.rank;

            if(nick !== null) {
                localStorage.setItem('umvd_nick', nick);
                localStorage.setItem('umvd_rank', rank);
                alert("Настройки сохранены!");
                location.reload();
            }
        };
    }

    setInterval(createUI, 2000);

    const style = document.createElement('style');
    style.textContent = `
        #umvd-helper-trigger:hover { transform: scale(1.1); }
        .umvd-opt:hover { filter: brightness(1.2); }
    `;
    document.head.appendChild(style);
})();
