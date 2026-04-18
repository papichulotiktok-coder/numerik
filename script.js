/**
 * LATIHAN TIU NUMERIK - SOFYAN BIMBEL
 * Modular Logic Engine v13.0 (Futuristik UI, Anti-Duplikasi, Pembahasan Super Awam)
 */


// --- KONFIGURASI KEAMANAN ---
const KODE_AKSES_BIMBEL = "LulusCPNS";
const KODE_ADMIN = "ADMINSOFYAN";


// --- VARIABEL GLOBAL ---
const TOTAL_Q = 15;
let questions = [];
let userAnswers = [];
let timeLog = [];
let currentIdx = 0;
let timeLeft = 15 * 60;
let timerInt;
let qStartTime = 0;
let currentStreak = 0;
let testMode = "mix";
let quota = { hitung: 4, deret: 4, perbandingan: 4, cerita: 3 };
let userName = "";
let timeUsed = 0;

// Set untuk melacak soal yang sudah keluar (Anti-Duplikasi)
let generatedSignatures = new Set();


// --- RENDERER MATEMATIKA (KaTeX) ---
function renderMathUI() {
    if (typeof renderMathInElement === "function") {
        const renderOptions = {
            delimiters: [
                {left: "$$", right: "$$", display: true},
                {left: "$", right: "$", display: false}
            ],
            throwOnError: false
        };
        const elQuestion = document.getElementById('q-content');
        const elOptions  = document.getElementById('options-container');
        const elReview   = document.getElementById('review-container');
        if (elQuestion) renderMathInElement(elQuestion, renderOptions);
        if (elOptions)  renderMathInElement(elOptions, renderOptions);
        if (elReview)   renderMathInElement(elReview, renderOptions);
    }
}


// --- LOGIKA GENERATOR SOAL ---
function getDiffMultiplier() { return Math.min(Math.floor(currentStreak / 2), 3); }

function fmt(num) {
    if (typeof num !== 'number') return num;
    if (!Number.isInteger(num)) return num.toString().replace('.', ',');
    return num >= 1000 ? num.toLocaleString('id-ID') : num;
}

function genOptions(correct) {
    let opts = new Set();
    opts.add(correct);

    let isDec = typeof correct === 'number' && !Number.isInteger(correct);
    let step = 1;
    if (typeof correct === 'number') {
        step = correct >= 1000 ? 500 : (correct >= 100 ? 10 : (isDec ? 0.25 : 1));
        if (step === 0) step = 1;
    }

    let attempts = 0;
    while (opts.size < 5 && attempts < 100) {
        attempts++;
        if (typeof correct === 'number') {
            let multiplier = Math.floor(Math.random() * 8) + 1;
            let fake = Math.random() > 0.5 ? correct + (multiplier * step) : correct - (multiplier * step);
            let finalFake = isDec ? Number(fake.toFixed(2)) : Math.round(fake);
            if (finalFake >= 0) opts.add(finalFake);
        } else { break; }
    }

    let fallbackOffset = 1;
    while (opts.size < 5 && typeof correct === 'number') {
        let forcedUp = correct + (fallbackOffset * step);
        opts.add(isDec ? Number(forcedUp.toFixed(2)) : Math.round(forcedUp));
        if (opts.size < 5) {
            let forcedDown = correct - (fallbackOffset * step);
            let finalDown = isDec ? Number(forcedDown.toFixed(2)) : Math.round(forcedDown);
            if (finalDown >= 0) opts.add(finalDown);
        }
        fallbackOffset++;
    }

    return Array.from(opts).sort((a, b) => {
        if (typeof a === 'string') return 0;
        return a - b;
    });
}

// Fungsi utama dengan sistem Anti-Duplikasi
function generateSingleQuestion() {
    let qObj;
    let attempts = 0;
    do {
        qObj = buildQuestionCore();
        attempts++;
    } while (generatedSignatures.has(qObj.sig) && attempts < 50);
    generatedSignatures.add(qObj.sig);
    return qObj;
}

