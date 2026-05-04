// ==UserScript==
// @name         UMVD MODULAR HELPER (INTEGRATED)
// @namespace    http://tampermonkey.net/
// @version      9.0
// @description  Интегрированная панель УМВД прямо под редактором форума
// @author       Gemini AI
// @match        *://forum.blackrussia.online/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ===== ДАННЫЕ =====
    const getSettings = () => ({
        nick: localStorage.getItem("umvd_nick") || "Nick_Name",
        rank: localStorage.getItem("umvd_rank") || "Полковник",
        gender: localStorage.getItem("umvd_gender") || "male" // для корректных окончаний (рассмотрел/рассмотрела)
    });

    // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 4 && hour < 12) return "Доброе утро";
        if (hour >= 12 && hour < 18) return "Добрый день";
        if (hour >= 18 && hour < 23) return "Добрый вечер";
        return "Доброй ночи";
    };

    const getAuthor = () => {
        const el = document.querySelector('.message-name .username');
        return el ? el.innerText.trim() : "Гражданин";
    };

    function insertToEditor(html) {
        const editor = document.querySelector('.fr-element.fr-view');
        if (editor) {
            editor.focus();
            document.execCommand('insertHTML', false, html);
        } else {
            alert("Сначала нажмите в поле ввода текста!");
        }
    }

    // ===== ШАБЛОНЫ (НОВЫЙ ДИЗАЙН) =====
    const buildMessage = (status, content) => {
        const {nick, rank, gender} = getSettings();
        const action = gender === "male" ? "рассмотрел" : "рассмотрела";
        const date = new Date().toLocaleDateString('ru-RU');
        const color = status === "ОДОБРЕНО" ? "rgb(0, 255, 127)" : "rgb(255, 69, 0)";

        return `[CENTER][COLOR=rgb(30, 144, 255)][B]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/B][/COLOR]
[B][FONT=times new roman][SIZE=5]УМВД ПО НИЖЕГОРОДСКОЙ ОБЛАСТИ[/SIZE][/FONT][/B]
[FONT=times new roman][SIZE=4]Официальный ответ руководства управления[/SIZE][/FONT]
[COLOR=rgb(30, 144, 255)][B]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/B][/COLOR][/CENTER]

[FONT=times new roman][SIZE=4]Здравия желаю, уважаемый [B]${getAuthor()}[/B].
${getGreeting()}! Я, ${rank} полиции [B]${nick}[/B], внимательно ${action} ваше заявление.

[B]Вердикт:[/B] [COLOR=${color}][B]${status}[/B][/COLOR]

${content}[/SIZE][/FONT]

[HR][/HR]
[RIGHT][FONT=times new roman][SIZE=4][B]Подпись:[/B] ${nick}
[B]Дата:[/B] ${date}[/SIZE][/FONT][/RIGHT]`;
    };

    // ===== СОЗДАНИЕ ИНТЕРФЕЙСА (ПОД ПОЛЕМ ВВОДА) =====
    function injectPanel() {
        if (document.getElementById('umvd-integrated-panel')) return;

        const editorFooter = document.querySelector('.xf-formButtons'); // Панель с кнопками "Ответить"
        if (!editorFooter) return;

        const panel = document.createElement('div');
        panel.id = 'umvd-integrated-panel';
        panel.style = `
            background: #1a1a1a;
            border: 1px solid #1e90ff;
            border-radius: 8px;
            padding: 10px;
            margin-top: 10px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 8px;
            box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
        `;

        const buttons = [
            { name: "✅ Одобрить", color: "#27ae60", act: () => insertToEditor(buildMessage("ОДОБРЕНО", "Ваше заявление составлено корректно. Ожидаем вас в здании УМВД.")) },
            { name: "❌ Отказать", color: "#c0392b", act: () => {
                const r = prompt("Причина отказа:");
                if(r) insertToEditor(buildMessage("ОТКАЗАНО", `Причина: [B]${r}[/B]`));
            }},
            { name: "⏳ Рассмотрение", color: "#f39c12", act: () => insertToEditor(buildMessage("НА РАССМОТРЕНИИ", "Ваши данные проверяются по базе МВД. Ожидайте ответа в этой теме.")) },
            { name: "🚔 Перевод", color: "#2980b9", act: () => insertToEditor(buildMessage("ОДОБРЕНО", "Перевод одобрен. Сохраните скриншот данного ответа для предъявления при вступлении.")) },
            { name: "📜 Правила", color: "#8e44ad", act: () => insertToEditor("[B]Вам отказано.[/B] Нарушены правила подачи (заявление не по форме / нет /time).") },
            { name: "⚙️ Настройки", color: "#444", act: () => {
                const n = prompt("Ваш Ник (Имя_Фамилия):", getSettings().nick);
                const r = prompt("Ваш Ранг (напр. Капитан):", getSettings().rank);
                const g = confirm("Ваш пол Мужской? (ОК - Да, Отмена - Женский)") ? "male" : "female";
                if(n && r) {
                    localStorage.setItem("umvd_nick", n);
                    localStorage.setItem("umvd_rank", r);
                    localStorage.setItem("umvd_gender", g);
                    location.reload();
                }
            }}
        ];

        buttons.forEach(b => {
            const btn = document.createElement('button');
            btn.innerText = b.name;
            btn.type = "button";
            btn.style = `background:${b.color}; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer; font-weight:bold; font-size:12px; transition:0.2s;`;
            btn.onmouseover = () => btn.style.filter = "brightness(1.2)";
            btn.onmouseout = () => btn.style.filter = "none";
            btn.onclick = b.act;
            panel.appendChild(btn);
        });

        editorFooter.parentNode.insertBefore(panel, editorFooter);
    }

    // Запуск проверки наличия редактора каждые 2 секунды (т.к. он может подгрузиться позже)
    setInterval(injectPanel, 2000);

})();
