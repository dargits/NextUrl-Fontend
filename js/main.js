/* ============================================
   MAIN.JS — Logic chính từng trang
   Detect page bằng data-page attribute trên body
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Khởi tạo chung cho mọi trang
  initThemeToggle();
  initMobileNav();
  updateNavbar();

  // Detect trang hiện tại
  const page = document.body.dataset.page;
  switch (page) {
    case 'home':
      initHomePage();
      break;
    case 'login':
      initLoginPage();
      break;
    case 'register':
      initRegisterPage();
      break;
    case 'dashboard':
      initDashboardPage();
      break;
    case 'analytics':
      initAnalyticsPage();
      break;
  }
});

/* ============================================
   DARK MODE TOGGLE
   ============================================ */
function initThemeToggle() {
  // Load theme từ localStorage
  const savedTheme = localStorage.getItem('linkshort_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('linkshort_theme', next);
    updateThemeIcon(next);
  });
}

function updateThemeIcon(theme) {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;
  toggleBtn.innerHTML = theme === 'dark'
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
}

/* ============================================
   MOBILE NAV TOGGLE
   ============================================ */
function initMobileNav() {
  const toggleBtn = document.getElementById('nav-mobile-toggle');
  const navLinks = document.getElementById('nav-links');
  if (!toggleBtn || !navLinks) return;

  toggleBtn.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    const isOpen = navLinks.classList.contains('open');
    toggleBtn.innerHTML = isOpen
      ? '<i class="fa-solid fa-xmark"></i>'
      : '<i class="fa-solid fa-bars"></i>';
  });

  // Đóng nav khi click vào link
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
    });
  });
}

/* ============================================
   UTILITY FUNCTIONS
   ============================================ */

/** Copy text vào clipboard + show toast */
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('success', 'Đã sao chép vào clipboard!', 'Sao chép');
  }).catch(() => {
    // Fallback cho trình duyệt cũ
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('success', 'Đã sao chép vào clipboard!', 'Sao chép');
  });
}

/** Mở QR Code modal */
function showQRCode(url) {
  const modal = document.getElementById('qr-modal');
  if (!modal) return;

  const qrImg = modal.querySelector('.qr-image');
  const qrUrl = modal.querySelector('.qr-url');
  // Dùng API miễn phí để sinh QR
  qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  qrImg.alt = `QR Code cho ${url}`;
  qrUrl.textContent = url;

  modal.classList.add('show');
}

/** Đóng QR Code modal */
function closeQRModal() {
  const modal = document.getElementById('qr-modal');
  if (modal) modal.classList.remove('show');
}

/** Chia sẻ link (Web Share API fallback → copy) */
function shareLink(url) {
  if (navigator.share) {
    navigator.share({
      title: 'Link rút gọn — NextUrl',
      text: 'Xem link rút gọn của tôi:',
      url: url
    }).catch(() => {
      // User cancelled sharing
    });
  } else {
    copyToClipboard(url);
  }
}

/** Validate URL (bắt đầu bằng http:// hoặc https://) */
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Format ngày giờ */
function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/** Tạo full short URL từ key */
function buildShortUrl(shortKey) {
  return `${API_BASE_URL}/${shortKey}`;
}

