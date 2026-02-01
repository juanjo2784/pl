let app = { 
    modo: "", 
    lotes: [], 
    memoriaEstandar: {}, 
    ultimoCodigo: "" 
};
let iconoSeleccionado = "fa-box"; 
let tipoProductoSeleccionado = "ארגז"; 
let torchEnabled = false;

// Auxiliar para formato de miles
const fNum = (n) => Number(n || 0).toLocaleString('es-ES');

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

// --- ESCANEO ---
function activarEscaneo() {
    document.getElementById('overlay-scanner').classList.remove('hidden');
    document.getElementById('form-scanner').classList.add('hidden');
    document.getElementById('btn-confirm-capture').classList.add('hidden');
    
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#interactive'),
            constraints: {
                width: { min: 1280 },
                height: { min: 720 },
                facingMode: "environment"
            },
            area: { top: "40%", right: "10%", left: "10%", bottom: "40%" }
        },
        decoder: { readers: ["code_128_reader", "ean_reader"] }
    }, (err) => { 
        if (err) return alert("Error de cámara: " + err);
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

// --- FORMULARIO CORREGIDO ---
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

// --- FINALIZAR REGISTRO CORREGIDO ---
function finalizarRegistro(code, cNominal, pNominal) {
    let est = app.memoriaEstandar[code];
    let com = 0;
    let par = 0;

    if (app.modo === 'rapido') {
        est = parseInt(document.getElementById('f-est').value);
        com = parseInt(document.getElementById('f-com').value) || 0;
        par = parseInt(document.getElementById('f-par').value) || 0;
        // Guardar memoria si es nuevo
        app.memoriaEstandar[code] = est;
    } else {
        com = cNominal || 0;
        par = pNominal || 0;
    }

    const idx = app.lotes.findIndex(l => l.id === code);

    if (idx !== -1) {
        if (app.lotes[idx].par > 0 && par > 0) {
            alert(`⚠️ התגלתה חריגה באצווה ${code}. היחידות יתווספו לסך הכל.`);
        }
        app.lotes[idx].com += com;
        app.lotes[idx].par += par;
        app.lotes[idx].updated = true;
        
        if (app.lotes[idx].par >= est) {
            const cajasExtras = Math.floor(app.lotes[idx].par / est);
            app.lotes[idx].com += cajasExtras;
            app.lotes[idx].par = app.lotes[idx].par % est;
        }
    } else {
        app.lotes.unshift({
            id: code,
            est: est,
            com: com,
            par: par,
            tipo: app.memoriaEstandar[code + "_tipo"] || tipoProductoSeleccionado,
            icon: app.memoriaEstandar[code + "_icon"] || iconoSeleccionado,
            updated: true
        });
    }
    actualizarLista();
    cerrarFormulario();
}

// --- LISTA ---
function actualizarLista() {
    const div = document.getElementById('container-lotes');
    if (app.lotes.length === 0) { div.innerHTML = ""; return; }

    const grupos = {};
    app.lotes.forEach((l, index) => {
        if (!grupos[l.tipo]) {
            grupos[l.tipo] = { lotes: [], totalCajas: 0, totalUnid: 0, icon: l.icon };
        }
        grupos[l.tipo].lotes.push({ ...l, originalIndex: index });
        grupos[l.tipo].totalCajas += (l.com + (l.par > 0 ? 1 : 0));
        grupos[l.tipo].totalUnid += (l.com * l.est + l.par);
    });

    let htmlFinal = "";
    for (const tipo in grupos) {
        const g = grupos[tipo];
        htmlFinal += `
            <div class="grupo-encabezado" style="background:var(--dark); color:white; padding:8px 12px; border-radius:8px; margin-top:15px; display:flex; justify-content:space-between;">
                <span><i class="fas ${g.icon}"></i> <b>${tipo}</b></span>
                <span style="font-size:12px;">ארגזים: ${fNum(g.totalCajas)} | יחידות: ${fNum(g.totalUnid)}</span>
            </div>
        `;

        g.lotes.forEach(l => {
            const totU = (l.com * l.est) + l.par;
            htmlFinal += `
                <div class="lote-item ${l.updated ? 'updated' : ''}" style="border-left:4px solid var(--s); padding:10px; background:white; margin-top:5px; position:relative;">
                    <button onclick="eliminar(${l.originalIndex})" style="position:absolute; right:10px; color:red; border:none; background:none;"><i class="fas fa-trash"></i></button>
                    <b>${l.id}</b> <small>(Est: ${fNum(l.est)})</small>
                    <div style="display:flex; gap:10px; margin-top:5px;">
                        <input type="number" class="input-edit" value="${l.com}" onchange="edit(${l.originalIndex},'com',this.value)">
                        <input type="number" class="input-edit" value="${l.par}" onchange="edit(${l.originalIndex},'par',this.value)">
                        <div style="margin-left:auto; text-align:right;">
                            <small>SUBTOTAL</small><br>
                            <b>${fNum(totU)}</b>
                        </div>
                    </div>
                </div>`;
        });
    }
    div.innerHTML = htmlFinal;
    div.scrollTop = 0; // Llevar arriba para ver el nuevo
    setTimeout(() => { app.lotes.forEach(l => l.updated = false); }, 1000);
}

function edit(idx, campo, val) {
    app.lotes[idx][campo] = parseInt(val) || 0;
    actualizarLista();
}

function eliminar(idx) {
    if(confirm("למחוק?")) { app.lotes.splice(idx, 1); actualizarLista(); }
}

function cerrarFormulario() {
    document.getElementById('form-scanner').classList.add('hidden');
    document.getElementById('overlay-scanner').classList.add('hidden');
}

function descargarCSV() {
    if (app.lotes.length === 0) return alert("אין נתונים.");
    const idPedido = document.getElementById('txt-pedido').innerText;
    let csv = "\uFEFFהזמנה: " + idPedido + "\n";
    csv += "אצווה,סוג,סטנדרט,קופסאות,חלקי,סה''כ\n";

    app.lotes.forEach(l => {
        const tot = (l.com * l.est) + l.par;
        csv += `${l.id},${l.tipo},${l.est},${l.com},${l.par},${tot}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Pedido_${idPedido}.csv`;
    link.click();
}