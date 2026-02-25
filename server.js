import express from 'express';
import { createClient } from '@supabase/supabase-js';
import cookieParser from 'cookie-parser';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// --- Clients ---

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BOATOS_URL = process.env.BOATOS_URL;
const BOATOS_ADMIN_TOKEN = process.env.BOATOS_ADMIN_TOKEN;

// --- Helpers ---

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function requireAuth(req, res, next) {
  if (req.signedCookies.auth === 'true') return next();
  res.redirect('/login');
}

// --- Routes ---

app.get('/login', (req, res) => {
  const error = req.query.error
    ? '<p style="color:#e74c3c;margin:0 0 12px">Wrong PIN</p>'
    : '';
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f0f2f5; }
    .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); text-align: center; width: 300px; }
    h2 { margin: 0 0 20px; color: #1a1a1a; }
    input { width: 100%; padding: 14px; font-size: 24px; text-align: center; border: 2px solid #e0e0e0; border-radius: 8px; box-sizing: border-box; letter-spacing: 8px; }
    input:focus { outline: none; border-color: #4A90D9; }
    button { width: 100%; padding: 14px; font-size: 16px; background: #4A90D9; color: white; border: none; border-radius: 8px; cursor: pointer; margin-top: 16px; font-weight: 600; }
    button:hover { background: #357ABD; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Enter PIN</h2>
    ${error}
    <form method="POST" action="/login">
      <input type="password" name="pin" maxlength="6" inputmode="numeric" autofocus required>
      <button type="submit">Enter</button>
    </form>
  </div>
</body>
</html>`);
});

app.post('/login', (req, res) => {
  if (req.body.pin === process.env.PIN) {
    res.cookie('auth', 'true', {
      signed: true,
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });
    return res.redirect('/');
  }
  res.redirect('/login?error=1');
});

app.get('/logout', (req, res) => {
  res.clearCookie('auth');
  res.redirect('/login');
});

app.get('/', requireAuth, async (req, res) => {
  const { data } = await supabase
    .from('EDemail')
    .select('*')
    .eq('id', 1)
    .single();

  const content = escapeHtml(data?.content || '');
  const sendTime = data?.send_time || '08:20';
  const toEmails = escapeHtml(data?.to_emails || 'edsimms12@gmail.com');
  const ccEmails = escapeHtml(data?.cc_emails || 'mail@bradsimms.com, ryansimms@gmail.com');
  const lastSent = data?.last_sent_at
    ? new Date(data.last_sent_at).toLocaleString('en-US', { timeZone: 'America/New_York' })
    : 'Never';

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email to Ed</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f0f2f5; }
    .card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h1 { margin: 0; color: #1a1a1a; font-size: 22px; }
    .logout { color: #888; font-size: 13px; text-decoration: none; }
    .logout:hover { color: #e74c3c; }
    label { display: block; font-weight: 600; color: #555; margin-bottom: 8px; font-size: 14px; }
    textarea { width: 100%; height: 200px; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 15px; font-family: inherit; resize: vertical; }
    textarea:focus { outline: none; border-color: #4A90D9; }
    .time-row { display: flex; align-items: center; gap: 12px; margin: 20px 0; }
    .time-row label { margin: 0; }
    input[type="time"] { padding: 10px 14px; font-size: 16px; border: 2px solid #e0e0e0; border-radius: 8px; }
    input[type="time"]:focus { outline: none; border-color: #4A90D9; }
    input[type="text"] { width: 100%; padding: 10px 14px; font-size: 15px; border: 2px solid #e0e0e0; border-radius: 8px; font-family: inherit; }
    input[type="text"]:focus { outline: none; border-color: #4A90D9; }
    .field { margin-bottom: 16px; }
    .btn { display: block; width: 100%; padding: 14px; font-size: 15px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; margin-top: 12px; }
    .btn-save { background: #4A90D9; color: white; }
    .btn-save:hover { background: #357ABD; }
    .btn-send { background: #28a745; color: white; }
    .btn-send:hover { background: #1e7e34; }
    .status { margin-top: 16px; padding: 12px; border-radius: 8px; text-align: center; font-weight: 500; display: none; }
    .meta { color: #999; font-size: 13px; margin-top: 20px; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Email to Ed</h1>
      <a href="/logout" class="logout">Logout</a>
    </div>

    <label for="content">Email Content</label>
    <textarea id="content">${content}</textarea>

    <div class="time-row">
      <label for="sendTime">Send Time (EST):</label>
      <input type="time" id="sendTime" value="${sendTime}">
    </div>

    <div class="field">
      <label for="toEmails">To</label>
      <input type="text" id="toEmails" value="${toEmails}">
    </div>

    <div class="field">
      <label for="ccEmails">CC</label>
      <input type="text" id="ccEmails" value="${ccEmails}">
    </div>

    <button class="btn btn-save" onclick="save()">Save</button>
    <button class="btn btn-send" onclick="sendNow()">Send Now</button>

    <div id="status" class="status"></div>
    <p class="meta">Last sent: ${lastSent}</p>
  </div>

  <script>
    function showStatus(msg, isError) {
      const el = document.getElementById('status');
      el.textContent = msg;
      el.style.display = 'block';
      el.style.background = isError ? '#f8d7da' : '#d4edda';
      el.style.color = isError ? '#721c24' : '#155724';
      setTimeout(() => { el.style.display = 'none'; }, 4000);
    }

    async function save() {
      try {
        const res = await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: document.getElementById('content').value,
            send_time: document.getElementById('sendTime').value,
            to_emails: document.getElementById('toEmails').value,
            cc_emails: document.getElementById('ccEmails').value,
          }),
        });
        const data = await res.json();
        showStatus(data.success ? 'Saved!' : data.error, !data.success);
      } catch (e) {
        showStatus('Error: ' + e.message, true);
      }
    }

    async function sendNow() {
      if (!confirm('Send email to Ed now?')) return;
      try {
        showStatus('Sending...', false);
        const res = await fetch('/api/send', { method: 'POST' });
        const data = await res.json();
        showStatus(data.success ? 'Email sent!' : data.error, !data.success);
        if (data.success) setTimeout(() => location.reload(), 2000);
      } catch (e) {
        showStatus('Error: ' + e.message, true);
      }
    }
  </script>
</body>
</html>`);
});

// --- API ---

app.post('/api/save', requireAuth, async (req, res) => {
  const { content, send_time, to_emails, cc_emails } = req.body;
  const { error } = await supabase
    .from('EDemail')
    .upsert({
      id: 1,
      content,
      send_time,
      to_emails,
      cc_emails,
      updated_at: new Date().toISOString(),
    });

  if (error) return res.json({ success: false, error: error.message });
  res.json({ success: true });
});

app.post('/api/send', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('EDemail')
      .select('content, to_emails, cc_emails')
      .eq('id', 1)
      .single();

    if (error || !data?.content) {
      return res.json({ success: false, error: 'No email content found. Save content first.' });
    }

    const today = new Date().toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const emailContent = data.content.replace(/\{\{location\}\}/g, 'on the boat');
    const fullContent = `Hello Ed,\nToday is ${today}\n\n${emailContent}`;

    const response = await fetch(`${BOATOS_URL}/admin/api/email-proxy/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': BOATOS_ADMIN_TOKEN,
      },
      body: JSON.stringify({
        to: data.to_emails || 'edsimms12@gmail.com',
        cc: data.cc_emails || 'mail@bradsimms.com, ryansimms@gmail.com',
        subject: 'Email from Ryan and Brad about your day',
        text: fullContent,
      }),
    });

    const result = await response.json();
    if (!result.success) return res.json({ success: false, error: result.error });

    await supabase
      .from('EDemail')
      .update({ last_sent_at: new Date().toISOString() })
      .eq('id', 1);

    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// Minimal response for cron/uptime checks (avoids "output too large" from monitors)
app.get('/health', (req, res) => {
  res.type('text/plain').send('ok');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
