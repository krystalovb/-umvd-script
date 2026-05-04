// ==UserScript==
// @name         UMVD ULTRA PRO MENU
// @namespace    http://tampermonkey.net/
// @version      7.0
// @description  Полный помощник с меню
// @match        *://forum.blackrussia.online/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ===== ДАННЫЕ =====
    function getData() {
        return {
            nick: localStorage.getItem("umvd_nick") || "Ваш Ник",
            rank: localStorage.getItem("umvd_rank") || "Старший состав УМВД"
        };
    }

    function setData(nick, rank) {
        localStorage.setItem("umvd_nick", nick);
        localStorage.setItem("umvd_rank", rank);
    }

    // ===== УТИЛИТЫ =====
    function insert(text) {
        const textarea = document.querySelector('textarea');
        if (textarea) textarea.value += text;
        else alert("Нет поля ввода");
    }

    function getAuthor() {
        const el = document.querySelector('.username');
        return el ? el.innerText : "Игрок";
    }

    function template(text) {
        const {nick, rank} = getData();
        return `

[УМВД]
${text}

С уважением, ${rank} ${nick}.
`;
    }

    // ===== КНОПКА ОТКРЫТИЯ =====
    const openBtn = document.createElement('button');
    openBtn.innerText = "UMVD";
    openBtn.style.position = "fixed";
    openBtn.style.right = "20px";
    openBtn.style.bottom = "20px";
    openBtn.style.zIndex = "9999";
    openBtn.style.padding = "10px";
    openBtn.style.borderRadius = "10px";
    openBtn.style.background = "#2ecc71";
    openBtn.style.color = "#fff";

    document.body.appendChild(openBtn);

    // ===== ПАНЕЛЬ =====
    const panel = document.createElement('div');
    panel.style.position = "fixed";
    panel.style.right = "20px";
    panel.style.bottom = "70px";
    panel.style.width = "230px";
    panel.style.background = "#111";
    panel.style.padding = "10px";
    panel.style.borderRadius = "10px";
    panel.style.display = "none";
    panel.style.zIndex = "9999";
    panel.style.color = "#fff";

    document.body.appendChild(panel);

    function addBtn(text, action, color="#2ecc71") {
        const btn = document.createElement('button');
        btn.innerText = text;
        btn.style.width = "100%";
        btn.style.margin = "4px 0";
        btn.style.padding = "6px";
        btn.style.border = "none";
        btn.style.borderRadius = "6px";
        btn.style.background = color;
        btn.style.color = "#fff";
        btn.onclick = action;
        panel.appendChild(btn);
    }

    // ===== ОТКРЫТИЕ / ЗАКРЫТИЕ =====
    openBtn.onclick = () => {
        panel.style.display = panel.style.display === "none" ? "block" : "none";
    };

    addBtn("❌ Закрыть", () => {
        panel.style.display = "none";
    }, "#c0392b");

    // ===== НАСТРОЙКИ =====
    addBtn("⚙️ Настройки", () => {
        const nick = prompt("Ник:", getData().nick);
        const rank = prompt("Должность:", getData().rank);
        if (nick && rank) setData(nick, rank);
    }, "#3498db");

    // ===== ОСНОВНЫЕ =====
    addBtn("👤 Упомянуть", () => {
        insert(`@${getAuthor()} `);
    }, "#16a085");

    addBtn("✅ Одобрено", () => {
        insert(template("Ваше заявление рассмотрено.\n\nОтвет: Одобрено"));
    });

    addBtn("❌ Отказано", () => {
        const reason = prompt("Причина:", "Не соответствует требованиям");
        insert(template(`Ваше заявление рассмотрено.\n\nОтвет: Отказано\nПричина: ${reason}`));
    }, "#e74c3c");

    addBtn("⏳ На рассмотрении", () => {
        insert(template("Ваше заявление на рассмотрении"));
    }, "#f1c40f");

    addBtn("📄 Запрос", () => {
        insert(template("Требуется дополнительная информация"));
    }, "#9b59b6");

    addBtn("📌 Исправьте", () => {
        insert(template("Исправьте заявление и подайте заново"));
    }, "#e67e22");

    addBtn("🚫 Нарушение", () => {
        insert(template("Обнаружено нарушение правил"));
    }, "#c0392b");

    // ===== СС =====
    addBtn("📢 Кандидаты СС", () => {
        let input = prompt("Ники через запятую:");
        if (!input) return;

        let list = input.split(",")
            .map(n=>n.trim())
            .filter(n=>n)
            .map((n,i)=>`${i+1}. ${n}`)
            .join("\\n");

        insert(template(`Допущены кандидаты:\n\n${list}`));
    }, "#d35400");

    addBtn("❌ Не прошли", () => {
        let input = prompt("Ники через запятую:");
        if (!input) return;

        let list = input.split(",")
            .map(n=>n.trim())
            .filter(n=>n)
            .map((n,i)=>`${i+1}. ${n}`)
            .join("\\n");

        insert(template(`Не прошли:\n\n${list}`));
    }, "#7f0000");

    // ===== ДОП =====
    addBtn("🧹 Очистить", () => {
        const textarea = document.querySelector('textarea');
        if (textarea) textarea.value = "";
    }, "#7f8c8d");

})();
