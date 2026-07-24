require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';

const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT || 465;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_TO = process.env.EMAIL_TO;

if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS || !EMAIL_TO) {
    console.warn('[WARN] Не заданы переменные почты в .env — отправка заявок не будет работать.');
}

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());

const leadLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: { ok: false, error: 'Слишком много заявок. Попробуйте позже.' }
});

const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT),
    secure: Number(EMAIL_PORT) === 465,
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    }
});

function escapeHtml(str = '') {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function buildEmailHtml({ name, phone, company, message }) {
    return `
    <h2>🔔 Новая заявка с сайта</h2>
    <p><b>Имя:</b> ${escapeHtml(name)}</p>
    <p><b>Телефон:</b> ${escapeHtml(phone)}</p>
    ${company ? `<p><b>Заведение:</b> ${escapeHtml(company)}</p>` : ''}
    ${message ? `<p><b>Комментарий:</b> ${escapeHtml(message)}</p>` : ''}
    <p><small>${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}</small></p>
  `;
}

app.post('/api/lead', leadLimiter, async (req, res) => {
  try {
    const { name, phone, company, message } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ ok: false, error: 'Поля "имя" и "телефон" обязательны.' });
    }

    await transporter.sendMail({
      from: `"Сайт QC" <${EMAIL_USER}>`,
      to: EMAIL_TO,
      subject: 'Новая заявка с сайта proverkarest.ru',
      html: buildEmailHtml({ name, phone, company, message })
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('Ошибка отправки email:', err);
    return res.status(500).json({ ok: false, error: 'Не удалось отправить заявку.' });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true, status: 'running' }));

app.listen(PORT, () => {
  console.log(`✅ Backend запущен: http://localhost:${PORT}`);
});