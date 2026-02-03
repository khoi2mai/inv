// CONFIG
const CONFIG = {
    PREFIX: "INV::",
    ZWS: '\u200B', ZWNJ: '\u200C', MARKER: '\u2060',
    SECRET: "Invisible_Sync_UI_2024"
};

let chatHistory = [];

// SETTINGS MANAGER
const AppSettings = {
    useIcon: localStorage.getItem('useIcon') === 'true',
    iconChar: localStorage.getItem('iconChar') || '🐧',

    _persist: () => {
        localStorage.setItem('useIcon', AppSettings.useIcon);
        localStorage.setItem('iconChar', AppSettings.iconChar);
    },

    toggle: () => {
        const toggleEl = document.getElementById('toggleIcon');
        AppSettings.useIcon = toggleEl.checked;
        AppSettings._persist();
        UI.showToast(AppSettings.useIcon ? 'Đã BẬT icon ẩn!' : 'Đã TẮT icon ẩn!');
    },
    
    // Mở/Đóng ngăn kéo chọn icon
    toggleDrawer: () => {
        const drawer = document.getElementById('emojiDrawer');
        const trigger = document.getElementById('iconTrigger');
        
        drawer.classList.toggle('show');
        trigger.classList.toggle('open');
    },

    selectIcon: (char, element) => {
        AppSettings.iconChar = char;
        AppSettings._persist();
        
        // 1. Cập nhật giao diện nút Trigger ngay lập tức
        document.getElementById('currentIconDisplay').innerText = char;
        
        // 2. Highlight trong grid
        document.querySelectorAll('.emoji-item').forEach(el => el.classList.remove('active'));
        if(element) element.classList.add('active');
        
        // 3. Đóng ngăn kéo lại
        AppSettings.toggleDrawer();

        // 4. Auto Bật Toggle nếu đang tắt
        const toggleEl = document.getElementById('toggleIcon');
        if (!toggleEl.checked) {
            toggleEl.checked = true;
            AppSettings.useIcon = true;
            AppSettings._persist();
        }
    },
    
    loadUI: () => {
        const toggleEl = document.getElementById('toggleIcon');
        if (toggleEl) toggleEl.checked = AppSettings.useIcon;
        
        // Hiển thị icon hiện tại lên nút Trigger
        document.getElementById('currentIconDisplay').innerText = AppSettings.iconChar;
        
        // Gán sự kiện click cho từng icon trong danh sách
        const items = document.querySelectorAll('.emoji-item');
        items.forEach(item => {
            if (item.getAttribute('data-char') === AppSettings.iconChar) {
                item.classList.add('active');
            }
            item.onclick = function() {
                AppSettings.selectIcon(this.getAttribute('data-char'), this);
            }
        });
    }
};

// XSS
const escapeHtml = (text) => {
    if (!text) return text;
    return String(text).replace(/[&<>"']/g, function(m) {
        return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'}[m];
    });
};

// COPPY
const forceCopy = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; 
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    let successful = false;
    try {
        successful = document.execCommand('copy');
    } catch (err) { successful = false; }
    
    document.body.removeChild(textArea);
    
    if (!successful && navigator.clipboard) {
        navigator.clipboard.writeText(text)
            .then(() => UI.showToast('Đã mã hóa & Copy!'))
            .catch(() => UI.showToast('Lỗi Copy!'));
    } else if (successful) {
        UI.showToast('Đã mã hóa & Copy!');
    }
};

