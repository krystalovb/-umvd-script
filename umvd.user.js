// ==UserScript==
// @name         UMVD by Gudin
// @namespace    https://forum.blackrussia.online
// @version      21.4
// @description  UMVD BY GUDIN: Professional Forum Utility
// @author       Gudin
// @match        https://forum.blackrussia.online/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const TARGET_FORUM_ID = 340;
    const SERVER_NAME = "Lime";
    const RANKS = ["Рядовой", "Сержант", "Старший Сержант", "Прапорщик", "Лейтенант", "Старший Лейтенант", "Капитан", "Майор", "Подполковник", "Полковник"];
    const REASONS = ["Отсутствие военного билета.", "Скриншоты без /time.", "Скриншотам более 3-х дней.", "Не по форме / нечитаемый шрифт.", "Вы в ЧС фракции.", "Низкая законопослушность.", "Опечатка в паспорте (NonRP)."];

    let sessionWork = 0;
    const getSetting = (key, def) => localStorage.getItem(key) || def;

    // --- БЕЗОПАСНЫЙ FPS BOOST ---
    function applyFpsBoost() {
        try {
            document.querySelectorAll('.block--category').forEach(cat => {
                const title = cat.querySelector('.block-header')?.innerText;
                if (title && title.includes('Сервера') && !title.includes(SERVER_NAME)) cat.style.display = 'none';
            });
        } catch (e) {}
    }

    // --- АВТО-КОРРЕКТОР ---
    function autoCorrect(text) {
        if (!text) return text;
        let corrected = text;
        corrected = corrected.replace(/([a-z])([a-z]+)_([a-z])([a-z]+)/gi, (match, p1, p2, p3, p4) => {
            return p1.toUpperCase() + p2.toLowerCase() + "_" + p3.toUpperCase() + p4.toLowerCase();
        });
        const vocabulary = { "законопаслушность": "законопослушность", "расмотрено": "рассмотрено", "откозано": "отказано" };
        for (let key in vocabulary) {
            let reg = new RegExp(key, "gi");
            corrected = corrected.replace(reg, vocabulary[key]);
        }
        return corrected;
    }

    async function quoteAndAppend(text) {
        const cleanText = autoCorrect(text);
        const quoteBtn = document.querySelector('.message:last-child [data-xf-click="quote"]');
        if (quoteBtn) quoteBtn.click();

        setTimeout(() => {
            const editor = document.querySelector('.fr-element.fr-view');
            if (editor) {
                editor.focus();
                const styledText = `[CENTER][FONT=Times New Roman]${cleanText}[/FONT][/CENTER]`;
                document.execCommand('insertHTML', false, styledText);
                sessionWork++;
                document.getElementById('riv-norm-counter').innerText = `Норма за сессию: ${sessionWork}`;
            }
        }, 600);
    }

    // --- МОДАЛКИ ---
    function showModal({ title, options = null, isTextArea = false, isConfirm = false, isSettings = false, inputPlaceholder = "" }) {
        return new Promise((resolve) => {
            const modalId = 'rivera-modal';
            let content = '';

            if (isSettings) {
                content = `<div style="display:flex; flex-direction:column; gap:8px;">
                    <input id="set-nick" type="text" placeholder="Ваш Ник" value="${getSetting('riv_nick', '')}" style="background:#16161e; border:1px solid #3b82f6; padding:10px; color:#fff; border-radius:5px;">
                    <select id="set-rank" style="background:#16161e; border:1px solid #3b82f6; padding:10px; color:#fff; border-radius:5px;">
                        ${RANKS.map(r => `<option value="${r}" ${r === getSetting('riv_rank', '') ? 'selected' : ''}>${r}</option>`).join('')}
                    </select>
                </div>`;
            } else if (options) {
                content = `<div style="display:grid; gap:5px; max-height:200px; overflow-y:auto;">${options.map(o => `<button class="opt-btn" data-v="${o}" style="background:#2d2d3a; color:#fff; border:1px solid #444; padding:8px; border-radius:6px; cursor:pointer; text-align:left;">${o}</button>`).join('')}</div>`;
            } else {
                content = isConfirm ? '' : (isTextArea 
                    ? `<textarea id="modal-field" style="width:100%; background:#16161e; border:1px solid #3b82f6; border-radius:8px; padding:10px; color:#fff; height:80px;"></textarea>`
                    : `<input id="modal-field" type="text" placeholder="${inputPlaceholder}" style="width:100%; background:#16161e; border:1px solid #3b82f6; border-radius:8px; padding:10px; color:#fff;">`
                );
            }

            const html = `<div id="${modalId}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:100000; display:flex; align-items:center; justify-content:center;">
                <div style="background:#1e1e27; width:350px; border-radius:15px; border:2px solid #3b82f6; padding:20px;">
                    <div style="color:#fff; font-weight:bold; margin-bottom:15px; text-align:center;">${title}</div>
                    ${content}
                    <div style="display:flex; gap:10px; margin-top:20px;">
                        <button id="m-cancel" style="flex:1; background:#444; color:#fff; border:none; padding:10px; border-radius:8px; cursor:pointer;">ОТМЕНА</button>
                        ${options ? '' : `<button id="m-confirm" style="flex:1; background:#3b82f6; color:#fff; border:none; padding:10px; border-radius:8px; cursor:pointer;">OK</button>`}
                    </div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', html);
            const m = document.getElementById(modalId);
            if(options) m.querySelectorAll('.opt-btn').forEach(b => b.onclick = () => { resolve(b.dataset.v); m.remove(); });
            m.querySelector('#m-confirm')?.addEventListener('click', () => {
                if(isSettings) {
                    localStorage.setItem('riv_nick', m.querySelector('#set-nick').value);
                    localStorage.setItem('riv_rank', m.querySelector('#set-rank').value);
                    m.remove();
                } else { resolve(m.querySelector('#modal-field')?.value || true); m.remove(); }
            });
            m.querySelector('#m-cancel').onclick = () => { m.remove(); resolve(false); };
        });
    }

    // --- ГЛАВНАЯ ПАНЕЛЬ ---
    function createUI() {
        if (document.getElementById('gudin-panel')) return;
        const panel = document.createElement('div');
        panel.id = 'gudin-panel';
        panel.style = "position:fixed; top:30%; right:20px; width:170px; background:#1e1e27; border:2px solid #3b82f6; border-radius:12px; z-index:99999; padding:12px; color:white; font-family:sans-serif; box-shadow:0 0 20px rgba(0,0,0,0.5);";
        panel.innerHTML = `
            <div style="font-size:11px; font-weight:bold; text-align:center; margin-bottom:10px;">UMVD BY GUDIN</div>
            <button class="g-btn" data-t="ok" style="background:#166534; width:100%; margin-bottom:5px; padding:8px; border:none; border-radius:6px; color:white; cursor:pointer; font-size:10px;">ОДОБРИТЬ</button>
            <button class="g-btn" data-t="no" style="background:#7f1d1d; width:100%; margin-bottom:5px; padding:8px; border:none; border-radius:6px; color:white; cursor:pointer; font-size:10px;">ОТКАЗАТЬ</button>
            <div id="riv-norm-counter" style="font-size:9px; text-align:center; color:#888; margin:5px 0;">Норма за сессию: 0</div>
            <button id="g-set" style="background:none; border:1px solid #3b82f6; color:#3b82f6; width:100%; padding:5px; border-radius:6px; cursor:pointer; font-size:9px;">⚙️ НАСТРОЙКИ</button>
        `;
        document.body.appendChild(panel);

        document.getElementById('g-set').onclick = () => showModal({ title: 'НАСТРОЙКИ', isSettings: true });

        document.querySelectorAll('.g-btn').forEach(btn => {
            btn.onclick = async () => {
                const type = btn.dataset.t;
                const nick = getSetting('riv_nick', 'Nick_Name');
                const rank = getSetting('riv_rank', 'Сотрудник');
                
                const pNick = await showModal({ title: 'НИК ИГРОКА', inputPlaceholder: 'Nick_Name' });
                if(!pNick) return;

                let body = `Здравия желаю, [B]${pNick}[/B].<br><br>`;
                if (type === 'ok') body += `Ваше заявление рассмотрено и получает статус: [COLOR=rgb(34, 197, 94)][B]ОДОБРЕНО[/B][/COLOR].`;
                else {
                    const rsn = await showModal({ title: 'ПРИЧИНА', options: REASONS });
                    body += `Ваше заявление рассмотрено и получает статус: [COLOR=rgb(239, 68, 68)][B]ОТКАЗАНО[/B][/COLOR].<br>Причина: ${rsn}`;
                }
                body += `<br><br>С уважением, ${rank} УМВД — ${nick}.`;
                quoteAndAppend(body);
            };
        });
    }

    // Запуск
    setTimeout(() => {
        createUI();
        setInterval(applyFpsBoost, 2000);
    }, 2000);

})();
