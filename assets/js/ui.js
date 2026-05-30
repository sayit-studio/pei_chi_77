const Header = {
  init() {
    window.addEventListener('scroll', () => {
      document.getElementById('siteHeader')
        .classList.toggle('scrolled', window.scrollY > 40);
    });
  }
};

const Hamburger = {
  init() {
    document.getElementById('hamburger').addEventListener('click', () => {
      document.getElementById('hamburger').classList.toggle('open');
      document.getElementById('mobileNav').classList.toggle('open');
    });
  }
};

function closeMobileNav() {
  document.getElementById('hamburger').classList.remove('open');
  document.getElementById('mobileNav').classList.remove('open');
}

const Tab = {
  init() {
    document.querySelectorAll('.ftab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.ftab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const cat = tab.dataset.cat;
        const cards = document.querySelectorAll('.ach-card');
        let visible = 0;

        cards.forEach(card => {
          const show = cat === 'all' || card.dataset.category === cat;
          card.dataset.hidden = show ? 'false' : 'true';
          card.style.display = show ? '' : 'none';
          if (show) visible++;
        });

        document.getElementById('emptyState')
          .classList.toggle('visible', visible === 0);
      });
    });
  }
};

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'share-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('visible'));
  setTimeout(() => {
    t.classList.remove('visible');
    setTimeout(() => t.remove(), 300);
  }, 2500);
}

const Modal = {
  open(id) {
    renderModal(id);
    const overlay = document.getElementById('modalOverlay');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    overlay.querySelector('.modal-sheet').scrollTop = 0;
    history.replaceState(null, '', '#' + id);
  },
  close() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.body.style.overflow = '';
    history.replaceState(null, '', location.pathname + location.search);
  },
  backdropClose(e) {
    if (e.target === document.getElementById('modalOverlay')) {
      this.close();
    }
  },
  share(id) {
    const item = (typeof ACHIEVEMENTS !== 'undefined')
      ? ACHIEVEMENTS.find(a => a.id === id)
      : null;
    const url = location.origin + location.pathname + '#' + id;
    const title = item ? item.title + ' — 敦和里長洪佩琦' : '敦和里長洪佩琦';
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(
        () => showToast('連結已複製，可貼上分享 ✓'),
        () => showToast('請手動複製網址列連結')
      );
    }
  }
};

const Lightbox = {
  _imgs: [],
  _idx: 0,

  open(imgs, idx) {
    if (!imgs || !imgs.length) return;
    this._imgs = imgs;
    this._idx = idx;
    this._render();
    document.getElementById('lightbox').classList.add('open');
  },

  close() {
    document.getElementById('lightbox').classList.remove('open');
  },

  backdropClose(e) {
    if (e.target === document.getElementById('lightbox')) {
      this.close();
    }
  },

  prev() {
    this._idx = (this._idx - 1 + this._imgs.length) % this._imgs.length;
    this._render();
  },

  next() {
    this._idx = (this._idx + 1) % this._imgs.length;
    this._render();
  },

  _render() {
    document.getElementById('lbImg').src = this._imgs[this._idx];
    document.getElementById('lbCounter').textContent =
      `${this._idx + 1} / ${this._imgs.length}`;
  }
};

const ScrollFade = {
  init() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
  },

  /* 動態新增元素（JS 渲染後呼叫） */
  refresh() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-up:not(.visible)').forEach(el => observer.observe(el));
  }
};

document.addEventListener('keydown', e => {
  if (document.getElementById('lightbox').classList.contains('open')) {
    if (e.key === 'ArrowLeft')  Lightbox.prev();
    if (e.key === 'ArrowRight') Lightbox.next();
    if (e.key === 'Escape')     Lightbox.close();
    return;
  }
  if (
    document.getElementById('modalOverlay').classList.contains('open') &&
    e.key === 'Escape'
  ) {
    Modal.close();
  }
});

const VideoCarousel = {
  init() {
    const reel = document.getElementById('videoReel');
    const prev = document.getElementById('vcPrev');
    const next = document.getElementById('vcNext');
    if (!reel || !prev || !next) return;

    /* 箭頭滾動 */
    const scroll = (dir) => {
      const card = reel.querySelector('.vc-card');
      const step = card ? card.offsetWidth + 20 : 260;
      reel.scrollBy({ left: dir * step, behavior: 'smooth' });
    };
    prev.addEventListener('click', () => scroll(-1));
    next.addEventListener('click', () => scroll(1));

    const updateArrows = () => {
      prev.disabled = reel.scrollLeft <= 4;
      next.disabled = reel.scrollLeft + reel.clientWidth >= reel.scrollWidth - 4;
    };
    reel.addEventListener('scroll', updateArrows, { passive: true });
    setTimeout(updateArrows, 300);

    /* IntersectionObserver：進入視窗 → 載入並自動播放；離開 → 停止 */
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const iframe = entry.target.querySelector('iframe');
        if (!iframe) return;
        const base = iframe.dataset.src;
        if (!base) return;

        if (entry.isIntersecting) {
          iframe.src = base + '&autoplay=1';
        } else {
          iframe.src = '';   /* 清空 src 讓瀏覽器停止串流 */
        }
      });
    }, {
      root: reel,         /* 以輪播容器為視窗 */
      threshold: 0.6,     /* 60% 面積可見才觸發 */
    });

    /* render 完成後才掛載觀察（render.js 也在 DOMContentLoaded 執行） */
    setTimeout(() => {
      reel.querySelectorAll('.vc-card').forEach(card => observer.observe(card));
      updateArrows();
    }, 150);
  },
};

document.addEventListener('DOMContentLoaded', () => {
  Header.init();
  Hamburger.init();
  Tab.init();
  ScrollFade.init();
  VideoCarousel.init();

  setTimeout(() => ScrollFade.refresh(), 100);

  const hash = location.hash.replace('#', '');
  if (hash && typeof ACHIEVEMENTS !== 'undefined' && ACHIEVEMENTS.find(a => a.id === hash)) {
    setTimeout(() => Modal.open(hash), 400);
  }
});
