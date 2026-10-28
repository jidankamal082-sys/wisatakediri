/* ======================================================
   Pariwisata Kediri - Main JavaScript
   Fetch JSON, render kategori + destinasi + map markers,
   filter, modal, mobile nav, keyboard accessible
   ====================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* --- DOM refs --- */
  const kategoriGrid = document.getElementById('kategoriGrid');
  const destinasiGrid = document.getElementById('destinasiGrid');
  const filterBar = document.getElementById('filterBar');
  const loadingState = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');

  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');
  const modalImg = document.getElementById('modalImg');
  const modalBadge = document.getElementById('modalBadge');
  const modalTitle = document.getElementById('modalTitle');
  const modalLocation = document.getElementById('modalLocation');
  const modalDesc = document.getElementById('modalDesc');
  const modalMaps = document.getElementById('modalMaps');

  let allDestinations = [];
  let map = null;
  let markers = [];

  /* --- AOS init --- */
  if (typeof AOS !== 'undefined') {
    AOS.init({ duration: 600, once: true, offset: 60 });
  }

  /* --- Mobile nav toggle (R-32) --- */
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    navToggle.classList.toggle('active');
    navToggle.setAttribute('aria-expanded', isOpen);
    navToggle.setAttribute('aria-label', isOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi');
  });

  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Buka menu navigasi');
    });
    // Keyboard: close on Enter/Escape
    link.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        navMenu.classList.remove('open');
        navToggle.classList.remove('active');
        navToggle.focus();
      }
    });
  });

  // Close nav on Escape key anywhere when menu is open
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('open')) {
      navMenu.classList.remove('open');
      navToggle.classList.remove('active');
      navToggle.focus();
    }
  });

  /* --- Deterministic pseudo-random coords for Kediri area --- */
  function pseudoRandom(seed) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = ((h << 5) - h) + seed.charCodeAt(i);
      h = h & h;
    }
    return (Math.abs(h) % 10000) / 10000;
  }

  function getKediriCoords(id, name) {
    const baseLat = -7.80;
    const baseLng = 112.01;
    const spread = 0.15;
    const seed = id || name;
    const r1 = pseudoRandom(seed + 'lat');
    const r2 = pseudoRandom(seed + 'lng');
    return {
      lat: baseLat + (r1 - 0.5) * spread * 2,
      lng: baseLng + (r2 - 0.5) * spread * 2
    };
  }


