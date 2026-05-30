let _activeImages = [];

function sanitize(str) {
  const d = document.createElement('div');
  d.textContent = String(str == null ? '' : str);
  return d.innerHTML;
}

const CATEGORY_BADGE = {
  '道路環境': 'badge-blue',
  '弱勢關懷': 'badge-pink',
  '社區活動': 'badge-green',
  '公共安全': 'badge-purple',
  '其他':     'badge-gray',
};

function buildBadgeHtml(category) {
  const cls = CATEGORY_BADGE[category] || 'badge-gray';
  return `<span class="badge ${cls}">${sanitize(category)}</span>`;
}

function buildImgOrPlaceholder(cover, emoji) {
  if (cover) {
    return `<img src="${sanitize(cover)}" alt="" loading="lazy">`;
  }
  return `
    <div class="img-placeholder">
      <span class="img-placeholder-emoji">${sanitize(emoji)}</span>
    </div>
  `;
}

function renderFeatured(items) {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;

  const featured = items.filter(item => item.featured).slice(0, 3);

  grid.innerHTML = featured.map(item => `
    <div class="featured-card fade-up" data-id="${sanitize(item.id)}" onclick="Modal.open('${sanitize(item.id)}')">
      <div class="featured-card-img">
        ${buildImgOrPlaceholder(item.cover, item.emoji)}
        <span class="featured-pin">⭐ 精選政績</span>
      </div>
      <div class="featured-body">
        <div class="featured-meta">
          ${buildBadgeHtml(item.category)}
          <span class="featured-date">${sanitize(item.date)}</span>
        </div>
        <h3 class="featured-title">${sanitize(item.title)}</h3>
        <p class="featured-desc">${sanitize(item.summary)}</p>
        <button class="featured-action" onclick="event.stopPropagation(); Modal.open('${sanitize(item.id)}')">
          查看完整過程 →
        </button>
      </div>
    </div>
  `).join('');
}

function renderList(items) {
  const grid = document.getElementById('achGrid');
  if (!grid) return;

  grid.innerHTML = items.map(item => `
    <article
      class="ach-card fade-up"
      data-id="${sanitize(item.id)}"
      data-category="${sanitize(item.category)}"
      onclick="Modal.open('${sanitize(item.id)}')"
    >
      <div class="ach-card-img">
        ${buildImgOrPlaceholder(item.cover, item.emoji)}
      </div>
      <div class="ach-card-body">
        <div class="ach-meta">
          ${buildBadgeHtml(item.category)}
          <span class="ach-date">${sanitize(item.date)}</span>
        </div>
        <h3 class="ach-title">${sanitize(item.title)}</h3>
        <p class="ach-desc">${sanitize(item.summary)}</p>
        <button class="ach-action" onclick="event.stopPropagation(); Modal.open('${sanitize(item.id)}')">
          查看完整過程 →
        </button>
      </div>
    </article>
  `).join('');
}

function renderModal(id) {
  const item = ACHIEVEMENTS.find(a => a.id === id);
  if (!item) return;

  /* 封面圖 */
  const coverEl = document.getElementById('modalCover');
  if (item.cover) {
    const img = document.createElement('img');
    img.src = item.cover;
    img.alt = item.title;
    img.loading = 'lazy';
    coverEl.innerHTML = '';
    coverEl.appendChild(img);
  } else {
    coverEl.innerHTML = `
      <div class="modal-cover-placeholder">
        <span class="modal-cover-emoji">${sanitize(item.emoji)}</span>
      </div>
    `;
  }

  /* Pills */
  const pillsEl = document.getElementById('modalPills');
  let pillsHtml = `<span class="pill pill-date">${sanitize(item.date)}</span>`;
  pillsHtml += `<span class="pill">${sanitize(item.category)}</span>`;
  if (item.featured) {
    pillsHtml += `<span class="pill pill-featured">⭐ 精選政績</span>`;
  }
  pillsHtml += `<button class="pill pill-share" onclick="Modal.share('${sanitize(item.id)}')">📤 分享</button>`;
  pillsEl.innerHTML = pillsHtml;

  /* 標題 */
  document.getElementById('modalTitle').textContent = item.title;

  /* 主題 Tags */
  const tagsEl = document.getElementById('modalTags');
  tagsEl.innerHTML = item.tags.map(t => `<span class="modal-tag">#${sanitize(t)}</span>`).join('');

  /* 完整說明 */
  document.getElementById('modalLead').textContent = item.content;

  /* 服務過程 */
  const processEl = document.getElementById('modalProcess');
  processEl.innerHTML = item.process.map((step, i) => `
    <div class="process-item">
      <span class="step-num">${i + 1}</span>
      <p class="step-text">${sanitize(step)}</p>
    </div>
  `).join('');

  /* 現場圖片 Gallery */
  const gallerySection = document.getElementById('modalGallerySection');
  const galleryEl = document.getElementById('modalGallery');

  if (item.images && item.images.length > 0) {
    _activeImages = item.images;
    gallerySection.style.display = '';
    galleryEl.innerHTML = item.images.map((src, i) => `
      <div class="gallery-thumb" onclick="Lightbox.open(_activeImages, ${i})">
        <img src="${sanitize(src)}" alt="現場圖片 ${i + 1}" loading="lazy">
        <div class="gallery-thumb-zoom">⤢</div>
      </div>
    `).join('');
  } else {
    _activeImages = [];
    gallerySection.style.display = 'none';
  }

  /* 影片記錄：隱藏 */
  document.getElementById('modalVideoSection').style.display = 'none';
}

function renderVideos(videos) {
  const reel = document.getElementById('videoReel');
  if (!reel) return;

  const active = videos.filter(v => v.fbUrl);

  if (!active.length) {
    reel.innerHTML = `
      <div class="vc-placeholder">
        <span class="vc-placeholder-icon">🎬</span>
        <p>影片即將上線，敬請期待</p>
      </div>
    `;
    return;
  }

  /* data-src 讓 IntersectionObserver 控制何時載入 + autoplay */
  reel.innerHTML = active.map(v => {
    const base = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(v.fbUrl)}&show_text=0&width=500&mute=1`;
    const hasOverlay = v.title || v.views;
    return `
      <div class="vc-card vc-card-reel">
        <div class="vc-frame vc-frame-reel">
          ${hasOverlay ? `
          <div class="vc-overlay">
            ${v.title ? `<p class="vc-overlay-title">${sanitize(v.title)}</p>` : ''}
            ${v.views ? `<p class="vc-overlay-views">👁 ${sanitize(v.views)} 次觀看</p>` : ''}
          </div>` : ''}
          <iframe
            data-src="${base}"
            src=""
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowfullscreen
            scrolling="no"
            frameborder="0"
          ></iframe>
        </div>
      </div>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderFeatured(ACHIEVEMENTS);
  renderList(ACHIEVEMENTS);
  renderVideos(VIDEOS);
});
