// ==UserScript==
// @name         UMVD CUSTOM SIGNATURE PANEL
// @namespace    http://tampermonkey.net/
// @version      12.0
// @description  Кнопки под редактором + кастомная подпись в настройках справа.
// @author       Gemini AI
// @match        *://forum.blackrussia.online/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. ПОЛУЧЕНИЕ ДАННЫХ
    const getStorage = () => ({
        nick: localStorage.getItem('umvd_nick') || "Nick_Name",
        rank: localStorage.getItem('umvd_rank') || "Полковник",
        sign: localStorage.getItem('umvd_sign') || "Служим России, служим закону!"
    });

    // 2. ФУНКЦИЯ ВСТАВКИ
    function insertToEditor(html) {
        const editor = document.querySelector('.fr-element.fr-view');
        if (!editor) {
            alert("Ошибка: кликните в поле ввода, чтобы активировать курсор!");
            return;
        }
        editor.focus();
        document.execCommand('insertHTML', false, html);
    }

    // 3. УЛУЧШЕННЫЙ ШАБЛОН С КАСТОМНОЙ ПОДПИСЬЮ
    const buildMsg = (status, text) => {
        const data = getStorage();
        const date = new Date().toLocaleDateString('ru-RU');
        const color = status === "ОДОБРЕНО" ? "#00FF7F" : "#FF4500";

        return `<center>[COLOR=rgb(30, 144, 255)]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/COLOR]<br>` +
               `[B][FONT=times new roman][SIZE=5]УМВД ПО НИЖЕГОРОДСКОЙ ОБЛАСТИ[/SIZE][/FONT][/B]<br>` +
               `[COLOR=rgb(30, 144, 255)]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/COLOR]</center><br><br>` +
               `[FONT=times new roman][SIZE=4]Здравия желаю!<br>` +
               `Ваше заявление было рассмотрено руководством Управления МВД.<br><br>` +
               `Вердикт: [B][COLOR=${color}]${status}[/COLOR][/B]<br>` +
               `${text}[/SIZE][/FONT]<br><br>` +
               `[RIGHT][B]Дата:[/B] ${date}<br>` +
               `[B]Должность:[/B] ${data.rank}<br>` +
               `[B]Подпись:[/B] ${data.nick}<br>` +
               `[I][COLOR=rgb(128, 128, 128)]${data.sign}[/COLOR][/I][/RIGHT]`;
    };

    // 4. ПАНЕЛЬ ВАРИАНТОВ ПОД РЕДАКТОРОМ
    function injectActionButtons() {
        if (document.getElementById('umvd-actions-row')) return;

        const footer = document.querySelector('.formButtonGroup') || document.querySelector('.xf-formButtons');
        if (!footer) return;

        const row = document.createElement('div');
        row.id = 'umvd-actions-row';
        row.style = "display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; padding: 8px; background: rgba(30, 144, 255, 0.05); border: 1px dashed #1e90ff; border-radius: 10px;";

        const actions = [
            { t: "✅ Одобрить", c: "#27ae60", html: buildMsg("ОДОБРЕНО", "Просим вас прибыть в здание УМВД г. Южный для прохождения инструктажа.") },
            { t: "❌ Отказать", c: "#c0392b", isPrompt: true },
            { t: "⏳ Рассмотрение", c: "#f39c12", html: buildMsg("НА РАССМОТРЕНИИ", "Ваши данные проходят проверку по базе ИЦ МВД. Ожидайте.") },
            { t: "🚔 Перевод", c: "#2980b9", html: buildMsg("ОДОБРЕНО", "Рапорт на перевод одобрен. Ждем вас в рабочее время.") },
            { t: "🚫 Нарушение", c: "#7f8c8d", html: buildMsg("ОТКАЗАНО", "Заявление заполнено не по форме или содержит бред (МГ).") }
        ];

        actions.forEach(a => {
            const btn = document.createElement('button');
            btn.innerText = a.t;
            btn.type = "button";
            btn.style = `background:${a.c}; color:white; border:none; padding:7px 12px; border-radius:5px; cursor:pointer; font-weight:bold; font-size:11px; transition: 0.2s;`;
            
            btn.onclick = (e) => {
                e.preventDefault();
                if (a.isPrompt) {
                    const r = prompt("Укажите причину отказа:");
                    if (r) insertToEditor(buildMsg("ОТКАЗАНО", `Причина: [B]${r}[/B]`));
                } else {
                    insertToEditor(a.html);
                }
            };
            row.appendChild(btn);
        });

        footer.parentNode.insertBefore(row, footer);
    }

    // 5. КНОПКА НАСТРОЕК СПРАВА
    function injectSettingsBtn() {
        if (document.getElementById('umvd-settings-fab')) return;

        const fab = document.createElement('div');
        fab.id = 'umvd-settings-fab';
        fab.innerHTML = "⚙️";
        fab.style = "position: fixed; right: 20px; top: 50%; width: 45px; height: 45px; background: #1c1c1c; color: #1e90ff; display: flex; align-items: center; justify-content: center; border-radius: 12px; cursor: pointer; z-index: 10000; font-size: 22px; border: 2px solid #1e90ff; box-shadow: 0 5px 15px rgba(0,0,0,0.5);";

        fab.onclick = () => {
            const data = getStorage();
            const n = prompt("Ваш Ник (Nick_Name):", data.nick);
            const r = prompt("Ваше Звание:", data.rank);
            const s = prompt("Кастомная подпись (будет в самом низу):", data.sign);
            
            if (n !== null && r !== null && s !== null) {
                localStorage.setItem('umvd_nick', n);
                localStorage.setItem('umvd_rank', r);
                localStorage.setItem('umvd_sign', s);
                alert("Данные успешно обновлены!");
                location.reload();
            }
        };

        document.body.appendChild(fab);
    }

    // Инициализация
    setInterval(() => {
        injectActionButtons();
        injectSettingsBtn();
    }, 1000);

})();