document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  
  if (!searchInput) return;

  // Buat wadah elemen dropdown saran jika belum ada
  let searchResults = document.getElementById('searchResults');
  if (!searchResults) {
    searchResults = document.createElement('div');
    searchResults.id = 'searchResults';
    searchResults.className = 'search-dropdown';
    searchInput.parentElement.appendChild(searchResults);
  }

  // Tampilkan daftar saran saat pengguna mengetik
  searchInput.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase().trim();
    searchResults.innerHTML = '';

    if (clearSearchBtn) {
      clearSearchBtn.style.display = keyword.length > 0 ? 'block' : 'none';
    }

    if (keyword.length === 0) {
      searchResults.style.display = 'none';
      return;
    }

    // Ambil semua kartu destinasi yang ada di halaman
    const cards = document.querySelectorAll('.destinasi-card, .card, [class*="card"]');
    let matches = [];

    cards.forEach(card => {
      const titleEl = card.querySelector('h3, h4, .title, .nama-tempat') || card;
      const titleText = titleEl.textContent.trim();

      if (titleText.toLowerCase().includes(keyword)) {
        matches.push({
          title: titleText,
          element: card
        });
      }
    });

    if (matches.length > 0) {
      searchResults.style.display = 'block';
      matches.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'search-dropdown-item';
        itemDiv.textContent = item.title;

        // Ketika opsi diklik, langsung scroll ke lokasi kartu wisata tersebut
        itemDiv.addEventListener('click', () => {
          searchInput.value = item.title;
          searchResults.style.display = 'none';
          
          item.element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

          // Efek sorotan sementara pada kartu yang dipilih
          item.element.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
          item.element.style.transform = 'scale(1.03)';
          item.element.style.boxShadow = '0 0 15px rgba(10, 37, 64, 0.4)';
          setTimeout(() => {
            item.element.style.transform = '';
            item.element.style.boxShadow = '';
          }, 2000);
        });

        searchResults.appendChild(itemDiv);
      });
    } else {
      searchResults.style.display = 'block';
      searchResults.innerHTML = '<div class="search-dropdown-item empty">Tidak ditemukan destinasi</div>';
    }
  });

  // Sembunyikan dropdown jika mengklik di luar kotak pencarian
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.style.display = 'none';
    }
  });

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchResults.style.display = 'none';
      clearSearchBtn.style.display = 'none';
      searchInput.focus();
    });
  }
});
             
  /* --- Fetch and render --- */
  fetch('js/data-destinasi.json')
    .then(res => {
      if (!res.ok) throw new Error('Gagal memuat data');
      return res.json();
    })
    .then(data => {
      loadingState.style.display = 'none';
      allDestinations = data.destinations || [];

      renderKategori(data.categories);
      renderDestinasi(allDestinations);
      initMap(allDestinations);
      initFilter();
      initKategoriClick();
    })
    .catch(err => {
      loadingState.innerHTML = `
        <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
        <p>Gagal memuat data destinasi. Silakan muat ulang halaman.</p>
        <p style="font-size:0.8rem;margin-top:8px;color:var(--text-muted);">${err.message}</p>
      `;
    });

  /* --- Render Kategori --- */
  function renderKategori(categories) {
    if (!categories || !categories.length) return;
    kategoriGrid.innerHTML = categories.map((cat, idx) => {
      const iconMap = {
        'religi': 'fa-place-of-worship',
        'air': 'fa-water',
        'sejarah': 'fa-landmark',
        'alam': 'fa-tree',
        'event': 'fa-calendar-alt',
        'kuliner': 'fa-utensils'
      };
      const icon = iconMap[cat.id] || 'fa-circle';
      const colorMap = {
        'religi': '#061c53',
        'air': '#47567f',
        'sejarah': '#061c53',
        'alam': '#47567f',
        'event': '#061c53',
        'kuliner': '#47567f'
      };
      const bg = colorMap[cat.id] || '#061c53';
      return `
        <button class="kategori-item" data-kategori="${cat.id}" role="tab" aria-selected="false"
                data-aos="fade-up" data-aos-delay="${idx * 50}">
          <div class="kategori-circle" style="background:${bg};">
            <i class="fas ${icon}" aria-hidden="true"></i>
          </div>
          <span>${cat.name.replace('&', '&amp;')}</span>
        </button>
      `;
    }).join('');

    // Re-trigger AOS for new elements
  if (typeof AOS !== 'undefined') {
  AOS.refreshHard();
  }
    }
  }

  /* --- Render Destinasi Cards --- */
  function renderDestinasi(destinations) {
    if (!destinations || destinations.length === 0) {
      destinasiGrid.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    destinasiGrid.innerHTML = destinations.map((d, idx) => {
      const catLower = (d.category || '').toLowerCase();
      const catId = catMap(catLower);

      // Get first image
      let imgHtml = '';
      if (d.images && d.images.length > 0) {
        const imgSrc = d.images[0];
        imgHtml = `<img src="${imgSrc}" alt="${escapeHtml(d.name)}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'no-image\\'><i class=\\'fas fa-image\\'></i><span>Foto tidak tersedia</span></div>'" />`;
      } else {
        imgHtml = `<div class="no-image"><i class="fas fa-image"></i><span>Foto tidak tersedia</span></div>`;
      }

      // Truncate name - remove "Lokasi:" stuff for card title
      const displayName = d.name.split('Lokasi:')[0].split('Lokasi :')[0].split('  ')[0].trim();

      // Truncate description
      const desc = (d.description || '').replace(/^"|"$/g, '').substring(0, 120) + (d.description && d.description.length > 120 ? '...' : '');

      const delay = (idx % 9) * 50;

      // Get coords for data attribute
      const coords = getKediriCoords(d.id, d.name);

      return `
        <article class="destinasi-card" data-id="${d.id}" data-category="${catLower}" data-lat="${coords.lat}" data-lng="${coords.lng}"
                 data-aos="fade-up" data-aos-delay="${delay}">
          <div class="destinasi-card-img">
            ${imgHtml}
          </div>
          <div class="destinasi-card-body">
            <span class="badge">${escapeHtml(d.category || 'Umum')}</span>
            <h3>${escapeHtml(displayName)}</h3>
            <p class="location"><i class="fas fa-map-marker-alt" aria-hidden="true"></i> ${escapeHtml(d.location || 'Kabupaten Kediri')}</p>
            <p>${escapeHtml(desc)}</p>
            <div class="card-actions">
              <button class="btn btn-primary detail-btn" data-id="${d.id}">
                <i class="fas fa-info-circle" aria-hidden="true"></i> Detail
              </button>
              <a href="${d.maps_link || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-outline">
                <i class="fas fa-map-pin" aria-hidden="true"></i> Maps
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Re-trigger AOS
    if (typeof AOS !== 'undefined') {
  AOS.refreshHard();
    }

    // Attach detail button listeners
    document.querySelectorAll('.detail-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const dest = allDestinations.find(d => d.id === id);
        if (dest) openModal(dest);
      });
    });
  }

  /* --- Helper: map category string to id --- */
  function catMap(catLower) {
    if (catLower.includes('religi')) return 'religi';
    if (catLower.includes('air') || catLower.includes('sumber')) return 'air';
    if (catLower.includes('sejarah')) return 'sejarah';
    if (catLower.includes('alam')) return 'alam';
    if (catLower.includes('event')) return 'event';
    if (catLower.includes('kuliner')) return 'kuliner';
    return catLower;
  }

  /* --- Helper: escape HTML --- */
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* --- Filter --- */
  let currentFilter = 'all';

  function initFilter() {
    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;

        // Update active button
        filterBar.querySelectorAll('.filter-btn').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        currentFilter = filter;
        applyFilter(filter);
      });

      // Keyboard
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btn.click();
        }
      });
    });
  }

  function applyFilter(filter) {
    let filtered;
    if (filter === 'all') {
      filtered = allDestinations;
    } else {
      filtered = allDestinations.filter(d => {
        const cat = (d.category || '').toLowerCase();
        return cat.includes(filter) || catMap(cat) === filter;
      });
    }
    renderDestinasi(filtered);
    // Also update map markers
    updateMapMarkers(filtered);
  }

  /* --- Kategori item click also filters --- */
  function initKategoriClick() {
    kategoriGrid.addEventListener('click', (e) => {
      const item = e.target.closest('.kategori-item');
      if (!item) return;
      const kategori = item.dataset.kategori;

      // Update filter bar
      filterBar.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
        if (b.dataset.filter === kategori) {
          b.classList.add('active');
          b.setAttribute('aria-selected', 'true');
        }
      });

      currentFilter = kategori;
      applyFilter(kategori);

      // Scroll to destinasi section
      document.getElementById('destinasi').scrollIntoView({ behavior: 'smooth' });
    });
  }

  /* --- Modal (R-32 keyboard accessible) --- */
  function openModal(dest) {
    const displayName = dest.name.split('Lokasi:')[0].split('Lokasi :')[0].split('  ')[0].trim();
    const desc = (dest.description || '').replace(/^"|"$/g, '');

    // Image
    if (dest.images && dest.images.length > 0) {
      modalImg.src = dest.images[0];
      modalImg.alt = displayName;
      modalImg.style.display = 'block';
    } else {
      modalImg.style.display = 'none';
    }

    modalBadge.textContent = dest.category || 'Umum';
    modalTitle.textContent = displayName;
    modalLocation.textContent = dest.location || 'Kabupaten Kediri';
    modalDesc.textContent = desc;
    modalMaps.href = dest.maps_link || '#';

    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Focus trap: focus close button
    setTimeout(() => modalClose.focus(), 100);
  }

  function closeModal(e) {
  if (e) {
    e.preventDefault();
  }
  const modalEl = document.getElementById('modalOverlay');
  if (modalEl) {
    modalEl.classList.remove('open');
    document.body.style.overflow = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('modalClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      closeModal(e);
    });
  }

  const overlayEl = document.getElementById('modalOverlay');
  if (overlayEl) {
    overlayEl.addEventListener('click', (e) => {
      if (e.target === overlayEl) {
        closeModal(e);
      }
    });
  }
});
   
   
  // Keyboard: Escape to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('open')) {
      closeModal();
    }
  });

  // Trap focus inside modal
  modalOverlay.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !modalOverlay.classList.contains('open')) return;
    const focusable = modalOverlay.querySelectorAll('button, a, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  /* --- Map (Leaflet) --- */
  function initMap(destinations) {
    const mapContainer = document.getElementById('map');
    if (!mapContainer || typeof L === 'undefined') return;

    const kediriCenter = [-7.8169, 112.0159];

    map = L.map('map', {
      center: kediriCenter,
      zoom: 11,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    // Add markers for all destinations with images (as indicator of featured)
    const markerData = destinations.map(d => {
      const coords = getKediriCoords(d.id, d.name);
      return { ...d, lat: coords.lat, lng: coords.lng };
    });

    addMarkersToMap(markerData);
  }

  function addMarkersToMap(destinations) {
    if (!map) return;
    // Clear existing markers
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    const bounds = [];
    const hasCoords = [];

    destinations.forEach(d => {
      const lat = d.lat || (getKediriCoords(d.id, d.name)).lat;
      const lng = d.lng || (getKediriCoords(d.id, d.name)).lng;

      if (lat && lng) {
        const marker = L.marker([lat, lng]).addTo(map);

        const displayName = d.name.split('Lokasi:')[0].split('Lokasi :')[0].split('  ')[0].trim();
        marker.bindPopup(`
          <div style="font-family: 'Inter', system-ui, sans-serif; min-width: 160px;">
            <strong style="font-size:0.9rem;color:#061c53;display:block;margin-bottom:4px;">${escapeHtml(displayName)}</strong>
            <span style="display:inline-block;background:#47567f;color:white;padding:2px 10px;border-radius:4px;font-size:0.72rem;">${escapeHtml(d.category || 'Umum')}</span>
            <p style="margin:8px 0 0;font-size:0.78rem;">
              <button onclick="document.querySelector('[data-id=\\'${d.id}\\'] .detail-btn')?.click()" style="background:none;border:none;color:#061c53;font-weight:600;cursor:pointer;font-size:0.78rem;padding:0;">
                <i class="fas fa-info-circle"></i> Lihat detail
              </button>
            </p>
          </div>
        `, { maxWidth: 240 });

        markers.push(marker);
        bounds.push([lat, lng]);
        hasCoords.push(d);
      }
    });

    // Fit bounds if we have markers
    if (bounds.length > 0 && typeof L !== 'undefined') {
      try {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
      } catch (e) {
        // fallback to center
        map.setView([-7.8169, 112.0159], 11);
      }
    }
  }

  function updateMapMarkers(destinations) {
    const markerData = destinations.map(d => {
      const coords = getKediriCoords(d.id, d.name);
      return { ...d, lat: coords.lat, lng: coords.lng };
    });
    addMarkersToMap(markerData);
  }

  /* --- Welcome Popup (once per browser) --- */
  const welcomeOverlay = document.getElementById('welcomeOverlay');
  const welcomeClose = document.getElementById('welcomeClose');
  const welcomeStart = document.getElementById('welcomeStart');

  if (welcomeOverlay && !sessionStorage.getItem('kediri-welcome-seen')) {
    setTimeout(() => {
      welcomeOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      setTimeout(() => welcomeClose.focus(), 200);
    }, 800);
  }

  function closeWelcome() {
    welcomeOverlay.classList.remove('open');
    document.body.style.overflow = '';
    sessionStorage.setItem('kediri-welcome-seen', 'true');
  }

  if (welcomeClose) welcomeClose.addEventListener('click', closeWelcome);
  if (welcomeStart) welcomeStart.addEventListener('click', closeWelcome);
  if (welcomeOverlay) {
    welcomeOverlay.addEventListener('click', (e) => {
      if (e.target === welcomeOverlay) closeWelcome();
    });
  }
  // ============ FIX AGAR TIDAK REFRESH SAAT MENUTUP MODAL ============
document.addEventListener('click', (e) => {
  const closeBtn = e.target.closest('#modalClose, .modal-close, [onclick*="closeModal"]');
  if (closeBtn) {
    e.preventDefault();
    if (typeof closeModal === 'function') {
      closeModal();
    } else {
      const modalOverlay = document.getElementById('modalOverlay');
      if (modalOverlay) {
        modalOverlay.classList.remove('open');
        document.body.style.overflow = '';
      }
    }
  }
});
  /* --- Spotlight: Jelajahi Sumber Mata Air button --- */
  const filterAirBtn = document.querySelector('[data-filter-air]');
  if (filterAirBtn) {
    filterAirBtn.addEventListener('click', () => {
      // Click "Air" filter button
      const airBtn = document.querySelector('.filter-btn[data-filter="air"]');
      if (airBtn) airBtn.click();
      document.getElementById('destinasi').scrollIntoView({ behavior: 'smooth' });
    });
  }
}
});
