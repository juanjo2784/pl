let app = { modo: "", lotes: [], memoriaEstandar: {}, ultimoCodigo: "" };

function iniciarApp(m) {
    const p = document.getElementById('inp-pedido').value;
    if(!p) return alert("Ingrese ID de pedido");
    app.modo = m;
    document.getElementById('txt-pedido').innerText = p.toUpperCase();
    document.getElementById('screen-intro').classList.add('hidden');
    document.getElementById('screen-main').classList.remove('hidden');
}

function activarEscaneo() {
    document.getElementById('overlay-scanner').classList.remove('hidden');
    document.getElementById('form-scanner').classList.add('hidden');
    document.getElementById('btn-confirm-capture').classList.add('hidden');
    
    Quagga.init({
        inputStream: { 
            name: "Live", 
            type: "LiveStream", 
            target: document.querySelector('#interactive'), 
            constraints: { facingMode: "environment" } 
        },
        decoder: { readers: ["code_128_reader", "ean_reader"] },
        locate: true
    }, (err) => { if (!err) Quagga.start(); });
}

Quagga.onDetected((res) => {
    app.ultimoCodigo = res.codeResult.code;
    const btn = document.getElementById('btn-confirm-capture');
    btn.innerHTML = `CONFIRMAR LOTE: ${app.ultimoCodigo}`;
    btn.classList.remove('hidden');
});

function procesarCapturaManual() {
    Quagga.stop();
    mostrarFormulario(app.ultimoCodigo);
}

// Variable global para el icono seleccionado temporalmente
let iconoSeleccionado = "fa-box"; 

function mostrarFormulario(code) {
    document.getElementById('form-scanner').classList.remove('hidden');
    document.getElementById('txt-lote-det').innerText = "Lote: " + code;
    const fields = document.getElementById('dynamic-fields');
    const est = app.memoriaEstandar[code] || "";

    if(!est) {
        // PRIMERA VEZ: Definir estándar e Icono
        fields.innerHTML = `
            <label>Tipo de producto:</label>
            <div class="icon-selector">
                <div class="icon-option selected" onclick="selectIcon(this, 'fa-box')" title="Caja"><i class="fas fa-box"></i></div>
                <div class="icon-option" onclick="selectIcon(this, 'fa-file-alt')" title="Folleto"><i class="fas fa-file-alt"></i></div>
                <div class="icon-option" onclick="selectIcon(this, 'fa-tags')" title="Etiqueta"><i class="fas fa-tags"></i></div>
                <div class="icon-option" onclick="selectIcon(this, 'fa-shield-alt')" title="Seguridad"><i class="fas fa-shield-alt"></i></div>
                <div class="icon-option" onclick="selectIcon(this, 'fa-archive')" title="Cartón"><i class="fas fa-archive"></i></div>
                <div class="icon-option" onclick="selectIcon(this, 'fa-cube')" title="Otro 1"><i class="fas fa-cube"></i></div>
                <div class="icon-option" onclick="selectIcon(this, 'fa-shapes')" title="Otro 2"><i class="fas fa-shapes"></i></div>
                <div class="icon-option" onclick="selectIcon(this, 'fa-folder')" title="Otro 3"><i class="fas fa-folder"></i></div>
            </div>
            <label>Cantidad estándar:</label>
            <input type="number" id="f-est" placeholder="Ej: 12" style="width:100%; padding:10px; margin-top:5px;">
            <button class="btn-action" style="background:var(--s); width:100%; color:white; padding:15px; border:none; border-radius:8px; margin-top:10px;" onclick="definirEst('${code}')">CONTINUAR</button>
        `;
    } else {
        // YA EXISTE: Flujo normal de suma
        const iconClass = app.lotes.find(l => l.id === code)?.icon || "fa-box";
        fields.innerHTML = `
            <div style="background:#e7f3ff; padding:10px; border-radius:8px; margin-bottom:15px; text-align:center;">
                <i class="fas ${iconClass} fa-2x"></i><br>
                Estándar: <b>${est}</b>
            </div>
            <input type="number" id="f-par" placeholder="Unidades Parciales" style="width:100%; padding:10px; margin-bottom:15px; font-size:18px; text-align:center;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <button class="btn-action" style="background:var(--s); color:white; padding:15px; border:none; border-radius:8px;" onclick="finalizarRegistro('${code}', 1, 0)">+1 CAJA</button>
                <button class="btn-action" style="background:var(--p); color:white; padding:15px; border:none; border-radius:8px;" onclick="finalizarRegistro('${code}', 0, undefined)">PARCIAL</button>
            </div>
        `;
    }
}

