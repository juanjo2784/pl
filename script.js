let app = { 
    modo: "", 
    lotes: [], 
    memoriaEstandar: {}, 
    ultimoCodigo: "" 
};
let iconoSeleccionado = "fa-box"; 
let tipoProductoSeleccionado = "ארגז"; 

// Auxiliar para formato de miles (español usa punto para miles)
const fNum = (n) => {
    return new Intl.NumberFormat('es-ES').format(n || 0);
};

// --- INICIO ---
function iniciarApp(m) {
    const p = document.getElementById('inp-pedido').value;
    if(!p) return alert("Ingrese ID de pedido");
    app.modo = m;
    document.getElementById('txt-pedido').innerText = p.toUpperCase();
    document.getElementById('screen-intro').classList.add('hidden');
    document.getElementById('screen-main').classList.remove('hidden');
}

function selectIcon(el, iconName, tipoNombre) {
    document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('selected'));
    el.classList.add('selected');
    iconoSeleccionado = iconName;
    tipoProductoSeleccionado = tipoNombre;
}

// --- ESCANEO (Se mantiene igual) ---
function activarEscaneo() {
    document.getElementById('overlay-scanner').classList.remove('hidden');
    document.getElementById('form-scanner').classList.add('hidden');
    document.getElementById('btn-confirm-capture').classList.add('hidden');
    
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#interactive'),
            constraints: { width: { min: 1280 }, height: { min: 720 }, facingMode: "environment" },
            area: { top: "40%", right: "10%", left: "10%", bottom: "40%" }
        },
        decoder: { readers: ["code_128_reader", "ean_reader"] }
    }, (err) => { 
        if (err) return alert("Error de cámara");
        Quagga.start(); 
    });
}

Quagga.onDetected((res) => {
    app.ultimoCodigo = res.codeResult.code;
    const btn = document.getElementById('btn-confirm-capture');
    btn.innerHTML = `<i class="fas fa-check"></i> אישור אצווה: ${app.ultimoCodigo}`;
    btn.classList.remove('hidden');
    if (navigator.vibrate) navigator.vibrate(100);
});

function procesarCapturaManual() {
    Quagga.stop();
    mostrarFormulario(app.ultimoCodigo);
}

