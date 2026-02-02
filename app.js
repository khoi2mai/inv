// --- 0. UTILS & CONFIG ---
const CONFIG = {
    PREFIX: "INV::",
    ZWS: '\u200B', ZWNJ: '\u200C', MARKER: '\u2060',
    SECRET: "Invisible_Sync_UI_2024"
};

let chatHistory = [];

// --- 1. CORE LOGIC (STENO) ---
const Steno = {
    textToHidden: (t) => {
        const binary = Array.from(t).map(c => c.charCodeAt(0).toString(2).padStart(16, '0')).join('');
        return CONFIG.MARKER + binary.split('').map(b => b === '0' ? CONFIG.ZWS : CONFIG.ZWNJ).join('') + CONFIG.MARKER;
    },
    
    encodeFromSyntax: (s) => {
        const open = s.indexOf('>'), close = s.lastIndexOf('<');
        if (open !== -1 && close !== -1 && open < close) {
            const visible = s.substring(0, open).trim() || '.';
            const hidden = s.substring(open + 1, close);
            return hidden.trim() ? visible + Steno.textToHidden(hidden) : s;
        }
        // Nếu không có cú pháp, coi toàn bộ là text hiển thị, không ẩn
        return s; 
    },

    decode: (s) => {
        if (!s || !s.includes(CONFIG.MARKER)) return null;
        const hiddenPart = s.replace(new RegExp(`[^${CONFIG.ZWS}${CONFIG.ZWNJ}]`, 'g'), '');
        const binary = hiddenPart.replace(new RegExp(CONFIG.ZWS, 'g'), '0').replace(new RegExp(CONFIG.ZWNJ, 'g'), '1');
        
        let text = '';
        for (let i = 0; i < binary.length; i += 16) {
            text += String.fromCharCode(parseInt(binary.substr(i, 16), 2));
        }

        const publicText = s.split(CONFIG.MARKER)[0].trim() || "...";
        return { public: publicText, secret: text };
    }
};

// --- 2. UI & CHAT SYSTEM ---
const UI = {
    mobInput: document.getElementById('mobInput'),
    chatArea: document.getElementById('chatArea'),
    toast: document.getElementById('toast'),

    showToast: (m) => {
        UI.toast.textContent = m;
        UI.toast.classList.add('show');
        setTimeout(() => UI.toast.classList.remove('show'), 3000);
    },

    renderMsg: (rawText, type, save = true) => {
        const row = document.createElement('div');
        row.className = `msg-row ${type}`;
        const data = Steno.decode(rawText);

        if (data) {
            row.innerHTML = `
                <div class="msg-bubble box-flat">
                    <div class="stego-container">
                        <span class="stego-public-text" style="color:#fff">${UI.escape(data.public)}</span>
                        <div class="stego-hidden-row">
                            <span class="stego-label">TIN NHẮN ẨN</span>
                            <span class="stego-content-text">${UI.escape(data.secret)}</span>
                        </div>
                    </div>
                </div>`;
        } else {
            row.innerHTML = `<div class="msg-bubble">${UI.escape(rawText)}</div>`;
        }

        UI.chatArea.appendChild(row);
        UI.chatArea.scrollTop = UI.chatArea.scrollHeight;
        if (save) chatHistory.push({ type, content: rawText });
    },

    escape: (t) => t ? String(t).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])) : ''
};

// --- 3. ACTIONS ---
async function forceCopy(text) {
    try {
        await navigator.clipboard.writeText(text);
        UI.showToast('Đã mã hóa & Copy!');
    } catch (err) {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        UI.showToast('Đã mã hóa & Copy!');
    }
}

function encryptAndCopy() {
    const val = UI.mobInput.value.trim();
    if (!val) return;

    if (Steno.decode(val)) {
        UI.renderMsg(val, 'bot');
    } else {
        const encoded = Steno.encodeFromSyntax(val);
        forceCopy(encoded);
        UI.renderMsg(encoded, 'user');
    }
    UI.mobInput.value = '';
}

// --- 4. EVENTS & FILES ---
UI.mobInput.onkeypress = (e) => { if (e.key === "Enter") { e.preventDefault(); encryptAndCopy(); } };

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const [sig, data] = e.target.result.trim().split('.');
            if (generateSignature(data) !== sig) return alert("File bị sửa!");
            
            const history = JSON.parse(decodeURIComponent(escape(atob(data))));
            UI.chatArea.innerHTML = '';
            chatHistory = [];
            history.forEach(m => UI.renderMsg(m.content, m.type));
            UI.showToast("Đã khôi phục!");
        } catch (err) { UI.showToast("File lỗi!"); }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function generateSignature(content) {
    let hash = 0, str = content + CONFIG.SECRET;
    for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i) | 0;
    return Math.abs(hash).toString(16);
}

// --- 5. INITIALIZE ---
(function init() {
    if (window.location.pathname.endsWith("index.html")) {
        window.history.replaceState(null, "", window.location.pathname.replace("index.html", ""));
    }
})();

// Giữ lại các hàm Global cho HTML calls
window.encryptAndCopy = encryptAndCopy;
window.importChat = () => document.getElementById('fileInput').click();
window.clearChat = () => { UI.chatArea.innerHTML = ''; chatHistory = []; };
window.insertChar = (c) => {
    const start = UI.mobInput.selectionStart, end = UI.mobInput.selectionEnd;
    UI.mobInput.value = UI.mobInput.value.substring(0, start) + c + UI.mobInput.value.substring(end);
    UI.mobInput.setSelectionRange(start + 1, start + 1);
    UI.mobInput.focus();
};