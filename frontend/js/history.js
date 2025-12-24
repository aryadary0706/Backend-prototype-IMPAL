import { getToken, getUserFromToken, removeToken } from './api.js';

const token = getToken();
if (!token) {
  window.location.href = 'index.html';
}

const user = getUserFromToken();
const userNameElement = document.getElementById('user-name');
if (user && userNameElement) {
  userNameElement.textContent = user.name || "User";
}

// Logout button
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    removeToken();
    window.location.href = 'index.html';
  });
}

// Load history
async function loadHistory() {
  const historyList = document.getElementById('history-list');
  historyList.innerHTML = '<p style="text-align:center;">Loading...</p>';
  
  try {
    const res = await fetch('http://localhost:3000/history', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    const response = await res.json();
    console.log('API response:', response);
    
    // Data ada di response.data
    const items = response.data || [];
    
    if (items.length === 0) {
        historyList.className = '';
        historyList.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-image">
                <img src="/frontend/assets/I2.jpg" alt="Plant illustration"/>
            </div>
            <div class="empty-state-content">
                <h3>Belum ada riwayat identifikasi 🌱</h3>
                <p>Ayo perbanyak pohon dan cek kesehatan tanamanmu dengan PlantDoc.</p>
            </div>
        </div>
        `;
    return;
    }

    historyList.className = 'history-container';
    historyList.innerHTML = items.map(item => `
      <div class="history-card">
        <img src="${item.imagePath}" alt="Plant" class="history-img" onerror="this.src='https://via.placeholder.com/260x180?text=No+Image'">
        <div class="history-info">
          <p><strong>Penyakit:</strong> ${item.diseaseName || 'N/A'}</p>
          <p><strong>Solusi:</strong> ${item.TreatmentAdvice || '-'}</p>
          <p><strong>Confidence:</strong> ${item.confidenceScore || 0}%</p>
          <p><strong>Tanggal:</strong> ${new Date(item.createdAt).toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
          <button class="delete-btn" data-id="${item.id}">Hapus</button>
        </div>
      </div>
    `).join('');

    // Add delete listeners
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteHistory(btn.dataset.id));
    });

  } catch (err) {
    console.error('Error loading history:', err);
    historyList.innerHTML = `<p style="text-align:center; color:#e74c3c;">Gagal memuat riwayat: ${err.message}</p>`;
  }
}

// Delete function
async function deleteHistory(id) {
  if (!confirm('Yakin ingin menghapus riwayat ini?')) return;

  try {
    const res = await fetch(`http://localhost:3000/history/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Gagal menghapus');
    }

    const result = await res.json();
    alert(result.message || 'Berhasil dihapus!');
    loadHistory(); // Reload history

  } catch (err) {
    console.error('Error deleting:', err);
    alert('Gagal menghapus: ' + err.message);
  }
}

// Load on page load
loadHistory();