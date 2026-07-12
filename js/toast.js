/* ============================================
   TOAST NOTIFICATION SYSTEM
   Loại: success, error, warning, info
   Tự ẩn sau 3.5s, có nút đóng, progress bar
   ============================================ */

/**
 * Khởi tạo container chứa toast (chèn vào body nếu chưa có)
 */
function initToastContainer() {
  if (document.getElementById('toast-container')) return;
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  document.body.appendChild(container);
}

/**
 * Icon map cho từng loại toast
 */
const TOAST_ICONS = {
  success: '<i class="fa-solid fa-check"></i>',
  error: '<i class="fa-solid fa-xmark"></i>',
  warning: '<i class="fa-solid fa-exclamation"></i>',
  info: '<i class="fa-solid fa-info"></i>'
};

/**
 * Title mặc định cho từng loại toast
 */
const TOAST_TITLES = {
  success: 'Thành công',
  error: 'Lỗi',
  warning: 'Cảnh báo',
  info: 'Thông tin'
};

/**
 * Hiển thị toast notification
 * @param {string} type - 'success' | 'error' | 'warning' | 'info'
 * @param {string} message - Nội dung thông báo
 * @param {string} [title] - Tiêu đề (tuỳ chọn, dùng mặc định nếu không truyền)
 * @param {number} [duration=3500] - Thời gian hiển thị (ms)
 */
function showToast(type, message, title, duration = 3500) {
  initToastContainer();
  const container = document.getElementById('toast-container');

  // Tạo toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${TOAST_ICONS[type] || TOAST_ICONS.info}</div>
    <div class="toast-content">
      <div class="toast-title">${title || TOAST_TITLES[type]}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" aria-label="Đóng">
      <i class="fa-solid fa-xmark"></i>
    </button>
    <div class="toast-progress">
      <div class="toast-progress-bar" style="animation-duration: ${duration}ms"></div>
    </div>
  `;

  // Nút đóng sớm
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => dismissToast(toast));

  // Thêm vào container
  container.appendChild(toast);

  // Tự động ẩn sau duration
  toast._timeout = setTimeout(() => dismissToast(toast), duration);
}

/**
 * Ẩn và xoá toast element với animation
 * @param {HTMLElement} toast
 */
function dismissToast(toast) {
  if (toast._dismissed) return;
  toast._dismissed = true;
  clearTimeout(toast._timeout);

  toast.classList.add('hiding');
  toast.addEventListener('animationend', () => {
    toast.remove();
  });
}

/**
 * Xử lý response từ API và hiện toast phù hợp
 * Ánh xạ code → loại toast theo spec
 * @param {object} response - Response object từ API {code, data, message}
 * @param {object} [customMessages] - Custom messages cho từng code
 * @returns {object} response - Trả lại response để chain
 */
function handleApiResponse(response, customMessages = {}) {
  const code = response.code;
  const message = customMessages[code] || response.message || '';

  switch (code) {
    case 200:
      showToast('success', message);
      break;
    case 201:
      showToast('success', message);
      break;
    case 400:
      showToast('error', message);
      break;
    case 401:
      showToast('warning', message || 'Vui lòng đăng nhập để tiếp tục');
      // Auto redirect to login after 1.5s
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
      break;
    case 403:
      showToast('error', message || 'Bạn không có quyền thực hiện hành động này');
      break;
    case 404:
      showToast('error', message || 'Không tìm thấy tài nguyên');
      break;
    case 500:
      showToast('error', message || 'Lỗi máy chủ, vui lòng thử lại sau');
      break;
    default:
      if (code >= 200 && code < 300) {
        showToast('success', message);
      } else if (code >= 400) {
        showToast('error', message || `Lỗi không xác định (code: ${code})`);
      }
  }

  return response;
}

/**
 * Hiện toast lỗi mạng
 */
function showNetworkError() {
  showToast('error', 'Không thể kết nối máy chủ, vui lòng thử lại', 'Lỗi kết nối');
}
