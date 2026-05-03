// ==UserScript==
// @name         Fraction Leader Responses (GitHub Version)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Быстрые ответы для лидеров фракций
// @author       Твое Имя
// @match        https://forum.gtadom.com/*
// @match        https://forum.radmir.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Конфигурация ответов
    const responses = [
        {
            title: "✅ Одобрено",
            text: "[CENTER][COLOR=rgb(65, 168, 95)][B]ОДОБРЕНО[/B][/COLOR]\n\nС уважением, лидер организации.\nСвяжитесь со мной в спец. связи для дальнейших инструкций.[/CENTER]"
        },
        {
            title: "❌ Отказ",
            text: "[CENTER][COLOR=rgb(184, 49, 47)][B]ОТКАЗАНО[/B][/COLOR]\n\nПричина: Несоответствие критериям / Слабая биография.[/CENTER]"
        },
        {
            title: "⏳ На рассмотрении",
            text: "[CENTER][COLOR=rgb(243, 121, 52)][B]НА РАССМОТРЕНИИ[/B][/COLOR]\n\nОжидайте ответа в течение 24 часов.[/CENTER]"
        }
    ];

    function insertText(text) {
        const editor = document.querySelector('.ck-editor__editable') || document.querySelector('textarea');
        if (editor) {
            // Если на форуме используется CKEditor (современные движки)
            if (editor.ckeditorInstance) {
                editor.ckeditorInstance.setData(text);
            } else {
                // Если обычная textarea
                editor.value += text;
            }
        }
    }

    function createButtons() {
        const toolbar = document.querySelector('.ck-toolbar__items') || document.querySelector('.buttonGroup');
        if (!toolbar) return;

        const container = document.createElement('div');
        container.style.padding = '10px';
        container.style.display = 'flex';
        container.style.gap = '5px';
        container.style.flexWrap = 'wrap';
        container.id = 'leader-helper-panel';

        responses.forEach(res => {
            const btn = document.createElement('button');
            btn.innerHTML = res.title;
            btn.type = 'button';
            btn.style.padding = '5px 10px';
            btn.style.cursor = 'pointer';
            btn.style.border = '1px solid #ccc';
            btn.style.borderRadius = '4px';
            btn.style.background = '#f5f5f5';

            btn.onclick = () => insertText(res.text);
            container.appendChild(btn);
        });

        toolbar.parentNode.insertBefore(container, toolbar);
    }

    // Запуск через небольшую паузу, чтобы редактор успел прогрузиться
    setTimeout(createButtons, 2000);
})();
