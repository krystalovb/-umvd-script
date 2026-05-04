// ==UserScript==
// @name         UMVD Rivera Lime Station
// @namespace    https://forum.blackrussia.online
// @version      17.0
// @description  Таймер для раздела УМВД Lime, русификация и управление панелью
// @author       Saint_Rivera & Gemini
// @match        https://forum.blackrussia.online/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const TARGET_FORUM_ID = 340; // ID раздела УМВД
    const RANKS = ["Рядовой", "Сержант", "Старший Сержант", "Прапорщик", "Лейтенант", "Старший Лейтенант", "Капитан", "Майор", "Подполковник", "Полковник"];
    const REASONS = ["Отсутствие военного билета.", "Скриншоты без /time.", "Скриншотам более 3-х дней.", "Не по форме / нечитаемый шрифт.", "Вы в ЧС фракции.", "Низкая законопослушность.", "Опечатка в паспорте (NonRP)."];

    const getSetting = (key, def) => localStorage.getItem(key) || def;

    // Функция проверки, находимся ли мы в нужном разделе для таймера
    function isUmvdForum() {
        return window.location.href.includes(`forums/%D0%A3%D0%9C%D0%92%D0%94.${TARGET_FORUM_ID}`);
    }

    function getTopicIdleTime() {
        if (!isUmvdForum()) return null;
        const lastPostTimeElement = document.querySelector('.message:last-child .u-dt');
        if (!lastPostTimeElement) return null;
        
        const lastPostTimestamp = new Date(lastPostTimeElement.getAttribute('data-time') * 1000);
        const now = new Date();
        const diffMs = now - lastPostTimestamp;
        return Math.floor(diffMs / (1000 * 60 * 60));
    }

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
            }
        }, 500);
    }

    function showModal({ title, message, options = null, isTextArea = false, isConfirm = false, isSettings = false, inputPlaceholder = "" }) {
        return new Promise((resolve) => {
            const modalId = 'rivera-modal';
            let content = '';

            if (isSettings) {
                content = `<div style="display:flex; flex-direction:column; gap:8px;">
                    <input id="set-nick" type="text" placeholder="Ник" value="${getSetting('riv_nick', '')}" style="background:#16161e; border:1px solid #3b82f644; border-radius:8px; padding:10px; color:#fff;">
                    <select id="set-rank" style="background:#16161e; border:1px solid #3b82f644; border-radius:8px; padding:10px; color:#fff;">
                        ${RANKS.map(r => `<option value="${r}" ${r === getSetting('riv_rank', '') ? 'selected' : ''}>${r}</option>`).join('')}
                    </select>
                    <input id="set-sign" type="text" placeholder="Подпись" value="${getSetting('riv_sign', '')}" style="background:#16161e; border:1px solid #3b82f644; border-radius:8px; padding:10px; color:#fff;">
                </div>`;
            } else if (options) {
                content = `<div style="display:grid; gap:5px;">${options.map(o => `<button class="opt-btn" data-v="${o}" style="background:#2d2d3a; color:#fff; border:1px solid #444; padding:8px; border-radius:6px; font-size:11px; cursor:pointer; text-align:left;">${o}</button>`).join('')}</div>`;
            } else {
                const detectNick = () => {
                    const lastMessage = document.querySelector('.message:last-child .message-inner .message-body .bbWrapper');
                    if (lastMessage) {
                        const match = lastMessage.innerText.match(/([A-Z][a-z]+_[A-Z][a-z]+)/);
                        return match ? match[0] : '';
                    }
                    return '';
                };
                content = isConfirm ? '' : (isTextArea 
                    ? `<textarea id="modal-field" style="width:100%; background:#16161e; border:1px solid #3b82f644; border-radius:8px; padding:10px; color:#fff; height:80px;"></textarea>`
                    : `<input id="modal-field" type="text" value="${inputPlaceholder.includes('Nick_Name') ? detectNick() : ''}" style="width:100%; background:#16161e; border:1px solid #3b82f644; border-radius:8px; padding:10px; color:#fff;">`
                );
            }

            const html = `<div id="${modalId}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); backdrop-filter:blur(5px); z-index:30000; display:flex; align-items:center; justify-content:center; font-family:sans-serif;">
                <div style="background:#1e1e27; width:400px; border-radius:15px; border:1px solid #333; overflow:hidden; box-shadow:0 20px 50px rgba(0,0,0,0.5);">
                    <div style="padding:15px; background:#3b82f622; color:#fff; font-weight:bold; text-align:center; font-size:13px;">${title}</div>
                    <div style="padding:20px;">
                        ${message ? `<p style="color:#94a3b8; font-size:12px; margin-bottom:15px;">${message}</p>` : ''}
                        ${content}
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
                } else {
                    resolve(m.querySelector('#modal-field')?.value || true); m.remove();
                }
            });
            m.querySelector('#m-cancel').onclick = () => { m.remove(); resolve(false); };
        });
    }

    function createUI() {
        if (document.getElementById('rivera-panel')) return;
        const panel = document.createElement('div');
        panel.id = 'rivera-panel';
        
        const idleHours = getTopicIdleTime();
        const timerHtml = idleHours !== null && idleHours >= 24 
            ? `<div style="background:#7f1d1d; color:#f87171; font-size:9px; padding:4px; border-radius:5px; margin-bottom:8px; text-align:center; font-weight:bold;">ВРЕМЯ БЕЗ ОТВЕТА: ${idleHours}ч.</div>` 
            : '';

        panel.style = "position:fixed; top:50%; right:15px; transform:translateY(-50%); width:180px; background:rgba(30,30,39,0.9); backdrop-filter:blur(10px); border-radius:15px; z-index:10000; border:1px solid #444; padding:12px; display:flex; flex-direction:column; gap:8px; box-shadow:0 10px 30px rgba(0,0,0,0.5);";
        
        panel.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #333; padding-bottom:5px;">
                <div style="color:#fff; font-size:10px; font-weight:900;">УМВД LIME</div>
                <div id="close-panel" style="color:#64748b; cursor:pointer; font-weight:bold; font-size:14px;">&times;</div>
            </div>
            ${timerHtml}
            <button class="r-btn" data-t="ok" style="background:#166534;">ОДОБРИТЬ</button>
            <button class="r-btn" data-t="no" style="background:#7f1d1d;">ОТКАЗАТЬ</button>
            <button class="r-btn" data-t="res" style="background:#374151;">ИТОГИ</button>
            <button id="r-set" style="background:none; border:1px solid #444; color:#64748b; font-size:10px; padding:5px; border-radius:5px; cursor:pointer;">⚙️ ПЕРСОНАЛИЗАЦИЯ</button>
        `;

        const openBtn = document.createElement('div');
        openBtn.id = 'rivera-open-btn';
        openBtn.style = "position:fixed; top:50%; right:0; transform:translateY(-50%); background:#3b82f6; color:#fff; padding:10px 5px; border-radius:10px 0 0 10px; cursor:pointer; z-index:9999; display:none; font-weight:bold;";
        openBtn.innerText = "R";

        document.body.appendChild(panel);
        document.body.appendChild(openBtn);

        document.getElementById('close-panel').onclick = () => { panel.style.display = 'none'; openBtn.style.display = 'block'; };
        openBtn.onclick = () => { panel.style.display = 'flex'; openBtn.style.display = 'none'; };
        document.getElementById('r-set').onclick = () => showModal({ title: 'НАСТРОЙКИ', isSettings: true });

        document.querySelectorAll('.r-btn').forEach(btn => {
            btn.style.cssText += "color:#fff; border:none; padding:10px; border-radius:8px; cursor:pointer; font-size:10px; font-weight:bold;";
            btn.onclick = async () => {
                const type = btn.dataset.t;
                const nick = getSetting('riv_nick', 'Nick');
                const rank = getSetting('riv_rank', 'Звание');
                const sign = getSetting('riv_sign', 'Police');
                const date = new Date().toLocaleString();
                let body = "";

                if (type === 'res') {
                    const a = await showModal({ title: 'ИТОГИ', message: 'Одобренные:', isTextArea: true });
                    const r = await showModal({ title: 'ИТОГИ', message: 'Отказанные:', isTextArea: true });
                    body = `[B][SIZE=5][COLOR=rgb(30, 144, 255)]ИТОГИ ПРОВЕРКИ УМВД[/COLOR][/SIZE][/B]<br><br>[LEFT][COLOR=rgb(34, 197, 94)]ОДОБРЕНО:[/COLOR]<br>${a}<br><br>[COLOR=rgb(239, 68, 68)]ОТКАЗАНО:[/COLOR]<br>${r}[/LEFT]`;
                } else {
                    const pNick = await showModal({ title: 'НИК ИГРОКА', inputPlaceholder: 'Nick_Name' });
                    if(!pNick) return;
                    body = `Здравия желаю, уважаемый(-ая) [B]${pNick}[/B].<br><br>`;
                    if (type === 'ok') body += `Ваше заявление рассмотрено. Вердикт: [B][COLOR=rgb(34, 197, 94)]ОДОБРЕНО[/COLOR][/B].`;
                    else {
                        const rsn = await showModal({ title: 'ПРИЧИНА', options: [...REASONS, "Своя причина..."] });
                        const finalRsn = (rsn === "Своя причина...") ? await showModal({ title: 'СВОЯ ПРИЧИНА', isTextArea: true }) : rsn;
                        body += `Ваше заявление рассмотрено. Вердикт: [B][COLOR=rgb(239, 68, 68)]ОТКАЗАНО[/COLOR][/B].<br>Причина: ${finalRsn}.`;
                    }
                }

                const s = await showModal({ title: 'ПОДПИСЬ', isConfirm: true });
                if(s) body += `<br><br>С уважением, ${rank} УМВД ${nick}.<br>[I]${sign}[/I]<br>[SIZE=1][COLOR=grey]Время: ${date} | LIME SERVER[/COLOR][/SIZE]`;
                quoteAndAppend(body);
            };
        });
    }

    setInterval(createUI, 1000);
})();
