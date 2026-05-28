const API_BASE = '/api';

const el = (id) => document.getElementById(id);

const loginView = el('login-view');
const forgotView = el('forgot-view');
const resetView = el('reset-view');
const dashboardView = el('dashboard-view');
const navLogout = el('nav-logout');

const changePwModal = el('change-pw-modal');
const changePwMsg = el('change-pw-msg');
let isForcedChange = false;

// Helpers
const showAlert = (id, msg, type = 'error') => {
  const alertEl = el(id);
  alertEl.textContent = msg;
  alertEl.className = `alert ${type}`;
  alertEl.style.display = 'block';
  setTimeout(() => alertEl.style.display = 'none', 5000);
};

// Check Auth State
const checkAuth = () => {
  const token = localStorage.getItem('adminToken');
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('resetToken');

  if (resetToken) {
    loginView.style.display = 'none';
    resetView.style.display = 'block';
  } else if (token) {
    showDashboard();
  }
};

const showDashboard = () => {
  loginView.style.display = 'none';
  dashboardView.style.display = 'block';
  navLogout.style.display = 'flex';
  fetchMessages();
};

// Login
el('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = el('login-email').value;
  const password = el('login-password').value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('adminToken', data.token);
      if (data.needsPasswordChange) {
        isForcedChange = true;
        changePwMsg.style.display = 'block';
        el('btn-cancel-change').style.display = 'none';
        changePwModal.style.display = 'flex';
      } else {
        showDashboard();
      }
    } else {
      showAlert('login-alert', data.error || 'Login failed');
    }
  } catch (err) {
    showAlert('login-alert', 'Network error. Backend might be down.');
  }
});

// Forgot Password link
el('link-forgot').addEventListener('click', () => {
  loginView.style.display = 'none';
  forgotView.style.display = 'block';
});
el('link-login').addEventListener('click', () => {
  forgotView.style.display = 'none';
  loginView.style.display = 'block';
});

// Forgot Password Form
el('forgot-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = el('forgot-email').value;
  try {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (res.ok) {
      showAlert('forgot-alert', data.message, 'success');
      el('forgot-email').value = '';
    } else {
      showAlert('forgot-alert', data.error);
    }
  } catch (err) {
    showAlert('forgot-alert', 'Network error.');
  }
});

// Reset Password Form
el('reset-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const newPassword = el('reset-password').value;
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('resetToken');
  const email = urlParams.get('email');

  try {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token, newPassword })
    });
    const data = await res.json();
    if (res.ok) {
      showAlert('reset-alert', 'Password reset successfully! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = 'admin.html';
      }, 2000);
    } else {
      showAlert('reset-alert', data.error);
    }
  } catch (err) {
    showAlert('reset-alert', 'Network error.');
  }
});

// Change Password 
el('btn-change-password').addEventListener('click', () => {
  isForcedChange = false;
  changePwMsg.style.display = 'none';
  el('btn-cancel-change').style.display = 'block';
  changePwModal.style.display = 'flex';
});

el('btn-cancel-change').addEventListener('click', () => {
  changePwModal.style.display = 'none';
});

el('change-pw-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const oldPassword = el('change-old-pw').value;
  const newPassword = el('change-new-pw').value;
  const token = localStorage.getItem('adminToken');

  try {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ oldPassword, newPassword })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('adminToken', data.token); // update token
      changePwModal.style.display = 'none';
      el('change-old-pw').value = '';
      el('change-new-pw').value = '';
      if (isForcedChange) {
        showDashboard();
      } else {
        alert('Password changed successfully.');
      }
    } else {
      showAlert('change-pw-alert', data.error);
    }
  } catch (err) {
    showAlert('change-pw-alert', 'Network error.');
  }
});

// Logout
el('btn-logout').addEventListener('click', () => {
  localStorage.removeItem('adminToken');
  window.location.reload();
});

// Fetch Messages
const fetchMessages = async () => {
  const token = localStorage.getItem('adminToken');
  try {
    const res = await fetch(`${API_BASE}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('adminToken');
      window.location.reload();
      return;
    }

    const messages = await res.json();
    const container = el('messages-container');
    container.innerHTML = '';
    
    if (messages.length === 0) {
      container.innerHTML = '<p style="color:var(--text-secondary);">No messages yet.</p>';
      return;
    }

    messages.forEach(msg => {
      const date = new Date(msg.createdAt).toLocaleString();
      const div = document.createElement('div');
      div.className = 'message-card';
      
      const replySubject = encodeURIComponent(`Re: ${msg.subject}`);
      const replyBody = encodeURIComponent(`\n\n--- Original Message from ${msg.name} ---\n${msg.message}`);
      const mailtoLink = `mailto:${msg.email}?subject=${replySubject}&body=${replyBody}`;

      div.innerHTML = `
        <div class="message-header">
          <div>
            <strong>${msg.name}</strong> (<a href="mailto:${msg.email}" style="color:var(--accent-cyan);text-decoration:none;">${msg.email}</a>)
          </div>
          <div class="message-meta">${date}</div>
        </div>
        <div class="message-subject">Subject: ${msg.subject}</div>
        <div class="message-body" style="margin-top:12px; margin-bottom: 20px;">${msg.message}</div>
        <div style="border-top: 1px solid var(--bg-tertiary); padding-top: 12px; text-align: right;">
          <a href="${mailtoLink}" class="btn" style="padding: 6px 12px; font-size: 0.9rem;">Reply via Email</a>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    el('messages-container').innerHTML = '<p style="color:#ff5555;">Error loading messages.</p>';
  }
};

el('btn-refresh').addEventListener('click', fetchMessages);

// Init
checkAuth();
