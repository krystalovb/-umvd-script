// ==UserScript==
// @name         UMVD Rivera Lime - Final Station
// @namespace    https://forum.blackrussia.online
// @version      21.0
// @description  Таймер 24ч, счетчик нормы, выбор ранга из списка, авто-детект ника.
// @author       Saint_Rivera & Gemini
// @match        https://forum.blackrussia.online/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    const RANKS = ["Рядовой", "Сержант", "Старший Сержант", "Прапорщик", "Лейтенант", "Старший Лейтенант", "Капитан", "Майор", "Подполковник", "Полковник"];
    const REASONS = ["Отсутствие военного билета.", "Скриншоты без /time.", "Скриншотам более 3-х дней.", "Не по форме / нечитаемый шрифт.", "Вы в ЧС фракции.", "Низкая законопослушность.", "Опечатка в паспорте (NonRP)."];

    let sessionWork = 0;
    const getSetting = (key, def) => localStorage.getItem(key) || def;

    // --- ФУНКЦИЯ: ТАЙМЕР 24ч ---
    function getTopicIdleTime() {
        const lastPostTimeElement = document.querySelector('.message:last-child .u-dt');
        if (!lastPostTimeElement) return null;
        const lastPostTimestamp = new Date(lastPostTimeElement.getAttribute('data-time') * 1000);
        return Math.floor((new Date() - lastPostTimestamp) / (1000 * 60 * 60));
    }

    // --- ФУНКЦИЯ: ВСТАВКА В РЕДАКТОР ---
    async function quoteAndAppend(text) {
        const quoteBtn = document.querySelector('.message:last-child [data-xf-click="quote"]') || 
                         document.querySelector('[data-xf-click="quote"]');
        if (quoteBtn) quoteBtn.click();

        setTimeout(() => {
            const editor = document.querySelector('.fr-element.fr-view');
            if (editor) {
                editor.focus();
                const styledText = `[CENTER][FONT=Times New Roman]${text}[/FONT][/CENTER]`;
                document.execCommand('insertHTML', false, styledText);
                sessionWork++;
                if(document.getElementById('riv-norm-counter')) {
                    document.getElementById('riv-norm-counter').innerText = `Норма за сессию: ${sessionWork}`;
                }
            }
        }, 500);
    }

    // --- МОДАЛЬНОЕ ОКНО (ДИЗАЙН ИЗ PNG) ---
    function showModal({ title, message, options = null, isTextArea = false, isConfirm = false, isSettings = false, inputPlaceholder = "" }) {
        return new Promise((resolve) => {
            const modalId = 'rivera-modal';
            let content = '';

            if (isSettings) {
                content = `<div style="display:flex; flex-direction:column; gap:8px;">
                    <input id="set-nick" type="text" placeholder="Ваш Ник" value="${getSetting('riv_nick', '')}" style="background:#16161e; border:1px solid #3b82f644; border-radius:8px; padding:10px; color:#fff;">
                    <p style="color:#94a3b8; font-size:11px; margin:0;">Выберите вашу должность:</p>
                    <div style="display:grid; gap:5px; max-height:150px; overflow-y:auto;">
                        ${RANKS.map(r => `<button class="rank-opt" data-v="${r}" style="background:#2d2d3a; color:#fff; border:1px solid #444; padding:8px; border-radius:6px; font-size:11px; cursor:pointer;">${r}</button>`).join('')}
                    </div>
                    <input id="set-sign" type="text" placeholder="Ваша Подпись" value="${getSetting('riv_sign', '')}" style="background:#16161e; border:1px solid #3b82f644; border-radius:8px; padding:10px; color:#fff;">
                </div>`;
            } else if (options) {
                content = `<div style="display:grid; gap:5px; max-height:200px; overflow-y:auto;">${options.map(o => `<button class="opt-btn" data-v="${o}" style="background:#2d2d3a; color:#fff; border:1px solid #444; padding:8px; border-radius:6px; font-size:11px; cursor:pointer; text-align:left;">${o}</button>`).join('')}</div>`;
            } else {
                const lastMsg = document.querySelector('.message:last-child .message-inner .message-body .bbWrapper');
                const detected = lastMsg ? (lastMsg.innerText.match(/([A-Z][a-z]+_[A-Z][a-z]+/) || [""])[0] : "";
                content = isConfirm ? '' : (isTextArea 
                    ? `<textarea id="modal-field" style="width:100%; background:#16161e; border:1px solid #3b82f644; border-radius:8px; padding:10px; color:#fff; height:80px;"></textarea>`
                    : `<input id="modal-field" type="text" placeholder="Ник игрока..." value="${inputPlaceholder.includes('Nick') ? detected : ''}" style="width:100%; background:#16161e; border:1px solid #3b82f644; border-radius:8px; padding:10px; color:#fff;">`
                );
            }

            const html = `<div id="${modalId}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); backdrop-filter:blur(5px); z-index:30000; display:flex; align-items:center; justify-content:center; font-family:sans-serif;">
                <div style="background:#1e1e27; width:90%; max-width:400px; border-radius:15px; border:1px solid #333; box-shadow:0 20px 50px rgba(0,0,0,0.5);">
                    <div style="padding:15px; background:#3b82f622; color:#fff; font-weight:bold; text-align:center; font-size:13px; border-radius:15px 15px 0 0;">${title}</div>
                    <div style="padding:20px;">
                        ${message ? `<p style="color:#94a3b8; font-size:12px; margin-bottom:15px; text-align:center;">${message}</p>` : ''}
                        ${content}
                        <div style="display:flex; gap:10px; margin-top:20px;">
                            <button id="m-cancel" style="flex:1; background:#334155; color:#fff; border:none; padding:10px; border-radius:8px; cursor:pointer;">ОТМЕНА</button>
                            ${(options || isSettings) ? '' : `<button id="m-confirm" style="flex:1; background:#166534; color:#fff; border:none; padding:10px; border-radius:8px; cursor:pointer;">ДАЛЕЕ →</button>`}
                        </div>
                    </div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', html);
            const m = document.getElementById(modalId);
            
            // Обработка выбора ранга в настройках
            if(isSettings) {
                m.querySelectorAll('.rank-opt').forEach(b => b.onclick = () => {
                    localStorage.setItem('riv_nick', m.querySelector('#set-nick').value);
                    localStorage.setItem('riv_rank', b.dataset.v);
                    localStorage.setItem('riv_sign', m.querySelector('#set-sign').value);
                    m.remove(); location.reload();
                });
            }
            if(options) m.querySelectorAll('.opt-btn').forEach(b => b.onclick = () => { resolve(b.dataset.v); m.remove(); });
            m.querySelector('#m-confirm')?.addEventListener('click', () => { resolve(m.querySelector('#modal-field')?.value || true); m.remove(); });
            m.querySelector('#m-cancel').onclick = () => { m.remove(); resolve(false); };
        });
    }

    // --- СОЗДАНИЕ ГЛАВНОЙ ПАНЕЛИ ---
    function createUI() {
        if (document.getElementById('rivera-panel')) return;
        const panel = document.createElement('div');
        panel.id = 'rivera-panel';
        
        const idleHours = getTopicIdleTime();
        let timerStyle = (idleHours >= 20) ? "background:#7f1d1d; color:#fff; animation: pulse 1.5s infinite;" : "background:#334155; color:#94a3b8;";

        panel.style = "position:fixed; top:50%; right:15px; transform:translateY(-50%); width:180px; background:rgba(30,30,39,0.95); border-radius:15px; z-index:10000; border:1px solid #444; padding:12px; display:flex; flex-direction:column; gap:6px; box-shadow:0 10px 30px rgba(0,0,0,0.5);";
        panel.innerHTML = `
            <div style="color:#fff; font-size:10px; font-weight:bold; text-align:center; border-bottom:1px solid #333; padding-bottom:5px;">УМВД LIME</div>
            <div style="${timerStyle} font-size:9px; padding:5px; border-radius:5px; text-align:center; font-weight:bold;">${idleHours !== null ? 'Без ответа: '+idleHours+'ч.' : 'Загрузка...'}</div>
            <button class="r-btn" data-t="ok" style="background:#166534;">ОДОБРИТЬ</button>
            <button class="r-btn" data-t="no" style="background:#7f1d1d;">ОТКАЗАТЬ</button>
            <button class="r-btn" data-t="trans" style="background:#1e40af;">ПЕРЕВОД (-1)</button>
            <div id="riv-norm-counter" style="color:#94a3b8; font-size:9px; text-align:center; border-top:1px solid #333; padding-top:5px;">Норма: 0</div>
            <button id="r-set" style="background:none; border:1px solid #444; color:#64748b; font-size:10px; padding:5px; border-radius:5px;">⚙️ НАСТРОЙКИ</button>
        `;

        document.body.appendChild(panel);
        document.getElementById('r-set').onclick = () => showModal({ title: 'ПЕРСОНАЛИЗАЦИЯ', isSettings: true });

        document.querySelectorAll('.r-btn').forEach(btn => {
            btn.style.cssText += "color:#fff; border:none; padding:10px; border-radius:8px; font-size:10px; font-weight:bold; cursor:pointer;";
            btn.onclick = async () => {
                const type = btn.dataset.t;
                const pNick = await showModal({ title: 'ВВЕДИТЕ НИК ИГРОКА', inputPlaceholder: 'Nick_Name' });
                if(!pNick) return;

                let body = `Здравия желаю, уважаемый(-ая) [B]${pNick}[/B].<br><br>`;
                if (type === 'ok') body += `Ваше заявление: [B][COLOR=rgb(34, 197, 94)]ОДОБРЕНО[/COLOR][/B].`;
                else if (type === 'no') {
                    const rsn = await showModal({ title: 'ПРИЧИНА ОТКАЗА', options: REASONS });
                    body += `Ваше заявление: [B][COLOR=rgb(239, 68, 68)]ОТКАЗАНО[/COLOR][/B].<br>Причина: ${rsn}.`;
                } else if (type === 'trans') {
                    const rVal = prompt("На какой ранг одобрен?");
                    body += `Ваше заявление на перевод: [B][COLOR=rgb(34, 197, 94)]ОДОБРЕНО[/COLOR][/B] на [B]${rVal}[/B] ранг.`;
                }

                body += `<br><br>С уважением, ${getSetting('riv_rank', 'Сотрудник')} УМВД — ${getSetting('riv_nick', 'Nick')}.<br>[I]${getSetting('riv_sign', 'Rivera')}[/I]`;
                quoteAndAppend(body);
            };
        });
    }

    setInterval(createUI, 2000);
})();
