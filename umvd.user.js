// ==UserScript==
// @name         Leader Helper (Universal)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Плавающие кнопки ответов
// @author       Leader
// @match        *://*.gtadom.com/*
// @match        *://*.radmir.com/*
// @match        *://*.radmir-hosting.ru/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const responses = [
        { title: "✅ Одобрить", text: "[CENTER][B][COLOR=rgb(65, 168, 95)]ОДОБРЕНО[/COLOR][/B]\nС уважением, лидер организации.[/CENTER]" },
        { title: "❌ Отказать", text: "[CENTER][B][COLOR=rgb(184, 49, 47)]ОТКАЗАНО[/COLOR][/B]\nПричина: [/CENTER]" },
        { title: "⏳ Рассмотрение", text: "[CENTER][B][COLOR=rgb(243, 121, 52)]НА РАССМОТРЕНИИ[/COLOR][/B][/CENTER]" }
    ];

    function insertText(text) {
        // Пробуем найти любое поле ввода (текстареа или редактор)
        const editor = document.querySelector('.ck-editor__editable') || 
                       document.querySelector('.fr-element') || 
                       document.querySelector('textarea.js-editor');
        
        if (editor) {
            // Для современных редакторов XenForo
            if (editor.getAttribute('contenteditable') === 'true') {
                editor.focus();
                document.execCommand('insertText', false, text);
            } else {
                editor.value += text;
            }
        } else {
            alert('Поле ввода не найдено. Кликните мышкой в поле ответа и попробуйте снова.');
        }
    }

    // Создаем плавающее меню
    const menu = document.createElement('div');
    menu.style = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        background: #2c3e50;
        padding: 10px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        display: flex;
        flex-direction: column;
        gap: 8px;
    `;

    responses.forEach(res => {
        const btn = document.createElement('button');
        btn.innerHTML = res.title;
        btn.style = `
            cursor: pointer;
            padding: 8px 12px;
            background: #34495e;
            color: white;
            border: 1px solid #5d6d7e;
            border-radius: 4px;
            font-size: 13px;
            text-align: center;
            transition: 0.2s;
        `;
        btn.onmouseover = () => btn.style.background = '#48c9b0';
        btn.onmouseout = () => btn.style.background = '#34495e';
        
        btn.onclick = () => insertText(res.text);
        menu.appendChild(btn);
    });

    document.body.appendChild(menu);
})();
