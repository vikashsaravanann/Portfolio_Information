document.addEventListener('DOMContentLoaded', () => {
    const authGate = document.getElementById('authGate');
    const hubDashboard = document.getElementById('hubDashboard');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    
    let sessionToken = null;

    const dashboardHTML = `
        <div class="section-title">
            <h2 class="mb-4">Broadcast <span class="highlight">Hub</span></h2>
            <p style="color: var(--text-secondary); margin-bottom: 40px;">Multi-channel communication dispatch center.</p>
        </div>

        <!-- Channel Status Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px;">
            <div class="hero-stat-box" id="status-email">
                <i class="fas fa-envelope text-accent"></i>
                <div class="stat-info">
                    <span class="stat-title">Email (SMTP)</span>
                    <span class="stat-desc status-text" style="color: #10b981;">Ready</span>
                </div>
            </div>
            <div class="hero-stat-box" id="status-sms">
                <i class="fas fa-sms" style="color: #f59e0b;"></i>
                <div class="stat-info">
                    <span class="stat-title">SMS (Fast2SMS)</span>
                    <span class="stat-desc status-text" style="color: #10b981;">Ready</span>
                </div>
            </div>
            <div class="hero-stat-box" id="status-telegram">
                <i class="fab fa-telegram" style="color: #3b82f6;"></i>
                <div class="stat-info">
                    <span class="stat-title">Telegram Bot</span>
                    <span class="stat-desc status-text" id="tg-status-text">Checking...</span>
                </div>
            </div>
            <div class="hero-stat-box" id="status-whatsapp">
                <i class="fab fa-whatsapp" style="color: #22c55e;"></i>
                <div class="stat-info">
                    <span class="stat-title">WhatsApp Cloud</span>
                    <span class="stat-desc status-text" style="color: #10b981;">Ready</span>
                </div>
            </div>
        </div>

        <!-- Composer -->
        <div class="certs-bordered-card" style="margin-bottom: 40px;">
            <h3 style="margin-bottom: 15px;">Compose Message</h3>
            <textarea id="messageBody" rows="8" placeholder="Type your broadcast message here..." 
                style="width: 100%; padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.5); color: #fff; font-family: var(--font-body); resize: vertical;"></textarea>
            <div style="text-align: right; color: var(--text-secondary); font-size: 0.85rem; margin-top: 10px;">
                <span id="charCount">0</span> characters
            </div>
        </div>

        <!-- Dispatch Controls -->
        <div class="certs-bordered-card" style="margin-bottom: 40px; text-align: center;">
            <h3 style="margin-bottom: 20px;">Select Channels</h3>
            <div class="channel-toggles" style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap; margin-bottom: 30px;">
                <button type="button" class="btn-toggle active" data-channel="email"><i class="fas fa-envelope"></i> Email</button>
                <button type="button" class="btn-toggle active" data-channel="sms"><i class="fas fa-sms"></i> SMS</button>
                <button type="button" class="btn-toggle active" data-channel="telegram"><i class="fab fa-telegram"></i> Telegram</button>
                <button type="button" class="btn-toggle active" data-channel="whatsapp"><i class="fab fa-whatsapp"></i> WhatsApp</button>
            </div>
            <button id="dispatchBtn" class="btn-primary" style="font-size: 1.1rem; padding: 15px 40px;">
                <i class="fas fa-paper-plane"></i> Dispatch Broadcast
            </button>
        </div>

        <!-- Results Panel -->
        <div id="resultsPanel" class="certs-bordered-card" style="display: none;">
            <h3 style="margin-bottom: 20px;">Dispatch Results</h3>
            <div id="resultsContent" style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 8px; font-family: monospace; white-space: pre-wrap; color: #a1a1aa;"></div>
        </div>
    `;

    // Login Flow
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('adminPassword').value;
        const btn = document.getElementById('loginBtn');
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
        loginError.style.display = 'none';

        try {
            const res = await fetch('/api/broadcast/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                sessionToken = data.token;
                authGate.style.display = 'none';
                
                // Inject DOM dynamically after authentication
                hubDashboard.innerHTML = dashboardHTML;
                hubDashboard.style.display = 'block';
                
                initDashboard();
            } else {
                loginError.textContent = data.error || 'Authentication failed.';
                loginError.style.display = 'block';
            }
        } catch (err) {
            loginError.textContent = 'Network error. Please try again.';
            loginError.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Authenticate';
        }
    });

    function initDashboard() {
        checkTelegramStatus();

        // Composer Character Count
        const msgBody = document.getElementById('messageBody');
        const charCount = document.getElementById('charCount');
        msgBody.addEventListener('input', () => {
            charCount.textContent = msgBody.value.length;
        });

        // Channel Toggles
        const toggles = document.querySelectorAll('.btn-toggle');
        toggles.forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('active');
            });
        });

        // Dispatch Flow
        const dispatchBtn = document.getElementById('dispatchBtn');
        const confirmModal = document.getElementById('confirmModal');
        const cancelDispatch = document.getElementById('cancelDispatch');
        const confirmDispatch = document.getElementById('confirmDispatch');
        const resultsPanel = document.getElementById('resultsPanel');
        const resultsContent = document.getElementById('resultsContent');

        dispatchBtn.addEventListener('click', () => {
            const message = msgBody.value.trim();
            const selectedChannels = Array.from(document.querySelectorAll('.btn-toggle.active')).map(btn => btn.dataset.channel);

            if (!message) {
                alert('Please compose a message before dispatching.');
                return;
            }
            if (selectedChannels.length === 0) {
                alert('Please select at least one channel.');
                return;
            }

            confirmModal.style.display = 'flex';
        });

        cancelDispatch.addEventListener('click', () => {
            confirmModal.style.display = 'none';
        });

        confirmDispatch.addEventListener('click', async () => {
            confirmModal.style.display = 'none';
            
            const message = msgBody.value.trim();
            const channels = Array.from(document.querySelectorAll('.btn-toggle.active')).map(btn => btn.dataset.channel);

            dispatchBtn.disabled = true;
            dispatchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Dispatching...';
            resultsPanel.style.display = 'block';
            resultsContent.textContent = 'Dispatching to ' + channels.join(', ') + '...\nPlease wait, this may take a moment depending on the recipient count.\n';

            try {
                const res = await fetch('/api/broadcast/dispatch', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionToken}`
                    },
                    body: JSON.stringify({ message, channels })
                });

                const data = await res.json();
                
                if (res.ok && data.success) {
                    resultsContent.textContent += '\n✅ Dispatch Complete!\n\n';
                    resultsContent.textContent += JSON.stringify(data.results, null, 2);
                } else {
                    resultsContent.textContent += '\n❌ Dispatch Failed:\n' + (data.error || 'Unknown error');
                    if (data.details) {
                        resultsContent.textContent += '\n' + JSON.stringify(data.details, null, 2);
                    }
                }
            } catch (err) {
                resultsContent.textContent += '\n❌ Network Error:\n' + err.message;
            } finally {
                dispatchBtn.disabled = false;
                dispatchBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Dispatch Broadcast';
            }
        });
    }

    // Check Telegram Status
    async function checkTelegramStatus() {
        const tgStatusText = document.getElementById('tg-status-text');
        try {
            const res = await fetch('/api/broadcast/telegram/status', {
                headers: { 'Authorization': `Bearer ${sessionToken}` }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                if (data.online) {
                    tgStatusText.textContent = `Online (@${data.bot.username})`;
                    tgStatusText.style.color = '#10b981'; // Green
                } else {
                    tgStatusText.textContent = 'Offline / ' + (data.reason || '');
                    tgStatusText.style.color = '#ef4444'; // Red
                }
            } else {
                tgStatusText.textContent = 'Error checking status';
                tgStatusText.style.color = '#ef4444';
            }
        } catch (e) {
            tgStatusText.textContent = 'Network error';
            tgStatusText.style.color = '#ef4444';
        }
    }

    // Auto year
    const yearEl = document.getElementById('copyrightYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
});
