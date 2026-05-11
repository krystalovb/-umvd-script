// ==UserScript==
// @name         UMVD Rivera Lime - Liquid Island Final
// @namespace    https://forum.blackrussia.online
// @version      40.0
// @description  Свои ответы в одобрялках/отказах + фикс тегов
// @author       Saint_Rivera & Gemini
// @match        https://forum.blackrussia.online/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const RANKS = ["Рядовой", "Сержант", "Старший Сержант", "Прапорщик", "Лейтенант", "Старший Лейтенант", "Капитан", "Майор", "Подполковник", "Полковник"];
    const REASONS = ["Свой ответ", "Отсутствие военного билета.", "Скриншоты без /time.", "Скриншотам более 3-х дней.", "Не по форме / нечитаемый шрифт.", "Низкая законопослушность (менее 30).", "Опечатка в паспорте (NonRP Nick).", "Битые ссылки."];
    const APPROVE_TYPES = ["Обычное одобрение", "Свой ответ", "Заявка на Сержанта [3]", "Повышение в звании", "Снятие выговора", "Перевод", "Восстановление"];

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
                <input id="set-nick" type="text" placeholder="Ваш Ник" value="${getSetting('riv_nick', '')}" style="width:100%; background:#1c1c1e; border:1px solid #333; border-radius:10px; padding:12px; color:#fff; margin-bottom:10px;">
                <input id="set-sign" type="text" placeholder="Ваша Подпись" value="${getSetting('riv_sign', '')}" style="width:100%; background:#1c1c1e; border:1px solid #333; border-radius:10px; padding:12px; color:#fff; margin-bottom:10px;">
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px; max-height:140px; overflow-y:auto;">
                    ${RANKS.map(r => `<button class="rank-opt" data-v="${r}" style="background:#2c2c2e; color:#fff; border:none; padding:8px; border-radius:8px; font-size:10px; cursor:pointer;">${r}</button>`).join('')}
                </div>`;
            } else if (options) {
                content = `<div style="display:grid; gap:6px; max-height:280px; overflow-y:auto;">${options.map(o => `<button class="opt-btn" data-v="${o}" style="background:#2c2c2e; border:1px solid #333; color:#fff; padding:10px; border-radius:10px; font-size:11px; cursor:pointer; text-align:left;">${o}</button>`).join('')}</div>`;
            } else if (isTextArea) {
                content = `<textarea id="modal-field" placeholder="${inputPlaceholder}" style="width:100%; height:110px; background:#1c1c1e; border:1px solid #333; border-radius:12px; padding:12px; color:#fff; resize:none; font-size:12px;"></textarea>`;
            } else if (!isQuestion) {
                content = `<input id="modal-field" type="text" placeholder="${inputPlaceholder}" value="${inputPlaceholder === 'Nick_Name' ? detectNickname() : ''}" style="width:100%; background:#1c1c1e; border:1px solid #333; border-radius:12px; padding:12px; color:#fff;">`;
            }

            const html = `
            <div id="${modalId}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); backdrop-filter:blur(8px); z-index:999999; display:flex; align-items:center; justify-content:center; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <div style="background:rgba(28, 28, 30, 0.95); width:360px; border-radius:24px; border:1px solid rgba(255,255,255,0.1); overflow:hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
                    <div style="padding:18px; background:rgba(255,255,255,0.03); color:#fff; font-weight:600; text-align:center; border-bottom:1px solid rgba(255,255,255,0.05);">${title}</div>
                    <div style="padding:24px;">
                        ${message ? `<p style="color:#8e8e93; font-size:13px; margin-bottom:15px; text-align:center;">${message}</p>` : ''}
                        ${content}
                        <div style="display:flex; gap:12px; margin-top:24px;">
                            <button id="m-cancel" style="flex:1; background:#3a3a3c; color:#fff; border:none; padding:14px; border-radius:14px; cursor:pointer; font-weight:500;">${isQuestion ? 'НЕТ' : 'ОТМЕНА'}</button>
                            ${(options || isSettings) ? '' : `<button id="m-confirm" style="flex:1; background:#007aff; color:#fff; border:none; padding:14px; border-radius:14px; cursor:pointer; font-weight:600;">${isQuestion ? 'ДА' : 'ДАЛЕЕ'}</button>`}
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
        container.id = 'rivera-island-container';
        container.style = "position:fixed; top:50%; right:15px; transform:translateY(-50%); z-index:10000; display:flex; flex-direction:column; align-items:flex-end; font-family:sans-serif;";

        const island = document.createElement('div');
        island.id = 'rivera-island';
        island.style = "width:50px; height:50px; background:rgba(0,0,0,0.85); backdrop-filter:blur(15px); border-radius:25px; border:1px solid rgba(255,255,255,0.1); display:flex; flex-direction:column; align-items:center; justify-content:center; transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); overflow:hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3); cursor:pointer;";
        
        const islandContent = document.createElement('div');
        islandContent.style = "display:none; opacity:0; width:160px; padding:15px; flex-direction:column; gap:8px; transition: 0.3s;";
        islandContent.innerHTML = `
            <div style="color:#fff; font-size:11px; font-weight:700; text-align:center; letter-spacing:1px; margin-bottom:5px;">УМВД LIME</div>
            <button class="r-btn" data-t="ok" style="background:#28cd41; color:#fff;">ОДОБРИТЬ</button>
            <button class="r-btn" data-t="no" style="background:#ff3b30; color:#fff;">ОТКАЗАТЬ</button>
            <button class="r-btn" data-t="res" style="background:#5856d6; color:#fff;">ИТОГИ</button>
            <button id="r-set" style="background:rgba(255,255,255,0.1); color:#fff; border:none; padding:8px; border-radius:10px; font-size:10px; margin-top:5px; cursor:pointer;">НАСТРОЙКИ</button>
        `;

        const icon = document.createElement('div');
        icon.innerHTML = "🛡️";
        icon.style = "font-size:20px; transition: 0.3s;";

        island.appendChild(icon);
        island.appendChild(islandContent);
        container.appendChild(island);
        document.body.appendChild(container);

        let isOpen = false;
        island.onclick = (e) => {
            if (e.target.closest('.r-btn') || e.target.id === 'r-set') return;
            isOpen = !isOpen;
            if (isOpen) {
                island.style.width = "180px";
                island.style.height = "260px";
                island.style.borderRadius = "30px";
                icon.style.display = "none";
                islandContent.style.display = "flex";
                setTimeout(() => islandContent.style.opacity = "1", 100);
            } else {
                islandContent.style.opacity = "0";
                setTimeout(() => {
                    islandContent.style.display = "none";
                    icon.style.display = "block";
                    island.style.width = "50px";
                    island.style.height = "50px";
                    island.style.borderRadius = "25px";
                }, 200);
            }
        };

        document.getElementById('r-set').onclick = () => showModal({ title: 'КОНФИГУРАЦИЯ', isSettings: true });

        document.querySelectorAll('.r-btn').forEach(btn => {
            btn.style.cssText += "border:none; padding:12px; border-radius:15px; font-size:11px; font-weight:700; cursor:pointer; transition:0.2s;";
            btn.onclick = async () => {
                const type = btn.dataset.t;
                let body = "";

                if (type === 'res') {
                    const customTitle = await showModal({ title: 'ЗАГОЛОВОК ИТОГОВ', inputPlaceholder: 'ИТОГИ ПРОВЕРКИ ЗАЯВЛЕНИЙ' });
                    const okList = await showModal({ title: 'ОДОБРЕНО', message: 'Введите ники через перенос строки:', isTextArea: true });
                    const noList = await showModal({ title: 'ОТКАЗАНО', message: 'Введите причины:', isTextArea: true });
                    const finalTitle = customTitle || "ИТОГИ ПРОВЕРКИ ЗАЯВЛЕНИЙ";
                    body = `[CENTER][FONT=Times New Roman][B][SIZE=5][COLOR=rgb(30, 144, 255)]${finalTitle}[/COLOR][/SIZE][/B]<br><br>[LEFT][COLOR=rgb(34, 197, 94)]ОДОБРЕНО:[/COLOR]<br>${okList || '-'}<br><br>[COLOR=rgb(239, 68, 68)]ОТКАЗАНО:[/COLOR]<br>${noList || '-'}[/LEFT][/FONT][/CENTER]`;
                } else {
                    const pNick = await showModal({ title: 'НИК ИГРОКА', inputPlaceholder: 'Nick_Name' });
                    if(!pNick) return;
                    
                    body = `[CENTER][FONT=Times New Roman]Здравия желаю, уважаемый(-ая) [B]${pNick}[/B].<br><br>`;
                    
                    if (type === 'ok') {
                        let subType = await showModal({ title: 'ВЕРДИКТ', options: APPROVE_TYPES });
                        if(!subType) return;
                        if(subType === "Свой ответ") {
                            subType = await showModal({ title: 'СВОЙ ТЕКСТ ОДОБРЕНИЯ', isTextArea: true });
                            body += `${subType}`;
                        } else {
                            body += `Ваше заявление: [COLOR=rgb(34, 197, 94)][B]ОДОБРЕНО[/B][/COLOR].`;
                        }
                    } else if (type === 'no') {
                        let rsn = await showModal({ title: 'ПРИЧИНА', options: REASONS });
                        if(!rsn) return;
                        if(rsn === "Свой ответ") {
                            rsn = await showModal({ title: 'СВОЯ ПРИЧИНА', isTextArea: true });
                        }
                        body += `Ваше заявление: [COLOR=rgb(239, 68, 68)][B]ОТКАЗАНО[/B][/COLOR].<br>Причина: ${rsn}`;
                    }
                }

                const signConfirm = await showModal({ title: 'ПОДПИСЬ', message: 'Поставить печать и подпись?', isQuestion: true });
                if (signConfirm) {
                    body += `<br><br>С уважением, ${getSetting('riv_rank', 'Сотрудник')} УМВД — ${getSetting('riv_nick', 'Nick')}.<br>[I]${getSetting('riv_sign', 'Rivera')}[/I]`;
                }
                
                body += `<br>[SIZE=1][COLOR=rgb(148, 163, 184)]ДЕЖУРНАЯ ЧАСТЬ МВД | LIME<br>Дата: ${new Date().toLocaleDateString()}[/COLOR][/SIZE][/FONT][/CENTER]`;
                insertToEditor(body);
            };
        });
    }

    setTimeout(createUI, 2000);
})();
