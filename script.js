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

// MODIFICACIÓN: Función de registro inteligente
function registrarInteligente(code) {
    const input = document.getElementById('f-mixto');
    const valor = parseInt(input.value) || 0;

    if (valor === 0) {
        // Campo vacío = 1 caja completa
        finalizarRegistro(code, 1, 0);
    } else {
        // Campo con número = Caja parcial
        finalizarRegistro(code, 0, valor);
    }
}

// MODIFICACIÓN: Mostrar Formulario con Autofocus
function mostrarFormulario(code) {
    document.getElementById('form-scanner').classList.remove('hidden');
    document.getElementById('txt-lote-det').innerText = "אצווה: " + code;
    const fields = document.getElementById('dynamic-fields');
    const est = app.memoriaEstandar[code] || "";

    if(app.modo === 'rapido') {
        // ... (Tu código actual de modo rápido se mantiene)
    } else {
        if(!est) {
            // ... (Tu código actual de definir estándar se mantiene)
        } else {
            const iconClass = app.memoriaEstandar[code + "_icon"] || "fa-box";
            fields.innerHTML = `
                <div style="background:#e7f3ff; padding:10px; border-radius:8px; margin-bottom:15px; text-align:center;">
                    <i class="fas ${iconClass} fa-2x" style="color:var(--s)"></i><br>סטנדרט: <b>${fNum(est)}</b>
                </div>
                
                <label style="display:block; margin-bottom:5px; font-weight:bold; color:#444;">כמות (ריק = ארגז מלא):</label>
                <input type="number" id="f-mixto" placeholder="הכנס יחידות או השאר ריק" 
                       style="width:100%; padding:15px; margin-bottom:15px; font-size:22px; text-align:center; border:2px solid var(--p); border-radius:10px; box-sizing:border-box;">
                
                <button class="btn-action" style="background:var(--p); color:white; padding:18px; font-size:18px; border-radius:10px;" 
                        onclick="registrarInteligente('${code}')">
                    <i class="fas fa-check-circle"></i> אשר רישום (Confirmar)
                </button>
            `;
            
            // AUTO-FOCUS: Abre el teclado automáticamente
            setTimeout(() => {
                const inp = document.getElementById('f-mixto');
                inp.focus();
                inp.click(); // Algunos navegadores móviles requieren el click
            }, 300);
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