function buildQuestionCore() {
    let type = testMode;
    let diff = getDiffMultiplier();

    if (type === 'mix') {
        let available = Object.keys(quota).filter(k => quota[k] > 0);
        if (available.length === 0) {
            quota = { hitung: 4, deret: 4, perbandingan: 4, cerita: 3 };
            available = Object.keys(quota);
        }
        type = available[Math.floor(Math.random() * available.length)];
        quota[type]--;
    }

    let qData = {};

    // ==========================================
    // 1. BERHITUNG CAMPURAN
    // ==========================================
    if (type === 'hitung') {
        let subtype = Math.floor(Math.random() * 4);
        if (subtype === 0) {
            const pair = [{d:"0{,}25", f:"\\frac{3}{4}"}, {d:"0{,}5", f:"\\frac{1}{2}"}, {d:"0{,}75", f:"\\frac{1}{4}"}][Math.floor(Math.random()*3)];
            const pr = [20, 25, 50][Math.floor(Math.random()*3)];
            const num = (Math.floor(Math.random()*5)+2 + diff) * 100;
            const ans = Math.round((pr/100) * num);
            qData = { cat: "Berhitung Campuran", q: `Hasil dari $(${pair.d} + ${pair.f}) \\times ${pr}\\% \\times ${num}$ adalah...`, options: genOptions(ans), correct: ans, note: `Cara Paling Gampang: Angka di dalam kurung itu kalau ditambah pasti jadi $1$. Jadi anggap aja kurungnya gak ada! Kamu tinggal hitung $${pr}\\%$ dari $${num}$, hasilnya pasti $${ans}$.` };
        } else if (subtype === 1) {
            const R = [6, 7, 8, 9][Math.floor(Math.random()*4)];
            const S = R * R;
            const p = [{p:"25\\%", b:4}, {p:"50\\%", b:2}][Math.floor(Math.random()*2)];
            const N = S * p.b;
            const ans = Math.round(R - 4);
            qData = { cat: "Berhitung Campuran", q: `Berapakah nilai dari $\\sqrt{${p.p} \\text{ dari } ${N}} - 2^2$?`, options: genOptions(ans), correct: ans, note: `Trik Nggak Bikin Pusing: Hitung aja yang di dalam akar duluan. $${p.p}$ dari $${N}$ itu kan $${S}$. Terus akar dari $${S}$ adalah $${R}$. Nah, $2^2$ itu kan $4$. Berarti $${R} - 4 = ${ans}$.` };
        } else if (subtype === 2) {
            const traps = [{d:"0{,}5", f:"\\frac{1}{2}"}, {d:"0{,}25", f:"\\frac{1}{4}"}][Math.floor(Math.random()*2)];
            const pr = [20, 40][Math.floor(Math.random()*2)];
            const num = (Math.floor(Math.random()*5)+5 + diff) * 50;
            const ans = Math.round((pr/100) * num);
            qData = { cat: "Berhitung Campuran", q: `Berapakah $${pr}\\%$ dari $${num}$ dikurangi $${traps.d}$ dan ditambah $${traps.f}$?`, options: genOptions(ans), correct: ans, note: `Trik Cepat Anti Ketipu: Kalau ada angka dikurangin, eh terus ditambah lagi sama angka yang sama persis (misal $-0{,}5$ terus ditambah $1/2$), coret aja dua-duanya karena hasilnya nol! Jadi cukup hitung $${pr}\\%$ dari $${num}$, ketemu deh $${ans}$.` };
        } else {
            const pair = [{d:"0{,}5", f:"\\frac{1}{2}"}, {d:"0{,}75", f:"\\frac{3}{4}"}][Math.floor(Math.random()*2)];
            const pr = [10, 20, 30][Math.floor(Math.random()*3)];
            const ans = Number((1 + (pr/100)).toFixed(2));
            qData = { cat: "Berhitung Campuran", q: `Berapakah nilai dari $${pair.d} : ${pair.f} + ${pr}\\%$?`, options: genOptions(ans), correct: ans, note: `Cara Gampang: Angka di depan itu kan sama aja, jadi kalau saling dibagi pasti hasilnya $1$. Terus, $${pr}\\%$ itu sama dengan $0{,}${pr/10}$. Kalau $1$ ditambah $0{,}${pr/10}$ jadinya $${fmt(ans)}$.` };
        }
    }

    // ==========================================
    // 2. DERET ANGKA (70% Tambah/Kurang, 30% Kali/Bagi)
    // ==========================================
    else if (type === 'deret') {
        let isKaliBagi = Math.random() < 0.3;

        if (isKaliBagi) {
            let s = Math.floor(Math.random()*3) + 2;
            let m = Math.floor(Math.random()*2) + 2;
            let tipe = Math.floor(Math.random()*2);

            if (tipe === 0) {
                let arr = [s, s*m, s*m*m, s*m*m*m];
                let ans = s*m*m*m*m;
                qData = { cat: "Deret Angka", q: `Berapa angka berikutnya: $${arr.join(', ')}, \\dots$`, options: genOptions(ans), correct: ans, note: `Lihat angkanya mendadak jadi gede banget kan? Pasti ini dikali. Coba cek, oh ternyata semua angkanya cuma dikali $${m}$ terus-menerus.` };
            } else {
                let arr = [s, s*2, s*2*3, s*2*3*4];
                let ans = s*2*3*4*5;
                qData = { cat: "Deret Angka", q: `Berapa angka berikutnya: $${arr.join(', ')}, \\dots$`, options: genOptions(ans), correct: ans, note: `Angkanya makin besar, berarti dikali. Tapi pengalinya urut! Angka pertama dikali $2$, lalu dikali $3$, lalu dikali $4$. Berarti angka terakhir harus kamu kali $5$.` };
            }
        } else {
            let p1 = Math.floor(Math.random()*4)+3 + diff;
            let tipe = Math.floor(Math.random()*3);

            if (tipe === 0) {
                let start = Math.floor(Math.random()*15)+5;
                let ans = start+(p1*4);
                qData = { cat: "Deret Angka", q: `Berapa angka berikutnya: $${start}, ${start+p1}, ${start+(p1*2)}, ${start+(p1*3)}, \\dots$`, options: genOptions(ans), correct: ans, note: `Ini soal gampang, cuma ditambah biasa. Tiap angka ke sebelahnya selalu ditambah $${p1}$.` };
            } else if (tipe === 1) {
                let p2 = Math.floor(Math.random()*3)+2;
                let s1 = 10, s2 = 50;
                let arr = [s1, s2, s1+p1, s2+p2, s1+(p1*2)];
                let ans = s2+(p2*2);
                qData = { cat: "Deret Angka", q: `Berapa angka berikutnya: $${arr.join(', ')}, \\dots$`, options: genOptions(ans), correct: ans, note: `Jangan lihat angka sebelahnya, coba lihat angka dengan cara "lompatin satu angka". Nanti kelihatan polanya cuma ditambah $${p2}$ aja.` };
            } else {
                let p2 = Math.floor(Math.random()*4)+2;
                let s1 = 15, s2 = 80;
                let arr = [s1, s2, s1+p1, s2-p2, s1+(p1*2)];
                let ans = s2-(p2*2);
                qData = { cat: "Deret Angka", q: `Berapa angka berikutnya: $${arr.join(', ')}, \\dots$`, options: genOptions(ans), correct: ans, note: `Fokus ke angka yang besar-besar aja (ingat: lompatin satu angka di tengahnya). Kelihatan kan makin lama makin turun? Polanya selalu dikurangi $${p2}$.` };
            }
        }
    }

    // ==========================================
    // 3. PERBANDINGAN KUANTITATIF
    // ==========================================
    else if (type === 'perbandingan') {
        let pkType = Math.floor(Math.random() * 4);
        const options = ["$X > Y$", "$X < Y$", "$X = Y$", "$X = 2Y$", "Hubungan Tak Tentu"];

        if (pkType === 0) {
            let n1 = 4, avg1 = 80, n2 = 5, avg2 = 82;
            let vy = (n2*avg2) - (n1*avg1);
            let vx = 90 + (Math.random() > 0.5 ? 5 : -5);
            let mathStr = vx === 95 ? "50 + 45" : (vx === 85 ? "100 - 15" : `${vx}`);
            qData = { cat: "Perbandingan Kuantitatif", type: "comparison", labelX: "Hitungan X", labelY: "Kasus Y", qx: `$${mathStr}$`, qy: `Nilai ujian Budi, jika rata-rata $${n1}$ temannya adalah $${avg1}$, tapi pas nilai Budi digabung, rata-ratanya naik jadi $${avg2}$.`, valX: vx, valY: vy, options: options, correct: vx > vy ? "$X > Y$" : (vx < vy ? "$X < Y$" : "$X = Y$"), note: `Cara Paling Gampang Nyari Nilai Budi (Kotak Y):<br>1. Total nilai baru = $${n2}$ orang dikali $${avg2} = 410$<br>2. Total nilai lama = $${n1}$ orang dikali $${avg1} = 320$<br>3. Nilainya Budi tinggal dikurangin aja: $410 - 320 = 90$. Terus bandingin sama angka di Kotak X deh.` };
        } else if (pkType === 1) {
            let distAwal = [10, 20][Math.floor(Math.random()*2)];
            let v1 = 40, v2 = 60;
            let vy = Math.round((distAwal / (v2 - v1)) * 60);
            let vx = vy + (Math.random() > 0.5 ? 15 : -15);
            let mathStr = `${vx/2} \\times 2`;
            qData = { cat: "Perbandingan Kuantitatif", type: "comparison", labelX: "Hitungan X", labelY: "Waktu Y", qx: `$${mathStr}$ Menit`, qy: `Lama waktu mobil (kecepatan $${v2}$ km/jam) menyusul motor (kecepatan $${v1}$ km/jam) yang sudah di depan sejauh $${distAwal}$ km.`, valX: vx, valY: vy, options: options, correct: vx > vy ? "$X > Y$" : (vx < vy ? "$X < Y$" : "$X = Y$"), note: `Cara Cepat Waktu Menyusul (Kotak Y): Jarak yang di depan ($${distAwal}$) kamu bagi sama beda kecepatan mereka ($60-40=20$). Hasilnya $${distAwal/20}$ Jam. Karena diminta dalam menit, tinggal dikali $60$. Hasilnya $Y = ${vy}$ Menit.` };
        } else if (pkType === 2) {
            let umurLalu = Math.round((Math.floor(Math.random() * 5) + 10) + diff);
            let thnLalu = 3;
            let selisih = 2;
            let umurTarget = (umurLalu + thnLalu) - selisih;
            let vx = umurTarget + (Math.random() > 0.5 ? 2 : -2);
            let mathStr = `${vx+5} - 5`;
            qData = { cat: "Perbandingan Kuantitatif", type: "comparison", labelX: "Umur X", labelY: "Umur Y", qx: `$${mathStr}$ Tahun`, qy: `Umur Budi sekarang. Padahal $${thnLalu}$ tahun lalu umur kakaknya $${umurLalu}$ tahun, dan Budi selalu lebih muda $${selisih}$ tahun dari kakaknya.`, valX: vx, valY: umurTarget, options: options, correct: vx > umurTarget ? "$X > Y$" : (vx < umurTarget ? "$X < Y$" : "$X = Y$"), note: `Pelan-pelan aja ngitungnya. Umur kakak $3$ tahun lalu kan $${umurLalu}$, berarti tahun ini umur kakak ditambah $3$, jadi $${umurLalu+thnLalu}$. Karena Budi lebih muda $2$ tahun, tinggal dikurang $2$. Jadi Umur Budi (Y) = $${umurTarget}$ tahun.` };
        } else {
            let org1 = 10 + diff;
            let hr1 = 20;
            let targetHr = 10;
            let tambahan = org1;
            let vx = tambahan + (Math.random() > 0.5 ? 5 : -5);
            let mathStr = `${vx*2} : 2`;
            qData = { cat: "Perbandingan Kuantitatif", type: "comparison", labelX: "Angka X", labelY: "Tambahan Pekerja Y", qx: `$${mathStr}$ Orang`, qy: `Tambahan pekerja yang dibutuhkan agar proyek yang harusnya selesai $${hr1}$ hari oleh $${org1}$ orang, bisa selesai sangat cepat dalam $${targetHr}$ hari.`, valX: vx, valY: tambahan, options: options, correct: vx > tambahan ? "$X > Y$" : (vx < tambahan ? "$X < Y$" : "$X = Y$"), note: `Trik Pakai Logika (Kotak Y): Coba deh, biar waktunya makin cepat jadi separuhnya doang (dari $20$ hari jadi $10$ hari), orang yang kerja harus didobel (dikali 2). Tadinya $${org1}$ orang, sekarang butuh $${org1*2}$ orang. Berarti TAMBAHAN orang barunya ya sebanyak $${tambahan}$ orang.` };
        }
    }

    // ==========================================
    // 4. SOAL CERITA ANALITIK
    // ==========================================
    else if (type === 'cerita') {
        let sub = Math.floor(Math.random() * 4);

        if (sub === 0) {
            let tot = 40, a = 25, b = 20, t = 5;
            let ans = 10;
            qData = { cat: "Soal Cerita Analitik", q: `Di sebuah kelas ada $${tot}$ orang. Ternyata $${a}$ orang suka Kopi, $${b}$ orang suka Susu, dan $${t}$ orang nggak suka minuman dua-duanya. Berapa orang yang rakus menyukai KEDUA minuman tersebut?`, options: genOptions(ans), correct: ans, note: `Cara Paling Gampang: Tambahin semua anak yang suka dan yang gak suka ($${a} + ${b} + ${t} = 50$). Habis itu tinggal dikurangin sama total anak di kelas itu ($40$). Ketemu deh, yang suka dua-duanya ada $10$ orang.` };
        } else if (sub === 1) {
            let k = 4, b = 6;
            let ans = 12;
            qData = { cat: "Soal Cerita Analitik", q: `Kran air bisa ngisi penuh bak mandi dalam $${k}$ jam. Eh, ternyata bawahnya bocor, jadi air penuh itu bakal habis terkuras dalam $${b}$ jam. Kalau kran dibuka tapi bocornya dibiarin, berapa jam bak mandinya baru bisa penuh?`, options: genOptions(ans), correct: ans, note: `Trik Cepat Keran Bocor: <br>1. Atasnya kamu kaliin: $${k} \\times ${b} = 24$<br>2. Bawahnya kamu kurangin (karena bocor): $${b} - ${k} = 2$<br>3. Udah deh, atas bagi bawah: $24 / 2 = 12$ Jam.` };
        } else if (sub === 2) {
            let d1 = 50, d2 = 20;
            let ans = 80000;
            qData = { cat: "Soal Cerita Analitik", q: `Nita mau beli sepatu harganya Rp$200.000$. Di tokonya ada tulisan "Diskon $${d1}\\% + ${d2}\\%$". Berapa uang yang harus dibayar Nita di kasir?`, options: genOptions(ans), correct: ans, note: `Awas Ketipu! Diskonnya nggak boleh langsung ditambah ya. Hitung satu-satu:<br>1. Diskon pertama $50\\%$ (artinya harga dipotong setengah), harganya sisa Rp$100.000$<br>2. Nah, harga yang Rp$100.000$ itu dipotong lagi $20\\%$. Berarti Nita cukup bayar $80\\%$-nya aja. $80\\%$ dari Rp$100.000$ = Rp$80.000$.` };
        } else {
            let d1 = 20;
            let ans = 190000;
            qData = { cat: "Soal Cerita Analitik", q: `Harga koper Rp$300.000$. Pak Budi dapat diskon $${d1}\\%$ dari toko. Karena dia bayar pakai kartu, dia dapat bonus potongan Rp$50.000$ (dipotong setelah diskon). Berapa harga akhirnya?`, options: genOptions(ans), correct: ans, note: `Hitung pelan-pelan urut dari depan: <br>1. Dikasih diskon $20\\%$, berarti Pak Budi cuma bayar $80\\%$-nya. $80\\%$ dari Rp$300.000$ = Rp$240.000$.<br>2. Eh dapat potongan bonus uang tunai lagi Rp$50.000$. Ya udah, Rp$240.000 - Rp50.000 = Rp190.000$.` };
        }
    }

    qData.sig = qData.q + (qData.qy || "");
    return qData;
}


