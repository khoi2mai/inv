// --- 0. UTILS & CONFIG ---
const CONFIG = {
    PREFIX: "INV::",
    ZWS: '\u200B', ZWNJ: '\u200C', MARKER: '\u2060',
    SECRET: "Invisible_Sync_UI_2024"
};

let chatHistory = [];

// Hàm bảo mật XSS
const escapeHtml = (text) => {
    if (!text) return text;
    return String(text).replace(/[&<>"']/g, function(m) {
        return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'}[m];
    });
};

// Hàm Force Copy
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

// --- 1. CORE LOGIC (STENO) ---
const Steno = {
    textToHidden: (t) => {
        const binary = Array.from(t).map(c => c.charCodeAt(0).toString(2).padStart(16, '0')).join('');
        return CONFIG.MARKER + binary.split('').map(b => b === '0' ? CONFIG.ZWS : CONFIG.ZWNJ).join('') + CONFIG.MARKER;
    },
    
    encodeFromSyntax: (s) => {
        // [ĐÃ SỬA] Không tự động thêm cú pháp nữa.
        // Chỉ mã hóa khi thực sự tìm thấy dấu > và <
        const open = s.indexOf('>'), close = s.lastIndexOf('<');
        if (open !== -1 && close !== -1 && open < close) {
            const visible = s.substring(0, open).trim() || '.'; // Mặc định là dấu . nếu phần hiện trống
            const hidden = s.substring(open + 1, close);
            
            // Nếu nội dung trong >...< có chữ thì mới mã hóa
            if (hidden) return visible + Steno.textToHidden(hidden);
        }
        return s; // Trả về nguyên gốc nếu không có cú pháp
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

// --- 2. UI CONTROLLER ---
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
            // == TRƯỜNG HỢP 1: CÓ MÃ ẨN (Box đẹp) ==
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
            // == TRƯỜNG HỢP 2: TEXT THƯỜNG (Bubble thường) ==
            row.innerHTML = `<div class="msg-bubble">${escapeHtml(content)}</div>`;
        }
        
        UI.chatArea.appendChild(row);
        UI.chatArea.scrollTop = UI.chatArea.scrollHeight;
        
        if (saveHistory) {
            chatHistory.push({ content, type, time: Date.now() });
        }
    }
};

// --- 3. ACTIONS ---
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

// --- 4. GLOBAL FUNCTIONS & EXPORT ---
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

// --- 5. INITIALIZE ---
document.addEventListener('DOMContentLoaded', () => {
    const infoBtn = document.getElementById('infoBtn');
    const infoModal = document.getElementById('infoModal');
    const closeBtn = document.getElementById('closeBtn');

    if (infoBtn) infoBtn.onclick = () => infoModal.classList.add('show');
    if (closeBtn) closeBtn.onclick = () => infoModal.classList.remove('show');
    window.onclick = (e) => { if (e.target == infoModal) infoModal.classList.remove('show'); };

    [UI.pcInput, UI.mobInput].forEach(el => {
        if (el) {
            el.addEventListener('keypress', (e) => { 
                if (e.key === 'Enter') {
                    e.preventDefault(); 
                    encryptAndCopy(); 
                }
            });
        }
    });

    if (window.location.pathname.endsWith("index.html")) {
        window.history.replaceState(null, "", window.location.pathname.replace("index.html", ""));
    }
});