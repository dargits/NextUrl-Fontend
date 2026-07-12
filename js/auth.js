/* ============================================
   AUTH MODULE — Xử lý đăng nhập/đăng ký/logout
   Token lưu tại localStorage
   ============================================ */

const TOKEN_KEY = 'linkshort_token';
const USER_KEY = 'linkshort_user';

/* --- Token management --- */

/** Lấy token từ localStorage */
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/** Lưu token vào localStorage */
function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

/** Xoá token */
function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/* --- User info management --- */

/** Lấy thông tin user (đã parse) */
function getUserInfo() {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/** Lưu thông tin user */
function setUserInfo(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/** Xoá thông tin user */
function removeUserInfo() {
  localStorage.removeItem(USER_KEY);
}

/* --- Auth checks --- */

/** Kiểm tra đã đăng nhập chưa */
function isLoggedIn() {
  return !!getToken();
}

/** Đăng xuất — xoá token + user info + redirect */
function logout() {
  removeToken();
  removeUserInfo();
  showToast('success', 'Đã đăng xuất thành công');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 800);
}

/**
 * Guard bảo vệ trang yêu cầu đăng nhập
 * Gọi ở đầu trang dashboard, analytics...
 * Nếu chưa đăng nhập → redirect về login
 */
function requireAuth() {
  if (!isLoggedIn()) {
    showToast('warning', 'Vui lòng đăng nhập để tiếp tục');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1000);
    return false;
  }
  return true;
}

/* --- Navbar update --- */

/**
 * Cập nhật navbar theo trạng thái đăng nhập
 * - Đã login: hiện avatar + dropdown (Link của tôi, Đăng xuất)
 * - Chưa login: hiện nút Đăng nhập / Đăng ký
 */
function updateNavbar() {
  const authActions = document.getElementById('auth-actions');
  if (!authActions) return;

  if (isLoggedIn()) {
    const user = getUserInfo();
    const initial = user?.userName ? user.userName.charAt(0).toUpperCase() : 'U';
    const avatarContent = user?.avatarUrl
      ? `<img src="${user.avatarUrl}" alt="Avatar" onerror="this.parentElement.textContent='${initial}'">`
      : initial;

    authActions.innerHTML = `
      <div class="user-menu">
        <button class="user-avatar-btn" id="user-avatar-btn" title="${user?.userName || 'User'}">
          ${avatarContent}
        </button>
        <div class="user-dropdown" id="user-dropdown">
          <div class="user-dropdown-header">
            <div class="user-name">${user?.userName || 'User'}</div>
            <div class="user-account">${user?.account || ''}</div>
          </div>
          <a href="dashboard.html"><i class="fa-solid fa-link"></i> Link của tôi</a>
          <button class="logout-btn" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i> Đăng xuất</button>
        </div>
      </div>
    `;

    // Toggle dropdown
    const avatarBtn = document.getElementById('user-avatar-btn');
    const dropdown = document.getElementById('user-dropdown');

    avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    // Close dropdown khi click ra ngoài
    document.addEventListener('click', () => {
      dropdown.classList.remove('show');
    });
  } else {
    authActions.innerHTML = `
      <a href="login.html" class="btn btn-ghost btn-sm">Đăng nhập</a>
      <a href="register.html" class="btn btn-primary btn-sm">Đăng ký</a>
    `;
  }
}
