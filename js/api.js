/* ============================================
   API MODULE — Gọi API tập trung
   Base URL cấu hình dễ đổi
   ============================================ */

/** Base URL của backend — đổi tại đây khi deploy */
const API_BASE_URL = 'https://nexturl.onrender.com';

/**
 * Hàm gọi API chung — xử lý JSON parse, error codes, network errors
 * @param {string} endpoint - Đường dẫn API (VD: '/api/auth/login')
 * @param {object} options - Tuỳ chọn fetch (method, body, headers...)
 * @returns {Promise<object>} Response object {code, data, message}
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Thêm token nếu có
  const token = getToken();
  if (token) {
    headers['Authorization'] = token;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Parse JSON response
    const data = await response.json();
    return data;

  } catch (error) {
    console.error('API Error:', error);
    // Network error / timeout
    showNetworkError();
    throw error;
  }
}

/* ============================================
   AUTH ENDPOINTS
   ============================================ */

/**
 * Đăng ký tài khoản mới
 * @param {object} data - {account, password, userName, avatarUrl?}
 * @returns {Promise<object>}
 */
async function registerUser(data) {
  return apiRequest('/api/v1/users/register', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Đăng nhập
 * @param {object} data - {account, password}
 * @returns {Promise<object>}
 */
async function loginUser(data) {
  return apiRequest('/api/v1/users/login', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/* ============================================
   LINK ENDPOINTS
   ============================================ */

/**
 * Tạo link rút gọn
 * @param {object} data - {originalUrl}
 * @param {string} [token] - Token xác thực (tuỳ chọn cho link ẩn danh)
 * @returns {Promise<object>}
 */
async function createShortLink(data, token) {
  const headers = {};
  if (token) {
    headers['Authorization'] = token;
  }

  return apiRequest('/api/v1/links/', {
    method: 'POST',
    body: JSON.stringify(data),
    headers
  });
}

/**
 * Lấy danh sách link của user
 * @param {string} token - Token xác thực
 * @returns {Promise<object>}
 */
async function getMyLinks(token) {
  return apiRequest('/api/v1/links/my-links', {
    method: 'GET',
    headers: { 'Authorization': token }
  });
}

/**
 * Lấy analytics của 1 link
 * @param {string|number} linkId - ID của link
 * @param {string} token - Token xác thực
 * @returns {Promise<object>}
 */
async function getAnalytics(linkId, token) {
  return apiRequest(`/api/v1/links/analytics/${linkId}`, {
    method: 'GET',
    headers: { 'Authorization': token }
  });
}

/**
 * Test kết nối Redis
 * @returns {Promise<string>}
 */
async function testRedis() {
  const url = `${API_BASE_URL}/api/redis-test/run`;
  try {
    const response = await fetch(url);
    return await response.text();
  } catch (error) {
    console.error('Redis Test Error:', error);
    throw error;
  }
}

