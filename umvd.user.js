// ==UserScript==
// @name         UMVD Rivera Final Helper
// @namespace    https://forum.blackrussia.online
// @version      11.0
// @description  Да/Нет выбор подписи и исправленные итоги кандидатов
// @author       Saint_Rivera & Gemini
// @match        https://forum.blackrussia.online/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const RANKS = ["Рядовой", "Сержант", "Старший Сержант", "Прапорщик", "Лейтенант", "Старший Лейтенант", "Капитан", "Майор", "Подполковник", "Полковник"];

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

    function showModal({ title, message, inputPlaceholder, isTextArea = false, isConfirm = false }) {
        return new Promise((resolve) => {
            const modalId = 'rivera-modal';
            const html = `
                <div id="${modalId}" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 20000; display: flex; align-items: center; justify-content: center; font-family: sans-serif;">
                    <div style="background: #2d2d3a; width: 380px; border-radius: 12px; border: 1px solid #40404f; overflow: hidden; animation: rivSlide 0.3s ease;">
                        <div style="padding: 16px; border-bottom: 1px solid #3a3a4a; display: flex; align-items: center; gap: 10px;">
                            <div style="width: 8px; height: 8px; background: #3b82f6; border-radius: 2px;"></div>
                            <span style="color: #fff; font-weight: bold; font-size: 13px; text-transform: uppercase;">${title}</span>
                        </div>
                        <div style="padding: 20px;">
                            <p style="color: #94a3b8; font-size: 13px; margin-bottom: 15px;">${message}</p>
                            ${isConfirm ? '' : (isTextArea 
                                ? `<textarea id="modal-field" placeholder="${inputPlaceholder}" style="width: 100%; background: #1e1e27; border: 1px solid #40404f; border-radius: 8px; padding: 12px; color: #fff; font-size: 13px; outline: none; height: 120px; resize: none; width: -webkit-fill-available;"></textarea>`
                                : `<input id="modal-field" type="text" placeholder="${inputPlaceholder}" style="width: -webkit-fill-available; background: #1e1e27; border: 1px solid #40404f; border-radius: 8px; padding: 12px; color: #fff; font-size: 13px; outline: none;">`
                            )}
                            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                                <button id="modal-cancel" style="background: #3a3a4a; color: #fff; border: none; padding: 10px 22px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">${isConfirm ? 'НЕТ' : 'ОТМЕНА'}</button>
                                <button id="modal-confirm" style="background: #0d5c3e; color: #fff; border: none; padding: 10px 22px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">${isConfirm ? 'ДА' : 'ПРИНЯТЬ'}</button>
                            </div>
                        </div>
                    </div>
                </div><style>@keyframes rivSlide { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }</style>`;
            document.body.insertAdjacentHTML('beforeend', html);
            const m = document.getElementById(modalId);
            const f = m.querySelector('#modal-field');
            if(f) f.focus();

            m.querySelector('#modal-confirm').onclick = () => { const v = f ? f.value : true; m.remove(); resolve(v); };
            m.querySelector('#modal-cancel').onclick = () => { m.remove(); resolve(false); };
        });
    }

    function createUI() {
        if (document.getElementById('rivera-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'rivera-panel';
        panel.style = "position: fixed; bottom: 20px; right: 20px; width: 260px; background: #2d2d3a; border-radius: 12px; z-index: 10000; border: 1px solid #40404f; overflow: hidden; font-family: sans-serif; box-shadow: 0 10px 30px rgba(0,0,0,0.5);";
        
        panel.innerHTML = `
            <div style="background: #1e1e27; padding: 12px; border-bottom: 1px solid #40404f; display: flex; align-items: center; gap: 8px;">
                <div style="width: 10px; height: 10px; background: #3b82f6; border-radius: 2px;"></div>
                <span style="color: #fff; font-size: 11px; font-weight: bold;">УМВД | RIVERA HELPER</span>
            </div>
            <div style="padding: 12px; display: flex; flex-direction: column; gap: 6px;">
                <select id="rank-select" style="background: #1e1e27; color: #fff; border: 1px solid #40404f; border-radius: 6px; padding: 8px; font-size: 11px; cursor: pointer;">
                    ${RANKS.map(r => `<option value="${r}" ${r === localStorage.getItem('umvd_rank') ? 'selected' : ''}>${r}</option>`).join('')}
                </select>
                <button class="riv-btn" data-type="ok" style="background:#0d5c3e;">✅ ОДОБРЕНО</button>
                <button class="riv-btn" data-type="no" style="background:#7a2e2e;">❌ ОТКАЗАНО</button>
                <button class="riv-btn" data-type="results" style="background:#3b82f6;">📊 ИТОГИ СПИСКОМ</button>
                <div style="margin-top: 5px; border-top: 1px solid #40404f; padding-top: 8px;">
                    <input id="nick-field" type="text" placeholder="Ваш Ник" value="${localStorage.getItem('umvd_nick') || ''}" style="background:#1e1e27; border:1px solid #40404f; color:#fff; font-size:11px; text-align:center; outline:none; width:100%; border-radius:4px; padding:6px;">
                </div>
            </div>`;
        document.body.appendChild(panel);

        document.getElementById('rank-select').onchange = (e) => localStorage.setItem('umvd_rank', e.target.value);
        document.getElementById('nick-field').oninput = (e) => localStorage.setItem('umvd_nick', e.target.value);

        document.querySelectorAll('.riv-btn').forEach(btn => {
            btn.style = btn.getAttribute('style') + "color:white; border:none; padding:10px; border-radius:6px; cursor:pointer; font-size:11px; font-weight:bold; text-align:left; transition: 0.2s;";
            btn.onclick = async () => {
                const rank = localStorage.getItem('umvd_rank');
                const myNick = localStorage.getItem('umvd_nick');
                const type = btn.getAttribute('data-type');
                let body = "";

                if (type === 'results') {
                    // Специальная логика для итогов
                    const approvedList = await showModal({ title: 'ОДОБРЕНО', message: 'Введите ники через запятую или с новой строки:', inputPlaceholder: 'Nick_1, Nick_2...', isTextArea: true });
                    const rejectedList = await showModal({ title: 'ОТКАЗАНО', message: 'Введите ники и причины:', inputPlaceholder: 'Nick - причина...', isTextArea: true });
                    
                    body = `[B][SIZE=5][COLOR=rgb(30, 144, 255)]ИТОГИ РАССМОТРЕНИЯ ЗАЯВЛЕНИЙ УМВД[/COLOR][/SIZE][/B]<br><br>` +
                           `[LEFT][B][COLOR=rgb(34, 197, 94)]КАНДИДАТЫ, ПРОШЕДШИЕ ОТБОР:[/COLOR][/B]<br>${approvedList || 'Список пуст'}<br><br>` +
                           `[B][COLOR=rgb(239, 68, 68)]КАНДИДАТЫ, ПОЛУЧИВШИЕ ОТКАЗ:[/COLOR][/B]<br>${rejectedList || 'Список пуст'}[/LEFT]`;
                } else {
                    // Логика для одиночных ответов
                    const playerNick = await showModal({ title: 'НИК ИГРОКА', message: 'Никнейм игрока:', inputPlaceholder: 'Nick_Name' });
                    if (!playerNick) return;

                    body = `Здравия желаю, уважаемый(-ая) [B]${playerNick}[/B].<br><br>`;
                    
                    if (type === 'ok') {
                        body += `Ваше заявление было рассмотрено руководством УМВД.<br>Вердикт: [B][COLOR=rgb(34, 197, 94)]ОДОБРЕНО[/COLOR][/B].`;
                    } else if (type === 'no') {
                        const reason = await showModal({ title: 'ПРИЧИНА', message: 'Укажите причину отказа:', inputPlaceholder: 'Текст...' });
                        body += `Ваше заявление было рассмотрено руководством УМВД.<br>Вердикт: [B][COLOR=rgb(239, 68, 68)]ОТКАЗАНО[/COLOR][/B].<br>Причина: ${reason || 'Не соответствует критериям'}.`;
                    }
                }

                // Спрашиваем про подпись (Да/Нет)
                const needSign = await showModal({ title: 'ПОДПИСЬ', message: `Добавить подпись: "${rank} УМВД ${myNick}"?`, isConfirm: true });

                if (needSign) {
                    body += `<br><br>С уважением, ${rank} УМВД ${myNick}.`;
                }

                quoteAndAppend(body);
            };
        });
    }

    setInterval(createUI, 1000);
})();
