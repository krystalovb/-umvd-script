// ==UserScript==
// @name         UMVD Helper
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Быстрый ответ
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    window.addEventListener('load', () => {
        const btn = document.createElement('button');
        btn.innerText = "Ответ УМВД";
        btn.style.position = "fixed";
        btn.style.bottom = "20px";
        btn.style.right = "20px";
        btn.style.zIndex = "9999";

        btn.onclick = () => {
            const textarea = document.querySelector('textarea');
            if (textarea) {
                textarea.value += "\\n[УМВД]\\nЗаявление рассмотрено.";
            } else {
                alert("Нет поля ввода");
            }
        };

        document.body.appendChild(btn);
    });
})();
