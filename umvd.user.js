// ==UserScript==
// @name         UMVD Rivera Lime - Final
// @namespace    https://forum.blackrussia.online
// @version      20.1
// @description  Full Edition: Auto-detect, Lists, Timer. Optimized for Safari/iOS.
// @author       Saint_Rivera & Gudin
// @match        *://forum.blackrussia.online/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const RANKS = ["Рядовой", "Сержант", "Старший Сержант", "Прапорщик", "Лейтенант", "Старший Лейтенант", "Капитан", "Майор", "Подполковник", "Полковник"];
    const REASONS = ["Отсутствие военного билета.", "Скриншоты без /time.", "Скриншотам более 3-х дней.", "Не по форме / нечитаемый шрифт.", "Вы в ЧС фракции.", "Низкая законопослушность.", "Опечатка в паспорте (NonRP)."];
    
    let sessionWork = 0;
    const getSetting = (key, def) => localStorage.getItem(key) || def;

    // --- АВТО-ДЕТЕКТ НИКА ---
    function detectNickname() {
        const posts = document.querySelectorAll('.bbWrapper');
        if (posts.length > 0) {
            const lastText = posts[posts.length - 1].innerText;
            const match = lastText.match(/([A-Z][a-z]+_[A-Z][a-z]+)/);
            return match ? match[0] : "";
        }
        return "";
    }

    // --- ИНТЕРФЕЙС ПАНЕЛИ ---
    function createUI() {
        if (document.getElementById('rivera-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'rivera-panel';
        panel.style = "position:fixed; bottom:20px; right:15px; width:160px; background:rgba(30,30,39,0.98); border:2px solid #3b82f6; border-radius:15px; z-index:10000; padding:12px; color:white; font-family:sans-serif; box-shadow:0 10px 30px rgba(0,0,0,0.5); display:flex; flex-direction:column; gap:5px;";

        panel.innerHTML = `
            <div style="text-align:center; font-size:10px; font-weight:bold; color:#3b82f6; margin-bottom:5px;">UMVD LIME</div>
            <button id="btn-ok" style="background:#166534; color:white; border:none; padding:10px; border-radius:8px; font-size:10px; font-weight:bold;">ОДОБРИТЬ</button>
            <button id="btn-no" style="background:#7f1d1d; color:white; border:none; padding:10px; border-radius:8px; font-size:10px; font-weight:bold;">ОТКАЗАТЬ</button>
            <div id="norm-count" style="text-align:center; font-size:9px; color:#94a3b8; margin:5px 0;">Норма: 0</div>
            <button id="btn-set" style="background:none; border:1px solid #444; color:#94a3b8; font-size:9px; padding:5px; border-radius:6px;">⚙️ НАСТРОЙКИ</button>
        `;
        document.body.appendChild(panel);

        // Логика кнопок
        document.getElementById('btn-set').onclick = () => {
            const n = prompt("Ваш Ник:", getSetting('riv_nick', ''));
            if(n) localStorage.setItem('riv_nick', n);
            const rPrompt = RANKS.map((r, i) => `${i+1}-${r}`).join('\n');
            const rNum = prompt("Номер ранга:\n" + rPrompt, "1");
            if(rNum && RANKS[rNum-1]) localStorage.setItem('riv_rank', RANKS[rNum-1]);
            alert("Сохранено!");
        };

        document.getElementById('btn-ok').onclick = () => handleResponse('ok');
        document.getElementById('btn-no').onclick = () => handleResponse('no');
    }

    function handleResponse(type) {
        const detected = detectNickname();
        const pNick = prompt("Ник игрока:", detected);
        if(!pNick) return;

        const myNick = getSetting('riv_nick', 'Nick');
        const myRank = getSetting('riv_rank', 'Сотрудник');
        
        let body = `[CENTER][FONT=Times New Roman]Здравия желаю, уважаемый(-ая) [B]${pNick}[/B].<br><br>`;
        if(type === 'ok') body += `Ваше заявление: [COLOR=rgb(34, 197, 94)][B]ОДОБРЕНО[/B][/COLOR].`;
        else body += `Ваше заявление: [COLOR=rgb(239, 68, 68)][B]ОТКАЗАНО[/B][/COLOR].`;
        body += `<br><br>С уважением, ${myRank} — ${myNick}.[/FONT][/CENTER]`;

        const editor = document.querySelector('.fr-element.fr-view');
        if(editor) {
            editor.focus();
            document.execCommand('insertHTML', false, body);
            sessionWork++;
            document.getElementById('norm-count').innerText = `Норма: ${sessionWork}`;
        } else {
            alert("Сначала нажми 'Ответить'!");
        }
    }

    setTimeout(createUI, 2000);
})();
