let app = { modo: "", lotes: [], memoriaEstandar: {}, ultimoCodigo: "" };
let iconoSeleccionado = "fa-box"; // Icono por defecto
let tipoProductoSeleccionado = "Caja"; // Valor por defecto

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
    // Quitar clase selected de todos
    document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('selected'));
    // Agregar al seleccionado
    el.classList.add('selected');
    
    // Guardamos ambos valores
    iconoSeleccionado = iconName;
    tipoProductoSeleccionado = tipoNombre; // <--- Nuevo: Guardamos el nombre
}

// --- NAVEGACIÓN Y ESCANEO ---
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
                // Forzamos resolución HD para ver detalles de códigos pequeños
                width: { min: 1280 },
                height: { min: 720 },
                facingMode: "environment",
                aspectRatio: { min: 1, max: 2 }
            },
            // IMPORTANTE: Limitamos el área donde Quagga busca el código (solo en la mira)
            area: { top: "30%", right: "10%", left: "10%", bottom: "30%" }
        },
        // Localizador más agresivo para códigos difíciles
        locate: true,
        locator: {
            patchSize: "medium", // Tamaño de búsqueda mejorado
            halfSample: false    // No reducir la imagen a la mitad (mantiene calidad)
        },
        decoder: {
            readers: ["code_128_reader", "ean_reader"], 
            multiple: false
        },
        numOfWorkers: navigator.hardwareConcurrency || 4,
        frequency: 10 // Escaneos por segundo
    }, (err) => { 
        if (err) return alert("Error de cámara: " + err); 
        Quagga.start(); 
    });
}

Quagga.onDetected((res) => {
    app.ultimoCodigo = res.codeResult.code;
    const btn = document.getElementById('btn-confirm-capture');
    btn.innerHTML = `אישור אצווה: ${app.ultimoCodigo}`;
    btn.classList.remove('hidden');
});

function procesarCapturaManual() {
    Quagga.stop();
    mostrarFormulario(app.ultimoCodigo);
}