// --- LEADERBOARD LOGIC ---
function saveToLeaderboard(score) {
    let lb = JSON.parse(localStorage.getItem('tiu_leaderboard')) || [];
    lb.push({ name: userName, mode: testMode, score: score, date: new Date().getTime() });
    lb.sort((a, b) => b.score - a.score);
    if (lb.length > 50) lb = lb.slice(0, 50);
    localStorage.setItem('tiu_leaderboard', JSON.stringify(lb));
}

function showLeaderboard() {
    document.getElementById('screen-login').classList.add('hidden');
    document.getElementById('screen-result').classList.add('hidden');
    document.getElementById('screen-leaderboard').classList.remove('hidden');

    let lb = JSON.parse(localStorage.getItem('tiu_leaderboard')) || [];
    let html = "";

    if (lb.length === 0) {
        html = "<p style='text-align:center; color:var(--text-muted); padding: 24px 20px;'>Belum ada data peringkat peserta.</p>";
    } else {
        lb.forEach((entry, i) => {
            let rankClass = i === 0 ? 'rank-1' : (i === 1 ? 'rank-2' : (i === 2 ? 'rank-3' : ''));
            let medal = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : (i + 1)));
            let modeMap = { 'mix': 'Full Mix', 'hitung': 'Node: Berhitung', 'deret': 'Node: Deret', 'perbandingan': 'Node: Kuantitatif', 'cerita': 'Node: Cerita' };
            let modeText = modeMap[entry.mode] || entry.mode;

            html += `<div class="lb-row">
                <div class="lb-rank ${rankClass}">${medal}</div>
                <div class="lb-info"><div class="lb-name">${entry.name}</div><div class="lb-mode">${modeText}</div></div>
                <div class="lb-score">${entry.score}</div>
            </div>`;
        });
    }
    document.getElementById('leaderboard-list').innerHTML = html;
}

