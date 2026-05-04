// ==UserScript==
// @name         UMVD MASTER HELPER v10
// @namespace    http://tampermonkey.net/
// @version      10.0
// @description  Полностью рабочий скрипт. Интегрированная панель.
// @author       Gemini AI
// @match        *://forum.blackrussia.online/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. Сохранение данных
    const getStorage = () => ({
        nick: localStorage.getItem('umvd_nick') || "Nick_Name",
        rank: localStorage.getItem('umvd_rank') || "Полковник"
    });

    // 2. Умная вставка текста (Решает проблему неработающих кнопок)
    function insertText(html) {
        // Пробуем найти основной слой редактора Froala
        const editor = document.querySelector('.fr-element.fr-view p') || 
                       document.querySelector('.fr-element.fr-view') ||
                       document.querySelector('.js-editor textarea');

        if (!editor) {
            alert("Ошибка: Поле ввода не найдено! Нажмите на поле 'Ответить', чтобы активировать редактор.");
            return;
        }

        const container = document.querySelector('.fr-element.fr-view');
        if (container) {
            container.focus();
            // Используем нативный метод вставки для XenForo/Froala
            document.execCommand('insertHTML', false, html);
        } else {
            editor.value += html;
        }
    }

    // 3. Красивый шаблон
    const buildResponse = (status, text) => {
        const data = getStorage();
        const date = new Date().toLocaleDateString('ru-RU');
        const color = status === "ОДОБРЕНО" ? "#00FF7F" : "#FF4500";

        return `<center>[COLOR=rgb(30, 144, 255)]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/COLOR]
[B][FONT=times new roman][SIZE=5]УПРАВЛЕНИЕ МВД ПО НИЖЕГОРОДСКОЙ ОБЛАСТИ[/SIZE][/FONT][/B]
[COLOR=rgb(30, 144, 255)]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/COLOR]</center>
<br>
[FONT=times new roman][SIZE=4]Здравия желаю!<br>
Я, ${data.rank} УМВД [B]${data.nick}[/B], проверил ваше заявление.<br><br>
Вердикт: [B][COLOR=${color}]${status}[/COLOR][/B]<br>
${text}[/SIZE][/FONT]
<br><br>
[RIGHT][B]Дата:[/B] ${date}
[B]Подпись:[/B] ${data.nick}[/RIGHT]`;
    };

    // 4. Создание и внедрение панели
    function createPanel() {
        if (document.getElementById('umvd-panel-v10')) return;

        // Ищем место под редактором (кнопки "Ответить")
        const target = document.querySelector('.formButtonGroup') || document.querySelector('.xf-formButtons');
        if (!target) return;

        const panel = document.createElement('div');
        panel.id = 'umvd-panel-v10';
        panel.style = "background:#181a1b; border:2px solid #1e90ff; padding:12px; border-radius:10px; margin:10px 0; display:flex; flex-wrap:wrap; gap:10px; justify-content:center; box-shadow: 0 4px 10px rgba(0,0,0,0.5);";

        const btns = [
            { t: "✅ Одобрить", c: "#27ae60", act: () => insertText(buildResponse("ОДОБРЕНО", "Ждем вас в здании УМВД г. Южный.")) },
            { t: "❌ Отказать", c: "#c0392b", act: () => {
                const r = prompt("Причина отказа:");
                if (r) insertText(buildResponse("ОТКАЗАНО", `Причина: [B]${r}[/B]`));
            }},
            { t: "⏳ Рассмотрение", c: "#f39c12", act: () => insertText(buildResponse("НА РАССМОТРЕНИИ", "Ожидайте ответа в течение 24-х часов.")) },
            { t: "⚙️ Настроить", c: "#555", act: () => {
                const n = prompt("Ник:", getStorage().nick);
                const r = prompt("Ранг:", getStorage().rank);
                if (n && r) {
                    localStorage.setItem('umvd_nick', n);
                    localStorage.setItem('umvd_rank', r);
                    location.reload();
                }
            }}
        ];

        btns.forEach(b => {
            const el = document.createElement('button');
            el.innerText = b.t;
            el.type = "button";
            el.style = `background:${b.c}; color:white; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; font-weight:bold; transition:0.3s;`;
            el.onclick = (e) => { e.preventDefault(); b.act(); };
            el.onmouseover = () => el.style.filter = "brightness(1.2)";
            el.onmouseout = () => el.style.filter = "none";
            panel.appendChild(el);
        });

        target.parentNode.insertBefore(panel, target);
    }

    // Запускаем поиск редактора
    const timer = setInterval(() => {
        createPanel();
    }, 1500);

})();
