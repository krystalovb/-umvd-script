// ==UserScript==
// @name         UMVD Rivera Lime
// @namespace    https://forum.blackrussia.online
// @version      22.1
// @description  Helper for UMVD Lime (Mobile Version)
// @author       Gudin & Saint_Rivera
// @match        *://forum.blackrussia.online/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    const RANKS = ["Рядовой", "Сержант", "Старший Сержант", "Прапорщик", "Лейтенант", "Старший Лейтенант", "Капитан", "Майор", "Подполковник", "Полковник"];
    const REASONS = ["Отсутствие военного билета.", "Скриншоты без /time.", "Скриншотам более 3-х дней.", "Не по форме / нечитаемый шрифт.", "Вы в ЧС фракции.", "Низкая законопослушность.", "Опечатка в паспорте (NonRP)."];

    const getSetting = (key, def) => localStorage.getItem(key) || def;
    let sessionWork = 0;

    // --- ФУНКЦИЯ: АВТО-КОРРЕКТОР ---
    function autoCorrect(text) {
        if (!text) return text;
        let corrected = text;
        corrected = corrected.replace(/([a-z])([a-z]+)_([a-z])([a-z]+)/gi, (match, p1, p2, p3, p4) => {
            return p1.toUpperCase() + p2.toLowerCase() + "_" + p3.toUpperCase() + p4.toLowerCase();
        });
        const vocabulary = { "законопаслушность": "законопослушность", "расмотрено": "рассмотрено", "откозано": "отказано", "вердикт": "Вердикт" };
        for (let key in vocabulary) {
            let reg = new RegExp(key, "gi");
            corrected = corrected.replace(reg, vocabulary[key]);
        }
        return corrected;
    }

    // --- ИНТЕРФЕЙС ПАНЕЛИ ---
    function createUI() {
        if (document.getElementById('rivera-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'rivera-panel';
        panel.style = "position:fixed; bottom:20px; right:10px; width:160px; background:rgba(30,30,39,0.95); border:2px solid #3b82f6; border-radius:12px; z-index:10000; padding:12px; color:white; font-family:sans-serif; box-shadow:0 5px 15px rgba(0,0,0,0.5);";
        panel.innerHTML = `
            <div style="text-align:center; font-size:10px; font-weight:bold; margin-bottom:8px; color:#3b82f6;">UMVD RIVERA</div>
            <button id="btn-ok" style="width:100%; background:#166534; color:white; border:none; padding:8px; border-radius:6px; margin-bottom:5px; font-size:10px; font-weight:bold;">ОДОБРИТЬ</button>
            <button id="btn-no" style="width:100%; background:#7f1d1d; color:white; border:none; padding:8px; border-radius:6px; margin-bottom:5px; font-size:10px; font-weight:bold;">ОТКАЗАТЬ</button>
            <div id="norm-count" style="text-align:center; font-size:9px; color:#888; margin:5px 0;">Норма: 0</div>
            <button id="btn-set" style="width:100%; background:none; border:1px solid #444; color:#aaa; font-size:9px; padding:4px; border-radius:4px;">⚙️ НАСТРОЙКИ</button>
        `;
        document.body.appendChild(panel);

        document.getElementById('btn-set').onclick = () => {
            const nick = prompt("Введите ваш Ник_Нейм:", getSetting('riv_nick', ''));
            if (nick) localStorage.setItem('riv_nick', nick);
            const rank = prompt("Введите ваш Ранг (например, Капитан):", getSetting('riv_rank', ''));
            if (rank) localStorage.setItem('riv_rank', rank);
        };

        document.getElementById('btn-ok').onclick = () => handleResponse('ok');
        document.getElementById('btn-no').onclick = () => handleResponse('no');
    }

    async function handleResponse(type) {
        const pNick = prompt("Ник игрока (Nick_Name):");
        if (!pNick) return;

        const myNick = getSetting('riv_nick', 'Сотрудник');
        const myRank = getSetting('riv_rank', 'УМВД');

        let body = `[CENTER][FONT=Times New Roman]Здравия желаю, уважаемый(-ая) [B]${pNick}[/B].<br><br>`;
        
        if (type === 'ok') {
            body += `Ваше заявление было рассмотрено и получило статус: [COLOR=rgb(34, 197, 94)][B]ОДОБРЕНО[/B][/COLOR].`;
        } else {
            const reason = prompt("Причина отказа:", REASONS[0]);
            body += `Ваше заявление было рассмотрено и получило статус: [COLOR=rgb(239, 68, 68)][B]ОТКАЗАНО[/B][/COLOR].<br>Причина: ${reason}`;
        }
        
        body += `<br><br>С уважением, ${myRank} — ${myNick}.[/FONT][/CENTER]`;
        
        const cleanBody = autoCorrect(body);

        // Вставка в редактор
        const editor = document.querySelector('.fr-element.fr-view');
        if (editor) {
            editor.focus();
            document.execCommand('insertHTML', false, cleanBody);
            sessionWork++;
            document.getElementById('norm-count').innerText = `Норма: ${sessionWork}`;
        } else {
            alert("Сначала нажмите на поле ввода (Ответить)!");
        }
    }

    // Запуск через 2 секунды после загрузки страницы
    setTimeout(createUI, 2000);

})();