function hideLeaderboard() {
    document.getElementById('screen-leaderboard').classList.add('hidden');
    document.getElementById('screen-login').classList.remove('hidden');
}

function adminResetLeaderboard() {
    let pass = prompt("Fitur Admin: Masukkan Kode Keamanan untuk menghapus seluruh Papan Peringkat");
    if (pass === KODE_ADMIN) {
        localStorage.removeItem('tiu_leaderboard');
        alert("Papan Peringkat berhasil di-reset secara permanen.");
        showLeaderboard();
    } else if (pass !== null) {
        alert("Kode Admin Salah! Akses ditolak.");
    }
}


// --- UI CONTROLLER ---
function startTest() {
    userName = document.getElementById('user-name').value.trim();
    let passInput = document.getElementById('access-password').value.trim();

    if (!userName) return alert("Masukkan nama kamu terlebih dahulu!");
    if (passInput !== KODE_AKSES_BIMBEL) return alert("Kode Akses Salah! Aplikasi ini khusus peserta internal.");

    testMode = document.getElementById('mode-select').value;
    quota = { hitung: 4, deret: 4, perbandingan: 4, cerita: 3 };

    // Reset State
    questions = []; userAnswers = []; timeLog = [];
    currentIdx = 0; currentStreak = 0;
    generatedSignatures.clear();
    timeUsed = 0;

    document.getElementById('screen-login').classList.add('hidden');
    document.getElementById('screen-quiz').classList.remove('hidden');
    document.getElementById('screen-quiz').classList.add('active-screen');

    if (timerInt) clearInterval(timerInt);
    timeLeft = 15 * 60;
    timerInt = setInterval(updateTimer, 1000);
    loadNextState();
}