function mostrarFormulario(code) {
    document.getElementById('form-scanner').classList.remove('hidden');
    document.getElementById('txt-lote-det').innerText = "אצווה: " + code;
    const fields = document.getElementById('dynamic-fields');
    const est = app.memoriaEstandar[code] || "";

    const htmlIconos = `
        <label style="display:block; font-size:12px; color:#666; margin-top:10px;">סוג מוצר</label>
        <div class="icon-selector">
            <div class="icon-option selected" onclick="selectIcon(this, 'fa-box', 'ארגז')"><i class="fas fa-box"></i><span>ארגז</span></div>
            <div class="icon-option" onclick="selectIcon(this, 'fa-file-alt', 'עלון')"><i class="fas fa-file-alt"></i><span>עלון</span></div>
            <div class="icon-option" onclick="selectIcon(this, 'fa-tags', 'מדבקה')"><i class="fas fa-tags"></i><span>מדבקה</span></div>
            <div class="icon-option" onclick="selectIcon(this, 'fa-shield-alt', 'T.E')"><i class="fas fa-shield-alt"></i><span>TE</span></div>
            <div class="icon-option" onclick="selectIcon(this, 'fa-archive', 'קרטון')"><i class="fas fa-archive"></i><span>קרטון</span></div>
            <div class="icon-option" onclick="selectIcon(this, 'fa-cube', 'חומר 1')"><i class="fas fa-cube"></i><span>חומר1</span></div>
            <div class="icon-option" onclick="selectIcon(this, 'fa-shapes', 'חומר 2')"><i class="fas fa-shapes"></i><span>חומר 2</span></div>
            <div class="icon-option" onclick="selectIcon(this, 'fa-folder', 'חומר 3')"><i class="fas fa-folder"></i><span>חומר 3</span></div>
        </div>
    `;

    if(app.modo === 'rapido') {
        fields.innerHTML = `
            ${!est ? htmlIconos : ''}
            <label>כמות סטנדרטית</label>
            <input type="number" id="f-est" value="${est}" style="width:100%; padding:10px;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
                <div><label>ארגזים</label><input type="number" id="f-com" value="0" style="width:100%; padding:10px;"></div>
                <div><label>חלקי</label><input type="number" id="f-par" value="0" style="width:100%; padding:10px;"></div>
            </div>
            <button class="btn-action" style="background:var(--p); width:100%; color:white; padding:15px; margin-top:15px;" onclick="finalizarRegistro('${code}')">שמור הכל</button>
        `;
    } else {
        if(!est) {
            fields.innerHTML = `
                ${htmlIconos}
                <label>כמות סטנדרטית:</label>
                <input type="number" id="f-est" placeholder="Ej: 12" style="width:100%; padding:10px;">
                <button class="btn-action" style="background:var(--s); width:100%; color:white; padding:15px; margin-top:10px;" onclick="definirEst('${code}')">המשך</button>
            `;
        } else {
            const iconClass = app.memoriaEstandar[code + "_icon"] || "fa-box";
            fields.innerHTML = `
                <div style="background:#e7f3ff; padding:10px; border-radius:8px; margin-bottom:15px; text-align:center;">
                    <i class="fas ${iconClass} fa-2x"></i><br>סטנדרט: <b>${fNum(est)}</b>
                </div>
                <input type="number" id="f-par-btn" placeholder="יחידות חלקיות" style="width:100%; padding:10px; margin-bottom:15px; font-size:18px; text-align:center;">
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <button class="btn-action" style="background:var(--s); color:white; padding:15px;" onclick="finalizarRegistro('${code}', 1, 0)">+1 ארגז</button>
                    <button class="btn-action" style="background:var(--p); color:white; padding:15px;" onclick="capturarParcialBtn('${code}')">חלקי</button>
                </div>
            `;
        }
    }
}

function definirEst(code) {
    const val = parseInt(document.getElementById('f-est').value);
    if(!val) return alert("הזן כמות סטנדרטית");
    app.memoriaEstandar[code] = val;
    app.memoriaEstandar[code + "_icon"] = iconoSeleccionado;
    app.memoriaEstandar[code + "_tipo"] = tipoProductoSeleccionado;
    mostrarFormulario(code);
}

function capturarParcialBtn(code) {
    const pVal = parseInt(document.getElementById('f-par-btn').value) || 0;
    if(pVal <= 0) return alert("הזן כמות חלקית");
    finalizarRegistro(code, 0, pVal);
}

// --- LOGICA DE REGISTRO (CORREGIDA) ---
// --- REGISTRO ---
function finalizarRegistro(code, cNominal, pNominal) {
    let est = app.memoriaEstandar[code];
    let com = cNominal || 0;
    let par = pNominal || 0;

    if (app.modo === 'rapido') {
        est = parseInt(document.getElementById('f-est').value);
        com = parseInt(document.getElementById('f-com').value) || 0;
        par = parseInt(document.getElementById('f-par').value) || 0;
        app.memoriaEstandar[code] = est;
    }

    // Buscamos si el lote ya existe
    let lote = app.lotes.find(l => l.id === code);

    if (lote) {
        lote.com += com; // Agrupamos cajas completas
        if (par > 0) lote.listaParciales.push(par); // Listamos parcial individual
        lote.updated = true;
    } else {
        app.lotes.unshift({
            id: code,
            est: est,
            com: com,
            listaParciales: par > 0 ? [par] : [],
            tipo: app.memoriaEstandar[code + "_tipo"] || tipoProductoSeleccionado,
            icon: app.memoriaEstandar[code + "_icon"] || iconoSeleccionado,
            updated: true
        });
    }
    
    actualizarLista();
    cerrarFormulario();
}

