let app = { modo: "", lotes: [], memoriaEstandar: {}, ultimoCodigo: "" };
let iconoSeleccionado = "fa-box"; 
let tipoProductoSeleccionado = "ארגז"; // Default en Hebreo
let torchEnabled = false;

// --- INICIO ---
function iniciarApp(m) {
    const p = document.getElementById('inp-pedido').value;
    if(!p) return alert("Ingrese ID de pedido");
    app.modo = m;
    document.getElementById('txt-pedido').innerText = p.toUpperCase();
    document.getElementById('screen-intro').classList.add('hidden');
    document.getElementById('screen-main').classList.remove('hidden');
}

// --- LÓGICA DE ICONOS ---
function selectIcon(el, iconName, tipoNombre) {
    document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('selected'));
    el.classList.add('selected');
    iconoSeleccionado = iconName;
    tipoProductoSeleccionado = tipoNombre;
}

// --- ESCANEO HD Y FLEXIBLE ---
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
                facingMode: "environment",
                aspectRatio: { min: 1, max: 2 }
            },
            area: { top: "45%", right: "10%", left: "10%", bottom: "45%" }
        },
        locator: { patchSize: "large", halfSample: true },
        decoder: { readers: ["code_128_reader", "ean_reader"], multiple: false },
        locate: true,
        frequency: 15
    }, (err) => { 
        if (err) return alert("Error de cámara: " + err);
        Quagga.start(); 
    });
}

// --- DETECCIÓN Y VALIDACIÓN ---
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

// --- FORMULARIO ---
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
            <label style="display:block; font-size:12px; color:#666; margin-top:10px;">כמות סטנדרטית</label>
            <input type="number" id="f-est" value="${est}" style="width:100%; padding:10px; margin-bottom:10px;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <div><label>ארגזים</label><input type="number" id="f-com" placeholder="0" style="width:100%; padding:10px;"></div>
                <div><label>חלקי</label><input type="number" id="f-par" placeholder="0" style="width:100%; padding:10px;"></div>
            </div>
            <button class="btn-action" style="background:var(--p); width:100%; color:white; padding:15px; border:none; border-radius:8px; margin-top:15px;" onclick="finalizarRegistro('${code}')">שמור הכל</button>
        `;
    } else {
        if(!est) {
            fields.innerHTML = `
                ${htmlIconos}
                <label>כמות סטנדרטית:</label>
                <input type="number" id="f-est" placeholder="Ej: 12" style="width:100%; padding:10px; margin-top:5px;">
                <button class="btn-action" style="background:var(--s); width:100%; color:white; padding:15px; border:none; border-radius:8px; margin-top:10px;" onclick="definirEst('${code}')">המשך</button>
            `;
        } else {
            const iconClass = app.memoriaEstandar[code + "_icon"] || "fa-box";
            fields.innerHTML = `
                <div style="background:#e7f3ff; padding:10px; border-radius:8px; margin-bottom:15px; text-align:center;">
                    <i class="fas ${iconClass} fa-2x"></i><br>כמות סטנדרטית: <b>${est}</b>
                </div>
                <input type="number" id="f-par" placeholder="יחידות חלקיות" style="width:100%; padding:10px; margin-bottom:15px; font-size:18px; text-align:center;">
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <button class="btn-action" style="background:var(--s); color:white; padding:15px; border:none; border-radius:8px;" onclick="finalizarRegistro('${code}', 1, 0)">+1 ארגז</button>
                    <button class="btn-action" style="background:var(--p); color:white; padding:15px; border:none; border-radius:8px;" onclick="finalizarRegistro('${code}', 0, undefined)">חלקי</button>
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