// --- FORMULARIO DINÁMICO ---
function mostrarFormulario(code) {
    document.getElementById('form-scanner').classList.remove('hidden');
    document.getElementById('txt-lote-det').innerText = "הצווה: " + code;
    const fields = document.getElementById('dynamic-fields');
    const est = app.memoriaEstandar[code] || "";

    const htmlIconos = `
        <label style="display:block; font-size:12px; color:#666; margin-top:10px;">סוג מוצר</label>
        <div class="icon-selector">
            <div class="icon-option selected" onclick="selectIcon(this, 'fa-box', 'ארגז')"><i class="fas fa-box"></i></div>
            <div class="icon-option" onclick="selectIcon(this, 'fa-file-alt', 'עלון')"><i class="fas fa-file-alt"></i></div>
            <div class="icon-option" onclick="selectIcon(this, 'fa-tags', 'מדבקה')"><i class="fas fa-tags"></i></div>
            <div class="icon-option" onclick="selectIcon(this, 'fa-shield-alt', 'T.E')"><i class="fas fa-shield-alt"></i></div>
            <div class="icon-option" onclick="selectIcon(this, 'fa-archive', 'קרטון')"><i class="fas fa-archive"></i></div>
            <div class="icon-option" onclick="selectIcon(this, 'fa-cube', 'חומר 1')"><i class="fas fa-cube"></i></div>
            <div class="icon-option" onclick="selectIcon(this, 'fa-shapes', 'חומר 2')"><i class="fas fa-shapes"></i></div>
            <div class="icon-option" onclick="selectIcon(this, 'fa-folder', 'חומר 3')"><i class="fas fa-folder"></i></div>
        </div>
    `;

    if(app.modo === 'rapido') {
        fields.innerHTML = `
            ${!est ? htmlIconos : ''}
            <label style="display:block; font-size:12px; color:#666; margin-top:10px;">כמות סטנדרטית</label>
            <input type="number" id="f-est" value="${est}" style="width:100%; padding:10px; margin-bottom:10px;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <div>
                    <label style="display:block; font-size:12px; color:#666;">ארגזים</label>
                    <input type="number" id="f-com" placeholder="0" style="width:100%; padding:10px;">
                </div>
                <div>
                    <label style="display:block; font-size:12px; color:#666;">חלקי</label>
                    <input type="number" id="f-par" placeholder="0" style="width:100%; padding:10px;">
                </div>
            </div>
            <button class="btn-action" style="background:var(--p); width:100%; color:white; padding:15px; border:none; border-radius:8px; margin-top:15px;" onclick="finalizarRegistro('${code}')">שמור הכל</button>
        `;
    } else {
        if(!est) {
            fields.innerHTML = `
                ${htmlIconos}
                <label>Cantidad estándar:</label>
                <input type="number" id="f-est" placeholder="Ej: 12" style="width:100%; padding:10px; margin-top:5px;">
                <button class="btn-action" style="background:var(--s); width:100%; color:white; padding:15px; border:none; border-radius:8px; margin-top:10px;" onclick="definirEst('${code}')">לְהַמשִׁיך</button>
            `;
        } else {
            const iconClass = app.memoriaEstandar[code + "_icon"] || "fa-box";
            fields.innerHTML = `
                <div style="background:#e7f3ff; padding:10px; border-radius:8px; margin-bottom:15px; text-align:center;">
                    <i class="fas ${iconClass} fa-2x"></i><br>
                    כמות סטנדרטית: <b>${est}</b>
                </div>
                <input type="number" id="f-par" placeholder="Unidades Parciales" style="width:100%; padding:10px; margin-bottom:15px; font-size:18px; text-align:center;">
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <button class="btn-action" style="background:var(--s); color:white; padding:15px; border:none; border-radius:8px;" onclick="finalizarRegistro('${code}', 1, 0)">חוסף ארגז</button>
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
    mostrarFormulario(code);
}

function finalizarRegistro(code, cNominal, pNominal) {
    const inputEst = document.getElementById('f-est');
    const est = app.memoriaEstandar[code] || (inputEst ? parseInt(inputEst.value) : 0);

    if(!est) return alert("עליך להגדיר כמות סטנדרטית");

    // Guardar estándar e icono si es nuevo
    if(!app.memoriaEstandar[code]) {
        app.memoriaEstandar[code] = est;
        app.memoriaEstandar[code + "_icon"] = iconoSeleccionado;
        app.memoriaEstandar[code + "_tipo"] = tipoProductoSeleccionado;
    }

    const icon = app.memoriaEstandar[code + "_icon"] || "fa-box";
    const tipo = app.memoriaEstandar[code + "_tipo"] || "Caja";
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
        app.lotes.unshift({ id: code, est: est, com: com, par: par, icon: icon, tipo: tipo, updated: false });
    }
    
    actualizarLista();
    cerrarEscaner();
}

// --- RENDERIZADO DE LISTA ---
function actualizarLista() {
    const div = document.getElementById('container-lotes');
    div.innerHTML = app.lotes.map((l, i) => {
        const totU = (l.com * l.est) + l.par;
        const totC = l.com + (l.par > 0 ? 1 : 0);
        return `
            <div class="lote-item ${l.updated ? 'updated' : ''}">
                <button onclick="מחק את זה(${i})" style="position:absolute; top:8px; right:8px; border:none; background:none; color:#dc3545; font-size:18px; cursor:pointer;">
                    <i class="fas fa-trash-alt"></i>
                </button>
                <i class="fas ${l.icon}" style="margin-right:8px; color:var(--s);"></i>
                <b>${l.id}</b> <span style="font-size:11px; color:#888;">(Est: ${l.est})</span>
                <div style="margin-top:8px; display:flex; align-items:center; gap:10px;">
                    <span style="font-size:13px;">ארגזים:</span>
                    <input type="number" class="input-edit" value="${l.com}" onchange="edit(${i},'com',this.value)">
                    <span style="font-size:13px;">חלקי:</span>
                    <input type="number" class="input-edit" value="${l.par}" onchange="edit(${i},'par',this.value)">
                </div>
                <div class="calc-res">
                    <span>כח''ה ארגזים: <b>${totC}</b></span>
                    <span>סח''ה יחידות: <b>${totU}</b></span>
                </div>
            </div>`;
    }).join('');
    // Limpiar flag de actualización después de renderizar
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
    if(confirm("למחוק את הרשומה הזו?")) {
        app.lotes.splice(idx, 1);
        actualizarLista();
    }
}

function cerrarEscaner() { Quagga.stop(); document.getElementById('overlay-scanner').classList.add('hidden'); }

function descargarCSV() {
    if(app.lotes.length === 0) return alert("No hay datos para exportar");

    // Encabezados claros para Excel
    let csv = "\uFEFFהזמנה;אצווה;סוג;סטנדרטי; ארגזים מלאים; יחידות חלקיות; סה''כ ארגזים (פיזיים); סה''כ יחידות\n";

    app.lotes.forEach(l => {
        const unidadesTotales = (l.com * l.est) + l.par;
        // totC: Cajas cerradas + 1 si hay sobrantes
        const totalCajasFisicas = l.com + (l.par > 0 ? 1 : 0);
        
        // Buscamos el nombre del tipo según el icono para que el CSV sea legible
        const tipoNombre = l.icon.replace('fa-', '').toUpperCase();

        csv += `${document.getElementById('txt-pedido').innerText};` +
               `${l.id};` +
               `${l.tipo};`+
               `${l.est};` +
               `${l.com};` +
               `${l.par};` +
               `${totalCajasFisicas};` + // Aquí incluimos totC
               `${unidadesTotales}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Carga_${document.getElementById('txt-pedido').innerText}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Intentar activar enfoque avanzado y Zoom si el hardware lo permite
Quagga.onStarted(() => {
    const track = Quagga.CameraAccess.getActiveTrack();
    if (track && typeof track.getCapabilities === 'function') {
        const caps = track.getCapabilities();
        const constraints = {};

        // Forzar enfoque continuo
        if (caps.focusMode && caps.focusMode.includes('continuous')) {
            constraints.focusMode = 'continuous';
        }
        
        // Aplicar cambios si existen
        if (Object.keys(constraints).length > 0) {
            track.applyConstraints({ advanced: [constraints] });
        }
    }
});