/* ============================================
   AUTH MODULE — Xử lý đăng nhập/đăng ký/logout
   Token lưu tại localStorage với fallback
   ============================================ */

const TOKEN_KEY = 'linkshort_token';
const USER_KEY = 'linkshort_user';

// Kiểm tra localStorage support
function isLocalStorageAvailable() {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    console.warn('localStorage is not available:', e);
    return false;
  }
}

// Kiểm tra sessionStorage support
function isSessionStorageAvailable() {
  try {
    const test = '__sessionStorage_test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch (e) {
    console.warn('sessionStorage is not available:', e);
    return false;
  }
}

// Log storage availability khi load
console.log('Storage availability:', {
  localStorage: isLocalStorageAvailable(),
  sessionStorage: isSessionStorageAvailable()
});

/* --- Token management --- */

/** Lấy token từ localStorage */
function getToken() {
  try {
    // Thử lấy từ localStorage trước
    let token = localStorage.getItem(TOKEN_KEY);
    
    if (!token) {
      // Fallback: thử lấy từ sessionStorage
      token = sessionStorage.getItem(TOKEN_KEY);
      if (token) {
        console.log('Token retrieved from sessionStorage fallback');
      }
    }
    
    if (!token && window.tempToken) {
      // Fallback cuối: lấy từ memory
      token = window.tempToken;
      console.log('Token retrieved from memory fallback');
    }
    
    return token;
  } catch (error) {
    console.error('Error retrieving token:', error);
    
    // Thử fallback methods
    try {
      const fallbackToken = sessionStorage.getItem(TOKEN_KEY) || window.tempToken || null;
      if (fallbackToken) {
        console.log('Token retrieved from error fallback');
      }
      return fallbackToken;
    } catch (fallbackError) {
      console.error('All token retrieval methods failed:', fallbackError);
      return null;
    }
  }
}

/** Lưu token vào localStorage */
function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    
    // Debug: Kiểm tra token có được lưu thành công không
    const saved = localStorage.getItem(TOKEN_KEY);
    console.log('Token set:', token);
    console.log('Token saved successfully:', saved === token);
    
    if (saved !== token) {
      console.error('Failed to save token to localStorage');
      // Fallback: thử lưu vào sessionStorage
      sessionStorage.setItem(TOKEN_KEY, token);
      console.log('Token saved to sessionStorage as fallback');
    }
  } catch (error) {
    console.error('Error saving token to localStorage:', error);
    // Fallback: lưu vào sessionStorage
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
      console.log('Token saved to sessionStorage as fallback');
    } catch (fallbackError) {
      console.error('Error saving token to sessionStorage:', fallbackError);
      // Fallback cuối: lưu vào memory (mất khi refresh)
      window.tempToken = token;
      console.log('Token saved to memory as last fallback');
    }
  }
}

/** Xoá token */
function removeToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token from localStorage:', error);
  }
  
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token from sessionStorage:', error);
  }
  
  // Clear memory fallback
  if (window.tempToken) {
    delete window.tempToken;
  }
}

/* --- User info management --- */

/** Lấy thông tin user (đã parse) */
function getUserInfo() {
  try {
    let data = localStorage.getItem(USER_KEY);
    
    if (!data) {
      // Fallback: sessionStorage
      data = sessionStorage.getItem(USER_KEY);
    }
    
    if (!data && window.tempUser) {
      // Fallback: memory
      return window.tempUser;
    }
    
    if (!data) return null;
    
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  } catch (error) {
    console.error('Error retrieving user info:', error);
    return window.tempUser || null;
  }
}

/** Lưu thông tin user */
function setUserInfo(user) {
  try {
    const userData = JSON.stringify(user);
    localStorage.setItem(USER_KEY, userData);
    
    // Kiểm tra có lưu được không
    const saved = localStorage.getItem(USER_KEY);
    if (!saved) {
      // Fallback: sessionStorage
      sessionStorage.setItem(USER_KEY, userData);
    }
  } catch (error) {
    console.error('Error saving user info:', error);
    // Fallback: sessionStorage
    try {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (fallbackError) {
      console.error('Error saving user info to sessionStorage:', fallbackError);
      window.tempUser = user;
    }
  }
}

/** Xoá thông tin user */
function removeUserInfo() {
  try {
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Error removing user info from localStorage:', error);
  }
  
  try {
    sessionStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Error removing user info from sessionStorage:', error);
  }
  
  // Clear memory fallback
  if (window.tempUser) {
    delete window.tempUser;
  }
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

// Debug functions - có thể gọi từ console
window.debugAuth = {
  checkStorageSupport: function() {
    console.log('localStorage available:', isLocalStorageAvailable());
    console.log('sessionStorage available:', isSessionStorageAvailable());
  },
  
  testTokenStorage: function() {
    // Backup current token if exists
    const currentToken = getToken();
    const testToken = 'test_token_' + Date.now();
    console.log('Testing token storage...');
    
    setToken(testToken);
    const retrieved = getToken();
    
    console.log('Test token:', testToken);
    console.log('Retrieved token:', retrieved);
    console.log('Storage test:', testToken === retrieved ? 'PASSED' : 'FAILED');
    
    // Restore previous token if it existed
    if (currentToken) {
      setToken(currentToken);
      console.log('Previous token restored');
    } else {
      removeToken();
      console.log('No previous token to restore');
    }
  },
  
  getCurrentToken: function() {
    const token = getToken();
    console.log('Current token:', token);
    console.log('Token exists:', !!token);
    return token;
  },
  
  getCurrentUser: function() {
    const user = getUserInfo();
    console.log('Current user:', user);
    return user;
  },
  
  checkAllStorages: function() {
    console.log('=== STORAGE CHECK ===');
    try {
      console.log('localStorage token:', localStorage.getItem(TOKEN_KEY));
    } catch (e) {
      console.log('localStorage error:', e.message);
    }
    
    try {
      console.log('sessionStorage token:', sessionStorage.getItem(TOKEN_KEY));
    } catch (e) {
      console.log('sessionStorage error:', e.message);
    }
    
    console.log('memory token:', window.tempToken);
    console.log('getToken() result:', getToken());
  }
};
