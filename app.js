// --- 0. TỰ ĐỘNG XÓA ĐUÔI .HTML TRÊN URL ---
(function() {
    if (window.location.pathname.endsWith("index.html")) {
        var newPath = window.location.pathname.replace("index.html", "");
        window.history.replaceState(null, "", newPath);
    }
})();

// 1. CẤU HÌNH & KHÓA BẢO MẬT
const PREFIX = "INV::";
const ZERO_WIDTH_SPACE = '\u200B', ZERO_WIDTH_NON_JOINER = '\u200C', MARKER = '\u2060';
const APP_SECRET = "Invisible_Sync_UI_2024";

let chatHistory = [];

// --- 2. LOGIC CỐT LÕI (GIỮ NGUYÊN) ---
const Steno = {
    textToHidden: (t) => {
        let b = ''; for (let i = 0; i < t.length; i++) b += t.charCodeAt(i).toString(2).padStart(16, '0');
        return MARKER + b.split('').map(x => x === '0' ? ZERO_WIDTH_SPACE : ZERO_WIDTH_NON_JOINER).join('') + MARKER;
    },
    encodeFromSyntax: (s) => {
        const o = s.indexOf('>'), c = s.lastIndexOf('<');
        if (o !== -1 && c !== -1 && o < c) {
            let v = s.substring(0, o).trim(); const h = s.substring(o + 1, c);
            if (!h.trim()) return s;
            return (v || '.') + Steno.textToHidden(h);
        }
        return s;
    },
    decode: (s) => {
        if (!s || !s.includes(MARKER)) return null;
        const h = s.replace(new RegExp(`[^${ZERO_WIDTH_SPACE}${ZERO_WIDTH_NON_JOINER}]`, 'g'), '');
        let b = h.replace(new RegExp(ZERO_WIDTH_SPACE, 'g'), '0').replace(new RegExp(ZERO_WIDTH_NON_JOINER, 'g'), '1');
        let t = ''; for (let i = 0; i < b.length; i += 16) t += String.fromCharCode(parseInt(b.substr(i, 16), 2));
        
        let publicText = "...";
        const parts = s.split(MARKER);
        if(parts.length > 0 && parts[0].trim() !== "") {
            publicText = parts[0].trim();
        }

        return { public: publicText, secret: t };
    }
};

// --- 3. HÀM COPY (Force Copy) ---
function forceCopy(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        const successful = document.execCommand('copy');
        if(successful) showToast('Đã mã hóa & Copy!');
        else showToast('Lỗi Copy!');
    } catch (err) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            showToast('Đã mã hóa & Copy!');
        }
    }
    document.body.removeChild(textArea);
}

// --- 4. XỬ LÝ NHẬP LIỆU THÔNG MINH ---
const mobInput = document.getElementById('mobInput');

// Hỗ trợ phím Enter
mobInput.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        encryptAndCopy();
    }
});

function encryptAndCopy() {
    const val = mobInput.value.trim();
    if (!val) return;

    // A. Kiểm tra nếu người dùng dán tin nhắn ĐÃ MÃ HÓA vào
    const checkDecoded = Steno.decode(val);
    if (checkDecoded) {
        // Dịch và hiển thị ngay
        renderUnifiedMsg(val, 'bot', true); 
        mobInput.value = '';
        return;
    }

    // B. Nếu là tin nhắn thường -> MÃ HÓA
    let processedVal = val;
    // Tự động thêm cú pháp nếu quên
    if (!val.includes('>') && !val.includes('<')) {
        processedVal = `. >${val}<`;
    }

    // Tạo chuỗi mã hóa
    const encoded = Steno.encodeFromSyntax(processedVal);
    
    // Copy ngay lập tức
    forceCopy(encoded);

    // Hiển thị lên chat (Dùng encoded để nó tự nhận diện là stego và hiện khung đẹp)
    renderUnifiedMsg(encoded, 'user', true);
    
    mobInput.value = '';
}

async function pasteAndTranslate() {
    try {
        let text = "";
        if (navigator.clipboard && navigator.clipboard.readText) {
            text = await navigator.clipboard.readText();
        } else {
            text = prompt("Dán tin nhắn cần dịch vào đây:");
        }

        if (text) {
            const decoded = Steno.decode(text);
            if (decoded) {
                // Hiển thị dạng Bot (người nhận)
                renderUnifiedMsg(text, 'bot', true); 
            } else {
                showToast('Không tìm thấy tin nhắn ẩn!');
            }
        }
    } catch (e) { 
        showToast('Lỗi quyền dán!'); 
    }
}

