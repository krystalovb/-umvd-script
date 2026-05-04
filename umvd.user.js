// ==UserScript==
// @name         Black Russia УМВД - PRO Helper
// @namespace    https://forum.blackrussia.online
// @version      2.1
// @description  Улучшенный помощник УМВД: скрытое меню, выбор ранга и кастомные шаблоны
// @author       Adaptive AI
// @match        https://forum.blackrussia.online/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const RANKS = ["Рядовой", "Сержант", "Старший Сержант", "Прапорщик", "Лейтенант", "Старший Лейтенант", "Капитан", "Майор", "Подполковник", "Полковник"];

    // Загрузка настроек
    const getSettings = () => ({
        nick: localStorage.getItem('umvd_nick') || "Nick_Name",
        rank: localStorage.getItem('umvd_rank') || "Полковник",
        txtOk: localStorage.getItem('umvd_txt_ok') || "Ждем вас в отделении УМВД г. Южный для оформления.",
        txtNo: localStorage.getItem('umvd_txt_no') || "Вы не подходите по критериям вступления.",
        txtWait: localStorage.getItem('umvd_txt_wait') || "Ваше заявление передано на проверку в ИЦ МВД."
    });

    // Функция вставки текста в редактор
    function insertToEditor(html) {
        const editor = document.querySelector('.fr-element.fr-view');
        if (!editor) {
            alert('✗ Сначала нажмите в поле ввода сообщения!');
            return;
        }
        editor.focus();
        document.execCommand('insertHTML', false, html);
    }

    // Шаблон официального ответа УМВД
    const buildMsg = (status, customText) => {
        const data = getSettings();
        const date = new Date().toLocaleDateString('ru-RU');
        const color = status === "ОДОБРЕНО" ? "#22c55e" : (status === "ОТКАЗАНО" ? "#ef4444" : "#f59e0b");

        return `<div style="font-family: 'Times New Roman', Times, serif; font-size: 15px; color: rgb(30, 144, 255); text-align: center;">` +
               `[COLOR=rgb(30, 144, 255)]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/COLOR]<br>` +
               `[B][SIZE=5]МИНИСТЕРСТВО ВНУТРЕННИХ ДЕЛ[/SIZE][/B]<br>` +
               `[SIZE=4]УПРАВЛЕНИЕ МВД ПО НИЖЕГОРОДСКОЙ ОБЛАСТИ[/SIZE]<br>` +
               `[COLOR=rgb(30, 144, 255)]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/COLOR]<br><br>` +
               `Здравия желаю!<br>Ваше обращение/заявление было рассмотрено руководством УМВД.<br><br>` +
               `Вердикт: [B][COLOR=${color}]${status}[/COLOR][/B]<br>` +
               `<span style="color: white;">${customText}</span><br><br>` +
               `[RIGHT][B]Дата:[/B] ${date}<br>` +
               `[B]С уважением, ${data.rank} полиции[/B]<br>` +
               `[B]${data.nick}[/B][/RIGHT]</div>`;
    };

    // Создание интерфейса
    function createUI() {
        if (document.getElementById('umvd-helper-main')) return;

        // Кнопка-триггер (FAB)
        const fab = document.createElement('div');
        fab.id = 'umvd-helper-trigger';
        fab.innerHTML = '🚔';
        fab.title = "Открыть панель УМВД";
        fab.style = "position: fixed; bottom: 25px; right: 25px; width: 60px; height: 60px; background: #1e90ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10001; font-size: 28px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); transition: 0.3s; border: 2px solid rgba(255,255,255,0.1);";
        document.body.appendChild(fab);

        // Основная панель
        const panel = document.createElement('div');
        panel.id = 'umvd-helper-main';
        panel.style = "position: fixed; bottom: 95px; right: 25px; width: 260px; background: #1e1e27; border-radius: 12px; z-index: 10000; display: none; flex-direction: column; box-shadow: 0 10px 30px rgba(0,0,0,0.6); border: 1px solid #334155; overflow: hidden; font-family: 'Segoe UI', sans-serif;";
        panel.innerHTML = `
            <div style="background: #0f172a; padding: 12px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #38bdf8; font-size: 12px; font-weight: bold; letter-spacing: 1px;">UMVD HELPER</span>
                <span id="umvd-settings-btn" style="cursor:pointer; font-size: 16px; transition: 0.2s;">⚙️</span>
            </div>
            <div style="padding: 15px; display: flex; flex-direction: column; gap: 10px;">
                <button id="umvd-verdict-btn" style="background: #1e90ff; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 12px; transition: 0.2s;">📋 ВЫБРАТЬ ВЕРДИКТ</button>
                <div id="umvd-dropdown" style="display:none; background: #2d3748; border-radius: 8px; border: 1px solid #4a5568; overflow: hidden; animation: fadeIn 0.2s;">
                   <div class="drop-item" data-res="ok" style="padding: 12px; color: #4ade80; cursor: pointer; font-size: 11px; border-bottom: 1px solid #4a5568;">✅ ОДОБРИТЬ</div>
                   <div class="drop-item" data-res="no" style="padding: 12px; color: #f87171; cursor: pointer; font-size: 11px; border-bottom: 1px solid #4a5568;">❌ ОТКАЗАТЬ</div>
                   <div class="drop-item" data-res="wait" style="padding: 12px; color: #fbbf24; cursor: pointer; font-size: 11px;">⏳ РАССМОТРЕНИЕ</div>
                </div>
            </div>
            <div style="background: #0f172a; padding: 8px 15px; border-top: 1px solid #334155; font-size: 9px; color: #64748b; text-align: center;">POLICE DEPARTMENT SERVICE</div>
        `;
        document.body.appendChild(panel);

        // Обработка клика по шерифу
        fab.onclick = () => {
            panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
            document.getElementById('umvd-dropdown').style.display = 'none';
        };

        // Логика меню
        document.getElementById('umvd-verdict-btn').onclick = () => {
            const drp = document.getElementById('umvd-dropdown');
            drp.style.display = drp.style.display === 'none' ? 'block' : 'none';
        };

        document.querySelectorAll('.drop-item').forEach(item => {
            item.onmouseenter = () => item.style.background = "#3182ce";
            item.onmouseleave = () => item.style.background = "transparent";
            item.onclick = () => {
                const type = item.getAttribute('data-res');
                const data = getSettings();
                if(type === 'ok') insertToEditor(buildMsg("ОДОБРЕНО", data.txtOk));
                if(type === 'no') insertToEditor(buildMsg("ОТКАЗАНО", data.txtNo));
                if(type === 'wait') insertToEditor(buildMsg("НА РАССМОТРЕНИИ", data.txtWait));
                panel.style.display = 'none';
            };
        });

        // Кнопка настроек
        document.getElementById('umvd-settings-btn').onclick = () => {
            const data = getSettings();
            const nick = prompt("Ваш Ник (Name_Surname):", data.nick);
            const rankMsg = "Выберите ваше звание (цифра):\n" + RANKS.map((r, i) => `${i+1}. ${r}`).join("\n");
            const rankIdx = prompt(rankMsg, "10");
            const rank = RANKS[parseInt(rankIdx)-1] || data.rank;
            const okTxt = prompt("Текст при ОДОБРЕНИИ:", data.txtOk);
            const noTxt = prompt("Текст при ОТКАЗЕ:", data.txtNo);
            const waitTxt = prompt("Текст при РАССМОТРЕНИИ:", data.txtWait);

            if(nick !== null) {
                localStorage.setItem('umvd_nick', nick);
                localStorage.setItem('umvd_rank', rank);
                localStorage.setItem('umvd_txt_ok', okTxt);
                localStorage.setItem('umvd_txt_no', noTxt);
                localStorage.setItem('umvd_txt_wait', waitTxt);
                alert("Данные УМВД обновлены!");
                location.reload();
            }
        };
    }

    // Постоянная проверка на наличие кнопок (для динамических страниц)
    setInterval(createUI, 2000);

    // Дополнительные стили
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        #umvd-helper-trigger:hover { transform: scale(1.1) rotate(10deg); background: #007bff !important; }
        #umvd-settings-btn:hover { transform: rotate(90deg); color: #fff; }
        .drop-item:active { background: #1e40af !important; }
    `;
    document.head.appendChild(style);

})();
