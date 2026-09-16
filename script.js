// ----------------------------------------------------
// 1. ระบบจัดการ State สินค้า, เวลา และ ผู้ใช้งาน
// ----------------------------------------------------
let currentUser = {
  isLoggedIn: false,
  name: "ยังไม่ได้เข้าสู่ระบบ",
  email: "-",
  provider: "-",
  avatar: "M",
  gender: "ชาย",
  interests: ["🎮 ไอที / เกมมิ่ง", "📷 กล้องถ่ายรูป", "👟 แฟชั่น"]
};

let products = [
  {
    id: 1,
    title: "หูฟังไร้สาย Flagship Model",
    category: "tech",
    sellerName: "TechSeller",
    sellerRating: "4.9 / 5 (32 รีวิว)",
    img: "https://picsum.photos/400/300?random=1",
    startPrice: 500,
    currentPrice: 1200,
    minBid: 10,
    maxPrice: 2500,
    startTime: new Date().getTime(),
    endTime: new Date().getTime() + (6 * 60 * 60 * 1000),
    liveUsers: 12,
    status: 'ACTIVE',
    history: [
      { user: "User_A", price: 1200, time: "14:30" }
    ]
  }
];

let currentActiveProductId = null;
let notifications = [];

// ----------------------------------------------------
// 2. ระบบ Navigation & History API
// ----------------------------------------------------
function navigateTo(pageId, isBack = false) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(pageId);
  if(target) target.classList.add('active');

  if (!isBack) {
    history.pushState({ pageId: pageId }, '', `#${pageId}`);
  }

  if (pageId === 'home-page') renderHomePage();
  if (pageId === 'profile-page') renderProfilePage();
}

function goBack() {
  if (window.history.length > 1 && location.hash !== '#home-page') {
    window.history.back();
  } else {
    navigateTo('home-page');
  }
}

window.onpopstate = function(event) {
  if (event.state && event.state.pageId) {
    navigateTo(event.state.pageId, true);
  } else {
    navigateTo('home-page', true);
  }
};

// ----------------------------------------------------
// 3. ระบบ Authentication (ล็อกอินจริง / Social Login)
// ----------------------------------------------------
function handleEmailLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  
  currentUser = {
    isLoggedIn: true,
    name: email.split('@')[0],
    email: email,
    provider: "อีเมล / รหัสผ่าน",
    avatar: email.charAt(0).toUpperCase(),
    gender: "ชาย",
    interests: ["🎮 ไอที / เกมมิ่ง", "📷 กล้องถ่ายรูป"]
  };

  alert(`เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับคุณ ${currentUser.name}`);
  updateNavUser();
  navigateTo('home-page');
}

function loginWithSocial(provider) {
  if (provider === 'facebook') {
    currentUser = {
      isLoggedIn: true,
      name: "Mawin (Facebook User)",
      email: "mawin.fb@facebook.com",
      provider: "Facebook",
      avatar: "https://graph.facebook.com/100000000000000/picture?type=large",
      isAvatarUrl: true,
      gender: "ชาย",
      interests: ["🎮 ไอที / เกมมิ่ง", "👟 แฟชั่น"]
    };
  } else if (provider === 'google') {
    currentUser = {
      isLoggedIn: true,
      name: "Mawin (Google User)",
      email: "mawin.dev@gmail.com",
      provider: "Google",
      avatar: "G",
      isAvatarUrl: false,
      gender: "ชาย",
      interests: ["🎮 ไอที / เกมมิ่ง", "📷 กล้องถ่ายรูป", "👟 แฟชั่น"]
    };
  }

  alert(`เชื่อมต่อและเข้าสู่ระบบด้วย ${currentUser.provider} สำเร็จ!`);
  updateNavUser();
  navigateTo('home-page');
}

function logout() {
  currentUser = {
    isLoggedIn: false,
    name: "ยังไม่ได้เข้าสู่ระบบ",
    email: "-",
    provider: "-",
    avatar: "M",
    gender: "-",
    interests: []
  };
  alert("ออกจากระบบเรียบร้อยแล้ว");
  updateNavUser();
  navigateTo('login-page');
}