/** Set loading state cho button */
function setButtonLoading(btn, loading) {
  if (loading) {
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> Đang xử lý...`;
    btn.disabled = true;
    btn.classList.add('loading');
  } else {
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
    btn.disabled = false;
    btn.classList.remove('loading');
  }
}

/* ============================================
   HOME PAGE — Rút gọn link
   ============================================ */
function initHomePage() {
  const form = document.getElementById('shorten-form');
  const urlInput = document.getElementById('url-input');
  const submitBtn = document.getElementById('shorten-btn');
  const resultSection = document.getElementById('result-section');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const originalUrl = urlInput.value.trim();

    // Validate URL
    if (!originalUrl) {
      showToast('error', 'Vui lòng nhập URL cần rút gọn');
      urlInput.focus();
      return;
    }

    if (!isValidUrl(originalUrl)) {
      showToast('error', 'URL không hợp lệ. Vui lòng nhập URL bắt đầu bằng http:// hoặc https://');
      urlInput.focus();
      return;
    }

    // Gọi API
    setButtonLoading(submitBtn, true);
    try {
      const token = getToken();
      const response = await createShortLink({ original_link: originalUrl }, token);

      if (response.code === 200 || response.code === 201) {
        showToast('success', 'Tạo link rút gọn thành công!');
        displayResult(response.data, originalUrl);
      } else {
        handleApiResponse(response);
      }
    } catch (error) {
      // Network error đã xử lý trong apiRequest
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

/** Hiển thị kết quả rút gọn */
function displayResult(data, originalUrl) {
  const resultSection = document.getElementById('result-section');
  if (!resultSection) return;

  // Xây dựng short URL
  const shortKey = data.shortKey || data.shortUrl || data.key || '';
  const shortUrl = shortKey.startsWith('http') ? shortKey : buildShortUrl(shortKey);

  resultSection.innerHTML = `
    <div class="result-card">
      <div class="short-url" id="short-url-text">${shortUrl}</div>
      <div class="original-url" title="${originalUrl}">${originalUrl}</div>
      <div class="result-actions">
        <button class="btn btn-primary btn-sm" onclick="copyToClipboard('${shortUrl}')">
          <i class="fa-solid fa-copy"></i> Sao chép
        </button>
        <button class="btn btn-secondary btn-sm" onclick="showQRCode('${shortUrl}')">
          <i class="fa-solid fa-qrcode"></i> Xem QR
        </button>
        <button class="btn btn-secondary btn-sm" onclick="shareLink('${shortUrl}')">
          <i class="fa-solid fa-share-nodes"></i> Chia sẻ
        </button>
      </div>
    </div>
    ${!isLoggedIn() ? `
      <div class="login-prompt">
        <i class="fa-solid fa-circle-info"></i>
        <a href="register.html">Đăng ký</a> hoặc <a href="login.html">đăng nhập</a> để quản lý link của bạn.
      </div>
    ` : ''}
  `;

  resultSection.classList.remove('hidden');
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ============================================
   LOGIN PAGE
   ============================================ */
function initLoginPage() {
  // Nếu đã đăng nhập → redirect về home
  if (isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const account = document.getElementById('login-account').value.trim();
    const password = document.getElementById('login-password').value;
    const submitBtn = form.querySelector('button[type="submit"]');

    // Validate
    if (!account) {
      showToast('error', 'Vui lòng nhập tên tài khoản');
      return;
    }
    if (account.length < 3 || account.length > 50) {
      showToast('error', 'Tên tài khoản phải từ 3 đến 50 ký tự');
      return;
    }
    if (!password) {
      showToast('error', 'Vui lòng nhập mật khẩu');
      return;
    }
    if (password.length < 6) {
      showToast('error', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    // Gọi API
    setButtonLoading(submitBtn, true);
    try {
      const response = await loginUser({ account, password });

      if (response.code === 200) {
        // Lưu token
        const token = response.data?.token || response.data;
        setToken(token);

        // Lưu user info nếu có
        if (response.data && typeof response.data === 'object') {
          setUserInfo({
            account: response.data.account || account,
            userName: response.data.userName || account,
            avatarUrl: response.data.avatarUrl || null
          });
        } else {
          setUserInfo({ account, userName: account });
        }

        showToast('success', 'Đăng nhập thành công!');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      } else {
        handleApiResponse(response);
      }
    } catch (error) {
      // Network error handled
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

/* ============================================
   REGISTER PAGE
   ============================================ */
function initRegisterPage() {
  if (isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const account = document.getElementById('reg-account').value.trim();
    const password = document.getElementById('reg-password').value;
    const userName = document.getElementById('reg-username').value.trim();
    const avatarUrl = document.getElementById('reg-avatar').value.trim();
    const submitBtn = form.querySelector('button[type="submit"]');

    // Validate
    if (!account) {
      showToast('error', 'Vui lòng nhập tên tài khoản');
      return;
    }
    if (account.length < 3 || account.length > 50) {
      showToast('error', 'Tên tài khoản phải từ 3 đến 50 ký tự');
      return;
    }
    if (!password) {
      showToast('error', 'Vui lòng nhập mật khẩu');
      return;
    }
    if (password.length < 6) {
      showToast('error', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (!userName) {
      showToast('error', 'Vui lòng nhập tên hiển thị');
      return;
    }
    if (userName.length > 100) {
      showToast('error', 'Tên hiển thị tối đa 100 ký tự');
      return;
    }
    if (avatarUrl && !isValidUrl(avatarUrl)) {
      showToast('error', 'URL ảnh đại diện không hợp lệ');
      return;
    }

    // Gọi API
    setButtonLoading(submitBtn, true);
    try {
      const data = { account, password, userName };
      if (avatarUrl) data.avatarUrl = avatarUrl;

      const response = await registerUser(data);

      if (response.code === 200 || response.code === 201) {
        showToast('success', 'Đăng ký thành công! Vui lòng đăng nhập.');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
      } else {
        handleApiResponse(response);
      }
    } catch (error) {
      // Network error handled
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

/* ============================================
   DASHBOARD PAGE — Link của tôi
   ============================================ */
let allLinks = []; // Lưu dữ liệu link để lọc

function initDashboardPage() {
  if (!requireAuth()) return;

  loadMyLinks();

  // Search / filter
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      filterLinks(query);
    });
  }
}

/** Tải danh sách link */
async function loadMyLinks() {
  const tableBody = document.getElementById('links-table-body');
  const cardsContainer = document.getElementById('links-cards');
  const emptyState = document.getElementById('empty-state');
  const loadingState = document.getElementById('loading-state');

  // Show loading
  if (loadingState) loadingState.classList.remove('hidden');
  if (emptyState) emptyState.classList.add('hidden');

  try {
    const token = getToken();
    const response = await getMyLinks(token);

    if (loadingState) loadingState.classList.add('hidden');

    if (response.code === 200) {
      const links = Array.isArray(response.data) ? response.data : [];
      allLinks = links;

      if (links.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        return;
      }

      renderLinksTable(links);
      renderLinksCards(links);
    } else {
      handleApiResponse(response);
    }
  } catch (error) {
    if (loadingState) loadingState.classList.add('hidden');
  }
}

/** Render bảng link (desktop) */
function renderLinksTable(links) {
  const tableBody = document.getElementById('links-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = links.map(link => {
    const shortKey = link.shortKey || link.key || '';
    const shortUrl = shortKey.startsWith('http') ? shortKey : buildShortUrl(shortKey);
    const originalUrl = link.originalUrl || link.original_url || link.url || '';
    const date = formatDate(link.createdAt || link.created_at || link.createTime);
    const linkId = link.id || link.linkId;

    return `
      <tr>
        <td>
          <a href="${shortUrl}" target="_blank" class="link-short">${shortUrl}</a>
        </td>
        <td>
          <span class="link-original" title="${originalUrl}">${originalUrl}</span>
        </td>
        <td class="link-date">${date}</td>
        <td>
          <div class="link-actions">
            <button class="btn btn-ghost btn-icon" onclick="copyToClipboard('${shortUrl}')" title="Sao chép">
              <i class="fa-solid fa-copy"></i>
            </button>
            <a href="analytics.html?id=${linkId}" class="btn btn-ghost btn-icon" title="Analytics">
              <i class="fa-solid fa-chart-simple"></i>
            </a>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/** Render cards link (mobile) */
function renderLinksCards(links) {
  const container = document.getElementById('links-cards');
  if (!container) return;

  container.innerHTML = links.map(link => {
    const shortKey = link.shortKey || link.key || '';
    const shortUrl = shortKey.startsWith('http') ? shortKey : buildShortUrl(shortKey);
    const originalUrl = link.originalUrl || link.original_url || link.url || '';
    const date = formatDate(link.createdAt || link.created_at || link.createTime);
    const linkId = link.id || link.linkId;

    return `
      <div class="card link-card-item">
        <div class="link-card-short">${shortUrl}</div>
        <div class="link-card-original" title="${originalUrl}">${originalUrl}</div>
        <div class="link-card-date"><i class="fa-regular fa-calendar"></i> ${date}</div>
        <div class="link-card-actions">
          <button class="btn btn-primary btn-sm" onclick="copyToClipboard('${shortUrl}')">
            <i class="fa-solid fa-copy"></i> Sao chép
          </button>
          <a href="analytics.html?id=${linkId}" class="btn btn-secondary btn-sm">
            <i class="fa-solid fa-chart-simple"></i> Analytics
          </a>
        </div>
      </div>
    `;
  }).join('');
}

/** Lọc link theo từ khoá */
function filterLinks(query) {
  if (!query) {
    renderLinksTable(allLinks);
    renderLinksCards(allLinks);
    return;
  }

  const filtered = allLinks.filter(link => {
    const shortKey = (link.shortKey || link.key || '').toLowerCase();
    const originalUrl = (link.originalUrl || link.original_url || link.url || '').toLowerCase();
    return shortKey.includes(query) || originalUrl.includes(query);
  });

  renderLinksTable(filtered);
  renderLinksCards(filtered);

  // Toggle empty state
  const emptyState = document.getElementById('empty-state');
  if (emptyState) {
    if (filtered.length === 0 && allLinks.length > 0) {
      emptyState.querySelector('h3').textContent = 'Không tìm thấy kết quả';
      emptyState.querySelector('p').textContent = 'Thử tìm kiếm với từ khoá khác.';
      emptyState.classList.remove('hidden');
    } else {
      emptyState.classList.add('hidden');
    }
  }
}

/* ============================================
   ANALYTICS PAGE
   ============================================ */
function initAnalyticsPage() {
  if (!requireAuth()) return;

  // Lấy linkId từ URL params
  const params = new URLSearchParams(window.location.search);
  const linkId = params.get('id');

  if (!linkId) {
    showToast('error', 'Không tìm thấy ID link');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
    return;
  }

  loadAnalytics(linkId);
}

/** Tải dữ liệu analytics */
async function loadAnalytics(linkId) {
  const loadingState = document.getElementById('loading-state');
  if (loadingState) loadingState.classList.remove('hidden');

  try {
    const token = getToken();
    const response = await getAnalytics(linkId, token);

    if (loadingState) loadingState.classList.add('hidden');

    if (response.code === 200) {
      renderAnalytics(response.data);
    } else {
      handleApiResponse(response);
    }
  } catch (error) {
    if (loadingState) loadingState.classList.add('hidden');
  }
}

/** Render dữ liệu analytics */
function renderAnalytics(data) {
  // Header info
  const shortKey = data.shortKey || data.key || '';
  const shortUrl = shortKey.startsWith('http') ? shortKey : buildShortUrl(shortKey);
  const originalUrl = data.originalUrl || data.original_url || data.url || '';

  const headerEl = document.getElementById('analytics-link-info');
  if (headerEl) {
    headerEl.innerHTML = `
      <a href="${shortUrl}" target="_blank" class="link-short" style="font-size: 1.1rem;">${shortUrl}</a>
      <div class="analytics-url" title="${originalUrl}"><i class="fa-solid fa-arrow-right"></i> ${originalUrl}</div>
    `;
  }

  // Stats
  const totalClicks = data.totalClicks || data.total_clicks || 0;
  const clickLogs = data.clickLogs || data.click_logs || data.clicks || [];
  const uniqueCountries = [...new Set(clickLogs.map(c => c.country || c.countryName || 'Unknown'))];

  document.getElementById('stat-total-clicks').textContent = totalClicks;
  document.getElementById('stat-unique-countries').textContent = uniqueCountries.length;
  document.getElementById('stat-short-key').textContent = shortKey;

  // Click logs table
  renderClickLogs(clickLogs);

  // Chart
  renderChart(clickLogs);
}

/** Render bảng click logs */
function renderClickLogs(logs) {
  const tbody = document.getElementById('clicks-table-body');
  if (!tbody) return;

  if (logs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 48px;">
          Chưa có lượt click nào
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = logs.map(log => {
    const ip = log.ipAddress || log.ip || '—';
    const country = log.country || log.countryName || 'Unknown';
    const status = log.status || 'SUCCESS';
    const time = formatDate(log.clickedAt || log.clicked_at || log.createdAt || log.timestamp);
    const badgeClass = status === 'SUCCESS' ? 'badge-success' : 'badge-error';

    return `
      <tr>
        <td><code>${ip}</code></td>
        <td>${country}</td>
        <td><span class="badge ${badgeClass}">${status}</span></td>
        <td>${time}</td>
      </tr>
    `;
  }).join('');
}

/** Vẽ biểu đồ click theo quốc gia (Chart.js) */
function renderChart(logs) {
  const canvas = document.getElementById('analytics-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  // Đếm click theo quốc gia
  const countryMap = {};
  logs.forEach(log => {
    const country = log.country || log.countryName || 'Unknown';
    countryMap[country] = (countryMap[country] || 0) + 1;
  });

  const labels = Object.keys(countryMap);
  const values = Object.values(countryMap);

  // Gradient colors cho bars
  const colors = labels.map((_, i) => {
    const hue = (i * 360 / labels.length + 250) % 360;
    return `hsla(${hue}, 65%, 55%, 0.8)`;
  });

  const borderColors = labels.map((_, i) => {
    const hue = (i * 360 / labels.length + 250) % 360;
    return `hsla(${hue}, 65%, 45%, 1)`;
  });

  // Detect dark mode
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#A0A0B8' : '#636E72';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Số lượt click',
        data: values,
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 1,
        borderRadius: 8,
        barThickness: 40,
        maxBarThickness: 60
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#1E1E32' : '#FFFFFF',
          titleColor: isDark ? '#E8E8F0' : '#2D3436',
          bodyColor: isDark ? '#A0A0B8' : '#636E72',
          borderColor: isDark ? '#2D2D48' : '#DEE2E6',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: textColor,
            stepSize: 1,
            font: { family: "'Be Vietnam Pro', sans-serif" }
          },
          grid: { color: gridColor }
        },
        x: {
          ticks: {
            color: textColor,
            font: { family: "'Be Vietnam Pro', sans-serif" }
          },
          grid: { display: false }
        }
      }
    }
  });
}
