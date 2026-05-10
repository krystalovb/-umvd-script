// ==UserScript==
// @name         UMVD Rivera Lime - Pro Edition
// @namespace    https://forum.blackrussia.online
// @version      35.0
// @description  Стабильная панель, вставка вниз и сворачивание
// @author       Saint_Rivera & Gemini
// @match        https://forum.blackrussia.online/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const RANKS = ["Рядовой", "Сержант", "Старший Сержант", "Прапорщик", "Лейтенант", "Старший Лейтенант", "Капитан", "Майор", "Подполковник", "Полковник"];
    const REASONS = ["Свой ответ", "Отсутствие военного билета.", "Скриншоты без /time.", "Скриншотам более 3-х дней.", "Не по форме / нечитаемый шрифт.", "Низкая законопослушность (менее 30).", "Опечатка в паспорте (NonRP Nick).", "Битые ссылки."];
    const APPROVE_TYPES = ["Обычное одобрение", "Заявка на Сержанта [3]", "Повышение в звании", "Снятие выговора", "Перевод", "Восстановление"];

    const getSetting = (key, def) => localStorage.getItem(key) || def;

    function fixNick(nick) {
        if (!nick) return "";
        return nick.trim().replace(/\s+/g, '_').split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('_');
    }

    function detectNickname() {
        const posts = document.querySelectorAll('.bbWrapper');
        if (posts.length === 0) return "";
        const lastPostText = posts[posts.length - 1].innerText;
        const myNick = getSetting('riv_nick', '').toLowerCase();
        const regex = /([A-Z][a-z]+_[A-Z][a-z]+)/g;
        const matches = lastPostText.match(regex);
        if (matches) {
            const filtered = matches.filter(n => n.toLowerCase() !== myNick);
            return filtered.length > 0 ? filtered[filtered.length - 1] : "";
        }
        return "";
    }

    async function showModal({ title, message = "", options = null, isSettings = false, isTextArea = false, isQuestion = false, inputPlaceholder = "" }) {
        return new Promise((resolve) => {
            const modalId = 'rivera-modal';
            let content = '';

            if (isSettings) {
                content = `
                <input id="set-nick" type="text" placeholder="Ваш Ник" value="${getSetting('riv_nick', '')}" style="width:100%; background:#16161e; border:1px solid #3b82f644; border-radius:8px; padding:10px; color:#fff; margin-bottom:10px;">
                <input id="set-sign" type="text" placeholder="Ваша Подпись" value="${getSetting('riv_sign', '')}" style="width:100%; background:#16161e; border:1px solid #3b82f644; border-radius:8px; padding:10px; color:#fff; margin-bottom:10px;">
                <div style="display:grid; gap:5px; max-height:140px; overflow-y:auto;">
                    ${RANKS.map(r => `<button class="rank-opt" data-v="${r}" style="background:#2d2d3a; color:#fff; border:none; padding:8px; border-radius:6px; font-size:11px; cursor:pointer;">${r}</button>`).join('')}
                </div>`;
            } else if (options) {
                content = `<div style="display:grid; gap:3px; max-height:280px; overflow-y:auto;">${options.map(o => `<button class="opt-btn" data-v="${o}" style="background:#2d2d3a; border:1px solid #444; color:#fff; padding:8px; border-radius:6px; font-size:11px; cursor:pointer; text-align:left;">${o}</button>`).join('')}</div>`;
            } else if (isTextArea) {
                content = `<textarea id="modal-field" placeholder="${inputPlaceholder}" style="width:100%; height:100px; background:#16161e; border:1px solid #3b82f644; border-radius:8px; padding:10px; color:#fff; resize:none;"></textarea>`;
            } else if (!isQuestion) {
                content = `<input id="modal-field" type="text" placeholder="${inputPlaceholder}" value="${inputPlaceholder === 'Nick_Name' ? detectNickname() : ''}" style="width:100%; background:#16161e; border:1px solid #3b82f644; border-radius:8px; padding:10px; color:#fff;">`;
            }

            const html = `
            <div id="${modalId}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); backdrop-filter:blur(5px); z-index:999999; display:flex; align-items:center; justify-content:center; font-family:sans-serif;">
                <div style="background:#1e1e27; width:350px; border-radius:15px; border:1px solid #3b82f6; overflow:hidden; box-shadow: 0 0 20px rgba(59,130,246,0.3);">
                    <div style="padding:15px; background:#3b82f6; color:#fff; font-weight:bold; text-align:center;">${title}</div>
                    <div style="padding:20px;">
                        ${message ? `<p style="color:#94a3b8; font-size:12px; margin-bottom:10px; text-align:center;">${message}</p>` : ''}
                        ${content}
                        <div style="display:flex; gap:10px; margin-top:20px;">
                            <button id="m-cancel" style="flex:1; background:#334155; color:#fff; border:none; padding:12px; border-radius:8px; cursor:pointer;">${isQuestion ? 'НЕТ' : 'ОТМЕНА'}</button>
                            ${(options || isSettings) ? '' : `<button id="m-confirm" style="flex:1; background:#166534; color:#fff; border:none; padding:12px; border-radius:8px; cursor:pointer;">${isQuestion ? 'ДА' : 'ДАЛЕЕ'}</button>`}
                        </div>
                    </div>
                </div>
            </div>`;

            document.body.insertAdjacentHTML('beforeend', html);
            const m = document.getElementById(modalId);

            if(isSettings) {
                m.querySelectorAll('.rank-opt').forEach(b => b.onclick = () => {
                    localStorage.setItem('riv_nick', document.getElementById('set-nick').value);
                    localStorage.setItem('riv_sign', document.getElementById('set-sign').value);
                    localStorage.setItem('riv_rank', b.dataset.v);
                    m.remove(); location.reload();
                });
            }
            if(options) m.querySelectorAll('.opt-btn').forEach(b => b.onclick = () => { resolve(b.dataset.v); m.remove(); });
            m.querySelector('#m-confirm')?.addEventListener('click', () => { 
                let val = m.querySelector('#modal-field')?.value || true;
                if(inputPlaceholder === 'Nick_Name') val = fixNick(val);
                resolve(val); m.remove(); 
            });
            m.querySelector('#m-cancel').onclick = () => { m.remove(); resolve(false); };
        });
    }

    function insertToEditor(html) {
        const editor = document.querySelector('.fr-element.fr-view');
        if (editor) {
            editor.focus();
            // Перемещаем курсор в самый конец, чтобы ответ был ПОД цитатой или прошлым текстом
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(editor);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
            
            document.execCommand('insertHTML', false, '<br>' + html);
        }
    }

    function createUI() {
        const container = document.createElement('div');
        container.id = 'rivera-main-container';
        container.style = "position:fixed; top:50%; right:0; transform:translateY(-50%); z-index:10000; display:flex; align-items:center; transition:0.3s;";

        const toggleBtn = document.createElement('div');
        toggleBtn.innerHTML = "🛡️";
        toggleBtn.style = "background:#3b82f6; color:#fff; width:35px; height:50px; display:flex; align-items:center; justify-content:center; border-radius:10px 0 0 10px; cursor:pointer; box-shadow:-2px 0 10px rgba(0,0,0,0.3);";
        
        const panel = document.createElement('div');
        panel.id = 'rivera-panel';
        panel.style = "width:160px; background:#1e1e27; border:1px solid #3b82f6; padding:12px; display:flex; flex-direction:column; gap:8px; box-shadow:-5px 0 20px rgba(0,0,0,0.4); display:none;";

        panel.innerHTML = `
            <div style="color:#fff; font-size:11px; font-weight:bold; text-align:center; border-bottom:1px solid #333; padding-bottom:5px;">УМВД LIME</div>
            <button class="r-btn" data-t="ok" style="background:#166534;">ОДОБРИТЬ</button>
            <button class="r-btn" data-t="no" style="background:#7f1d1d;">ОТКАЗАТЬ</button>
            <button class="r-btn" data-t="res" style="background:#374151;">ИТОГИ</button>
            <button id="r-set" style="background:none; border:1px solid #444; color:#64748b; font-size:10px; padding:6px; border-radius:6px; cursor:pointer;">⚙️ НАСТРОЙКИ</button>
        `;

        container.appendChild(toggleBtn);
        container.appendChild(panel);
        document.body.appendChild(container);

        toggleBtn.onclick = () => {
            const isHidden = panel.style.display === 'none';
            panel.style.display = isHidden ? 'flex' : 'none';
            toggleBtn.style.borderRadius = isHidden ? '0' : '10px 0 0 10px';
        };

        document.getElementById('r-set').onclick = () => showModal({ title: 'НАСТРОЙКИ', isSettings: true });

        document.querySelectorAll('.r-btn').forEach(btn => {
            btn.style.cssText += "color:#fff; border:none; padding:10px; border-radius:8px; font-size:10px; font-weight:bold; cursor:pointer; transition:0.2s;";
            btn.onclick = async () => {
                const type = btn.dataset.t;
                let body = "";

                if (type === 'res') {
                    const okList = await showModal({ title: 'ИТОГИ', message: 'Одобренные ники:', isTextArea: true });
                    const noList = await showModal({ title: 'ИТОГИ', message: 'Причины отказов:', isTextArea: true });
                    body = `[CENTER][B][SIZE=5][COLOR=rgb(30, 144, 255)]ИТОГИ ПРОВЕРКИ ЗАЯВЛЕНИЙ[/COLOR][/SIZE][/B]<br><br>[LEFT][COLOR=rgb(34, 197, 94)]ОДОБРЕНО:[/COLOR]<br>${okList || '-'}<br><br>[COLOR=rgb(239, 68, 68)]ОТКАЗАНО:[/COLOR]<br>${noList || '-'}[/LEFT]`;
                } else {
                    const pNick = await showModal({ title: 'ВВЕДИТЕ НИК ИГРОКА', inputPlaceholder: 'Nick_Name' });
                    if(!pNick) return;
                    
                    body = `[CENTER][FONT=Times New Roman]Здравия желаю, уважаемый(-ая) [B]${pNick}[/B].<br><br>`;
                    
                    if (type === 'ok') {
                        const subType = await showModal({ title: 'ТИП ОДОБРЕНИЯ', options: APPROVE_TYPES });
                        if(!subType) return;
                        body += `Ваше заявление: [COLOR=rgb(34, 197, 94)][B]ОДОБРЕНО[/B][/COLOR].`;
                    } else if (type === 'no') {
                        let rsn = await showModal({ title: 'ПРИЧИНА ОТКАЗА', options: REASONS });
                        if(!rsn) return;
                        if(rsn === "Свой ответ") rsn = await showModal({ title: 'СВОЯ ПРИЧИНА', isTextArea: true });
                        body += `Ваше заявление: [COLOR=rgb(239, 68, 68)][B]ОТКАЗАНО[/B][/COLOR].<br>Причина: ${rsn}`;
                    }
                }

                const signConfirm = await showModal({ title: 'ПОДПИСЬ', message: 'Добавить роспись?', isQuestion: true });
                if (signConfirm) {
                    body += `<br><br>С уважением, ${getSetting('riv_rank', 'Сотрудник')} УМВД — ${getSetting('riv_nick', 'Nick')}.<br>[I]${getSetting('riv_sign', 'Rivera')}[/I]`;
                }
                
                body += `<br>[SIZE=1][COLOR=rgb(148, 163, 184)]Дата: ${new Date().toLocaleDateString()} | LIME[/COLOR][/SIZE][/FONT][/CENTER]`;
                insertToEditor(body);
            };
        });
    }

    setTimeout(createUI, 2000);
})();
