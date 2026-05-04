// ==UserScript==
// @name         UMVD ULTRA PRO Helper
// @namespace    http://tampermonkey.net/
// @version      6.0
// @description  Максимальный помощник старшего состава УМВД
// @match        *://forum.blackrussia.online/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ===================== ДАННЫЕ =====================
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

    // ===================== УТИЛИТЫ =====================
    function insert(text) {
        const textarea = document.querySelector('textarea');
        if (textarea) textarea.value += text;
        else alert("❌ Поле ввода не найдено");
    }

    function copy(text) {
        navigator.clipboard.writeText(text);
        alert("📋 Скопировано");
    }

    function getAuthor() {
        const el = document.querySelector('.username');
        return el ? el.innerText : "Игрок";
    }

    function chooseReason() {
        const reasons = [
            "Не соответствует требованиям",
            "Недостаточно доказательств",
            "Нарушение правил подачи",
            "Неверное оформление",
            "Дубликат заявки"
        ];
        return prompt("Причина отказа:\n" + reasons.map((r,i)=>`${i+1}. ${r}`).join("\n"), reasons[0]);
    }

    function