function finalizarRegistro(code, cNominal, pNominal) {
    const inputEst = document.getElementById('f-est');
    const est = app.memoriaEstandar[code] || (inputEst ? parseInt(inputEst.value) : 0);
    if(!est) return alert("עליך להגדיר כמות סטנדרטית");

    if(!app.memoriaEstandar[code]) {
        app.memoriaEstandar[code] = est;
        app.memoriaEstandar[code + "_icon"] = iconoSeleccionado;
        app.memoriaEstandar[code + "_tipo"] = tipoProductoSeleccionado;
    }

    const icon = app.memoriaEstandar[code + "_icon"];
    const tipo = app.memoriaEstandar[code + "_tipo"];
    let com = cNominal !== undefined ? cNominal : (parseInt(document.getElementById('f-com')?.value) || 0);
    let par = pNominal !== undefined ? pNominal : (parseInt(document.getElementById('f-par')?.value) || 0);

    if (par >= est) return alert("חורג חלקית מהתקן");

    const idx = app.lotes.findIndex(l => l.id === code);
    if (idx !== -1) {
        app.lotes[idx].com += com;
        app.lotes[idx].par += par;
        if (app.lotes[idx].par >= est) {
            app.lotes[idx].com += Math.floor(app.lotes[idx].par / est);
            app.lotes[idx].par = app.lotes[idx].par % est;
        }
        app.lotes[idx].updated = true;
    } else {
        app.lotes.unshift({ id: code, est: est, com: com, par: par, icon: icon, tipo: tipo, updated: true });
    }
    actualizarLista();
    cerrarEscaner();
}

// --- LISTA Y EDICIÓN ---
function actualizarLista() {
    const div = document.getElementById('container-lotes');
    if (app.lotes.length === 0) {
        div.innerHTML = "";
        return;
    }

    // 1. Agrupar datos por tipo
    const grupos = {};
    app.lotes.forEach((l, index) => {
        if (!grupos[l.tipo]) {
            grupos[l.tipo] = { lotes: [], totalCajas: 0, totalUnid: 0, icon: l.icon };
        }
        grupos[l.tipo].lotes.push({ ...l, originalIndex: index });
        grupos[l.tipo].totalCajas += (l.com + (l.par > 0 ? 1 : 0));
        grupos[l.tipo].totalUnid += (l.com * l.est + l.par);
    });

    // 2. Generar el HTML
    let htmlFinal = "";

    for (const tipo in grupos) {
        const g = grupos[tipo];
        
        // Encabezado de grupo con Totales
        htmlFinal += `
            <div style="background:var(--dark); color:white; padding:8px 12px; border-radius:8px; margin-top:15px; display:flex; justify-content:space-between; align-items:center;">
                <span><i class="fas ${g.icon}"></i> <b>${tipo.toUpperCase()}</b></span>
                <span style="font-size:12px;">סכ''ה ארגזים: ${g.totalCajas} | סכ''ה יחידות: ${g.totalUnid}</span>
            </div>
        `;

        // Lotes pertenecientes a este grupo
        g.lotes.forEach(l => {
            const totU = (l.com * l.est) + l.par; // Subtotal de unidades de este lote
            const totC = l.com + (l.par > 0 ? 1 : 0); // Total de cajas (contando la parcial como una)
            
            htmlFinal += `
                <div class="lote-item ${l.updated ? 'updated' : ''}" style="margin-top:5px; border-left: 4px solid var(--s); padding: 10px; position: relative;">
                    <button onclick="eliminar(${l.originalIndex})" style="position:absolute; top:8px; right:8px; border:none; background:none; color:#dc3545;">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    
                    <div style="margin-bottom: 5px;">
                        <b>${l.id}</b> <span style="font-size:11px; color:#888;">(Est: ${l.est})</span>
                    </div>

                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-size:10px; color:#666;">Cajas</span>
                            <input type="number" class="input-edit" value="${l.com}" onchange="edit(${l.originalIndex},'com',this.value)">
                        </div>
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-size:10px; color:#666;">Parcial</span>
                            <input type="number" class="input-edit" value="${l.par}" onchange="edit(${l.originalIndex},'par',this.value)">
                        </div>
                        
                        <div style="margin-left: auto; text-align: right; background: #f8f9fa; padding: 5px 10px; border-radius: 5px; border: 1px solid #ddd;">
                            <div style="font-size: 9px; color: #888; text-transform: uppercase;">Subtotal</div>
                            <div style="font-size: 14px; font-weight: bold; color: var(--dark);">
                                ${totU} <span style="font-size: 10px; font-weight: normal;">unid.</span>
                            </div>
                        </div>
                    </div>
                </div>`;
        });


    }

    div.innerHTML = htmlFinal;
    app.lotes.forEach(l => l.updated = false);
}
function edit(idx, campo, val) {
    const v = parseInt(val) || 0;
    if(campo === 'par' && v >= app.lotes[idx].est) {
        alert("חורג חלקית מהתקן");
        actualizarLista();
        return;
    }
    app.lotes[idx][campo] = v;
    actualizarLista();
}

