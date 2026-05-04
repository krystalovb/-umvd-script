// ==UserScript==
// @name         UMVD Rivera Center Style Helper
// @namespace    https://forum.blackrussia.online
// @version      8.0
// @description  Центрирование текста и шрифт Times New Roman
// @author       Saint_Rivera & Gemini
// @match        https://forum.blackrussia.online/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const RANKS = ["Рядовой", "Сержант", "Старший Сержант", "Прапорщик", "Лейтенант", "Старший Лейтенант", "Капитан", "Майор", "Подполковник", "Полковник"];

    // Функция для цитирования и вставки стилизованного текста
    async function quoteAndAppend(text) {
        const quoteBtn = document.querySelector('.message:last-child [data-xf-click="quote"]') || 
                         document.querySelector('[data-xf-click="quote"]');
        
        if (quoteBtn) {
            quoteBtn.click();
        }

        setTimeout(() => {
            const editor = document.querySelector('.fr-element.fr-view');
            if (editor) {
                editor.focus();
                // Обертка в центр и шрифт Times New Roman
                const styledText = `[CENTER][FONT=Times New Roman]${text}[/FONT][/CENTER]`;
                document.execCommand('insertHTML', false, styledText);
            }
        }, 500);
    }

    // Модальное окно ( Rivera UI )
    function showModal({ title, message, inputPlaceholder, isTextArea = false }) {
        return new Promise((resolve) => {
            const modalId = 'rivera-modal';
            const html = `
                <div id="${modalId}" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 20000; display: flex; align-items: center; justify-content: center; font-family: sans-serif;">
                    <div style="background: #2d2d3a; width: 360px; border-radius: 12px; border: 1px solid #40404f; overflow: hidden; animation: rivSlide 0.3s ease;">
                        <div style="padding: 16px; border-bottom: 1px solid #3a3a4a; display: flex; align-items: center; gap: 10px;">
                            <div style="width: 8px; height: 8px; background: #3b82f6; border-radius: 2px;"></div>
                            <span style="color: #fff; font-weight: bold; font-size: 13px; text-transform: uppercase;">${title}</span>
                        </div>
                        <div style="padding: 20px;">
                            <p style="color: #94a3b8; font-size: 13px; margin-bottom: 15px;">${message}</p>
                            ${isTextArea 
                                ? `<textarea id="modal-field" placeholder="${inputPlaceholder}" style="width: 100%; background: #1e1e27; border: 1px solid #40404f; border-radius: 8px; padding: 12px; color: #fff; font-size: 13px; outline: none; height: 100px; resize: none;"></textarea>`
                                : `<input id="modal-field" type="text" placeholder="${inputPlaceholder}" style="width: 100%; background: #1e1e27; border: 1px solid #40404f; border-radius: 8px; padding: 12px; color: #fff; font-size: 13px; outline: none;">`
                            }
                            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                                <button id="modal-cancel" style="background: #3a3a4a; color: #94a3b8; border: none; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-size: 12px;">ОТМЕНА</button>
                                <button id="modal-confirm" style="background: #0d5c3e; color: #fff; border: none; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">ДАЛЕЕ ➔</button>
                            </div>
                        </div>
                    </div>
                </div><style>@keyframes rivSlide { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }</style>`;
            document.body.insertAdjacentHTML('beforeend', html);
            const m = document.getElementById(modalId);
            const f = m.querySelector('#modal-field');
            f.focus();
            m.querySelector('#modal-confirm').onclick = () => { const v = f.value; m.remove(); resolve(v); };
            m.querySelector('#modal-cancel').onclick = () => { m.remove(); resolve(null); };
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
                <span style="color: #fff; font-size: 11px; font-weight: bold;">УМВД CENTER HELPER</span>
            </div>
            <div style="padding: 12px; display: flex; flex-direction: column; gap: 6px;">
                <select id="rank-select" style="background: #1e1e27; color: #fff; border: 1px solid #40404f; border-radius: 6px; padding: 8px; font-size: 11px;">
                    ${RANKS.map(r => `<option value="${r}" ${r === localStorage.getItem('umvd_rank') ? 'selected' : ''}>${r}</option>`).join('')}
                </select>
                
                <button class="riv-btn" data-type="ok" style="background:#0d5c3e;">✅ ОДОБРЕНО</button>
                <button class="riv-btn" data-type="no" style="background:#7a2e2e;">❌ ОТКАЗАНО</button>
                <button class="riv-btn" data-type="answer" style="background:#3a3a4a;">❓ ОТВЕТ НА ВОПРОС</button>
                <button class="riv-btn" data-type="results" style="background:#3b82f6;">📊 ИТОГИ КАНДИДАТОВ</button>
                <button class="riv-btn" data-type="thanks" style="background:#3a3a4a;">🙏 БЛАГОДАРНОСТЬ</button>
                
                <input id="nick-field" type="text" value="${localStorage.getItem('umvd_nick') || 'Nick_Name'}" style="background:transparent; border:none; color:#64748b; font-size:10px; text-align:center; margin-top:5px; outline:none; width:100%;">
            </div>`;
        document.body.appendChild(panel);

        document.getElementById('rank-select').onchange = (e) => localStorage.setItem('umvd_rank', e.target.value);
        document.getElementById('nick-field').oninput = (e) => localStorage.setItem('umvd_nick', e.target.value);

        document.querySelectorAll('.riv-btn').forEach(btn => {
            btn.style = btn.getAttribute('style') + "color:white; border:none; padding:10px; border-radius:6px; cursor:pointer; font-size:11px; font-weight:bold; text-align:left; transition:0.2s;";
            btn.onclick = async () => {
                const type = btn.getAttribute('data-type');
                const rank = localStorage.getItem('umvd_rank');
                const myNick = localStorage.getItem('umvd_nick');

                const playerNick = await showModal({ 
                    title: 'НИК ИГРОКА', 
                    message: 'Введите никнейм игрока для ответа:', 
                    inputPlaceholder: 'Nick_Name' 
                });
                if (!playerNick) return;

                let body = `Здравия желаю, уважаемый(-ая) [B]${playerNick}[/B].<br><br>`;

                if (type === 'ok') {
                    body += `Ваше заявление было официально рассмотрено руководством Управления МВД.<br>Вердикт: [B][COLOR=rgb(34, 197, 94)]ОДОБРЕНО[/COLOR][/B].<br><br>С уважением, ${rank} полиции ${myNick}.`;
                } else if (type === 'no') {
                    const reason = await showModal({ title: 'ПРИЧИНА', message: 'Почему отказ?', inputPlaceholder: 'Причина...' });
                    body += `Ваше заявление было официально рассмотрено руководством Управления МВД.<br>Вердикт: [B][COLOR=rgb(239, 68, 68)]ОТКАЗАНО[/COLOR][/B].<br>Причина: ${reason || 'Не соответствует критериям'}.<br><br>С уважением, ${rank} полиции ${myNick}.`;
                } else if (type === 'answer') {
                    const ans = await showModal({ title: 'ОТВЕТ', message: 'Текст ответа:', inputPlaceholder: 'Текст...', isTextArea: true });
                    body += `${ans}<br><br>С уважением, ${rank} полиции ${myNick}.`;
                } else if (type === 'thanks') {
                    body += `Благодарим вас за обращение и теплые слова в адрес руководства!<br><br>С уважением, ${rank} полиции ${myNick}.`;
                } else if (type === 'results') {
                    const app = await showModal({ title: 'ОДОБРЕНО', message: 'Список одобренных:', inputPlaceholder: 'Nick1, Nick2' });
                    const rej = await showModal({ title: 'ОТКАЗАНО', message: 'Список отказанных:', inputPlaceholder: 'Nick - причина', isTextArea: true });
                    body = `[B][SIZE=5][COLOR=rgb(30, 144, 255)]ИТОГИ ПРОВЕРКИ ЗАЯВЛЕНИЙ[/COLOR][/SIZE][/B]<br><br>` +
                           `[LEFT][B][COLOR=rgb(34, 197, 94)]ОДОБРЕННЫЕ:[/COLOR][/B]<br>${app || '—'}<br><br>` +
                           `[B][COLOR=rgb(239, 68, 68)]ОТКАЗАННЫЕ:[/COLOR][/B]<br>${rej || '—'}<br><br>` +
                           `[RIGHT][B]${rank} ${myNick}[/B][/RIGHT][/LEFT]`;
                }
                
                quoteAndAppend(body);
            };
        });
    }

    setInterval(createUI, 1000);
})();