// --- LISTA AGRUPADA POR LOTE ---
function actualizarLista() {
    const div = document.getElementById('container-lotes');
    if (app.lotes.length === 0) { div.innerHTML = ""; return; }

    let htmlFinal = "";

    app.lotes.forEach((l, idxLote) => {
        const sumaParciales = l.listaParciales.reduce((a, b) => a + b, 0);
        const totalUnid = (l.com * l.est) + sumaParciales;

        htmlFinal += `
            <div class="lote-card" style="background:white; margin-bottom:10px; border-radius:8px; border:1px solid #ddd; overflow:hidden;">
                <div style="background:#2d2d2d; color:white; padding:10px; display:flex; justify-content:space-between;">
                    <span><i class="fas fa-file-alt"></i> <b>${l.id}</b> <small>(Est: ${fNum(l.est)})</small></span>
                    <i class="fas fa-trash" onclick="eliminarLote(${idxLote})" style="color:#f87171; cursor:pointer;"></i>
                </div>

                <div style="padding:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span style="font-size:14px;"><i class="fas fa-box" style="color:#d97706"></i> ארגזים מלאים (Cajas comp.):</span>
                        <input type="number" value="${l.com}" 
                               onchange="editCajas(${idxLote}, this.value)"
                               style="width:60px; border:1px solid #10b981; border-radius:5px; text-align:center; font-weight:bold; padding:5px;">
                    </div>

                    ${l.listaParciales.map((p, idxPar) => `
                        <div style="background:#fff7ed; border-top:1px dashed #fdba74; padding:6px 10px; display:flex; justify-content:space-between; font-size:13px;">
                            <span><i class="fas fa-box-open" style="color:#f59e0b"></i> Caja parcial:</span>
                            <span style="font-weight:bold;">
                                ${fNum(p)} Unid. 
                                <i class="fas fa-times" onclick="eliminarParcial(${idxLote}, ${idxPar})" style="color:red; margin-left:8px; cursor:pointer;"></i>
                            </span>
                        </div>
                    `).join('')}

                    <div style="border-top:1px solid #eee; margin-top:5px; padding-top:8px; display:flex; justify-content:space-between; align-items:center;">
                        <span style="color:#666; font-weight:bold;">Total Unid:</span>
                        <span style="font-size:20px; color:#10b981; font-weight:800;">${fNum(totalUnid)}</span>
                    </div>
                </div>
            </div>
        `;
    });

    div.innerHTML = htmlFinal;
}
// --- FUNCIONES AUXILIARES ---
function editCajas(idx, val) {
    app.lotes[idx].com = parseInt(val) || 0;
    actualizarLista();
}

function eliminarParcial(idxLote, idxPar) {
    if(confirm("¿Eliminar esta caja parcial?")) {
        app.lotes[idxLote].listaParciales.splice(idxPar, 1);
        actualizarLista();
    }
}

function eliminarLote(idx) {
    if(confirm("¿Eliminar TODO el lote?")) {
        app.lotes.splice(idx, 1);
        actualizarLista();
    }
}

function cerrarFormulario() {
    document.getElementById('form-scanner').classList.add('hidden');
    document.getElementById('overlay-scanner').classList.add('hidden');
}

function descargarCSV() {
    if (app.lotes.length === 0) return alert("No hay datos");
    const idPedido = document.getElementById('txt-pedido').innerText || "SIN_ID";
    let csv = "\uFEFFReporte Inventario\nPedido: " + idPedido + "\n\n";
    csv += "Lote,Tipo,Estandar,Cajas Completas,Unid. Parciales,Subtotal Unidades\n";
    
    app.lotes.forEach(l => {
        csv += `${l.id},${l.tipo},${l.est},${l.com},${l.par},${(l.com*l.est)+l.par}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Inventario_${idPedido}.csv`;
    link.click();
}