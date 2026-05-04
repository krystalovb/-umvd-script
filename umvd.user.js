// ==UserScript==
// @name         UMVD Helper v1 AI | Black Russia
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Панель УМВД с AI-помощником и автоматизацией ответов
// @author       Сергей Грозный / Adaptive AI
// @match        https://forum.blackrussia.online/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=blackrussia.online
// @grant        GM_xmlhttpRequest
// @connect      api.groq.com
// ==/UserScript==

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // КОНФИГУРАЦИЯ УМВД
    // ═══════════════════════════════════════════════════════════════════════

    const CONFIG = {
        storage: {
            settings: 'umvd_v1_s',
            collapse: 'umvd_v1_c',
            aiKey: 'umvd_v1_ai'
        },
        defaults: {
            settings: { nick: 'Иван Иванов', rank: 'Полковник УМВД' },
            collapse: { umvd: false, promo: true, complaint: true },
            aiKey: ''
        },
        ranks: [
            {id:2, name:'Сержант',         short:'Сержант [2]'       },
            {id:3, name:'Старший сержант', short:'Ст. Сержант [3]'    },
            {id:4, name:'Прапорщик',       short:'Прапорщик [4]'     },
            {id:5, name:'Лейтенант',       short:'Лейтенант [5]'     },
            {id:6, name:'Старший лейтенант', short:'Ст. Лейтенант [6]'},
            {id:7, name:'Капитан',         short:'Капитан [7]'       },
            {id:8, name:'Майор',           short:'Майор [8]'         }
        ],
        quickReasons: {
            transfer_no:      ['Не полная форма заявления', 'Отсутствует разрешение руководства', 'Скриншотам более 3-х дней'],
            restore_no:       ['Прошло более 30 дней с момента ухода', 'Причина ухода — грубое нарушение (ОЧС)', 'Некорректные данные'],
            contract_no:      ['Низкий уровень законопослушности', 'Отсутствует военный билет', 'Опечатки в личных данных'],
            promo_no:         ['Не выполнены пункты системы повышения', 'Отсутствует фиксация проделанной работы'],
            complaint_no:     ['Недостаточно доказательств', 'Действия сотрудника правомерны', 'Нарушена форма подачи'],
            complaint_partial:['Сотрудник получит выговор, часть претензий отклонена', 'Проведена профилактическая беседа']
        },
        colors: {
            main: 'rgb(30, 144, 255)' // Полицейский синий
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // УТИЛИТЫ
    // ═══════════════════════════════════════════════════════════════════════

    const Utils = {
        storage: {
            load: (key, fallback) => {
                try {
                    const raw = localStorage.getItem(key);
                    return raw ? {...fallback, ...JSON.parse(raw)} : {...fallback};
                } catch { return {...fallback}; }
            },
            save: (key, value) => {
                try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
            }
        },
        date: {
            genDocNum: () => {
                const year = new Date().getFullYear();
                const rand = Math.floor(1000 + Math.random() * 9000);
                return `${year}-${rand}`;
            },
            getMSK: () => {
                const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
                const dd = String(d.getDate()).padStart(2,'0');
                const mm = String(d.getMonth()+1).padStart(2,'0');
                return `${dd}.${mm}.${d.getFullYear()}`;
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // AI ПОМОЩНИК (УМВД STYLE)
    // ═══════════════════════════════════════════════════════════════════════

    class AIAssistant {
        constructor(apiKey) {
            this.apiKey = apiKey;
            this.model = 'llama-3.3-70b-versatile';
        }

        async analyze(applicationText) {
            if (!this.apiKey) throw new Error('API ключ не настроен');

            const prompt = `Ты — сотрудник отдела кадров УМВД г. Южный в игре Black Russia.
ЗАЯВЛЕНИЕ: ${applicationText}

КРИТЕРИИ ДЛЯ ПОЛИЦИИ:
1. ОБРАЩЕНИЕ: Должно быть к "Начальнику УМВД" или "Полковнику".
2. НИК: Формат Nick_Name.
3. ДОКУМЕНТЫ: Должны быть ссылки на паспорт, медкарту, лицензии (B, оружие) и ВОЕННЫЙ БИЛЕТ (обязательно для УМВД).
4. ЗАКОНОПОСЛУШНОСТЬ: 10+.

Ответь строго в JSON:
{"decision": "approve" или "reject", "reason": "краткая причина на русском", "confidence": 0-100, "extracted_nick": "ник или null"}`;

            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: 'https://api.groq.com/openai/v1/chat/completions',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
                    data: JSON.stringify({
                        model: this.model,
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.2
                    }),
                    onload: (res) => {
                        try {
                            const data = JSON.parse(res.responseText);
                            const text = data.choices[0].message.content;
                            resolve(JSON.parse(text.match(/\{[\s\S]*\}/)[0]));
                        } catch (e) { reject(new Error('Ошибка обработки AI')); }
                    },
                    onerror: () => reject(new Error('Сеть недоступна'))
                });
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ШАБЛОНЫ ОТВЕТОВ УМВД
    // ═══════════════════════════════════════════════════════════════════════

    class TemplateEngine {
        constructor(nick, rank) {
            this.nick = nick;
            this.rank = rank;
        }

        header(title) {
            const num = Utils.date.genDocNum();
            const date = Utils.date.getMSK();
            const blue = CONFIG.colors.main;
            return (
                `[CENTER][COLOR=${blue}]══════════════════════════════════════════════════[/COLOR]\n` +
                `[B][FONT=times new roman][SIZE=5][COLOR=${blue}]МИНИСТЕРСТВО ВНУТРЕННИХ ДЕЛ[/COLOR][/SIZE][/FONT][/B]\n` +
                `[FONT=times new roman][SIZE=4]УПРАВЛЕНИЕ МВД ПО НИЖЕГОРОДСКОЙ ОБЛАСТИ\n` +
                `г. Южный[/SIZE][/FONT]\n` +
                `[COLOR=${blue}]══════════════════════════════════════════════════[/COLOR][/CENTER]\n` +
                `[FONT=times new roman][SIZE=3][COLOR=rgb(128,128,128)]Исх. № [B]${num}[/B] от [B]${date}[/B][/COLOR][/SIZE][/FONT]\n` +
                `[HR][/HR]\n` +
                `[FONT=times new roman][SIZE=4]{NICK}\n`
            );
        }

        footer() {
            return (
                `[HR][/HR]\n` +
                `[RIGHT][FONT=times new roman][SIZE=4]Начальник отдела кадров УМВД\n` +
                `[B]${this.rank} ${this.nick}[/B][/SIZE][/FONT][/RIGHT]`
            );
        }

        table(rows) { return `\n[TABLE]\n${rows.join('\n')}\n[/TABLE]\n`; }
        row(l, v) { return `[TR][TD][B]${l}[/B][/TD][TD]${v}[/TD][/TR]`; }

        build(type, params = {}) {
            let body = '';
            const statusOk = '[COLOR=rgb(0,255,0)][ICODE]ОДОБРЕНО[/ICODE][/COLOR]';
            const statusNo = '[COLOR=rgb(255,0,0)][ICODE]ОТКАЗАНО[/ICODE][/COLOR]';

            switch(type) {
                case 'transfer_ok':
                    body = this.table([this.row('Тип','Перевод в УМВД'), this.row('Вердикт',statusOk)]) + 
                           'Ваше заявление на перевод в органы внутренних дел было [B]одобрено[/B]. Ждем вас в отделении г. Южный.';
                    break;
                case 'transfer_no':
                    body = this.table([this.row('Тип','Перевод в УМВД'), this.row('Вердикт',statusNo), this.row('Причина', params.reason)]) + 
                           'Вам [B]отказано[/B] в переводе. Ознакомьтесь с причиной выше.';
                    break;
                case 'promo_ok':
                    body = this.table([this.row('Рапорт','На повышение'), this.row('Звание',params.rank.short), this.row('Вердикт',statusOk)]) +
                           'Поздравляю с присвоением нового специального звания!';
                    break;
                case 'complaint_ok':
                    body = this.table([this.row('Жалоба','На сотрудника'), this.row('Статус','[B]Удовлетворена[/B]'), this.row('Меры', params.punishment)]) +
                           `В отношении сотрудника ${params.staff} будут приняты дисциплинарные меры.`;
                    break;
                default: 
                    body = 'Документ находится на стадии рассмотрения.';
            }
            return this.header() + body + '\n' + this.footer();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // БАЗОВАЯ ЛОГИКА (ГЛАВНЫЙ КЛАСС)
    // ═══════════════════════════════════════════════════════════════════════

    class UMVDHelper {
        constructor() {
            this.settings = Utils.storage.load(CONFIG.storage.settings, CONFIG.defaults.settings);
            this.aiKey = localStorage.getItem(CONFIG.storage.aiKey) || '';
            this.engine = new TemplateEngine(this.settings.nick, this.settings.rank);
            this.ai = new AIAssistant(this.aiKey);
            this.init();
        }

        init() {
            this.injectStyles();
            this.createUI();
        }

        injectStyles() {
            const css = document.createElement('style');
            css.textContent = `
                #umvd-fab { position:fixed; bottom:20px; right:20px; width:60px; height:60px; border-radius:50%; background:${CONFIG.colors.main}; 
                            color:white; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:10000; font-size:30px; box-shadow:0 4px 15px rgba(0,0,0,0.4); }
                #umvd-panel { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); width:400px; background:#1c1c1c; border:2px solid ${CONFIG.colors.main};
                              border-radius:15px; z-index:10001; display:none; flex-direction:column; color:white; font-family:sans-serif; overflow:hidden; }
                .umvd-header { background:${CONFIG.colors.main}; padding:15px; font-weight:bold; text-align:center; position:relative; }
                .umvd-body { padding:15px; max-height:500px; overflow-y:auto; }
                .umvd-btn { width:100%; padding:10px; margin-bottom:8px; border:none; border-radius:5px; cursor:pointer; font-weight:bold; transition:0.2s; }
                .btn-ok { background:#28a745; color:white; }
                .btn-no { background:#dc3545; color:white; }
                .umvd-input { width:100%; padding:8px; margin-bottom:10px; background:#333; border:1px solid #555; color:white; border-radius:5px; box-sizing:border-box; }
                .active { display:flex !important; }
            `;
            document.head.appendChild(css);
        }

        createUI() {
            const fab = document.createElement('div');
            fab.id = 'umvd-fab'; fab.innerHTML = '🚔';
            document.body.appendChild(fab);

            const panel = document.createElement('div');
            panel.id = 'umvd-panel';
            panel.innerHTML = `
                <div class="umvd-header">УМВД HELPER AI <span id="umvd-close" style="position:absolute; right:15px; cursor:pointer;">✕</span></div>
                <div class="umvd-body">
                    <label style="font-size:12px; color:#aaa;">НИК ПОДАЮЩЕГО:</label>
                    <input type="text" id="umvd-tgt" class="umvd-input" placeholder="Ivan_Ivanov">
                    
                    <button class="umvd-btn btn-ok" id="btn-trans-ok">✅ ПЕРЕВОД: ОДОБРИТЬ</button>
                    <button class="umvd-btn btn-no" id="btn-trans-no">❌ ПЕРЕВОД: ОТКАЗ</button>
                    <hr style="border:0.5px solid #444;">
                    <button class="umvd-btn" style="background:#555; color:white;" id="btn-ai-check">🤖 AI АНАЛИЗ ЗАЯВКИ</button>
                    
                    <div style="margin-top:10px; font-size:11px; color:#888; text-align:center;">
                        Настройки: ${this.settings.nick} | ${this.settings.rank}
                    </div>
                </div>
            `;
            document.body.appendChild(panel);

            fab.onclick = () => panel.classList.toggle('active');
            document.getElementById('umvd-close').onclick = () => panel.classList.remove('active');

            // Пример обработки кнопки
            document.getElementById('btn-trans-ok').onclick = () => this.sendResponse('transfer_ok');
        }

        sendResponse(type) {
            const nick = document.getElementById('umvd-tgt').value;
            if (!nick) return alert('Введите ник игрока!');
            
            const text = this.engine.build(type, { nick });
            const editor = document.querySelector('.fr-element');
            if (editor) {
                editor.focus();
                document.execCommand('insertText', false, text);
                document.getElementById('umvd-panel').classList.remove('active');
            } else {
                alert('Поле ответа не найдено на странице!');
            }
        }
    }

    // Запуск
    new UMVDHelper();

})();
