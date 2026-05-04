// ==UserScript==
// @name         UMVD ULTRA PRO MENU (FIXED)
// @namespace    http://tampermonkey.net/
// @version      8.0
// @description  Исправленный помощник УМВД: работает в редакторе Froala
// @author       Adaptive AI
// @match        *://forum.blackrussia.online/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ===== ДАННЫЕ (LocalStorage) =====
    const getSettings = () => ({
        nick: localStorage.getItem("umvd_nick") || "Nick_Name",
        rank: localStorage.getItem("umvd_rank") || "Полковник"
    });

    const setSettings = (nick, rank) => {
        localStorage.setItem("umvd_nick", nick);
        localStorage.setItem("umvd_rank", rank);
    };

    // ===== ФУНКЦИЯ ВСТАВКИ (FIXED FOR FROALA) =====
    function insertText(text) {
        // Ищем редактор Froala
        const editor = document.querySelector('.fr-element.fr-view') || document.querySelector('.js-editor textarea');
        
        if (!editor) {
            alert("Поле ввода не найдено. Нажмите 'Ответить', чтобы появился редактор.");
            return;
        }

        // Если это Froala (див с текстом)
        if (editor.tagName === 'DIV') {
            editor.focus();
            // Заменяем переносы строк на <p> или <br> для HTML редактора
            const htmlText = text.replace(/\n/g, '<br>');
            document.execCommand('insertHTML', false, htmlText);
        } else {
            // Если обычное текстовое поле
            editor.value += text;
        }
    }

    function getAuthor() {
        const el = document.querySelector('.message-name .username');
        return el ? el.innerText.trim() : "Игрок";
    }

    // ===== ШАБЛОН ОТВЕТА (ОБНОВЛЕННЫЙ УМВД) =====
    function getTemplate(content) {
        const {nick, rank} = getSettings();
        const date = new Date().toLocaleDateString('ru-RU');
        
        return `[CENTER][COLOR=rgb(30, 144, 255)][B]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/B][/COLOR]
[B][FONT=times new roman][SIZE=5]МИНИСТЕРСТВО ВНУТРЕННИХ ДЕЛ[/SIZE][/FONT][/B]
[FONT=times new roman][SIZE=4]УПРАВЛЕНИЕ МВД ПО НИЖЕГОРОДСКОЙ ОБЛАСТИ[/SIZE][/FONT]
[COLOR=rgb(30, 144, 255)][B]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/B][/COLOR][/CENTER]

[FONT=times new roman][SIZE=4]Здравия желаю!
${content}[/SIZE][/FONT]

[HR][/HR]
[RIGHT][FONT=times new roman][SIZE=4]С уважением, [B]${rank} полиции[/B]
[B]${nick}[/B]
${date}[/SIZE][/FONT][/RIGHT]`;
    }

    // ===== UI ЭЛЕМЕНТЫ =====
    const openBtn = document.createElement('div');
    openBtn.innerHTML = "🚔";
    openBtn.style = "position:fixed; right:20px; bottom:20px; z-index:10000; width:60px; height:60px; background:#1e90ff; color:#fff; display:flex; align-items:center; justify-content:center; border-radius:50%; cursor:pointer; font-size:30px; box-shadow:0 4px 15px rgba(0,0,0,0.5); transition: 0.3s;";
    document.body.appendChild(openBtn);

    const panel = document.createElement('div');
    panel.style = "position:fixed; right:20px; bottom:90px; width:250px; background:#1c1c1c; border: 2px solid #1e90ff; padding:15px; border-radius:15px; display:none; z-index:10000; color:#fff; font-family: sans-serif; box-shadow: 0 10px 30px rgba(0,0,0,0.7);";
    document.body.appendChild(panel);

    const title = document.createElement('div');
    title.innerHTML = "<b style='color:#1e90ff'>УМВД HELPER</b><hr style='border:0.5px solid #333'>";
    panel.appendChild(title);

    function addBtn(text, action, color = "#2d2d2d") {
        const btn = document.createElement('button');
        btn.innerText = text;
        btn.style = `width:100%; margin:5px 0; padding:10px; border:none; border-radius:8px; background:${color}; color:#fff; cursor:pointer; font-weight:bold; transition:0.2s;`;
        btn.onmouseover = () => btn.style.opacity = "0.8";
        btn.onmouseout = () => btn.style.opacity = "1";
        btn.onclick = () => {
            action();
            // panel.style.display = "none"; // Можно раскомментировать, чтобы меню закрывалось после клика
        };
        panel.appendChild(btn);
    }

    // ===== КНОПКИ УПРАВЛЕНИЯ =====
    openBtn.onclick = () => {
        panel.style.display = panel.style.display === "none" ? "block" : "none";
    };

    addBtn("⚙️ Настройки", () => {
        const nick = prompt("Введите ваш ник (Nick_Name):", getSettings().nick);
        const rank = prompt("Введите вашу должность:", getSettings().rank);
        if (nick && rank) setSettings(nick, rank);
    }, "#3498db");

    addBtn("👤 Упомянуть", () => {
        insertText(`@${getAuthor()}, `);
    }, "#16a085");

    addBtn("✅ Одобрено", () => {
        insertText(getTemplate("Ваше заявление было рассмотрено и получило статус: [COLOR=rgb(0, 255, 127)][B]ОДОБРЕНО[/B][/COLOR]."));
    }, "#27ae60");

    addBtn("❌ Отказано", () => {
        const reason = prompt("Причина отказа:", "Не соответствует критериям.");
        if (reason) insertText(getTemplate(`Ваше заявление было рассмотрено и получило статус: [COLOR=rgb(255, 69, 0)][B]ОТКАЗАНО[/B][/COLOR].\n[B]Причина:[/B] ${reason}`));
    }, "#e74c3c");

    addBtn("⏳ На рассмотрении", () => {
        insertText(getTemplate("Ваше заявление находится в статусе: [COLOR=rgb(241, 196, 15)][B]НА РАССМОТРЕНИИ[/B][/COLOR]. Ожидайте вердикта."));
    }, "#f1c40f");

    addBtn("📌 Кандидаты СС", () => {
        let input = prompt("Ники через запятую:");
        if (!input) return;
        let list = input.split(",").map((n, i) => `[B]${i + 1}.[/B] ${n.trim()}`).join("\n");
        insertText(getTemplate(`Кандидаты, допущенные к обзвону:\n\n${list}\n\n[I]Время обзвона будет сообщено дополнительно.[/I]`));
    }, "#d35400");

    addBtn("🧹 Очистить", () => {
        const editor = document.querySelector('.fr-element.fr-view');
        if (editor) editor.innerHTML = "";
    }, "#7f8c8d");

    addBtn("Закрыть ✖", () => {
        panel.style.display = "none";
    }, "#444");

})();
