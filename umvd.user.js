// ==UserScript==
// @name         UMVD Rivera Lime - Ultimate Edition
// @namespace    https://forum.blackrussia.online
// @version      21.0
// @description  FPS Boost, Таймер 24ч, Счетчик нормы и Авто-корректор
// @author       Saint_Rivera & Gemini
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

    // --- ФУНКЦИЯ: FPS BOOST (Удаление лишних серверов) ---
    function applyFpsBoost() {
        document.querySelectorAll('.block--category').forEach(cat => {
            const title = cat.querySelector('.block-header')?.innerText;
            if (title && title.includes('Сервера') && !title.includes(SERVER_NAME)) cat.remove();
        });
        document.querySelectorAll('.node--forum').forEach(node => {
            const nodeTitle = node.querySelector('.node-title')?.innerText;
            if (nodeTitle && /\d+\s*server/i.test(nodeTitle) && !nodeTitle.includes(SERVER_NAME)) node.remove();
        });
    }

    // --- ФУНКЦИЯ: АВТО-КОРРЕКТОР (Пункт 6) ---
    function autoCorrect(text) {
        if (!text) return text;
        let corrected = text;
        // Исправляем Ник_Нейм (Ivan_ivanov -> Ivan_Ivanov)
        corrected = corrected.replace(/([a-z])([a-z]+)_([a-z])([a-z]+)/gi, (match, p1, p2, p3, p4) => {
            return p1.toUpperCase() + p2.toLowerCase() + "_" + p3.toUpperCase() + p4.toLowerCase();
        });
        // Исправляем ошибки в словах
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

    // --- ЛОГИКА ТАЙМЕРА ---
    function getTopicIdleTime() {
        if (!window.location.href.includes(`forums/%D0%A3%D0%9C%D0%92%D0%94.${TARGET_FORUM_ID}`)) return null;
        const lastPost = document.querySelector('.message:last-child .u-dt');
        if (!lastPost) return null;
        return Math.floor((new Date() - new Date(lastPost.getAttribute('data-time') * 1000)) / (1000 * 60 * 60));
    }

    async function quoteAndAppend(text) {
        const cleanText = autoCorrect(text);
        const quoteBtn = document.querySelector('.message:last-child [data-xf-click="quote"]') || 
                         document.querySelector('[data-xf-click="quote"]');
        if (quoteBtn) quoteBtn.click();

        setTimeout(() => {
            const editor = document.querySelector('.fr-element.fr-view');
            if (editor) {
                editor.focus();
                const styledText = `[CENTER][FONT=Times New Roman]${cleanText}[/FONT][/CENTER]`;
                document.execCommand('insertHTML', false, styledText);
                sessionWork++;
                if(document.getElementById('riv-norm-counter')) document.getElementById('riv-norm-counter').innerText = `Норма за сессию: ${sessionWork}`;
            }
        }, 500);
    }

    function showModal({ title, message, options = null, isTextArea = false, isConfirm = false, isSettings = false, inputPlaceholder = "" }) {
        return new Promise((resolve) => {
            const modalId = 'rivera-modal';
            let content = '';

            if (isSettings) {
                content = `<div style="display:flex; flex-direction:column; gap:8px;">
                    <input id="set-nick" type="text" placeholder="Ваш Ник" value="${getSetting('riv_nick', '')}" style="background:#16161e; border:1px solid #3b82f644; border-radius:8px; padding:10px; color:#fff;">
                    <select id="set-rank" style="background:#16161e; border:1px solid #3b82f644; border-radius:8px; padding:10px; color:#fff;">
                        ${RANKS.map(r => `<option value="${r}" ${r === getSetting('riv_rank', '') ? 'selected' : ''}>${r}</option>`).join('')}
                    </select>
                    <input id="set-sign" type="text" placeholder="Ваша Подпись" value="${getSetting('riv_sign', '')}" style="background:#16161e; border:1px solid #3b82f644; border-radius:8px; padding:10px; color:#fff;">
                </div>`;
            } else if (options) {
                content = `<div style="display:grid; gap:5px; max-height:200px; overflow-y:auto;">${options.map(o => `<button class="opt-btn" data-v="${o}" style="background:#2d2d3a; color:#fff; border:1px solid #444; padding:8px; border-radius:6px; font-size:11px; cursor:pointer; text-align:left;">${o}</button>`).join('')}</div>`;
            } else {
                const lastMsg = document.querySelector('.message:last-child .message-inner .message-body .bbWrapper');
                const detected = lastMsg ? (lastMsg.innerText.match(/([A-Z][a-z]+_[A-Z][a-z]+/) || [""])[0] : "";
                content = isConfirm ? '' : (isTextArea 
                    ? `<textarea id="modal-field" style="width:100%; background:#16161e; border:1px solid #3b82f644; border-radius:8px; padding:10px; color:#fff; height:80px;"></textarea>`
                    : `<input id="modal-field" type="text" value="${inputPlaceholder.includes('Nick') ? detected : ''}" style="width:100%; background:#16161e; border:1px solid #3b82f644; border-radius:8px; padding:10px; color:#fff;">`
                );
            }

            const html = `<div id="${modalId}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); backdrop-filter:blur(5px); z-index:30000; display:flex; align-items:center; justify-content:center; font-family:sans-serif;">
                <div style="background:#1e1e27; width:400px; border-radius:15px; border:1px solid #333; box-shadow:0 20px 50px rgba(0,0,0,0.5);">
                    <div style="padding:15px; background:#3b82f622; color:#fff; font-weight:bold; text-align:center; font-size:13px; border-radius:15px 15px 0 0;">${title}</div>
                    <div style="padding:20px;">${content}
                        <div style="display:flex; gap:10px; margin-top:20px;">
                            <button id="m-cancel" style="flex:1; background:#334155; color:#fff; border:none; padding:10px; border-radius:8px; cursor:pointer;">ОТМЕНА</button>
                            ${options ? '' : `<button id="m-confirm" style="flex:1; background:#3b82f6; color:#fff; border:none; padding:10px; border-radius:8px; cursor:pointer;">OK</button>`}
                        </div>
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
                    localStorage.setItem('riv_sign', m.querySelector('#set-sign').value);
                    m.remove(); location.reload();
                } else { resolve(m.querySelector('#modal-field')?.value || true); m.remove(); }
            });
            m.querySelector('#m-cancel').onclick = () => { m.remove(); resolve(false); };
        });
    }

    function createUI() {
        if (document.getElementById('rivera-panel')) return;
        const panel = document.createElement('div');
        panel.id = 'rivera-panel';
        const idleHours = getTopicIdleTime();
        
        const styleSheet = document.createElement("style");
        styleSheet.innerText = "@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }";
        document.head.appendChild(styleSheet);

        panel.style = "position:fixed; top:50%; right:15px; transform:translateY(-50%); width:180px; background:rgba(30,30,39,0.95); backdrop-filter:blur(10px); border-radius:15px; z-index:10000; border:1px solid #444; padding:12px; display:flex; flex-direction:column; gap:6px; box-shadow:0 10px 30px rgba(0,0,0,0.5);";
        panel.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #333; padding-bottom:5px;">
                <div style="color:#fff; font-size:10px; font-weight:bold;">УМВД LIME (V21)</div>
                <div id="close-panel" style="color:#64748b; cursor:pointer; font-size:18px;">&times;</div>
            </div>
            ${idleHours && idleHours >= 20 ? `<div style="background:#7f1d1d; color:#fff; animation: pulse 1.5s infinite; font-size:9px; padding:5px; border-radius:5px; text-align:center; font-weight:bold;">БЕЗ ОТВЕТА: ${idleHours}ч.!</div>` : ''}
            <button class="r-btn" data-t="ok" style="background:#166534;">ОДОБРИТЬ</button>
            <button class="r-btn" data-t="no" style="background:#7f1d1d;">ОТКАЗАТЬ</button>
            <button class="r-btn" data-t="trans" style="background:#1e40af;">ПЕРЕВОД (-1)</button>
            <button class="r-btn" data-t="res" style="background:#374151;">ИТОГИ</button>
            <div id="riv-norm-counter" style="color:#94a3b8; font-size:9px; text-align:center; margin-top:5px; border-top:1px solid #333; padding-top:5px;">Норма за сессию: 0</div>
            <button id="r-set" style="background:none; border:1px solid #444; color:#64748b; font-size:10px; padding:4px; border-radius:5px; cursor:pointer;">⚙️ НАСТРОЙКИ</button>
        `;

        const openBtn = document.createElement('div');
        openBtn.id = 'rivera-open-btn';
        openBtn.style = "position:fixed; top:50%; right:0; transform:translateY(-50%); background:#3b82f6; color:#fff; padding:12px 6px; border-radius:10px 0 0 10px; cursor:pointer; z-index:9999; display:none; font-weight:bold; font-size:10px;";
        openBtn.innerText = "УМВД";

        document.body.appendChild(panel);
        document.body.appendChild(openBtn);

        document.getElementById('close-panel').onclick = () => { panel.style.display = 'none'; openBtn.style.display = 'block'; };
        openBtn.onclick = () => { panel.style.display = 'flex'; openBtn.style.display = 'none'; };
        document.getElementById('r-set').onclick = () => showModal({ title: 'ПЕРСОНАЛИЗАЦИЯ', isSettings: true });

        document.querySelectorAll('.r-btn').forEach(btn => {
            btn.style.cssText += "color:#fff; border:none; padding:10px; border-radius:8px; cursor:pointer; font-size:10px; font-weight:bold;";
            btn.onclick = async () => {
                const type = btn.dataset.t;
                const nick = getSetting('riv_nick', 'Nick');
                const rank = getSetting('riv_rank', 'Звание');
                const sign = getSetting('riv_sign', 'Police');
                let body = "";

                if (type === 'res') {
                    const a = await showModal({ title: 'ИТОГИ', message: 'Одобренные ники:', isTextArea: true });
                    const r = await showModal({ title: 'ИТОГИ', message: 'Отказанные:', isTextArea: true });
                    body = `[B][SIZE=5][COLOR=rgb(30, 144, 255)]ИТОГИ ПРОВЕРКИ УМВД[/COLOR][/SIZE][/B]<br><br>[LEFT][COLOR=rgb(34, 197, 94)]ОДОБРЕНО:[/COLOR]<br>${a || '-'}<br><br>[COLOR=rgb(239, 68, 68)]ОТКАЗАНО:[/COLOR]<br>${r || '-'}[/LEFT]`;
                } else {
                    const pNick = await showModal({ title: 'НИК ИГРОКА', inputPlaceholder: 'Nick_Name' });
                    if(!pNick) return;
                    body = `Здравия желаю, уважаемый(-ая) [B]${pNick}[/B].<br><br>`;
                    if (type === 'ok') body += `Ваше заявление рассмотрено. Вердикт: [B][COLOR=rgb(34, 197, 94)]ОДОБРЕНО[/COLOR][/B].`;
                    else if (type === 'no') {
                        const rsn = await showModal({ title: 'ПРИЧИНА', options: [...REASONS, "Своя причина..."] });
                        const finalRsn = (rsn === "Своя причина...") ? await showModal({ title: 'СВОЯ ПРИЧИНА', isTextArea: true }) : rsn;
                        body += `Ваше заявление рассмотрено. Вердикт: [B][COLOR=rgb(239, 68, 68)]ОТКАЗАНО[/COLOR][/B].<br>Причина: ${finalRsn}.`;
                    }
                    else if (type === 'trans') {
                        const curR = await showModal({ title: 'РАНГ', message: 'Ваш текущий ранг (число):' });
                        body += `Ваше заявление на перевод рассмотрено. Вердикт: [B][COLOR=rgb(34, 197, 94)]ОДОБРЕНО[/COLOR][/B] на [B]${curR - 1}[/B] ранг.`;
                    }
                }

                const s = await showModal({ title: 'ПОДПИСЬ', isConfirm: true });
                if(s) body += `<br><br>С уважением, ${rank} УМВД — ${nick}.<br>[I]${sign}[/I]<br>[SIZE=1][COLOR=grey]Время: ${new Date().toLocaleString()} | LIME[/COLOR][/SIZE]`;
                quoteAndAppend(body);
            };
        });
    }

    setInterval(() => { applyFpsBoost(); createUI(); }, 1000);
})();
