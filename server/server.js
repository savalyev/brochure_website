require('dotenv').config();

const express = require("express");
const cors = require('cors');
const fetch = require('node-fetch');
const rateLimit = require('express-rate-limit');

const app = express();

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';

if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('[WARN] TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы в .env - бот не сможет отправлять сообщения.');
}

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());

const leadLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: { ok: false, error: 'Слишком много заявок. Попробуйте позже.' }
});

function escapeHtml(str = '') {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function buildTelegramMessage({ name, phone, company, message }) {
    return (
        '<b>Новая заявка с сайта</b>\n\n' +
        `<b>Имя:</b> ${escapeHtml(name)}\n` +
        `<b>Телефон:</b> ${escapeHtml(phone)}\n` +
        (company ? `<b>Заведение:</b> ${escapeHtml(company)}\n` : '') +
        (message ? `<b>Комментарий:</b> ${escapeHtml(message)}\n` : '') +
        `\n${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`
    );
}

app.post('/api/lead', leadLimiter, async(req, res) => {
    try {
        const { name, phone, company, message } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ ok: false, error: 'Поля "имя" и "телефон" обязательны.' });
        }

        const text = buildTelegramMessage({ name, phone, company, message });

        const tgResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text,
                parse_mode: 'HTML'
            })
        });

        const tgData = await tgResponse.json();

        if (!tgData.ok) {
            console.error('Telegram API error:', tgData);
            return res.status(502).json({ ok: false, error: 'Не удалось отправить сообщение в Telegram.' });
        }

        return res.json({ ok: true });
    } catch (err) {
        console.error('Server error:', err);
        return res.status(500).json({ ok: false, error: 'Внутренняя ошибка сервера.' });
    }
});

app.get('/api/health', (req, res) => res.json({ ok: true, status: 'running' }));

app.listen(PORT, () => {
    console.log(`Backend запущен: http://localhost:${PORT}`);
});