function updateTimer() {
    timeLeft--;
    let m = Math.floor(timeLeft / 60), s = timeLeft % 60;
    let timerEl = document.getElementById('timer');
    timerEl.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
    if (timeLeft <= 60) timerEl.classList.add('danger');
    if (timeLeft <= 0) finish();
}

function updateLevelChip(streak) {
    let chip = document.getElementById('level-chip');
    let levelText = document.getElementById('level-text');
    chip.className = 'level-chip';
    if (streak >= 4) {
        chip.classList.add('level-hard');
        chip.textContent = '🔥 HARD';
        levelText.textContent = 'Level: Hard';
    } else if (streak >= 2) {
        chip.classList.add('level-medium');
        chip.textContent = '⚡ MEDIUM';
        levelText.textContent = 'Level: Medium';
    } else {
        chip.classList.add('level-normal');
        chip.textContent = '🟢 NORMAL';
        levelText.textContent = 'Level: Normal';
    }
}

function loadNextState() {
    curSel = null;
    let q = generateSingleQuestion();
    questions.push(q);

    document.getElementById('progress-bar').style.width = `${((currentIdx + 1) / TOTAL_Q) * 100}%`;
    document.getElementById('progress-text').innerText = `${currentIdx + 1}/${TOTAL_Q}`;
    updateLevelChip(currentStreak);
    document.getElementById('q-category').innerText = q.cat;

    let html = q.type === "comparison"
        ? `<table class="comp-table"><tr><th>X</th><th>Y</th></tr><tr><td>${q.qx}</td><td>${q.qy}</td></tr></table>`
        : `${currentIdx + 1}. ${q.q}`;
    document.getElementById('q-content').innerHTML = html;

    let optHtml = "";
    ['A', 'B', 'C', 'D', 'E'].forEach((label, i) => {
        let val = q.options[i];
        let disp = "";
        if (typeof val === 'string' && val.includes('$')) {
            disp = val;
        } else {
            disp = (q.cat.includes("Cerita") || q.qy?.includes("Harga")) && val >= 1000 ? `Rp$${fmt(val)}$` : `$${fmt(val)}$`;
        }
        optHtml += `<div class="option" onclick="selOpt(this, '${val}')"><b>${label}.</b> ${disp}</div>`;
    });
    document.getElementById('options-container').innerHTML = optHtml;

    if (currentIdx === TOTAL_Q - 1) {
        let btn = document.getElementById('btn-next');
        btn.innerText = "Selesai & Kumpulkan";
        btn.className = 'btn btn-warning';
    } else {
        let btn = document.getElementById('btn-next');
        btn.innerText = "Kunci Jawaban";
        btn.className = 'btn btn-primary';
    }

    qStartTime = Date.now();
    renderMathUI();
}