// CORE LOGIC
const Steno = {
    textToHidden: (t) => {
        const binary = Array.from(t).map(c => c.charCodeAt(0).toString(2).padStart(16, '0')).join('');
        return CONFIG.MARKER + binary.split('').map(b => b === '0' ? CONFIG.ZWS : CONFIG.ZWNJ).join('') + CONFIG.MARKER;
    },
    
	encodeFromSyntax: (s) => {
        const open = s.indexOf('>'), close = s.lastIndexOf('<');
        if (open !== -1 && close !== -1 && open < close) {
            let visible = s.substring(0, open).trim() || '.';
            const hidden = s.substring(open + 1, close);
            
            // --- CẬP NHẬT LOGIC THÊM ICON TẠI ĐÂY ---
            if (hidden && AppSettings.useIcon) {
                // Thêm icon vào sau nội dung công khai
                visible = visible + " " + AppSettings.iconChar;
            }
            // ------------------------------------------

            if (hidden) return visible + Steno.textToHidden(hidden);
        }
        return s;
    },

    decode: (s) => {
        if (!s || !s.includes(CONFIG.MARKER)) return null;
        
        const parts = s.split(CONFIG.MARKER);
        let publicText = "...";
        if(parts.length > 0 && parts[0].trim() !== "") {
            publicText = parts[0].trim();
        }

        try {
            const hiddenPart = s.substring(s.indexOf(CONFIG.MARKER) + 1, s.lastIndexOf(CONFIG.MARKER));
            const binary = hiddenPart.split('').map(c => c === CONFIG.ZWS ? '0' : '1').join('');
            
            let secretText = "";
            for (let i = 0; i < binary.length; i += 16) {
                secretText += String.fromCharCode(parseInt(binary.substring(i, i + 16), 2));
            }
            return { public: publicText, secret: secretText };
        } catch (e) { return null; }
    }
};

// UI CONTROLLER
const UI = {
    pcInput: document.getElementById('pcInput'),
    mobInput: document.getElementById('mobInput'),
    chatArea: document.getElementById('chatArea'),
    toast: document.getElementById('toast'),

    showToast: (msg) => {
        UI.toast.innerText = msg;
        UI.toast.classList.add('show');
        setTimeout(() => UI.toast.classList.remove('show'), 2000);
    },

    renderMsg: (content, type, saveHistory = true) => {
        const row = document.createElement('div');
        row.className = `msg-row ${type}`;
        
        const decoded = Steno.decode(content);

        if (decoded) {
            const safePublic = escapeHtml(decoded.public);
            const safeSecret = escapeHtml(decoded.secret);
            
            row.innerHTML = `
                <div class="msg-bubble box-flat">
                    <div class="stego-container">
                        <div class="stego-public-text">${safePublic}</div>
                        <div class="stego-hidden-row">
                            <span class="stego-label">TIN NHẮN ẨN</span>
                            <div class="stego-content-text">${safeSecret}</div>
                        </div>
                    </div>
                </div>`;
        } else {
            row.innerHTML = `<div class="msg-bubble">${escapeHtml(content)}</div>`;
        }
        
        UI.chatArea.appendChild(row);
        UI.chatArea.scrollTop = UI.chatArea.scrollHeight;
        
		if (saveHistory) {
            chatHistory.push({ content, type, time: Date.now() });
            localStorage.setItem('chatLogs', JSON.stringify(chatHistory));
        }
    }
};

// ACTIONS
async function encryptAndCopy() {
    const inputEl = UI.mobInput.value ? UI.mobInput : UI.pcInput;
    const inputVal = inputEl.value.trim();
    
    if (!inputVal) return;
    const checkDecoded = Steno.decode(inputVal);
    if (checkDecoded) {
        UI.renderMsg(inputVal, 'bot');
        inputEl.value = '';
        return;
    }
    const hasSyntax = inputVal.includes('>') && inputVal.includes('<');

    if (hasSyntax) {
        const result = Steno.encodeFromSyntax(inputVal);
        forceCopy(result);
        UI.renderMsg(result, 'user');
    } else {
        UI.renderMsg(inputVal, 'user');
    }
    
    UI.mobInput.value = '';
    UI.pcInput.value = '';
}

async function pasteAndTranslate() {
    try {
        let text = "";
        if (navigator.clipboard && navigator.clipboard.readText) {
            text = await navigator.clipboard.readText();
        } else {
            text = prompt("Dán nội dung cần dịch vào đây:");
        }

        if (!text) return;

        const decoded = Steno.decode(text);
        if (decoded) {
            UI.renderMsg(text, 'bot'); 
            UI.showToast("Giải mã thành công!");
        } else {
            UI.mobInput.value = text;
            UI.showToast("Không tìm thấy mã ẩn, đã dán vào ô nhập.");
        }
    } catch (err) {
        UI.showToast("Lỗi truy cập Clipboard!");
    }
}