function updateNavUser() {
  const navLoginBtn = document.getElementById('nav-login-btn');
  if (currentUser.isLoggedIn) {
    navLoginBtn.innerText = `โปรไฟล์ (${currentUser.name})`;
    navLoginBtn.onclick = () => navigateTo('profile-page');
  } else {
    navLoginBtn.innerText = "เข้าสู่ระบบ";
    navLoginBtn.onclick = () => navigateTo('login-page');
  }
}

function renderProfilePage() {
  document.getElementById('profile-name').innerText = currentUser.name;
  document.getElementById('profile-email').value = currentUser.email;
  document.getElementById('profile-provider').value = currentUser.provider;
  
  const avatarElem = document.getElementById('profile-avatar');
  if (currentUser.isAvatarUrl) {
    avatarElem.innerHTML = `<img src="${currentUser.avatar}" alt="Avatar">`;
  } else {
    avatarElem.innerText = currentUser.avatar;
  }

  const logoutBtnContainer = document.getElementById('profile-logout-container');
  if (currentUser.isLoggedIn) {
    logoutBtnContainer.style.display = 'block';
  } else {
    logoutBtnContainer.style.display = 'none';
  }
}

// ----------------------------------------------------
// 4. Render หน้าหลัก, รายการสินค้า & ค้นหา/กรอง
// ----------------------------------------------------
function renderHomePage(filteredProducts = null) {
  const container = document.getElementById('product-container');
  const listToRender = filteredProducts || products;
  
  if (!listToRender || listToRender.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 3rem 1rem;">
        <h3>🚫 ไม่พบรายการประมูล</h3>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">ไม่มีสินค้าที่ตรงกับเงื่อนไขการค้นหาของคุณ</p>
        <button class="btn" onclick="navigateTo('sell-page')">ลงประมูลสินค้าเป็นคนแรก</button>
      </div>
    `;
    return;
  }

  let html = '<div class="product-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.5rem;">';
  listToRender.forEach(p => {
    const maxPriceText = p.maxPrice ? ` | ซื้อทันที: ฿${p.maxPrice.toLocaleString()}` : '';
    html += `
      <div class="product-card" onclick="openAuctionDetail(${p.id})" style="cursor: pointer; border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; background: var(--card-bg);">
        <img src="${p.img}" alt="${p.title}" style="width: 100%; height: 180px; object-fit: cover;">
        <div class="product-info" style="padding: 1rem;">
          <span class="badge-live" id="badge-${p.id}" style="background: red; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">LIVE</span>
          <h3 style="margin-top:0.4rem; font-size:1.1rem;">${p.title}</h3>
          <p class="timer" id="card-timer-${p.id}">⏳ คำนวณเวลา...</p>
          <p style="font-weight: bold; color: var(--primary-color);">ราคาปัจจุบัน: ฿${p.currentPrice.toLocaleString()}</p>
          <p style="font-size:0.8rem; color: var(--text-muted);">${maxPriceText}</p>
        </div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

function filterProducts() {
  const searchKey = document.getElementById('search-input')?.value.toLowerCase().trim() || '';
  const category = document.getElementById('category-filter')?.value || 'all';
  const sort = document.getElementById('sort-filter')?.value || 'latest';

  let result = [...products];

  // กรองด้วยคำค้นหา
  if (searchKey) {
    result = result.filter(p => p.title.toLowerCase().includes(searchKey));
  }

  // กรองด้วยหมวดหมู่
  if (category !== 'all') {
    result = result.filter(p => p.category === category);
  }

  // เรียงลำดับ
  if (sort === 'price-low') {
    result.sort((a, b) => a.currentPrice - b.currentPrice);
  } else if (sort === 'price-high') {
    result.sort((a, b) => b.currentPrice - a.currentPrice);
  } else if (sort === 'latest') {
    result.sort((a, b) => b.id - a.id);
  }

  renderHomePage(result);
}

function clearAllProducts() {
  products = [];
  renderHomePage();
}

// ----------------------------------------------------
// 5. หน้าเข้าร่วมประมูล (Detail Page)
// ----------------------------------------------------
function openAuctionDetail(productId) {
  currentActiveProductId = productId;
  const p = products.find(item => item.id === productId);
  if(!p) return;

  document.getElementById('detail-img').src = p.img;
  document.getElementById('detail-title').innerText = p.title;
  document.getElementById('detail-start-price').innerText = `฿${p.startPrice.toLocaleString()}`;
  document.getElementById('detail-current-price').innerText = `฿${p.currentPrice.toLocaleString()}`;
  document.getElementById('detail-min-bid').innerText = `+฿${p.minBid}`;
  document.getElementById('detail-max-price').innerText = p.maxPrice ? `฿${p.maxPrice.toLocaleString()}` : 'ไม่มี (ประมูลจนจบเวลา)';
  document.getElementById('detail-live-users').innerText = p.liveUsers;

  const sellerNameElem = document.getElementById('detail-seller-name');
  if (sellerNameElem) sellerNameElem.innerText = p.sellerName || "TechSeller";

  const bidInput = document.getElementById('bid-input');
  const minPrice = p.currentPrice + p.minBid;
  bidInput.value = minPrice;
  bidInput.min = minPrice;
  bidInput.step = p.minBid;

  renderBidHistory(p);
  navigateTo('auction-page');
}

function renderBidHistory(p) {
  const historyContainer = document.getElementById('bid-history-list');
  historyContainer.innerHTML = p.history.map(h => `
    <div class="bid-item" style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px dashed var(--border-color);">
      <span><strong>${h.user}</strong> (${h.time})</span>
      <span style="color:var(--primary-color); font-weight:bold;">฿${h.price.toLocaleString()}</span>
    </div>
  `).join('');
}

function placeBid() {
  if (!currentUser.isLoggedIn) {
    alert('กรุณาเข้าสู่ระบบก่อนทำการเสนอราคา!');
    navigateTo('login-page');
    return;
  }

  const p = products.find(item => item.id === currentActiveProductId);
  const input = document.getElementById('bid-input');
  const val = parseInt(input.value);

  if (p.status === 'ENDED') {
    alert('การประมูลนี้จบลงแล้ว');
    return;
  }

  if (val < p.currentPrice + p.minBid) {
    alert(`ต้องเสนอราคามากกว่าขั้นต่ำ ฿${(p.currentPrice + p.minBid).toLocaleString()}`);
    return;
  }

  p.currentPrice = val;
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  p.history.unshift({ user: `${currentUser.name} (คุณ)`, price: val, time: timeStr });

  if (p.maxPrice && val >= p.maxPrice) {
    p.status = 'ENDED';
    alert(`🎉 คุณเสนอราคาถึงราคาสูงสุด (฿${p.maxPrice.toLocaleString()}) ชนะการประมูลทันที!`);
    addNotification(`คุณชนะการประมูลสินค้า "${p.title}" ที่ราคา ฿${val.toLocaleString()}`);
  } else {
    alert('เสนอราคาเรียบร้อยแล้ว!');
    addNotification(`คุณเสนอราคา ฿${val.toLocaleString()} ในสินค้า "${p.title}"`);
  }

  openAuctionDetail(p.id);
}

// Loop Realtime นับเวลา
setInterval(() => {
  const now = new Date().getTime();

  products.forEach(p => {
    let timerText = "";

    if (p.status === 'ENDED') {
      timerText = "🔴 จบการประมูลแล้ว";
    } else if (now < p.startTime) {
      p.status = 'UPCOMING';
      const diff = p.startTime - now;
      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      timerText = `🟡 เริ่มประมูลในอีก: ${hrs} ชม. ${mins} นาที`;
    } else {
      p.status = 'ACTIVE';
      const diff = p.endTime - now;
      if (diff <= 0) {
        p.status = 'ENDED';
        timerText = "🔴 จบการประมูลแล้ว";
      } else {
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        timerText = `⏳ เหลือเวลา: ${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
      }
    }

    const cardTimer = document.getElementById(`card-timer-${p.id}`);
    if(cardTimer) cardTimer.innerText = timerText;

    if (currentActiveProductId === p.id) {
      const detailTimer = document.getElementById('detail-timer');
      const bidBtn = document.getElementById('bid-btn');
      if (detailTimer) detailTimer.innerText = timerText;
      
      if (p.status === 'ENDED' && bidBtn) {
        bidBtn.disabled = true;
        bidBtn.innerText = "ปิดการประมูลแล้ว";
      }
    }
  });
}, 1000);

// ----------------------------------------------------
// 6. หน้าวางขายสินค้า (Sell Form)
// ----------------------------------------------------
function toggleImgInputType() {
  const type = document.getElementById('img-input-type').value;
  if (type === 'file') {
    document.getElementById('file-input-group').style.display = 'block';
    document.getElementById('url-input-group').style.display = 'none';
  } else {
    document.getElementById('file-input-group').style.display = 'none';
    document.getElementById('url-input-group').style.display = 'block';
  }
}

function handleCreateProduct(e) {
  e.preventDefault();

  if (!currentUser.isLoggedIn) {
    alert('กรุณาเข้าสู่ระบบก่อนลงประกาศวางขายสินค้า!');
    navigateTo('login-page');
    return;
  }

  const title = document.getElementById('sell-title').value;
  const category = document.getElementById('sell-category')?.value || 'other';
  const imgType = document.getElementById('img-input-type').value;
  let imgUrl = "";

  if (imgType === 'url') {
    imgUrl = document.getElementById('sell-img-url').value;
  } else {
    const fileInput = document.getElementById('sell-img-file');
    if (fileInput.files && fileInput.files[0]) {
      imgUrl = URL.createObjectURL(fileInput.files[0]);
    } else {
      imgUrl = "https://picsum.photos/400/300?random=99";
    }
  }

  const startPrice = parseInt(document.getElementById('sell-start-price').value);
  const minBid = parseInt(document.getElementById('sell-min-bid').value) || 10;
  const maxPriceInput = document.getElementById('sell-max-price').value;
  const maxPrice = maxPriceInput ? parseInt(maxPriceInput) : null;

  const startDateVal = document.getElementById('sell-start-date').value;
  const durationHours = parseInt(document.getElementById('sell-duration').value);

  if (durationHours < 5) {
    alert('ระยะเวลาประมูลต้องไม่ต่ำกว่า 5 ชั่วโมง');
    return;
  }

  const startTime = startDateVal ? new Date(startDateVal).getTime() : new Date().getTime();
  const endTime = startTime + (durationHours * 60 * 60 * 1000);

  const newProd = {
    id: Date.now(),
    title: title,
    category: category,
    sellerName: currentUser.name,
    sellerRating: "5.0 / 5 (ผู้ขายใหม่)",
    img: imgUrl,
    startPrice: startPrice,
    currentPrice: startPrice,
    minBid: minBid,
    maxPrice: maxPrice,
    startTime: startTime,
    endTime: endTime,
    liveUsers: 1,
    status: 'ACTIVE',
    history: []
  };

  products.unshift(newProd);
  alert('เปิดวางขายสินค้าสำเร็จ!');
  navigateTo('home-page');
}

// ----------------------------------------------------
// 7. Messenger Chat & Theme Toggle & Notifications
// ----------------------------------------------------
function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  appendChatBubble(text, 'user');
  input.value = '';

  setTimeout(() => {
    appendChatBubble("รับทราบครับ ขอบคุณมากครับ!", 'seller');
  }, 1200);
}

function sendChatImage(inputElem) {
  if (inputElem.files && inputElem.files[0]) {
    const imgUrl = URL.createObjectURL(inputElem.files[0]);
    const imgContent = `<img src="${imgUrl}" style="max-width: 200px; border-radius: 8px;">`;
    appendChatBubble(imgContent, 'user', true);

    setTimeout(() => {
      appendChatBubble("ได้รับรูปภาพเรียบร้อยแล้วครับ", 'seller');
    }, 1500);
  }
}

function appendChatBubble(content, type, isHtml = false) {
  const chatBody = document.getElementById('chat-body');
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${type}`;
  
  if (isHtml) {
    bubble.innerHTML = content;
  } else {
    bubble.innerText = content;
  }

  chatBody.appendChild(bubble);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function addNotification(msg) {
  notifications.unshift(msg);
  const badge = document.getElementById('notif-badge');
  if (badge) {
    badge.innerText = notifications.length;
    badge.style.display = 'inline-block';
  }
}

function toggleNotifications() {
  if (notifications.length === 0) {
    alert("ไม่มีการแจ้งเตือนใหม่");
  } else {
    alert("📢 รายการแจ้งเตือน:\n\n" + notifications.join("\n"));
    notifications = [];
    const badge = document.getElementById('notif-badge');
    if (badge) badge.style.display = 'none';
  }
}

function toggleTheme() {
  const html = document.documentElement;
  const newTheme = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', newTheme);
}

window.onload = () => {
  history.replaceState({ pageId: 'home-page' }, '', '#home-page');
  renderHomePage();
  navigateTo('home-page', true);
};