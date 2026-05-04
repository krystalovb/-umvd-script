// ==UserScript==
// @name         UMVD Helper v2 AI | Black Russia
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Профессиональный помощник для сотрудников УМВД. AI-анализ, красивые шаблоны и гибкие настройки.
// @author       Adaptive AI
// @match        https://forum.blackrussia.online/*
// @grant        GM_xmlhttpRequest
// @connect      api.groq.com
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        colors: {
            main: '#1e90ff',
            bg: '#0f172a',
            card: '#1e293b',
            text: '#f8fafc'
        },
        ranks: [
            "Рядовой [1]", "Сержант [2]", "Ст. Сержант [3]", "Прапорщик [4]",
            "Лейтенант [5]", "Ст. Лейтенант [6]", "Капитан [7]", "Майор [8]",
            "Подполковник [9]", "Полковник [10]"
        ]
    };

    let settings = JSON.parse(localStorage.getItem('umvd_settings')) || {
        nick: 'Ivan_Ivanov',
        rank: 'Полковник',
        aiKey: ''
    };

    const saveSettings = (data) => {
        settings = { ...settings, ...data };
        localStorage.setItem('umvd_settings', JSON.stringify(settings));
    };

    // ═══════════════════════════════════════════════════════════════════════
    // ШАБЛОНЫ
    // ═══════════════════════════════════════════════════════════════════════

    const generateTemplate = (type, targetNick, reason = '') => {
        const date = new Date().toLocaleDateString('ru-RU');
        const num = Math.floor(Math.random() * 9000) + 1000;
        const header = `[CENTER][COLOR=${CONFIG.colors.main}]══════════════════════════════════════════════════[/COLOR]
[B][FONT=times new roman][SIZE=5][COLOR=${CONFIG.colors.main}]МИНИСТЕРСТВО ВНУТРЕННИХ ДЕЛ[/COLOR][/SIZE][/FONT][/B]
[FONT=times new roman][SIZE=4]УПРАВЛЕНИЕ МВД ПО НИЖЕГОРОДСКОЙ ОБЛАСТИ
г. Южный[/SIZE][/FONT]
[COLOR=${CONFIG.colors.main}]══════════════════════════════════════════════════[/COLOR][/CENTER]

[FONT=times new roman][SIZE=3][COLOR=rgb(128,128,128)]Исх. № [B]У-${num}[/B] от [B]${date}[/B][/COLOR][/SIZE][/FONT]
[HR][/HR]
Здравия желаю, [B]${targetNick}[/B]!
`;

        const footer = `\n[HR][/HR]
[RIGHT][FONT=times new roman][SIZE=4]С уважением,
[B]${settings.rank} УМВД ${settings.nick}[/B][/SIZE][/FONT][/RIGHT]`;

        let body = '';
        if (type === 'ok') {
            body = `Ваше заявление было рассмотрено руководством УМВД.
Вердикт: [COLOR=rgb(0,255,0)][B]ОДОБРЕНО[/B][/COLOR].
Ждем вас в отделе полиции г. Южный в рабочее время.`;
        } else {
            body = `Ваше заявление было рассмотрено руководством УМВД.
Вердикт: [COLOR=rgb(255,0,0)][B]ОТКАЗАНО[/B][/COLOR].
Причина: [B]${reason || 'Несоответствие критериям / Опечатки'}[/B].`;
        }

        return header + body + footer;
    };

    // ═══════════════════════════════════════════════════════════════════════
    // UI СТИЛИ
    // ═══════════════════════════════════════════════════════════════════════

    const injectStyles = () => {
        const style = document.createElement('style');
        style.textContent = `
            #umvd-root { font-family: 'Segoe UI', Roboto, sans-serif; color: ${CONFIG.colors.text}; }
            #umvd-fab { position: fixed; bottom: 25px; right: 25px; width: 65px; height: 65px; background: ${CONFIG.colors.main}; 
                        border-radius: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; 
                        box-shadow: 0 10px 25px rgba(0,0,0,0.3); z-index: 9999; transition: 0.3s; font-size: 30px; }
            #umvd-fab:hover { transform: scale(1.1) rotate(10deg); }

            #umvd-main { position: fixed; bottom: 100px; right: 25px; width: 350px; background: ${CONFIG.colors.bg}; 
                         border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); display: none; flex-direction: column; 
                         box-shadow: 0 20px 50px rgba(0,0,0,0.5); z-index: 9999; overflow: hidden; backdrop-filter: blur(10px); }
            
            .umvd-head { background: ${CONFIG.colors.main}; padding: 20px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
            .umvd-content { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
            
            .umvd-input { background: ${CONFIG.colors.card}; border: 1px solid rgba(255,255,255,0.1); padding: 12px; 
                          border-radius: 12px; color: white; outline: none; transition: 0.2s; }
            .umvd-input:focus { border-color: ${CONFIG.colors.main}; }
            
            .umvd-btn { padding: 12px; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.2s; }
            .btn-blue { background: ${CONFIG.colors.main}; color: white; }
            .btn-green { background: #10b981; color: white; }
            .btn-red { background: #ef4444; color: white; }
            .umvd-btn:hover { opacity: 0.9; transform: translateY(-2px); }
            .umvd-btn:active { transform: translateY(0); }

            .umvd-tab { display: none; flex-direction: column; gap: 12px; }
            .active-tab { display: flex; }
            
            .tab-trigger { font-size: 12px; cursor: pointer; opacity: 0.7; }
            .tab-trigger:hover { opacity: 1; }
        `;
        document.head.appendChild(style);
    };

    // ═══════════════════════════════════════════════════════════════════════
    // СОЗДАНИЕ ИНТЕРФЕЙСА
    // ═══════════════════════════════════════════════════════════════════════

    const createUI = () => {
        const root = document.createElement('div');
        root.id = 'umvd-root';
        root.innerHTML = `
            <div id="umvd-fab">🚔</div>
            <div id="umvd-main">
                <div class="umvd-head">
                    <span>УМВД HELPER v2</span>
                    <span class="tab-trigger" id="go-settings">⚙️ Настройки</span>
                </div>
                
                <div class="umvd-content active-tab" id="tab-work">
                    <input type="text" id="target-nick" class="umvd-input" placeholder="Ник игрока (Ivan_Ivanov)">
                    <button class="umvd-btn btn-green" id="action-ok">✅ Одобрить</button>
                    <button class="umvd-btn btn-red" id="action-no">❌ Отказать</button>
                    <hr style="opacity: 0.1">
                    <button class="umvd-btn btn-blue" id="action-ai">🤖 AI Анализ (Groq)</button>
                </div>

                <div class="umvd-content" id="tab-settings">
                    <label style="font-size: 11px; opacity: 0.6">ВАШ НИК (Nick_Name):</label>
                    <input type="text" id="set-nick" class="umvd-input" value="${settings.nick}">
                    
                    <label style="font-size: 11px; opacity: 0.6">ВАШЕ ЗВАНИЕ:</label>
                    <select id="set-rank" class="umvd-input">
                        ${CONFIG.ranks.map(r => `<option value="${r}" ${settings.rank === r ? 'selected' : ''}>${r}</option>`).join('')}
                    </select>

                    <label style="font-size: 11px; opacity: 0.6">GROQ API KEY:</label>
                    <input type="password" id="set-key" class="umvd-input" value="${settings.aiKey}" placeholder="gsk_...">
                    
                    <button class="umvd-btn btn-blue" id="save-settings">💾 Сохранить и выйти</button>
                </div>
            </div>
        `;
        document.body.appendChild(root);

        // Логика переключения
        const fab = document.getElementById('umvd-fab');
        const main = document.getElementById('umvd-main');
        const workTab = document.getElementById('tab-work');
        const setTab = document.getElementById('tab-settings');

        fab.onclick = () => main.style.display = main.style.display === 'flex' ? 'none' : 'flex';

        document.getElementById('go-settings').onclick = () => {
            workTab.classList.remove('active-tab');
            setTab.classList.add('active-tab');
        };

        document.getElementById('save-settings').onclick = () => {
            saveSettings({
                nick: document.getElementById('set-nick').value,
                rank: document.getElementById('set-rank').value,
                aiKey: document.getElementById('set-key').value
            });
            setTab.classList.remove('active-tab');
            workTab.classList.add('active-tab');
            alert('Настройки сохранены!');
        };

        // Кнопки действий
        document.getElementById('action-ok').onclick = () => insertText('ok');
        document.getElementById('action-no').onclick = () => {
            const reason = prompt('Введите причину отказа:');
            if (reason) insertText('no', reason);
        };
    };

    const insertText = (type, reason = '') => {
        const target = document.getElementById('target-nick').value;
        if (!target) return alert('Сначала введите ник игрока!');
        
        const template = generateTemplate(type, target, reason);
        const editor = document.querySelector('.fr-element.fr-view');
        
        if (editor) {
            editor.focus();
            document.execCommand('insertText', false, template);
            document.getElementById('umvd-main').style.display = 'none';
        } else {
            alert('Не найдено поле ввода на странице. Вы точно в теме форума?');
        }
    };

    // Инициализация
    injectStyles();
    createUI();

})();