let curSel = null;
function selOpt(el, v) {
    curSel = v;
    document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
}

function processNext() {
    if (!curSel) return alert("Pilih jawaban dulu ya sebelum lanjut!");
    let elapsed = Math.round((Date.now() - qStartTime) / 1000);
    timeLog.push(elapsed);
    timeUsed += elapsed;
    userAnswers.push(curSel);

    if (String(curSel) === String(questions[currentIdx].correct)) {
        currentStreak++;
    } else {
        currentStreak = 0;
    }

    curSel = null;
    if (currentIdx < TOTAL_Q - 1) { currentIdx++; loadNextState(); } else { finish(); }
}

function finish() {
    clearInterval(timerInt);
    document.getElementById('screen-quiz').classList.add('hidden');
    document.getElementById('screen-result').classList.remove('hidden');

    let score = 0;
    let revHtml = "";

    questions.forEach((q, i) => {
        let isC = String(userAnswers[i]) === String(q.correct);
        if (isC) score++;

        let t = timeLog[i];
        let timeClass = t < 45 ? 'time-fast' : (t <= 60 ? 'time-ok' : 'time-slow');

        let usrDisplay = userAnswers[i] || '-';
        let keyDisplay = q.correct;

        if (typeof keyDisplay === 'number') {
            keyDisplay = (q.cat.includes("Cerita") || q.qy?.includes("Harga")) && keyDisplay >= 1000 ? `Rp$${fmt(keyDisplay)}$` : `$${fmt(keyDisplay)}$`;
            if (usrDisplay !== '-') {
                let parsedUsr = Number(usrDisplay);
                usrDisplay = (q.cat.includes("Cerita") || q.qy?.includes("Harga")) && parsedUsr >= 1000 ? `Rp$${fmt(parsedUsr)}$` : `$${fmt(parsedUsr)}$`;
            }
        }

        let answerRow = isC
            ? `<div class="review-answer-row"><span class="review-correct-ans">✓ Jawaban benar: ${keyDisplay}</span></div>`
            : `<div class="review-answer-row"><span class="review-wrong-ans">✗ Jawaban kamu: ${usrDisplay}</span> &nbsp;|&nbsp; <strong>Kunci: ${keyDisplay}</strong></div>`;

        revHtml += `<div class="review-card ${isC ? 'correct-card' : 'wrong-card'}">
            <div class="review-header">
                <div class="review-soal-num">Soal ${i + 1}</div>
                <span class="time-badge ${timeClass}">${t}s</span>
            </div>
            <div class="review-cat">${q.cat}</div>
            <div class="review-q-text">${q.type === 'comparison' ? 'Analisis Perbandingan X &amp; Y' : q.q}</div>
            ${answerRow}
            <div class="note-box">💡 ${q.note}</div>
        </div>`;
    });

    let finalScore = Math.round((score / TOTAL_Q) * 100);
    let wrong = TOTAL_Q - score;

    // Update stat cards
    document.getElementById('stat-benar').textContent = score;
    document.getElementById('stat-salah').textContent = wrong;

    // Format time used
    let totalSecs = timeUsed;
    let tm = Math.floor(totalSecs / 60), ts = totalSecs % 60;
    document.getElementById('stat-waktu').textContent = `${tm}:${ts < 10 ? '0' : ''}${ts}`;

    // Score ring animation
    document.getElementById('final-score').textContent = finalScore;
    let ringEl = document.getElementById('score-ring-fill');
    let scoreColor = finalScore >= 80 ? '#34d399' : (finalScore >= 60 ? '#fbbf24' : '#f87171');
    ringEl.style.stroke = scoreColor;
    document.getElementById('final-score').style.color = scoreColor;

    // Animate ring after render
    setTimeout(() => {
        const circumference = 326.7;
        const offset = circumference - (finalScore / 100) * circumference;
        ringEl.style.strokeDashoffset = offset;
    }, 100);

    // Result subtitle
    let subtitle = finalScore >= 80 ? "Luar biasa! Kamu siap ujian!" : (finalScore >= 60 ? "Bagus! Terus berlatih ya!" : "Semangat! Pasti bisa lebih baik!");
    document.getElementById('result-subtitle').textContent = subtitle;

    document.getElementById('review-container').innerHTML = revHtml;

    saveToLeaderboard(finalScore);
    renderMathUI();
}