function eliminar(idx) {
    if(confirm("למחוק את הרשומה הזו?")) { app.lotes.splice(idx, 1); actualizarLista(); }
}

// --- UTILIDADES ---
function cerrarEscaner() { 
    Quagga.stop(); 
    torchEnabled = false;
    document.getElementById('overlay-scanner').classList.add('hidden'); 
}

function toggleTorch() {
    const track = Quagga.CameraAccess.getActiveTrack();
    if (track && typeof track.getCapabilities === 'function') {
        const caps = track.getCapabilities();
        if (caps.torch) {
            torchEnabled = !torchEnabled;
            track.applyConstraints({ advanced: [{ torch: torchEnabled }] });
            document.getElementById('btn-torch').style.color = torchEnabled ? "#ffc107" : "white";
        }
    }
}

function aplicarZoom(val) {
    const track = Quagga.CameraAccess.getActiveTrack();
    if (track && typeof track.getCapabilities === 'function' && track.getCapabilities().zoom) {
        track.applyConstraints({ advanced: [{ zoom: parseFloat(val) }] });
    }
}

function descargarCSV() {
    if (app.lotes.length === 0) return alert("אין נתונים לייצוא.");

    const idPedido = document.getElementById('txt-pedido').innerText || "SIN_ID";
    
    // 1. Cabecera y Detalle de Lotes
    let csv = "\uFEFFפרטי האצווה\n";
    csv += "הזמנה, אצווה, סוג, סטנדרטי, קופסאות, חלקי, סה''כ יחידות\n";

    // Objeto para calcular los totales por tipo mientras recorremos
    const resumen = {};

    app.lotes.forEach(l => {
        const totalU = (l.com * l.est) + l.par;
        const totalC = l.com + (l.par > 0 ? 1 : 0);
        const tipo = l.tipo || "ארגז";

        // Agregar fila de detalle
        csv += `${idPedido},${l.id},${tipo},${l.est},${l.com},${l.par},${totalU}\n`;

        // Acumular para el resumen
        if (!resumen[tipo]) {
            resumen[tipo] = { cjs: 0, unid: 0 };
        }
        resumen[tipo].cjs += totalC;
        resumen[tipo].unid += totalU;
    });

    // 2. Sección de Resumen por Tipo
    csv += "\n\nסיכום לפי סוג מוצר\n";
    csv += "סוג, סה''כ קופסאות, סה''כ יחידות\n";

    for (const tipo in resumen) {
        csv += `${tipo},${resumen[tipo].cjs},${resumen[tipo].unid}\n`;
    }

    // 3. Gran Total Final
    const granTotalCjs = Object.values(resumen).reduce((acc, curr) => acc + curr.cjs, 0);
    const granTotalUnid = Object.values(resumen).reduce((acc, curr) => acc + curr.unid, 0);
    
    csv += `\nTOTAL GENERAL,${granTotalCjs},${granTotalUnid}\n`;

    // Lógica de descarga
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `הזמנה_${idPedido}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}