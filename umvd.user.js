// ==UserScript==
// @name         UMVD CUSTOM MENU PRO
// @namespace    http://tampermonkey.net/
// @version      13.0
// @description  Выпадающее меню, выбор ранга из списка и полная настройка текстов.
// @author       Gemini AI
// @match        *://forum.blackrussia.online/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const RANKS = ["Сержант", "Старший Сержант", "Прапорщик", "Лейтенант", "Старший Лейтенант", "Капитан", "Майор", "Подполковник", "Полковник"];

    // 1. ПОЛУЧЕНИЕ ДАННЫХ
    const getStorage = () => ({
        nick: localStorage.getItem('umvd_nick') || "Nick_Name",
        rank: localStorage.getItem('umvd_rank') || "Полковник",
        txtOk: localStorage.getItem('umvd_txt_ok') || "Ждем вас в здании УМВД.",
        txtNo: localStorage.getItem('umvd_txt_no') || "Не соответствие критериям.",
        txtWait: localStorage.getItem('umvd_txt_wait') || "Заявление на рассмотрении."
    });

    // 2. ФУНКЦИЯ ВСТАВКИ
    function insertToEditor(html) {
        const editor = document.querySelector('.fr-element.fr-view');
        if (!editor) {
            alert("Ошибка: кликните в поле ввода!");
            return;
        }
        editor.focus();
        document.execCommand('insertHTML', false, html);
    }

    // 3. ШАБЛОН СООБЩЕНИЯ
    const buildMsg = (status, customText) => {
        const data = getStorage();
        const date = new Date().toLocaleDateString('ru-RU');
        const color = status === "ОДОБРЕНО" ? "#00FF7F" : (status === "ОТКАЗАНО" ? "#FF4500" : "#F39C12");

        return `<center>[COLOR=rgb(30, 144, 255)]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/COLOR]<br>` +
               `[B][FONT=times new roman][SIZE=5]УМВД ПО НИЖЕГОРОДСКОЙ ОБЛАСТИ[/SIZE][/FONT][/B]<br>` +
               `[COLOR=rgb(30, 144, 255)]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/COLOR]</center><br><br>` +
               `[FONT=times new roman][SIZE=4]Здравия желаю!<br><br>` +
               `Вердикт: [B][COLOR=${color}]${status}[/COLOR][/B]<br>` +
               `${customText}[/SIZE][/FONT]<br><br>` +
               `[RIGHT][B]Дата:[/B] ${date}<br>` +
               `[B]С уважением, ${data.rank} полиции[/B]<br>` +
               `[B]${data.nick}[/B][/RIGHT]`;
    };

    // 4. СОЗДАНИЕ ВЫПАДАЮЩЕГО МЕНЮ
    function injectMenu() {
        if (document.getElementById('umvd-main-wrapper')) return;

        const footer = document.querySelector('.formButtonGroup') || document.querySelector('.xf-formButtons');
        if (!footer) return;

        const wrapper = document.createElement('div');
        wrapper.id = 'umvd-main-wrapper';
        wrapper.style = "margin-bottom: 10px; position: relative; display: inline-block;";

        const mainBtn = document.createElement('button');
        mainBtn.innerText = "📋 ВЫБРАТЬ ОТВЕТ";
        mainBtn.type = "button";
        mainBtn.style = "background:#1e90ff; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:13px; box-shadow: 0 4px 6px rgba(0,0,0,0.2);";

        const dropdown = document.createElement('div');
        dropdown.id = 'umvd-dropdown';
        dropdown.style = "display:none; position:absolute; bottom:45px; left:0; background:#222; border:1px solid #1e90ff; border-radius:8px; width:200px; z-index:1000; overflow:hidden; box-shadow: 0 8px 16px rgba(0,0,0,0.4);";

        const data = getStorage();
        const options = [
            { t: "✅ Одобрить", act: () => insertToEditor(buildMsg("ОДОБРЕНО", data.txtOk)) },
            { t: "❌ Отказать", act: () => insertToEditor(buildMsg("ОТКАЗАНО", data.txtNo)) },
            { t: "⏳ Рассмотрение", act: () => insertToEditor(buildMsg("НА РАССМОТРЕНИИ", data.txtWait)) }
        ];

        options.forEach(opt => {
            const item = document.createElement('div');
            item.innerText = opt.t;
            item.style = "padding:12px; color:white; cursor:pointer; font-size:12px; border-bottom:1px solid #333; transition: 0.2s;";
            item.onmouseover = () => item.style.background = "#1e90ff";
            item.onmouseout = () => item.style.background = "transparent";
            item.onclick = () => {
                opt.act();
                dropdown.style.display = "none";
            };
            dropdown.appendChild(item);
        });

        mainBtn.onclick = (e) => {
            e.preventDefault();
            dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
        };

        wrapper.appendChild(mainBtn);
        wrapper.appendChild(dropdown);
        footer.parentNode.insertBefore(wrapper, footer);
    }

    // 5. НАСТРОЙКИ СПРАВА
    function injectSettings() {
        if (document.getElementById('umvd-settings-fab')) return;

        const fab = document.createElement('div');
        fab.id = 'umvd-settings-fab';
        fab.innerHTML = "⚙️";
        fab.style = "position:fixed; right:20px; top:50%; width:45px; height:45px; background:#1c1c1c; color:#1e90ff; display:flex; align-items:center; justify-content:center; border-radius:12px; cursor:pointer; z-index:10000; border:2px solid #1e90ff; font-size:20px;";

        fab.onclick = () => {
            const data = getStorage();
            const newNick = prompt("Ваш Ник (Nick_Name):", data.nick);
            
            // Выбор ранга
            let rankMsg = "Выберите номер вашего звания:\n" + RANKS.map((r, i) => `${i+1}. ${r}`).join("\n");
            const rankIndex = prompt(rankMsg, "9");
            const newRank = RANKS[parseInt(rankIndex) - 1] || data.rank;

            // Настройка текстов
            const newOk = prompt("Текст при ОДОБРЕНИИ (что писать после вердикта):", data.txtOk);
            const newNo = prompt("Текст при ОТКАЗЕ (что писать после вердикта):", data.txtNo);
            const newWait = prompt("Текст при РАССМОТРЕНИИ:", data.txtWait);

            if (newNick) {
                localStorage.setItem('umvd_nick', newNick);
                localStorage.setItem('umvd_rank', newRank);
                localStorage.setItem('umvd_txt_ok', newOk);
                localStorage.setItem('umvd_txt_no', newNo);
                localStorage.setItem('umvd_txt_wait', newWait);
                alert("Настройки успешно применены!");
                location.reload();
            }
        };

        document.body.appendChild(fab);
    }

    setInterval(() => {
        injectMenu();
        injectSettings();
    }, 1000);

})();
