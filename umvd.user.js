// ==UserScript==
// @name         UMVD Rivera Lime - Stable FPS
// @namespace    https://forum.blackrussia.online
// @version      21.5
// @description  Исправленная версия: стабильный интерфейс, авто-детект, выбор ранга списком и FPS Boost.
// @author       Saint_Rivera & Gemini
// @match        https://forum.blackrussia.online/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const RANKS = ["Рядовой", "Сержант", "Старший Сержант", "Прапорщик", "Лейтенант", "Старший Лейтенант", "Капитан", "Майор", "Подполковник", "Полковник"];
    const REASONS = ["Отсутствие военного билета.", "Скриншоты без /time.", "Скриншотам более 3-х дней.", "Не по форме / нечитаемый шрифт.", "Вы в ЧС фракции.", "Низкая законопослушность.", "Опечатка в паспорте (NonRP)."];
    const SERVER_NAME = "Lime";

    let sessionWork = 0;
    const getSetting = (key, def) => localStorage.getItem(key) || def;

    // --- 1. FPS BOOST (Безопасный) ---
    function applyFpsBoost() {
        // Удаляем категории других серверов только на главной
        if (window.location.pathname === '/' || window.location.pathname === '/index.php') {
            document.querySelectorAll('.block--category').forEach(cat => {
                const txt = cat.innerText;
                if (txt.includes('Сервера') && !txt.includes(SERVER_NAME)) cat.remove();
            });
        }
    }

    // --- 2. АВТО-ДЕТЕКТ НИКА ---
    function detectNickname() {
        const posts = document.querySelectorAll('.bbWrapper');
        if (posts.length > 0) {
            const lastText = posts[posts.length - 1].innerText;
            const match = lastText.match(/([A-Z][a-z]+_[A-Z][a-z]+)/);
            return match ? match[0] : "";
        }
        return "";
    }

    // --- 3. МОДАЛЬНОЕ ОКНО (ДИЗАЙН PNG) ---
    function showModal({ title, options = null, isSettings = false, inputPlaceholder = "" }) {
        return new Promise((resolve) => {
            const modalId = 'rivera-modal';
            let content = '';

            if (isSettings) {
                content = `
                <input id="set-nick" type="text" placeholder="Ваш Ник" value="${getSetting('riv_nick', '')}" style="width:100%; background:#16161e; border:1px solid #3b82f644; border-radius:8px; padding:10px; color:#fff; margin-bottom:10px;">
                <p style="color:#94a3b8; font-size:11px; margin-bottom:5px;">Выберите ваш ранг:</p>
                <div style="display:grid; gap:5px; max-height:150px; overflow-y:auto; border:1px solid #333; padding:5px; border-radius:8px;">
                    ${RANKS.map(r => `<button class="rank-opt" data-v="${r}" style="background:#2d2d3a; color:#fff; border:none; padding:8px; border-radius:6px; font-size:11px; cursor:pointer;">${r}</button>`).join('')}
                </div>`;
            } else if (options) {
                content = `<div style="display:grid; gap:5px; max-height:200px; overflow-y:auto;">${options.map(o => `<button class="opt-btn" data-v="${o}" style="background:#2d2d3a; color:#fff; border:1px solid #444; padding:8px; border-radius:6px; font-size:11px; cursor:pointer; text-align:left;">${o}</button>`).join('')}</div>`;
            } else {
                content = `<input id="modal-field" type="text" placeholder="${inputPlaceholder}" value="${inputPlaceholder === 'Nick_Name' ? detectNickname() : ''}" style="width:100%; background:#16161e; border:1px solid #3b82f644; border-radius:8px; padding:10px; color:#fff;">`;
            }

            const html = `
            <div id="${modalId}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); backdrop-filter:blur(4px); z-index:30000; display:flex; align-items:center; justify-content:center; font-family:sans-serif;">
                <div style="background:#1e1e27; width:90%; max-width:380px; border-radius:15px; border:1px solid #333; overflow:hidden;">
                    <div style="padding:15px; background:#3b82f622; color:#fff; font-weight:bold; text-align:center; font-size:13px; border-bottom:1px solid #333;">${title}</div>
                    <div style="padding:20px;">
                        ${content}
                        <div style="display:flex; gap:10px; margin-top:20px;">
                            <button id="m-cancel" style="flex:1; background:#334155; color:#fff; border:none; padding:12px; border-radius:8px; cursor:pointer; font-size:12px;">ОТМЕНА</button>
                            ${(options || isSettings) ? '' : `<button id="m-confirm" style="flex:1; background:#166534; color:#fff; border:none; padding:12px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:bold;">ДАЛЕЕ →</button>`}
                        </div>
                    </div>
                </div>
            </div>`;

            document.body.insertAdjacentHTML('beforeend', html);
            const m = document.getElementById(modalId);

            if(isSettings) {
                m.querySelectorAll('.rank-opt').forEach(b => b.onclick = () => {
                    localStorage.setItem('riv_nick', document.getElementById('set-nick').value);
                    localStorage.setItem('riv_rank', b.dataset.v);
                    m.remove(); location.reload();
                });
            }
            if(options) m.querySelectorAll('.opt-btn').forEach(b => b.onclick = () => { resolve(b.dataset.v); m.remove(); });
            m.querySelector('#m-confirm')?.addEventListener('click', () => { resolve(m.querySelector('#modal-field')?.value || true); m.remove(); });
            m.querySelector('#m-cancel').onclick = () => { m.remove(); resolve(false); };
        });
    }

    // --- 4. ПАНЕЛЬ УПРАВЛЕНИЯ ---
    function createUI() {
        if (document.getElementById('rivera-panel')) return;
        const panel = document.createElement('div');
        panel.id = 'rivera-panel';
        panel.style = "position:fixed; bottom:20px; right:15px; width:160px; background:rgba(30,30,39,0.98); border:2px solid #3b82f6; border-radius:15px; z-index:10000; padding:12px; display:flex; flex-direction:column; gap:6px; box-shadow:0 10px 30px rgba(0,0,0,0.5);";
        
        panel.innerHTML = `
            <div style="color:#fff; font-size:10px; font-weight:bold; text-align:center; border-bottom:1px solid #333; padding-bottom:5px;">УМВД LIME</div>
            <button class="r-btn" data-t="ok" style="background:#166534;">ОДОБРИТЬ</button>
            <button class="r-btn" data-t="no" style="background:#7f1d1d;">ОТКАЗАТЬ</button>
            <button class="r-btn" data-t="trans" style="background:#1e40af;">ПЕРЕВОД</button>
            <div id="riv-norm" style="color:#94a3b8; font-size:9px; text-align:center;">Норма: 0</div>
            <button id="r-set" style="background:none; border:1px solid #444; color:#64748b; font-size:9px; padding:5px; border-radius:6px;">⚙️ НАСТРОЙКИ</button>
        `;
        document.body.appendChild(panel);

        document.getElementById('r-set').onclick = () => showModal({ title: 'НАСТРОЙКИ', isSettings: true });

        document.querySelectorAll('.r-btn').forEach(btn => {
            btn.style.cssText += "color:#fff; border:none; padding:10px; border-radius:8px; font-size:10px; font-weight:bold; cursor:pointer;";
            btn.onclick = async () => {
                const type = btn.dataset.t;
                const pNick = await showModal({ title: 'ВВЕДИТЕ НИК ИГРОКА', inputPlaceholder: 'Nick_Name' });
                if(!pNick) return;

                let body = `[CENTER][FONT=Times New Roman]Здравия желаю, уважаемый(-ая) [B]${pNick}[/B].<br><br>`;
                if (type === 'ok') body += `Ваше заявление: [COLOR=rgb(34, 197, 94)][B]ОДОБРЕНО[/B][/COLOR].`;
                else if (type === 'no') {
                    const rsn = await showModal({ title: 'ПРИЧИНА ОТКАЗА', options: REASONS });
                    if(!rsn) return;
                    body += `Ваше заявление: [COLOR=rgb(239, 68, 68)][B]ОТКАЗАНО[/B][/COLOR].<br>Причина: ${rsn}.`;
                } else if (type === 'trans') {
                    const rankTo = prompt("На какой ранг одобрен?");
                    body += `Ваше заявление на перевод: [COLOR=rgb(34, 197, 94)][B]ОДОБРЕНО[/B][/COLOR] на [B]${rankTo}[/B] ранг.`;
                }
                body += `<br><br>С уважением, ${getSetting('riv_rank', 'Сотрудник')} УМВД — ${getSetting('riv_nick', 'Nick')}.[/FONT][/CENTER]`;

                const editor = document.querySelector('.fr-element.fr-view');
                if(editor) {
                    editor.focus();
                    document.execCommand('insertHTML', false, body);
                    sessionWork++;
                    document.getElementById('riv-norm').innerText = `Норма: ${sessionWork}`;
                }
            };
        });
    }

    // Запуск функций
    applyFpsBoost();
    setTimeout(createUI, 2000);
})();
