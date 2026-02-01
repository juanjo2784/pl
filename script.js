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

    // Guardamos cada entrada como un registro único para poder desglosarlo
    app.lotes.unshift({
        id: code,
        est: est,
        com: com,
        par: par,
        tipo: app.memoriaEstandar[code + "_tipo"] || tipoProductoSeleccionado,
        icon: app.memoriaEstandar[code + "_icon"] || iconoSeleccionado,
        updated: true,
        fecha: new Date().getTime() // Para mantener orden de escaneo
    });
    
    actualizarLista();
    cerrarFormulario();
}

// --- LISTA AGRUPADA POR LOTE ---
function actualizarLista() {
    const div = document.getElementById('container-lotes');
    if (app.lotes.length === 0) { div.innerHTML = ""; return; }

    // 1. Agrupar por ID de Lote
    const gruposPorLote = {};
    app.lotes.forEach((l, index) => {
        if (!gruposPorLote[l.id]) {
            gruposPorLote[l.id] = { 
                items: [], 
                totalUnid: 0, 
                est: l.est, 
                tipo: l.tipo, 
                icon: l.icon 
            };
        }
        gruposPorLote[l.id].items.push({ ...l, originalIndex: index });
        gruposPorLote[l.id].totalUnid += (l.com * l.est + l.par);
    });

    let htmlFinal = "";

    // 2. Generar el HTML basado en tu esquema
    for (const loteId in gruposPorLote) {
        const grupo = gruposPorLote[loteId];
        
        htmlFinal += `
            <div class="lote-card" style="background:white; margin-bottom:15px; border-radius:10px; box-shadow:0 2px 5px rgba(0,0,0,0.1); overflow:hidden;">
                <div style="background:#f1f5f9; padding:10px; border-bottom:2px solid #cbd5e1; display:flex; justify-content:space-between; align-items:center;">
                    <span><i class="fas ${grupo.icon}"></i> <b>${loteId}</b> <small>(Est: ${fNum(grupo.est)})</small></span>
                    <span style="color:var(--p); font-weight:bold;">Total: ${fNum(grupo.totalUnid)}</span>
                </div>
                
                <div class="lote-detalles" style="padding:5px;">
        `;

        grupo.items.forEach(item => {
            const esParcial = item.par > 0;
            const subtotal = (item.com * item.est) + item.par;
            
            htmlFinal += `
                <div style="display:flex; align-items:center; padding:8px; border-bottom:1px solid #eee; font-size:14px;">
                    <button onclick="eliminar(${item.originalIndex})" style="color:#ef4444; border:none; background:none; margin-left:10px;"><i class="fas fa-times"></i></button>
                    <span style="flex:1; text-align:right;">
                        ${item.com > 0 ? `<b>${item.com}</b> Cajas` : ''}
                        ${item.com > 0 && item.par > 0 ? ' + ' : ''}
                        ${item.par > 0 ? `<span style="color:#f59e0b;"><b>${item.par}</b> Unid. (Parcial)</span>` : ''}
                    </span>
                    <span style="width:70px; text-align:left; font-weight:600;">${fNum(subtotal)}</span>
                </div>
            `;
        });

        htmlFinal += `
                </div>
            </div>
        `;
    }

    div.innerHTML = htmlFinal;
    // Efecto visual de actualizado
    setTimeout(() => { app.lotes.forEach(l => l.updated = false); }, 1000);
}
// --- FUNCIONES AUXILIARES ---
function edit(idx, campo, val) {
    app.lotes[idx][campo] = parseInt(val) || 0;
    actualizarLista();
}

function eliminar(idx) {
    if(confirm("למחוק שורה זו?")) { app.lotes.splice(idx, 1); actualizarLista(); }
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