// FUNCTIONS & EXPORT
window.encryptAndCopy = encryptAndCopy;
window.pasteAndTranslate = pasteAndTranslate;

window.exportChat = () => {
    if (chatHistory.length === 0) return UI.showToast("Chưa có tin nhắn!");
    const jsonStr = JSON.stringify(chatHistory);
    const data = btoa(unescape(encodeURIComponent(jsonStr)));
    const sig = Math.abs(data.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0)).toString(16);
    
    const blob = new Blob([sig + "." + data], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `chat_${Date.now()}.inv`;
    a.click();
};

window.importChat = () => document.getElementById('fileInput').click();
window.handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const parts = ev.target.result.trim().split('.');
            if (parts.length !== 2) throw new Error();
            const data = parts[1];
            const checkSig = Math.abs(data.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0)).toString(16);
            if (checkSig !== parts[0]) throw new Error("File lỗi");

            const jsonStr = decodeURIComponent(escape(atob(data)));
            const loaded = JSON.parse(jsonStr);
            
            UI.chatArea.innerHTML = '';
            chatHistory = [];
            loaded.forEach(msg => UI.renderMsg(msg.content, msg.type, true));
            UI.showToast("Đã khôi phục!");
        } catch (err) { UI.showToast("File không hợp lệ!"); }
    };
    reader.readAsText(file);
    e.target.value = '';
};

window.clearChat = () => { 
    UI.chatArea.innerHTML = ''; 
    chatHistory = []; 
    localStorage.removeItem('chatLogs');
    UI.showToast("Đã xóa toàn bộ chat!");
};

window.copyBankInfo = () => {
    const num = document.getElementById('bankNum').innerText.replace(/\s/g, '');
    forceCopy(num);
    UI.showToast("Đã copy số tài khoản!");
};

window.insertChar = (c) => {
    const input = UI.mobInput;
    const start = input.selectionStart, end = input.selectionEnd;
    input.value = input.value.substring(0, start) + c + input.value.substring(end);
    input.setSelectionRange(start + 1, start + 1);
    input.focus();
};

// INITIALIZE
document.addEventListener('DOMContentLoaded', () => {
    const savedChat = localStorage.getItem('chatLogs');
    if (savedChat) {
        try {
            chatHistory = JSON.parse(savedChat);
            chatHistory.forEach(msg => {
                UI.renderMsg(msg.content, msg.type, false);
            });
        } catch (e) {
            console.error("Lỗi tải lịch sử chat", e);
        }
    }

	// --- BUYMECOFFEE ---
    const infoBtn = document.getElementById('infoBtn');
    const infoModal = document.getElementById('infoModal');
    const closeBtn = document.getElementById('closeBtn');

    if (infoBtn) infoBtn.onclick = () => infoModal.classList.add('show');
    if (closeBtn) closeBtn.onclick = () => infoModal.classList.remove('show');

    // --- SETTING INIT ---
    const settingBtn = document.getElementById('settingBtn');
    const settingModal = document.getElementById('settingModal');
    const closeSettingBtn = document.getElementById('closeSettingBtn');
    const toggleIcon = document.getElementById('toggleIcon');
    const iconTrigger = document.getElementById('iconTrigger'); 

    AppSettings.loadUI();
    if (settingBtn) settingBtn.onclick = () => settingModal.classList.add('show');
    if (closeSettingBtn) closeSettingBtn.onclick = () => settingModal.classList.remove('show');
    if (toggleIcon) toggleIcon.addEventListener('change', () => AppSettings.toggle());
    if (iconTrigger) iconTrigger.onclick = () => AppSettings.toggleDrawer();
    window.onclick = (e) => { 
        if (e.target == document.getElementById('infoModal')) document.getElementById('infoModal').classList.remove('show');
        if (e.target == settingModal) settingModal.classList.remove('show');
    };
    const mobInput = document.getElementById('mobInput');
    if (mobInput) {
        mobInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                encryptAndCopy();
            }
        });
    }

    if (window.location.pathname.endsWith("index.html")) {
        window.history.replaceState(null, "", window.location.pathname.replace("index.html", ""));
    }
});