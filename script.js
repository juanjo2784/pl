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
        // MODO UNO A UNO
        if(!est) {
            fields.innerHTML = `
                ${htmlIconos}
                <label>כמות סטנדרטית:</label>
                <input type="number" id="f-est" placeholder="Ej: 12" style="width:100%; padding:10px;">
                <button class="btn-action" style="background:var(--s); width:100%; color:white; padding:15px; margin-top:10px;" onclick="definirEst('${code}')">המשך</button>
            `;
        } else {
            const iconClass = app.memoriaEstandar[code + "_icon"] || "fa-box";
            
            // 🆕 NUEVO DISEÑO UNIFICADO PARA UNO A UNO
            fields.innerHTML = `
                <div style="background:#e7f3ff; padding:15px; border-radius:8px; margin-bottom:15px; text-align:center;">
                    <i class="fas ${iconClass} fa-2x" style="margin-bottom:8px;"></i><br>
                    <span style="font-size:14px; color:#666;">סטנדרט:</span> 
                    <b style="font-size:20px; color:var(--s);">${fNum(est)}</b>
                </div>
                
                <div style="background:#f8f9fa; padding:15px; border-radius:8px; margin-bottom:15px; border:2px solid #e9ecef;">
                    <label style="display:block; font-size:13px; color:#666; margin-bottom:8px; font-weight:bold;">
                        💡 הוראה: השאר ריק לקופסה שלמה / הזן כמות לחלקי
                    </label>
                    <input type="number" 
                           id="f-input-cantidad" 
                           placeholder="כמות יחידות (ריק = קופסה שלמה)" 
                           style="width:100%; padding:14px; border:2px solid #ddd; border-radius:8px; font-size:18px; text-align:center; margin-bottom:10px;"
                           onkeypress="if(event.key==='Enter') procesarUnoAUno('${code}')">
                    
                    <div style="font-size:12px; color:#28a745; text-align:center; margin-top:5px;" id="preview-accion">
                        יתווסף: +1 ארגז שלם (${est} יח')
                    </div>
                </div>

                <button class="btn-action" 
                        style="background:var(--p); color:white; padding:18px; font-size:18px; font-weight:bold; border-radius:10px; box-shadow:0 4px 15px rgba(40,167,69,0.4); display:flex; align-items:center; justify-content:center; gap:10px;" 
                        onclick="procesarUnoAUno('${code}')">
                    <i class="fas fa-plus-circle fa-lg"></i> 
                    <span id="txt-btn-principal">הוסף ארגז שלם</span>
                </button>
                
                <button class="btn-action" style="background:#6c757d; color:white; padding:12px; margin-top:8px; font-size:14px;" onclick="cerrarEscaner()">
                    <i class="fas fa-times"></i> ביטול
                </button>
            `;
            
            // 🎯 Configurar comportamiento dinámico del input
            setTimeout(() => {
                const input = document.getElementById('f-input-cantidad');
                const btnText = document.getElementById('txt-btn-principal');
                const preview = document.getElementById('preview-accion');
                
                if(input) {
                    input.focus();
                    
                    input.addEventListener('input', function() {
                        const val = this.value.trim();
                        const cantidad = parseInt(val);
                        
                        if (val === '' || val === '0') {
                            // Vacío = Caja completa
                            btnText.innerHTML = 'הוסף ארגז שלם';
                            preview.innerHTML = `+1 ארגז שלם (${est} יח')`;
                            preview.style.color = '#28a745';
                        } else if (!isNaN(cantidad) && cantidad > 0) {
                            // Con valor = Parcial
                            btnText.innerHTML = `הוסף חלקי (${cantidad} יח')`;
                            preview.innerHTML = `+${cantidad} יחידות (חלקי)`;
                            preview.style.color = '#fd7e14'; // Naranja para parcial
                        } else {
                            btnText.innerHTML = 'הוסף';
                            preview.innerHTML = '';
                        }
                    });
                }
            }, 100);
        }
    }
}

// 🆕 NUEVA FUNCIÓN: Procesar modo uno a uno con botón único
function procesarUnoAUno(code) {
    const input = document.getElementById('f-input-cantidad');
    const valor = input.value.trim();
    const estandar = app.memoriaEstandar[code];
    
    if (valor === '' || valor === '0') {
        // CAJA COMPLETA
        finalizarRegistro(code, 1, 0);
    } else {
        // CAJA PARCIAL
        const cantidad = parseInt(valor);
        if (isNaN(cantidad) || cantidad <= 0) {
            alert("כמות לא חוקית");
            return;
        }
        finalizarRegistro(code, 0, cantidad);
        // Limpiar input para siguiente escaneo
        input.value = '';
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
    csv += "Lote,Tipo,Estandar,Cajas Completas,Parciales (lista),Total Parciales,Total Unidades\n";
    
    app.lotes.forEach(l => {
        const sumaParciales = l.listaParciales.reduce((a, b) => a + b, 0);
        const totalUnidades = (l.com * l.est) + sumaParciales;
        csv += `${l.id},${l.tipo},${l.est},${l.com},"${l.listaParciales.join('|')}",${sumaParciales},${totalUnidades}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Inventario_${idPedido}.csv`;
    link.click();
}