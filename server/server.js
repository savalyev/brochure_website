require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
// HOST=127.0.0.1 — когда сервер стоит за nginx и не должен торчать наружу напрямую.
const HOST = process.env.HOST || undefined;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';
// За nginx реальный IP посетителя приходит в X-Forwarded-For. Без этого rate limit
// видит у всех IP прокси и лимит становится общим на весь сайт.
// По умолчанию доверяем только локальному прокси (nginx на той же машине).
const TRUST_PROXY = process.env.TRUST_PROXY || 'loopback';

const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT || 465;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_TO = process.env.EMAIL_TO;

if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS || !EMAIL_TO) {
    console.warn('[WARN] Не заданы переменные почты в .env — отправка заявок не будет работать.');
}

app.set('trust proxy', /^\d+$/.test(TRUST_PROXY) ? Number(TRUST_PROXY) : TRUST_PROXY);
app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json({ limit: '10kb' }));

const FIELD_LIMITS = { name: 100, phone: 30, restaurant: 200, comment: 2000 };

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
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function cleanField(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function buildEmailHtml({ name, phone, restaurant, comment }) {
    return `
    <h2>🔔 Новая заявка с сайта</h2>
    <p><b>Имя:</b> ${escapeHtml(name)}</p>
    <p><b>Телефон:</b> ${escapeHtml(phone)}</p>
    ${restaurant ? `<p><b>Заведение:</b> ${escapeHtml(restaurant)}</p>` : ''}
    ${comment ? `<p><b>Комментарий:</b> ${escapeHtml(comment)}</p>` : ''}
    <p><small>${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}</small></p>
  `;
}

app.post('/api/lead', leadLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const lead = {
      name: cleanField(body.name),
      phone: cleanField(body.phone),
      // company — старое имя поля, оставлено для совместимости
      restaurant: cleanField(body.restaurant) || cleanField(body.company),
      comment: cleanField(body.comment)
    };

    if (!lead.name || !lead.phone) {
      return res.status(400).json({ ok: false, error: 'Поля "имя" и "телефон" обязательны.' });
    }

    if (body.consent !== true) {
      return res.status(400).json({ ok: false, error: 'Нужно согласие на обработку персональных данных.' });
    }

    const tooLong = Object.keys(FIELD_LIMITS).find((key) => lead[key].length > FIELD_LIMITS[key]);
    if (tooLong) {
      return res.status(400).json({ ok: false, error: 'Слишком длинное значение в форме.' });
    }

    await transporter.sendMail({
      from: `"Сайт QC" <${EMAIL_USER}>`,
      to: EMAIL_TO,
      subject: 'Новая заявка с сайта proverkarest.ru',
      html: buildEmailHtml(lead)
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('Ошибка отправки email:', err);
    return res.status(500).json({ ok: false, error: 'Не удалось отправить заявку.' });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true, status: 'running' }));

app.listen(PORT, HOST, () => {
  console.log(` Backend запущен: http://${HOST || 'localhost'}:${PORT}`);
});