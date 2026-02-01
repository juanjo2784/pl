let app = {
    modo: "",
    lotes: [],
    memoriaEstandar: {},
    ultimoCodigo: "",
    stream: null
};

// Formateo de números con puntos de miles
const fNum = (n) => Number(n || 0).toLocaleString('es-ES');

function formatearInputMiles(input) {
    let valor = input.value.replace(/\D/g, "");
    input.value = valor ? new Intl.NumberFormat('es-ES').format(valor) : "";
}

function limpiarPuntos(id) {
    const el = document.getElementById(id);
    return el ? parseInt(el.value.replace(/\./g, '')) || 0 : 0;
}

function iniciarApp(m) {
    const p = document.getElementById('inp-pedido').value;
    if (!p) return alert("נא להזין מספר הזמנה");
    app.modo = m;
    document.getElementById('txt-pedido').innerText = p;
    document.getElementById('screen-intro').classList.add('hidden');
    document.getElementById('screen-main').classList.remove('hidden');
}

// --- ESCANER ---
function activarEscaneo() {
    document.getElementById('overlay-scanner').classList.remove('hidden');
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#interactive'),
            constraints: { facingMode: "environment" }
        },
        decoder: { readers: ["code_128_reader", "ean_reader"] }
    }, (err) => {
        if (err) return alert(err);
        Quagga.start();
        app.stream = Quagga.CameraAccess.getActiveTrack();
    });
}

Quagga.onDetected((res) => {
    app.ultimoCodigo = res.codeResult.code;
    const btn = document.getElementById('btn-confirm-capture');
    btn.classList.remove('hidden');
    btn.innerHTML = `<i class="fas fa-check"></i> אצווה: ${app.ultimoCodigo}`;
});

function aplicarZoom(val) {
    if (app.stream) {
        app.stream.applyConstraints({ advanced: [{ zoom: val }] });
    }
}

function procesarCapturaManual() {
    document.getElementById('form-scanner').classList.remove('hidden');
    document.getElementById('btn-confirm-capture').classList.add('hidden');
    mostrarFormulario(app.ultimoCodigo);
}

function mostrarFormulario(code) {
    const fields = document.getElementById('dynamic-fields');
    const est = app.memoriaEstandar[code] || "";

    if (app.modo === 'rapido') {
        fields.innerHTML = `
            <label>סטנדרט (יחידות למארז)</label>
            <input type="number" id="f-est" value="${est}">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <div><label>מארזים</label><input type="text" id="f-com" oninput="formatearInputMiles(this)"></div>
                <div><label>בודדים</label><input type="text" id="f-par" oninput="formatearInputMiles(this)"></div>
            </div>
            <button class="btn-action" style="background:var(--s); margin-top:10px;" onclick="guardarLote('${code}')">שמור</button>
        `;
    } else {
        // Lógica uno a uno simplificada
        fields.innerHTML = `
            <label>כמות להוספה</label>
            <input type="text" id="f-par" class="input-grande" oninput="formatearInputMiles(this)">
            <button class="btn-action" style="background:var(--p); margin-top:10px;" onclick="guardarLote('${code}')">הוסף למלאי</button>
        `;
    }
}

function guardarLote(code) {
    const est = parseInt(document.getElementById('f-est')?.value) || 1;
    const com = limpiarPuntos('f-com');
    const par = limpiarPuntos('f-par');

    if (app.modo === 'rapido') app.memoriaEstandar[code] = est;

    const totalIngresado = (com * est) + par;
    const idx = app.lotes.findIndex(l => l.id === code);

    if (idx !== -1) {
        app.lotes[idx].total += totalIngresado;
    } else {
        app.lotes.unshift({ id: code, total: totalIngresado });
    }

    actualizarLista();
    cerrarEscaner();
}

function actualizarLista() {
    const container = document.getElementById('container-lotes');
    container.innerHTML = app.lotes.map((l, i) => `
        <div class="lote-item">
            <div style="display:flex; justify-content:space-between;">
                <b>${l.id}</b>
                <span style="color:var(--p); font-weight:bold;">${fNum(l.total)}</span>
            </div>
        </div>
    `).join('');
}

function cerrarFormulario() {
    document.getElementById('form-scanner').classList.add('hidden');
}

function cerrarEscaner() {
    Quagga.stop();
    document.getElementById('overlay-scanner').classList.add('hidden');
    document.getElementById('form-scanner').classList.add('hidden');
}

function descargarCSV() {
    let csv = "\uFEFFBatch,Total\n";
    app.lotes.forEach(l => csv += `${l.id},${l.total}\n`);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `inventario_${document.getElementById('txt-pedido').innerText}.csv`;
    link.click();
}