function selectIcon(el, iconName) {
    document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('selected'));
    el.classList.add('selected');
    iconoSeleccionado = iconName;
}

function definirEst(code) {
    const val = parseInt(document.getElementById('f-est').value);
    if(!val) return alert("Ingrese estándar");
    app.memoriaEstandar[code] = val;
    // Guardamos el icono en un objeto temporal vinculado al lote
    app.memoriaEstandar[code + "_icon"] = iconoSeleccionado;
    mostrarFormulario(code);
}

function definirEst(code) {
    const val = parseInt(document.getElementById('f-est').value);
    if(!val) return alert("Ingrese un estándar válido");
    app.memoriaEstandar[code] = val;
    mostrarFormulario(code);
}

// Modificación en finalizarRegistro para incluir el icono
function finalizarRegistro(code, cNominal, pNominal) {
    const est = app.memoriaEstandar[code];
    const icon = app.memoriaEstandar[code + "_icon"] || "fa-box";
    let com = cNominal !== undefined ? cNominal : (parseInt(document.getElementById('f-com')?.value) || 0);
    let par = pNominal !== undefined ? pNominal : (parseInt(document.getElementById('f-par')?.value) || 0);

    if (par >= est) return alert("Parcial excede estándar");

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
        app.lotes.unshift({ id: code, est: est, com: com, par: par, icon: icon, updated: false });
    }
    actualizarLista();
    cerrarEscaner();
}

function actualizarLista() {
    const div = document.getElementById('container-lotes');
    div.innerHTML = app.lotes.map((l, i) => {
        const totU = (l.com * l.est) + l.par;
        const totC = l.com + (l.par > 0 ? 1 : 0);
        return `
            <div class="lote-item ${l.updated ? 'updated' : ''}">
                <i class="fas ${l.icon} lote-type-icon"></i>
                <b>${l.id}</b> <small>(Est: ${l.est})</small>
                <div style="margin-top:5px;">
                    Cjs: <input type="number" class="input-edit" value="${l.com}" onchange="edit(${i},'com',this.value)">
                    Prc: <input type="number" class="input-edit" value="${l.par}" onchange="edit(${i},'par',this.value)">
                </div>
                <div class="calc-res">
                    <span>Cjs Tot: <b>${totC}</b></span>
                    <span>Unid Tot: <b>${totU}</b></span>
                </div>
            </div>`;
    }).join('');
}
// Funciones de soporte para la lista
function edit(idx, campo, val) {
    const v = parseInt(val) || 0;
    if(campo === 'par' && v >= app.lotes[idx].est) {
        alert("El parcial no puede superar el estándar");
        actualizarLista();
        return;
    }
    app.lotes[idx][campo] = v;
    actualizarLista();
}

function eliminar(idx) {
    if(confirm("¿Eliminar este registro?")) {
        app.lotes.splice(idx, 1);
        actualizarLista();
    }
}

function cerrarEscaner() { Quagga.stop(); document.getElementById('overlay-scanner').classList.add('hidden'); }

function descargarCSV() {
    if(app.lotes.length === 0) return alert("No hay datos");
    let csv = "\uFEFFPedido,Lote,Estándar,Cajas,Parcial,Total Unidades\n";
    app.lotes.forEach(l => {
        csv += `${document.getElementById('txt-pedido').innerText},${l.id},${l.est},${l.com},${l.par},${(l.com*l.est)+l.par}\n`;
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `Pedido_${document.getElementById('txt-pedido').innerText}.csv`;
    a.click();
}