// --- 5. HỆ THỐNG HIỂN THỊ ĐỒNG BỘ (QUAN TRỌNG NHẤT) ---
// Hàm này thay thế cho cả addMsg và addDecodedMsg cũ
function renderUnifiedMsg(rawText, type, save = true) {
    const chatArea = document.getElementById('chatArea');
    const row = document.createElement('div');
    row.className = `msg-row ${type}`;

    // Thử giải mã xem text này có chứa mã ẩn không
    const stegoData = Steno.decode(rawText);

    if (stegoData) {
        // === TRƯỜNG HỢP 1: CÓ MÃ ẨN (Hiện giao diện đẹp) ===
        const bubble = document.createElement('div');
        // Thêm box-flat để có style, nếu là user thì thêm class user-stego để chỉnh màu nếu cần
        bubble.className = 'msg-bubble box-flat'; 

        const safePublic = escapeHtml(stegoData.public || '...');
        const safeSecret = escapeHtml(stegoData.secret);
        
        // Màu chữ public: User (nền cam) -> trắng, Bot (nền xám) -> trắng
        const publicCol = '#fff'; 

        bubble.innerHTML = `
            <div class="stego-container">
                <span class="stego-public-text" style="color: ${publicCol}">${safePublic}</span>
                <div class="stego-hidden-row">
                    <span class="stego-label">TIN NHẮN ẨN</span>
                    <span class="stego-content-text">${safeSecret}</span>
                </div>
            </div>`;
        row.appendChild(bubble);

    } else {
        // === TRƯỜNG HỢP 2: TEXT THƯỜNG (Hiện bubble thường) ===
        const safeText = escapeHtml(rawText);
        row.innerHTML = `<div class="msg-bubble">${safeText}</div>`;
    }

    chatArea.appendChild(row);
    chatArea.scrollTop = chatArea.scrollHeight;

    if (save) {
        // Lưu chuỗi gốc (encoded hoặc plain text) vào lịch sử
        chatHistory.push({ type: type, content: rawText });
    }
}

// Hàm bảo mật XSS
function escapeHtml(text) {
    if (!text) return text;
    return String(text).replace(/[&<>"']/g, function(m) {
        return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'}[m];
    });
}

// --- 6. EXPORT & IMPORT (GIỮ NGUYÊN) ---

function generateSignature(content) {
    let str = content + APP_SECRET;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; 
    }
    return Math.abs(hash).toString(16);
}

function exportChat() {
    if (chatHistory.length === 0) {
        showToast("Chưa có tin nhắn!");
        return;
    }
    const jsonStr = JSON.stringify(chatHistory);
    const base64Str = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) { return String.fromCharCode('0x' + p1); }));
    const signature = generateSignature(base64Str);
    const finalContent = signature + "." + base64Str;
    const blob = new Blob([finalContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "invisible_chat_" + Date.now() + ".inv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Đã lưu file an toàn!");
}

function importChat() { document.getElementById('fileInput').click(); }

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parts = e.target.result.trim().split('.');
            if (parts.length !== 2) throw new Error("Format sai");
            if (generateSignature(parts[1]) !== parts[0]) {
                alert("CẢNH BÁO: File bị sửa!"); return;
            }
            const jsonStr = decodeURIComponent(atob(parts[1]).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const loadedHistory = JSON.parse(jsonStr);
            if (Array.isArray(loadedHistory)) {
                // Xóa chat cũ và file input
                document.getElementById('chatArea').innerHTML = ''; 
                chatHistory = [];
                
                // Load lại từng tin nhắn qua hàm renderUnifiedMsg
                loadedHistory.forEach(msg => {
                    renderUnifiedMsg(msg.content, msg.type, true);
                });
                showToast("Đã khôi phục!");
            }
        } catch (err) { showToast("File lỗi!"); }
    };
    reader.readAsText(file);
    event.target.value = ''; 
}

// --- UTILS ---
function toggleMode() { alert("Vui lòng dùng trên điện thoại!"); }
function copyMode() { navigator.clipboard.writeText("Cú pháp: Hiển thị >Ẩn đi<"); alert("Đã copy hướng dẫn!"); }
function clearChat() { 
    document.getElementById('chatArea').innerHTML = ''; 
    chatHistory = [];
    document.getElementById('fileInput').value = '';
}
function showToast(m) { const t = document.getElementById('toast'); t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); }

const infoModal = document.getElementById('infoModal'), infoBtn = document.getElementById('infoBtn'), closeBtn = document.getElementById('closeBtn');
if(infoBtn) infoBtn.onclick = () => infoModal.classList.add('show');
if(closeBtn) closeBtn.onclick = () => infoModal.classList.remove('show');
window.onclick = (e) => { if(e.target == infoModal) infoModal.classList.remove('show'); }

// --- 6. ADDED FOR NEW DONATE MODAL ---
function copyBankInfo() {
    const bankNum = document.getElementById('bankNum').innerText;
    const cleanNum = bankNum.replace(/\s/g, '');
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(cleanNum);
        showToast("Đã copy số tài khoản!");
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = cleanNum;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast("Đã copy số tài khoản!");
    }
}

// --- HÀM CHÈN KÝ TỰ NHANH ---
function insertChar(char) {
    const input = document.getElementById('mobInput');
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    
    // Chèn ký tự vào vị trí con trỏ
    input.value = text.substring(0, start) + char + text.substring(end);
    
    // Di chuyển con trỏ ra sau ký tự vừa chèn
    input.selectionStart = input.selectionEnd = start + 1;
    
    // Focus lại vào ô nhập để gõ tiếp luôn
    input.focus();
}