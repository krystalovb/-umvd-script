// ==UserScript==
// @name         UMVD Official Helper (Report Edition)
// @namespace    https://forum.blackrussia.online
// @version      4.0
// @description  Официальный помощник УМВД: Рапорты, Итоги, Исходящие номера
// @author       Saint_Rivera & Gemini
// @match        https://forum.blackrussia.online/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const RANKS = ["Рядовой", "Сержант", "Старший Сержант", "Прапорщик", "Лейтенант", "Старший Лейтенант", "Капитан", "Майор", "Подполковник", "Полковник"];

    const getSettings = () => ({
        nick: localStorage.getItem('umvd_nick') || "Nick_Name",
        rank: localStorage.getItem('umvd_rank') || "Полковник"
    });

    // Функция вставки с цитатой
    async function quoteAndInsert(text) {
        const quoteBtn = document.querySelector('.message:last-child [data-xf-click="quote"]') || 
                         document.querySelector('[data-xf-click="quote"]');
        if (quoteBtn) quoteBtn.click();

        setTimeout(() => {
            const editor = document.querySelector('.fr-element.fr-view');
            if (editor) {
                editor.focus();
                document.execCommand('insertHTML', false, text);
            }
        }, 400);
    }

    // Генератор официального заголовка
    function getOfficialHeader() {
        const date = new Date().toLocaleDateString('ru-RU');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        return `<div style="text-align: left; font-family: 'Times New Roman'; font-size: 14px; color: #d1d5db;">` +
               `г. Южный, ул. Центральная, д. 1<br>` +
               `Исходящий номер: №У-${randomNum} от ${date}</div><br>`;
    }

    // Модальные окна для итогов (как в армейском скрипте)
    async function getResultsData() {
        const approvedInput = prompt("Введите ники ОДОБРЕННЫХ кандидатов через запятую:");
        const rejectedInput = prompt("Введите ники и причины ОТКАЗАННЫХ (пример: Nick_Name - скриншотам 3+ дня):");
        
        let approvedList = approvedInput ? approvedInput.split(',').map((n, i) => `${i+1}. ${n.trim()}`).join('<br>') : "—";
        let rejectedList = rejectedInput ? rejectedInput.split(',').map((n, i) => `${i+1}. ${n.trim()}`).join('<br>') : "—";

        const date = new Date().toLocaleDateString('ru-RU');
        const data = getSettings();

        const html = `<div style="text-align: center; font-family: 'Times New Roman'; font-size: 16px; color: #fff;">` +
            getOfficialHeader() +
            `<span style="color: #1e90ff; font-weight: bold; font-size: 18px;">ИТОГИ РАССМОТРЕНИЯ ЗАЯВОК</span><br><br>` +
            `<div style="text-align: left;">` +
            `Уважаемые граждане, уведомляем вас о завершении проверки поданных анкет.<br><br>` +
            `<span style="color: #22c55e;">[B]ОДОБРЕННЫЕ КАНДИДАТЫ:[/B]</span><br>${approvedList}<br><br>` +
            `<span style="color: #ef4444;">[B]ОТКАЗАННЫЕ КАНДИДАТЫ:[/B]</span><br>${rejectedList}<br><br>` +
            `Информация о времени проведения обзвона/встречи будет сообщена дополнительно.<br><br>` +
            `[RIGHT][B]С уважением, ${data.rank} полиции ${data.nick}[/B][/RIGHT]</div></div>`;
        
        quoteAndInsert(html);
    }

    // Обычные ответы (Рапорты)
    const buildReportMsg = (status) => {
        const data = getSettings();
        const color = status === "ОДОБРЕНО" ? "#22c55e" : "#ef4444";
        
        let footerText = status === "ОДОБРЕНО" 
            ? "Благодарим за проявленный интерес к службе в органах внутренних дел. Вам необходимо явиться в дежурную часть г. Южный для прохождения дальнейших процедур."
            : "К сожалению, на данный момент мы не готовы предложить вам службу. Попробуйте подать заявление позже, исправив ошибки.";

        if(status === "БЛАГОДАРНОСТЬ") {
             return getOfficialHeader() + `<div style="font-family: 'Times New Roman'; font-size: 15px;">Уважаемый(-ая), руководство УМВД выражает вам признательность за теплые слова и проявленное внимание. Желаем вам успехов!<br><br>[RIGHT][B]${data.rank} ${data.nick}[/B][/RIGHT]</div>`;
        }

        return `<div style="font-family: 'Times New Roman'; font-size: 15px; color: #fff;">` +
               getOfficialHeader() +
               `Уважаемый(-ая), ваш рапорт/заявление было официально рассмотрено руководством Управления МВД.<br><br>` +
               `СТАТУС: [B][COLOR=${color}]${status}[/COLOR][/B]<br><br>` +
               `${footerText}<br><br>` +
               `[RIGHT][B]${data.rank} полиции ${data.nick}[/B][/RIGHT]</div>`;
    };

    function createUI() {
        if (document.getElementById('umvd-helper-main')) return;

        const fab = document.createElement('div');
        fab.id = 'umvd-helper-trigger';
        fab.innerHTML = '🚔';
        fab.style = "position: fixed; bottom: 25px; right: 25px; width: 55px; height: 55px; background: #1e90ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10001; font-size: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);";
        document.body.appendChild(fab);

        const panel = document.createElement('div');
        panel.id = 'umvd-helper-main';
        panel.style = "position: fixed; bottom: 90px; right: 25px; width: 230px; background: #1e1e27; border-radius: 12px; z-index: 10000; display: none; flex-direction: column; box-shadow: 0 10px 30px rgba(0,0,0,0.6); border: 1px solid #334155; overflow: hidden; font-family: sans-serif;";
        panel.innerHTML = `
            <div style="background: #0f172a; padding: 12px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #38bdf8; font-size: 12px; font-weight: bold;">УМВД ПОМОЩНИК</span>
                <span id="umvd-settings-btn" style="cursor:pointer;">⚙️</span>
            </div>
            <div style="padding: 10px; display: flex; flex-direction: column; gap: 8px;">
                <button class="u-btn" data-type="ok" style="background:#0d5c3e; border:none; color:white; padding:10px; border-radius:6px; cursor:pointer; font-size:12px;">✅ ОДОБРИТЬ</button>
                <button class="u-btn" data-type="no" style="background:#7a2e2e; border:none; color:white; padding:10px; border-radius:6px; cursor:pointer; font-size:12px;">❌ ОТКАЗАТЬ</button>
                <button class="u-btn" data-type="results" style="background:#3b82f6; border:none; color:white; padding:10px; border-radius:6px; cursor:pointer; font-size:12px;">📊 ИТОГИ (СПИСОК)</button>
                <button class="u-btn" data-type="thanks" style="background:#4b5563; border:none; color:white; padding:10px; border-radius:6px; cursor:pointer; font-size:12px;">🙏 БЛАГОДАРНОСТЬ</button>
            </div>
        `;
        document.body.appendChild(panel);

        fab.onclick = () => panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';

        document.querySelectorAll('.u-btn').forEach(btn => {
            btn.onclick = () => {
                const type = btn.getAttribute('data-type');
                if (type === 'results') {
                    getResultsData();
                } else if (type === 'ok') {
                    quoteAndInsert(buildReportMsg("ОДОБРЕНО"));
                } else if (type === 'no') {
                    quoteAndInsert(buildReportMsg("ОТКАЗАНО"));
                } else if (type === 'thanks') {
                    quoteAndInsert(buildReportMsg("БЛАГОДАРНОСТЬ"));
                }
                panel.style.display = 'none';
            };
        });

        document.getElementById('umvd-settings-btn').onclick = () => {
            const data = getSettings();
            const nick = prompt("Ваш Ник (Name_Surname):", data.nick);
            const rIdx = prompt("Выберите звание (цифра):\n" + RANKS.map((r, i) => `${i+1}. ${r}`).join("\n"), "10");
            const rank = RANKS[parseInt(rIdx)-1] || data.rank;
            if(nick) {
                localStorage.setItem('umvd_nick', nick);
                localStorage.setItem('umvd_rank', rank);
                location.reload();
            }
        };
    }

    setInterval(createUI, 2000);
})();
