// ==UserScript==
// @name         UMVD Ultimate Helper AI | Black Russia
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Объединенный скрипт УМВД: AI-анализ, гибкие настройки и новый премиум-дизайн сообщений.
// @author       Adaptive AI
// @match        https://forum.blackrussia.online/*
// @grant        GM_xmlhttpRequest
// @connect      api.groq.com
// ==/UserScript==

(function () {
    'use strict';

    // ════════════════════ НАСТРОЙКИ И КОНФИГУРАЦИЯ ════════════════════
    const CONFIG = {
        colors: {
            police: 'rgb(30, 144, 255)',
            success: 'rgb(0, 255, 127)',
            error: 'rgb(255, 69, 0)',
            ui_bg: '#0f172a',
            ui_card: '#1e293b'
        },
        ranks: [
            "Сержант [2]", "Старший Сержант [3]", "Прапорщик [4]",
            "Лейтенант [5]", "Старший Лейтенант [6]", "Капитан [7]",
            "Майор [8]", "Подполковник [9]", "Полковник [10]"
        ]
    };

    let settings = JSON.parse(localStorage.getItem('umvd_v3_settings')) || {
        nick: 'Ivan_Ivanov',
        rank: 'Полковник',
        aiKey: ''
    };

    const saveSettings = (data) => {
        settings = { ...settings, ...data };
        localStorage.setItem('umvd_v3_settings', JSON.stringify(settings));
    };

    // ════════════════════ НОВЫЙ ДИЗАЙН СООБЩЕНИЙ ════════════════════
    const TemplateEngine = {
        build: (type, targetNick, reason = '') => {
            const date = new Date().toLocaleDateString('ru-RU');
            const num = Math.floor(Math.random() * 9000) + 1000;
            const blue = CONFIG.colors.police;

            let header = `[CENTER][COLOR=${blue}]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/COLOR]
[B][FONT=times new roman][SIZE=5]МИНИСТЕРСТВО ВНУТРЕННИХ ДЕЛ РОССИЙСКОЙ ФЕДЕРАЦИИ[/SIZE][/FONT][/B]
[FONT=times new roman][SIZE=4]УПРАВЛЕНИЕ МВД ПО НИЖЕГОРОДСКОЙ ОБЛАСТИ
[I]ОТДЕЛ КАДРОВ[/I][/SIZE][/FONT]
[COLOR=${blue}]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/COLOR][/CENTER]

[FONT=times new roman][SIZE=3][COLOR=rgb(152, 157, 160)]г. Южный, ул. Центральная, д. 1
Исходящий номер: [B]№У-${num}[/B] от [B]${date}[/B][/COLOR][/SIZE][/FONT]
[HR][/HR]
[FONT=times new roman][SIZE=4]Уважаемый(-ая) [B]${targetNick}[/B], ваш рапорт/заявление было официально рассмотрено руководством Управления МВД.[/SIZE][/FONT]\n`;

            let footer = `\n[HR][/HR]
[RIGHT][FONT=times new roman][SIZE=4]Начальник УМВД по Нижегородской области
[B]${settings.rank} полиции
${settings.nick}[/B][/SIZE][/FONT][/RIGHT]`;

            let body = '';
            if (type === 'ok') {
                body = `[TABLE]
[TR][TD][CENTER][COLOR=${CONFIG.colors.success}][B]СТАТУС: ОДОБРЕНО[/B][/COLOR][/CENTER][/TD][/TR]
[/TABLE]
[FONT=times new roman][SIZE=4]Благодарим за проявленный интерес к службе в органах внутренних дел. Вам необходимо явиться в дежурную часть г. Южный для прохождения дальнейших процедур.[/SIZE][/FONT]`;
            } else {
                body = `[TABLE]
[TR][TD][CENTER][COLOR=${CONFIG.colors.error}][B]СТАТУС: ОТКАЗАНО[/B][/COLOR][/CENTER][/TD][/TR]
[TR][TD][CENTER][B]Причина:[/B] ${reason}[/CENTER][/TD][/TR]
[/TABLE]
[FONT=times new roman][SIZE=4]Вы имеете право обжаловать данное решение в установленном законом порядке или подать рапорт повторно после исправления указанных недочетов.[/SIZE][/FONT]`;
            }

            return header + body + footer;
        }
    };

    // ════════════════════ AI АНАЛИЗАТОР ════════════════════
    const AI = {
        analyze: async (text) => {
            if (!settings.aiKey) return alert('Ошибка: Введите API ключ в настройках!');
            
            const prompt = `Ты ИИ-сотрудник УМВД. Проверь текст заявки на: 1. Ник (Nick_Name), 2. Наличие Военного билета, 3. Законопослушность 10+, 4. Лицензии. Если всё ок, пиши "approve", если нет - "reject" и кратко причину. Ответ дай строго в JSON: {"decision":"...","reason":"..."}`;

            return new Promise((resolve) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: 'https://api.groq.com/openai/v1/chat/completions',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.aiKey}` },
                    data: JSON.stringify({
                        model: 'llama-3.3-70b-versatile',
                        messages: [{ role: 'user', content: prompt + "\n\nТЕКСТ: " + text }],
                        temperature: 0.2
                    }),
                    onload: (res) => {
                        try {
                            const data = JSON.parse(res.responseText);
                            resolve(JSON.parse(data.choices[0].message.content.match(/\{.*\}/s)[0]));
                        } catch (e) { alert('AI не смог разобрать заявку.'); }
                    }
                });
            });
        }
    };

    // ════════════════════ ИНТЕРФЕЙС ════════════════════
    const injectStyles = () => {
        const style = document.createElement('style');
        style.textContent = `
            #umvd-box { position: fixed; bottom: 20px; right: 20px; z-index: 9999; font-family: 'Segoe UI', sans-serif; }
            #umvd-fab { width: 60px; height: 60px; background: ${CONFIG.colors.police}; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.4); transition: 0.3s; }
            #umvd-fab:hover { transform: scale(1.1) rotate(15deg); }
            
            #umvd-window { position: absolute; bottom: 80px; right: 0; width: 320px; background: ${CONFIG.colors.ui_bg}; border-radius: 16px; display: none; flex-direction: column; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); }
            .umvd-header { padding: 15px; background: ${CONFIG.colors.police}; font-weight: bold; color: white; display: flex; justify-content: space-between; }
            .umvd-body { padding: 15px; display: flex; flex-direction: column; gap: 10px; }
            
            .umvd-input { background: ${CONFIG.colors.ui_card}; border: 1px solid #334155; padding: 10px; border-radius: 8px; color: white; outline: none; }
            .umvd-btn { padding: 10px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; color: white; transition: 0.2s; }
            .btn-blue { background: ${CONFIG.colors.police}; }
            .btn-green { background: #10b981; }
            .btn-red { background: #ef4444; }
            .umvd-btn:hover { opacity: 0.8; }
            
            .hidden { display: none !important; }
        `;
        document.head.appendChild(style);
    };

    const createUI = () => {
        const root = document.createElement('div');
        root.id = 'umvd-box';
        root.innerHTML = `
            <div id="umvd-fab">🚔</div>
            <div id="umvd-window">
                <div class="umvd-header">
                    <span>УМВД ПАНЕЛЬ</span>
                    <span id="open-settings" style="cursor:pointer">⚙️</span>
                </div>
                
                <div id="view-work" class="umvd-body">
                    <input type="text" id="in-target" class="umvd-input" placeholder="Ник игрока">
                    <button class="umvd-btn btn-green" id="do-ok">ОДОБРИТЬ</button>
                    <button class="umvd-btn btn-red" id="do-no">ОТКАЗАТЬ</button>
                    <button class="umvd-btn btn-blue" id="do-ai">🤖 AI ТЕСТ</button>
                </div>

                <div id="view-settings" class="umvd-body hidden">
                    <input type="text" id="set-nick" class="umvd-input" value="${settings.nick}" placeholder="Ваш Ник">
                    <select id="set-rank" class="umvd-input">
                        ${CONFIG.ranks.map(r => `<option value="${r.split(' ')[0]}" ${settings.rank === r.split(' ')[0] ? 'selected' : ''}>${r}</option>`).join('')}
                    </select>
                    <input type="password" id="set-key" class="umvd-input" value="${settings.aiKey}" placeholder="API Ключ Groq">
                    <button class="umvd-btn btn-blue" id="save-settings">СОХРАНИТЬ</button>
                </div>
            </div>
        `;
        document.body.appendChild(root);

        const fab = document.getElementById('umvd-fab');
        const win = document.getElementById('umvd-window');
        const vWork = document.getElementById('view-work');
        const vSets = document.getElementById('view-settings');

        fab.onclick = () => win.style.display = win.style.display === 'flex' ? 'none' : 'flex';
        
        document.getElementById('open-settings').onclick = () => {
            vWork.classList.toggle('hidden');
            vSets.classList.toggle('hidden');
        };

        document.getElementById('save-settings').onclick = () => {
            saveSettings({
                nick: document.getElementById('set-nick').value,
                rank: document.getElementById('set-rank').value,
                aiKey: document.getElementById('set-key').value
            });
            vSets.classList.add('hidden');
            vWork.classList.remove('hidden');
        };

        const postToForum = (text) => {
            const editor = document.querySelector('.fr-element');
            if (editor) {
                editor.focus();
                document.execCommand('insertText', false, text);
                win.style.display = 'none';
            } else alert('Поле ввода не найдено!');
        };

        document.getElementById('do-ok').onclick = () => {
            const nick = document.getElementById('in-target').value;
            postToForum(TemplateEngine.build('ok', nick));
        };

        document.getElementById('do-no').onclick = () => {
            const nick = document.getElementById('in-target').value;
            const reason = prompt('Причина отказа:');
            if (reason) postToForum(TemplateEngine.build('no', nick, reason));
        };

        document.getElementById('do-ai').onclick = async () => {
            const nick = document.getElementById('in-target').value;
            const lastPost = document.querySelector('.message-inner:last-child .message-userContent').innerText;
            const result = await AI.analyze(lastPost);
            
            if (result.decision === 'approve') {
                postToForum(TemplateEngine.build('ok', nick));
            } else {
                postToForum(TemplateEngine.build('no', nick, result.reason));
            }
        };
    };

    injectStyles();
    createUI();
})();
