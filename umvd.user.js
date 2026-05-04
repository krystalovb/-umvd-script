// ==UserScript==
// @name         UMVD Rivera Glass Edition
// @namespace    https://forum.blackrussia.online
// @version      13.0
// @description  Новый дизайн справа, стекло, авто-ник и персонализация
// @author       Saint_Rivera & Gemini
// @match        https://forum.blackrussia.online/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const RANKS = ["Рядовой", "Сержант", "Старший Сержант", "Прапорщик", "Лейтенант", "Старший Лейтенант", "Капитан", "Майор", "Подполковник", "Полковник"];

    // Инициализация настроек
    const getSetting = (key, def) => localStorage.getItem(key) || def;

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

    function detectNick() {
        const lastMessage = document.querySelector('.message:last-child .message-inner .message-body .bbWrapper');
        if (lastMessage) {
            const text = lastMessage.innerText;
            const match = text.match(/([A-Z][a-z]+_[A-Z][a-z]+)/);
            return match ? match[0] : '';
        }
        return '';
    }

    function showModal({ title, message, inputPlaceholder, isTextArea = false, isConfirm = false, isSettings = false }) {
        return new Promise((resolve) => {
            const modalId = 'rivera-modal';
            let content = '';

            if (isSettings) {
                content = `
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        <div>
                            <label style="color:#94a3b8; font-size:10px; font-weight:bold;">ВАШ НИКНЕЙМ</label>
                            <input id="set-nick" type="text" value="${getSetting('riv_nick', 'Nick_Name')}" style="width:100%; background:#16161e; border:1px solid #3b82f644; border-radius:8px; padding:10px; color:#fff; outline:none;">
                        </div>
                        <div>
                            <label style="color:#94a3b8; font-size:10px; font-weight:bold;">ЗВАНИЕ</label>
                            <select id="set-rank" style="width:100%; background:#16161e; border:1px solid #3b82f644; border-radius:8px; padding:10px; color:#fff; outline:none;">
                                ${RANKS.map(r => `<option value="${r}" ${r === getSetting('riv_rank', 'Рядовой') ? 'selected' : ''}>${r}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label style="color:#94a3b8; font-size:10px; font-weight:bold;">ЛИЧНАЯ ПОДПИСЬ</label>
                            <input id="set-sign" type="text" value="${getSetting('riv_sign', 'Police Dept.')}" style="width:100%; background:#16161e; border:1px solid #3b82f644; border-radius:8px; padding:10px; color:#fff; outline:none;">
                        </div>
                    </div>
                `;
            } else {
                content = isConfirm ? '' : (isTextArea 
                    ? `<textarea id="modal-field" placeholder="${inputPlaceholder}" style="width:100%; background:#16161e; border:1px solid #444; border-radius:8px; padding:12px; color:#fff; height:120px; resize:none; outline:none; border: 1px solid #3b82f644;"></textarea>`
                    : `<input id="modal-field" type="text" value="${inputPlaceholder.includes('Nick_Name') ? detectNick() : ''}" placeholder="${inputPlaceholder}" style="width:100%; background:#16161e; border:1px solid #444; border-radius:8px; padding:12px; color:#fff; outline:none; border: 1px solid #3b82f644;">`
                );
            }

            const html = `
                <div id="${modalId}" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 30000; display: flex; align-items: center; justify-content: center; font-family: 'Segoe UI', sans-serif;">
                    <div style="background: linear-gradient(145deg, #1e1e27, #16161e); width: 380px; border-radius: 16px; border: 1px solid #ffffff11; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); overflow: hidden;">
                        <div style="padding: 18px; background: #3b82f611; border-bottom: 1px solid #ffffff08; text-align:center;">
                            <span style="color: #fff; font-weight: 800; font-size: 14px; letter-spacing: 1px;">${title}</span>
                        </div>
                        <div style="padding: 24px;">
                            ${message ? `<p style="color: #94a3b8; font-size: 13px; margin-bottom: 18px; text-align:center;">${message}</p>` : ''}
                            ${content}
                            <div style="display: flex; gap: 12px; margin-top: 24px;">
                                <button id="modal-cancel" style="flex:1; background: #334155; color: #fff; border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-size: 12px; font-weight: 600;">${isConfirm ? 'НЕТ' : 'ОТМЕНА'}</button>
                                <button id="modal-confirm" style="flex:1; background: #3b82f6; color: #fff; border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-size: 12px; font-weight: 600; box-shadow: 0 4px 12px #3b82f644;">${isConfirm ? 'ДА' : 'ПОДТВЕРДИТЬ'}</button>
                            </div>
                        </div>
                    </div>
                </div>`;
            
            document.body.insertAdjacentHTML('beforeend', html);
            const m = document.getElementById(modalId);
            if(m.querySelector('#modal-field')) m.querySelector('#modal-field').focus();

            m.querySelector('#modal-confirm').onclick = () => {
                if (isSettings) {
                    localStorage.setItem('riv_nick', m.querySelector('#set-nick').value);
                    localStorage.setItem('riv_rank', m.querySelector('#set-rank').value);
                    localStorage.setItem('riv_sign', m.querySelector('#set-sign').value);
                    m.remove();
                    location.reload();
                } else {
                    const v = m.querySelector('#modal-field') ? m.querySelector('#modal-field').value : true;
                    m.remove();
                    resolve(v);
                }
            };
            m.querySelector('#modal-cancel').onclick = () => { m.remove(); resolve(false); };
        });
    }

    function createUI() {
        if (document.getElementById('rivera-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'rivera-panel';
        // Расположение справа вне контента
        panel.style = "position: fixed; top: 50%; right: 15px; transform: translateY(-50%); width: 220px; background: rgba(30, 30, 39, 0.85); backdrop-filter: blur(12px); border-radius: 20px; z-index: 10000; border: 1px solid rgba(255,255,255,0.08); font-family: 'Segoe UI', Tahoma, sans-serif; box-shadow: 0 20px 40px rgba(0,0,0,0.4); padding: 15px; display: flex; flex-direction: column; gap: 12px;";
        
        panel.innerHTML = `
            <div style="text-align: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px; margin-bottom: 5px;">
                <div style="font-size: 12px; font-weight: 900; color: #fff; letter-spacing: 1px;">УМВД RIVERA</div>
                <div style="font-size: 9px; color: #3b82f6; font-weight: bold; margin-top: 2px;">PREMIUM HELPER</div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px;">
                <button class="riv-btn" data-type="ok" style="background: linear-gradient(to right, #166534, #15803d); border-left: 4px solid #4ade80;">ОДОБРИТЬ</button>
                <button class="riv-btn" data-type="no" style="background: linear-gradient(to right, #7f1d1d, #b91c1c); border-left: 4px solid #f87171;">ОТКАЗАТЬ</button>
                <button class="riv-btn" data-type="results" style="background: linear-gradient(to right, #1e40af, #3b82f6); border-left: 4px solid #60a5fa;">ИТОГИ СПИСКОМ</button>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 5px;">
                <a href="https://forum.blackrussia.online/threads/1/" target="_blank" title="Уголовный Кодекс" style="background: #2d2d3a; color: #94a3b8; font-size: 10px; padding: 8px 0; border-radius: 8px; text-align: center; text-decoration: none; border: 1px solid #ffffff05;">УК</a>
                <a href="https://forum.blackrussia.online/threads/2/" target="_blank" title="КоАП" style="background: #2d2d3a; color: #94a3b8; font-size: 10px; padding: 8px 0; border-radius: 8px; text-align: center; text-decoration: none; border: 1px solid #ffffff05;">КП</a>
                <a href="https://forum.blackrussia.online/threads/3/" target="_blank" title="Устав" style="background: #2d2d3a; color: #94a3b8; font-size: 10px; padding: 8px 0; border-radius: 8px; text-align: center; text-decoration: none; border: 1px solid #ffffff05;">УТ</a>
            </div>

            <button id="open-settings" style="background: transparent; border: 1px dashed #444; color: #64748b; font-size: 10px; padding: 8px; border-radius: 8px; cursor: pointer; transition: 0.3s;">⚙️ ПЕРСОНАЛИЗАЦИЯ</button>
            
            <div style="font-size: 9px; color: #444; text-align: center; margin-top: auto;">${getSetting('riv_rank', 'Звание')} ${getSetting('riv_nick', 'Ник')}</div>
        `;

        document.body.appendChild(panel);

        document.getElementById('open-settings').onclick = () => showModal({ title: 'ПЕРСОНАЛИЗАЦИЯ', isSettings: true });

        document.querySelectorAll('.riv-btn').forEach(btn => {
            btn.style.cssText += "color:white; border-top:none; border-right:none; border-bottom:none; padding:12px; border-radius:10px; cursor:pointer; font-size:11px; font-weight:700; text-align:left; transition: 0.3s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);";
            
            btn.onmouseover = () => btn.style.transform = "translateX(-5px)";
            btn.onmouseout = () => btn.style.transform = "translateX(0)";

            btn.onclick = async () => {
                const rank = getSetting('riv_rank', 'Рядовой');
                const nick = getSetting('riv_nick', 'Nick_Name');
                const sign = getSetting('riv_sign', 'Police');
                const date = new Date().toLocaleDateString();
                const type = btn.getAttribute('data-type');
                let body = "";

                if (type === 'results') {
                    const app = await showModal({ title: 'СПИСОК ОДОБРЕННЫХ', message: 'Введите ники кандидатов:', isTextArea: true });
                    const rej = await showModal({ title: 'СПИСОК ОТКАЗАННЫХ', message: 'Введите ники и причины:', isTextArea: true });
                    body = `[B][SIZE=5][COLOR=rgb(30, 144, 255)]ИТОГИ ПРОВЕРКИ ЗАЯВЛЕНИЙ УМВД[/COLOR][/SIZE][/B]<br><br>[LEFT][B][COLOR=rgb(34, 197, 94)]ОДОБРЕНО:[/COLOR][/B]<br>${app || '—'}<br><br>[B][COLOR=rgb(239, 68, 68)]ОТКАЗАНО:[/COLOR][/B]<br>${rej || '—'}[/LEFT]`;
                } else {
                    const playerNick = await showModal({ title: 'ПРОВЕРКА ИГРОКА', message: 'Никнейм игрока (найден в цитате):', inputPlaceholder: 'Nick_Name' });
                    if (!playerNick) return;

                    body = `Здравия желаю, уважаемый(-ая) [B]${playerNick}[/B].<br><br>`;
                    body += type === 'ok' 
                        ? `Ваше заявление было рассмотрено руководством УМВД.<br>Вердикт: [B][COLOR=rgb(34, 197, 94)]ОДОБРЕНО[/COLOR][/B].`
                        : `Ваше заявление было рассмотрено руководством УМВД.<br>Вердикт: [B][COLOR=rgb(239, 68, 68)]ОТКАЗАНО[/COLOR][/B].`;
                }

                const needSign = await showModal({ title: 'ПОДПИСЬ', message: 'Прикрепить вашу личную роспись?', isConfirm: true });
                if (needSign) {
                    body += `<br><br>С уважением, ${rank} УМВД — ${nick}.<br>[I]${sign}[/I]<br>[SIZE=2]Дата: ${date}[/SIZE]`;
                }

                quoteAndAppend(body);
            };
        });
    }

    // Запуск и слежение за изменениями страницы
    setInterval(createUI, 1000);
})();
