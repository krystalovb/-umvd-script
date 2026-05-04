// ==UserScript==
// @name         UMVD Rivera Lime
// @namespace    https://forum.blackrussia.online
// @version      22.3
// @description  Full Mobile Edition: Авто-корректор, Таймер 24ч, Счетчик нормы. (Без FPS Boost)
// @author       Gudin & Saint_Rivera
// @match        *://forum.blackrussia.online/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // --- КОНФИГУРАЦИЯ ---
    const TARGET_FORUM_ID = 340;
    const RANKS = ["Рядовой", "Сержант", "Старший Сержант", "Прапорщик", "Лейтенант", "Старший Лейтенант", "Капитан", "Майор", "Подполковник", "Полковник"];
    const REASONS = ["Отсутствие военного билета.", "Скриншоты без /time.", "Скриншотам более 3-х дней.", "Не по форме / нечитаемый шрифт.", "Вы в ЧС фракции.", "Низкая законопослушность.", "Опечатка в паспорте (NonRP)."];

    let sessionWork = 0;
    const getSetting = (key, def) => localStorage.getItem(key) || def;

    // --- СИСТЕМА АВТО-КОРРЕКЦИИ ---
    function autoCorrect(text) {
        if (!text) return text;
        let corrected = text;

        // Исправление Nick_Name (авто-капс первой буквы)
        corrected = corrected.replace(/([a-z])([a-z]+)_([a-z])([a-z]+)/gi, (match, p1, p2, p3, p4) => {
            return p1.toUpperCase() + p2.toLowerCase() + "_" + p3.toUpperCase() + p4.toLowerCase();
        });

        // Исправление грамматики
        const vocabulary = {
            "законопаслушность": "законопослушность",
            "расмотрено": "рассмотрено",
            "откозано": "отказано",
            "здравия желаю": "Здравия желаю",
            "вердикт": "Вердикт"
        };
        for (let key in vocabulary) {
            let reg = new RegExp(key, "gi");
            corrected = corrected.replace(reg, vocabulary[key]);
        }
        return corrected;
    }

    // --- ТАЙМЕР ДЕДЛАЙНА (24 часа) ---
    function getTopicIdleTime() {
        const lastPost = document.querySelector('.message:last-child .u-dt');
        if (!lastPost) return null;
        return Math.floor((new Date() - new Date(lastPost.getAttribute('data-time') * 1000)) / (1000 * 60 * 60));
    }

    // --- ИНТЕРФЕЙС ПАНЕЛИ ---
    function createUI() {
        if (document.getElementById('rivera-panel')) return;

        const idleHours = getTopicIdleTime();
        const panel = document.createElement('div');
        panel.id = 'rivera-panel';
        
        // Стиль панели
        panel.style = `
            position: fixed;
            bottom: 20px;
            right: 15px;
            width: 170px;
            background: rgba(30, 30, 39, 0.98);
            border: 2px solid #3b82f6;
            border-radius: 12px;
            z-index: 10000;
            padding: 12px;
            color: white;
            font-family: -apple-system, sans-serif;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        `;

        // Анимация пульсации для дедлайна
        const styleSheet = document.createElement("style");
        styleSheet.innerText = "@keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }";
        document.head.appendChild(styleSheet);

        panel.innerHTML = `
            <div style="text-align:center; font-size:10px; font-weight:bold; margin-bottom:8px; color:#3b82f6;">UMVD RIVERA</div>
            
            ${idleHours && idleHours >= 20 ? 
              `<div style="background:#7f1d1d; color:#fff; font-size:9px; padding:4px; border-radius:4px; text-align:center; margin-bottom:8px; animation: pulse-red 2s infinite;">БЕЗ ОТВЕТА: ${idleHours}ч.</div>` : ''}

            <button id="btn-ok" style="width:100%; background:#166534; color:white; border:none; padding:10px; border-radius:8px; margin-bottom:6px; font-size:10px; font-weight:bold; cursor:pointer;">ОДОБРИТЬ</button>
            <button id="btn-no" style="width:100%; background:#7f1d1d; color:white; border:none; padding:10px; border-radius:8px; margin-bottom:6px; font-size:10px; font-weight:bold; cursor:pointer;">ОТКАЗАТЬ</button>
            <button id="btn-trans" style="width:100%; background:#1e40af; color:white; border:none; padding:10px; border-radius:8px; margin-bottom:6px; font-size:10px; font-weight:bold; cursor:pointer;">ПЕРЕВОД</button>
            
            <div id="norm-count" style="text-align:center; font-size:9px; color:#94a3b8; margin:8px 0; border-top: 1px solid #333; padding-top: 8px;">Норма за сессию: 0</div>
            <button id="btn-set" style="width:100%; background:none; border:1px solid #444; color:#94a3b8; font-size:9px; padding:6px; border-radius:6px; cursor:pointer;">⚙️ НАСТРОЙКИ</button>
        `;

        document.body.appendChild(panel);

        // Логика кнопок
        document.getElementById('btn-set').onclick = () => {
            const nick = prompt("Ваш Ник_Нейм:", getSetting('riv_nick', ''));
            if (nick) localStorage.setItem('riv_nick', nick);
            const rank = prompt("Ваш Ранг:", getSetting('riv_rank', ''));
            if (rank) localStorage.setItem('riv_rank', rank);
            const sign = prompt("Ваша Подпись (напр. Rivera):", getSetting('riv_sign', ''));
            if (sign) localStorage.setItem('riv_sign', sign);
        };

        document.getElementById('btn-ok').onclick = () => handleResponse('ok');
        document.getElementById('btn-no').onclick = () => handleResponse('no');
        document.getElementById('btn-trans').onclick = () => handleResponse('trans');
    }

    // --- ОБРАБОТКА ОТВЕТА ---
    async function handleResponse(type) {
        const pNick = prompt("Ник игрока (через _ ):");
        if (!pNick) return;

        const myNick = getSetting('riv_nick', 'Nick_Name');
        const myRank = getSetting('riv_rank', 'Сотрудник');
        const mySign = getSetting('riv_sign', 'Police');

        let body = `[CENTER][FONT=Times New Roman]Здравия желаю, уважаемый(-ая) [B]${pNick}[/B].<br><br>`;
        
        if (type === 'ok') {
            body += `Ваше заявление было рассмотрено и получает статус: [COLOR=rgb(34, 197, 94)][B]ОДОБРЕНО[/B][/COLOR].`;
        } else if (type === 'no') {
            const reason = prompt("Причина отказа (1-Военник, 2-Тайм, 3-ЧС):", REASONS[0]);
            body += `Ваше заявление было рассмотрено и получает статус: [COLOR=rgb(239, 68, 68)][B]ОТКАЗАНО[/B][/COLOR].<br>Причина: ${reason}`;
        } else if (type === 'trans') {
            const rankResult = prompt("На какой ранг одобрен перевод?");
            body += `Ваше заявление на перевод рассмотрено. Вердикт: [COLOR=rgb(34, 197, 94)][B]ОДОБРЕНО[/B][/COLOR] на [B]${rankResult}[/B] ранг.`;
        }
        
        body += `<br><br>С уважением, ${myRank} УМВД — ${myNick}.<br>[I]${mySign}[/I]<br>[SIZE=1][COLOR=grey]LIME | ${new Date().toLocaleDateString()}[/COLOR][/SIZE][/FONT][/CENTER]`;
        
        const finalBody = autoCorrect(body);

        // Вставка в редактор
        const editor = document.querySelector('.fr-element.fr-view');
        if (editor) {
            editor.focus();
            document.execCommand('insertHTML', false, finalBody);
            sessionWork++;
            document.getElementById('norm-count').innerText = `Норма за сессию: ${sessionWork}`;
        } else {
            alert("Ошибка! Сначала нажми кнопку 'Ответить' на форуме, чтобы открылось поле ввода.");
        }
    }

    // Авто-запуск
    setTimeout(createUI, 2000);
    setInterval(createUI, 5000);

})();
