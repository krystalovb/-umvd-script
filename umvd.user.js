// ==UserScript==
// @name         UMVD Rivera Lime - Ultimate Edition
// @namespace    https://forum.blackrussia.online
// @version      27.0
// @description  Добавлены: Свой ответ, Жалоба, Сержант [3] и др.
// @author       Saint_Rivera & Gemini
// @match        https://forum.blackrussia.online/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const RANKS = ["Рядовой", "Сержант", "Старший Сержант", "Прапорщик", "Лейтенант", "Старший Лейтенант", "Капитан", "Майор", "Подполковник", "Полковник"];
    const REASONS = ["Отсутствие военного билета.", "Скриншоты без /time.", "Скриншотам более 3-х дней.", "Не по форме / нечитаемый шрифт.", "Вы в ЧС фракции.", "Низкая законопослушность.", "Опечатка в паспорте (NonRP)."];
    
    const APPROVE_TYPES = [
        "Обычное одобрение",
        "Свой ответ",
        "Заявка на Сержанта [3]",
        "Повышение в звании", 
        "Снятие выговора", 
        "Рассмотрение жалобы",
        "Перевод",
        "Восстановление",
        "Заявление на отпуск"
    ];

    const INFO_TEXT = `
        <b style="color:#3b82f6;">— КРИТЕРИИ ВСТУПЛЕНИЯ —</b><br>
        • 3-летняя прописка (3 LVL).<br>
        • Военный билет, Мед. карта.<br>
        • Лицензии: В, Оружие.<br>
        • Законопослушность: 30+.<br><br>
        <b style="color:#3b82f6;">— ПРАВИЛА ПЕРЕВОДОВ —</b><br>
        • Из МО: -1 ранг.<br>
        • Из ГИБДД: без потери.<br>
        • Из ФСБ: +1 ранг.<br>
        • Из ФСИН: -1 ранг.
    `;

    const getSetting = (key, def) => localStorage.getItem(key) || def;

    function fixNick(nick) {
        if (!nick) return "";
        return nick.trim().replace(/\s+/g, '_').split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('_');
    }

    function detectNickname() {
        const posts = document.querySelectorAll('.bbWrapper');
        if (posts.length > 0) {
            const lastText = posts[posts.length - 1].innerText;
            const match = lastText.match(/([A-Z][a-z]+_[A-Z][a-z]+)/);
            return match ? match[0] : "";
        }
        return "";
    }

    function showModal({ title, message = "", options = null, isSettings = false, isTextArea = false, isQuestion = false, isInfo = false, inputPlaceholder = "" }) {
        return new Promise((resolve) => {
            const modalId = 'rivera-modal';
            let content = '';

            if (isInfo) {
                content = `<div style="color:#fff; font-size:12px; line-height:1.5; background:#16161e; padding:15px; border-radius:10px; border:1px solid #333;">${INFO_TEXT}</div>`;
            } else if (isSettings) {
                content = `
                <input id="set-nick" type="text" placeholder="Ваш Ник" value="${getSetting('riv_nick', '')}" style="width:100%; background:#16161e; border:1px solid #3b82f644; border-radius:8px; padding:10px; color:#fff; margin-bottom:10px;">
                <input id="set-sign" type="text" placeholder="Ваша Подпись" value="${getSetting('riv_sign', '')}" style="width:100%; background:#16161e; border:1px solid #3b82f644; border-radius:8px; padding:10px; color:#fff; margin-bottom:10px;">
                <p style="color:#94a3b8; font-size:11px; margin-bottom:5px;">Ваш ранг:</p>
                <div style="display:grid; gap:5px; max-height:140px; overflow-y:auto; border:1px solid #333; padding:5px; border-radius:8px;">
                    ${RANKS.map(r => `<button class="rank-opt" data-v="${r}" style="background:#2d2d3a; color:#fff; border:none; padding:8px; border-radius:6px; font-size:11px; cursor:pointer;">${r}</button>`).join('')}
                </div>`;
            } else if (options) {
                content = `<div style="display:grid; gap:3px; max-height:250px; overflow-y:auto;">${options.map(o => `<button class="opt-btn" data-v="${o}" style="background:#2d2d3a; color:#fff; border:1px solid #444; padding:8px; border-radius:6px; font-size:11px; cursor:pointer; text-align:left;">${o}</button>`).join('')}</div>`;
            } else if (isTextArea) {
                content = `<textarea id="modal-field" placeholder="${inputPlaceholder}" style="width:100%; height:120px; background:#16161e; border:1px solid #3b82f644; border-radius:8px; padding:10px; color:#fff; resize:none; font-size:12px;"></textarea>`;
            } else if (!isQuestion) {
                content = `<input id="modal-field" type="text" placeholder="${inputPlaceholder}" value="${inputPlaceholder === 'Nick_Name' ? detectNickname() : ''}" style="width:100%; background:#16161e; border:1px solid #3b82f644; border-radius:8px; padding:10px; color:#fff;">`;
            }

            const html = `
            <div id="${modalId}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); backdrop-filter:blur(4px); z-index:30000; display:flex; align-items:center; justify-content:center; font-family:sans-serif;">
                <div style="background:#1e1e27; width:90%; max-width:380px; border-radius:15px; border:1px solid #333; overflow:hidden;">
                    <div style="padding:15px; background:#3b82f622; color:#fff; font-weight:bold; text-align:center; font-size:13px;">${title}</div>
                    <div style="padding:20px;">
                        ${message ? `<p style="color:#94a3b8; font-size:12px; margin-bottom:10px; text-align:center;">${message}</p>` : ''}
                        ${content}
                        <div style="display:flex; gap:10px; margin-top:20px;">
                            <button id="m-cancel" style="flex:1; background:#334155; color:#fff; border:none; padding:12px; border-radius:8px; cursor:pointer;">${(isQuestion || isInfo) ? 'НЕТ' : 'ОТМЕНА'}</button>
                            ${(options || isSettings || isInfo) ? '' : `<button id="m-confirm" style="flex:1; background:#166534; color:#fff; border:none; padding:12px; border-radius:8px; cursor:pointer; font-weight:bold;">${isQuestion ? 'ДА' : 'ДАЛЕЕ →'}</button>`}
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

    function createUI() {
        if (document.getElementById('rivera-panel')) return;
        const panel = document.createElement('div');
        panel.id = 'rivera-panel';
        panel.style = "position:fixed; bottom:20px; right:15px; width:165px; background:rgba(30,30,39,0.98); border:2px solid #3b82f6; border-radius:15px; z-index:10000; padding:12px; display:flex; flex-direction:column; gap:6px; box-shadow:0 10px 30px rgba(0,0,0,0.5);";
        
        panel.innerHTML = `
            <div style="color:#fff; font-size:10px; font-weight:bold; text-align:center; border-bottom:1px solid #333; padding-bottom:5px;">УМВД LIME</div>
            <button class="r-btn" data-t="ok" style="background:#166534;">ОДОБРИТЬ</button>
            <button class="r-btn" data-t="no" style="background:#7f1d1d;">ОТКАЗАТЬ</button>
            <button class="r-btn" data-t="res" style="background:#374151;">ИТОГИ</button>
            <button id="r-info" style="background:#ca8a04; color:#fff; border:none; padding:8px; border-radius:8px; font-size:10px; font-weight:bold; cursor:pointer;">ℹ️ ШПАРГАЛКА</button>
            <button id="r-set" style="background:none; border:1px solid #444; color:#64748b; font-size:9px; padding:6px; border-radius:6px; margin-top:2px;">⚙️ НАСТРОЙКИ</button>
        `;
        document.body.appendChild(panel);

        document.getElementById('r-info').onclick = () => showModal({ title: 'СПРАВОЧНИК УМВД', isInfo: true });
        document.getElementById('r-set').onclick = () => showModal({ title: 'НАСТРОЙКИ', isSettings: true });

        document.querySelectorAll('.r-btn').forEach(btn => {
            btn.style.cssText += "color:#fff; border:none; padding:10px; border-radius:8px; font-size:10px; font-weight:bold; cursor:pointer;";
            btn.onclick = async () => {
                const type = btn.dataset.t;
                let body = "";

                if (type === 'res') {
                    const okList = await showModal({ title: 'ИТОГИ', message: 'Одобренные ники:', isTextArea: true });
                    const noList = await showModal({ title: 'ИТОГИ', message: 'Причины отказов:', isTextArea: true });
                    body = `[CENTER][B][SIZE=5][COLOR=rgb(30, 144, 255)]ИТОГИ ПРОВЕРКИ ЗАЯВЛЕНИЙ УМВД[/COLOR][/SIZE][/B]<br><br>[LEFT][COLOR=rgb(34, 197, 94)]ОДОБРЕНО:[/COLOR]<br>${okList || '-'}<br><br>[COLOR=rgb(239, 68, 68)]ОТКАЗАНО:[/COLOR]<br>${noList || '-'}[/LEFT]`;
                } else {
                    const pNick = await showModal({ title: 'ВВЕДИТЕ НИК ИГРОКА', inputPlaceholder: 'Nick_Name' });
                    if(!pNick) return;
                    
                    if (type === 'ok') {
                        const subType = await showModal({ title: 'ТИП ОДОБРЕНИЯ', options: APPROVE_TYPES });
                        if(!subType) return;
                        
                        body = `[CENTER][FONT=Times New Roman]Здравия желаю, уважаемый(-ая) [B]${pNick}[/B].<br><br>`;
                        
                        if(subType === "Обычное одобрение") body += `Ваше заявление: [COLOR=rgb(34, 197, 94)][B]ОДОБРЕНО[/B][/COLOR].`;
                        else if(subType === "Свой ответ") {
                            const custom = await showModal({ title: 'СВОЙ ТЕКСТ', isTextArea: true, inputPlaceholder: 'Введите ваш текст ответа...' });
                            body += `${custom}`;
                        }
                        else if(subType === "Заявка на Сержанта [3]") body += `Ваше заявление на Сержанта [3]: [COLOR=rgb(34, 197, 94)][B]ОДОБРЕНО[/B][/COLOR].<br>Ждём вас в здании УМВД.`;
                        else if(subType === "Повышение в звании") {
                            const newRank = await showModal({ title: 'ПОВЫШЕНИЕ', inputPlaceholder: 'Новый ранг' });
                            body += `Ваше заявление на повышение: [COLOR=rgb(34, 197, 94)][B]ОДОБРЕНО[/B][/COLOR] на [B]${newRank}[/B] ранг.`;
                        } else if(subType === "Снятие выговора") {
                            body += `Ваше заявление на снятие дисциплинарного взыскания: [COLOR=rgb(34, 197, 94)][B]ОДОБРЕНО[/B][/COLOR].`;
                        } else if(subType === "Рассмотрение жалобы") {
                            const punish = await showModal({ title: 'ЖАЛОБА', options: ["Сотрудник получит выговор", "С сотрудником будет проведена беседа", "Сотрудник будет уволен"] });
                            body += `Ваша жалоба: [COLOR=rgb(34, 197, 94)][B]ОДОБРЕНА[/B][/COLOR].<br>${punish}.`;
                        } else if(subType === "Перевод") {
                            const trRank = await showModal({ title: 'ПЕРЕВОД', inputPlaceholder: 'На какой ранг (с учетом правил)?' });
                            body += `Ваше заявление на перевод: [COLOR=rgb(34, 197, 94)][B]ОДОБРЕНО[/B][/COLOR] на [B]${trRank}[/B] ранг.`;
                        } else if(subType === "Восстановление") {
                            const oldR = await showModal({ title: 'ВОССТАНОВЛЕНИЕ', inputPlaceholder: 'Бывший ранг' });
                            body += `Ваше заявление на восстановление: [COLOR=rgb(34, 197, 94)][B]ОДОБРЕНО[/B][/COLOR] на [B]${parseInt(oldR)-2 || 1}[/B] ранг.`;
                        } else if(subType === "Заявление на отпуск") body += `Ваше заявление на отпуск: [COLOR=rgb(34, 197, 94)][B]ОДОБРЕНО[/B][/COLOR].`;
                        
                    } else if (type === 'no') {
                        const rsn = await showModal({ title: 'ПРИЧИНА ОТКАЗА', options: REASONS });
                        if(!rsn) return;
                        body = `[CENTER][FONT=Times New Roman]Здравия желаю, уважаемый(-ая) [B]${pNick}[/B].<br><br>Ваше заявление: [COLOR=rgb(239, 68, 68)][B]ОТКАЗАНО[/B][/COLOR].<br>Причина: ${rsn}.`;
                    }
                }

                const signConfirm = await showModal({ title: 'ПОДПИСЬ', message: 'Добавить вашу роспись в ответ?', isQuestion: true });
                if (signConfirm) {
                    body += `<br><br>С уважением, ${getSetting('riv_rank', 'Сотрудник')} УМВД — ${getSetting('riv_nick', 'Nick')}.<br>[I]${getSetting('riv_sign', 'Rivera')}[/I]`;
                }

                const now = new Date();
                body += `<br>[SIZE=1][COLOR=rgb(148, 163, 184)]Дата: ${now.toLocaleDateString()} | LIME SERVER[/COLOR][/SIZE][/FONT][/CENTER]`;

                const editor = document.querySelector('.fr-element.fr-view');
                if(editor) { editor.focus(); document.execCommand('insertHTML', false, body); }
            };
        });
    }

    setTimeout(createUI, 2000);
})();
