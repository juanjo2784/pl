let app = { modo: "", lotes: [], memoriaEstandar: {}, ultimoCodigo: "" };

function iniciarApp(m) {
    const p = document.getElementById('inp-pedido').value;
    if(!p) return;
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
        inputStream: { name: "Live", type: "LiveStream", target: document.querySelector('#interactive'), 
        constraints: { facingMode: "environment" } },
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

function mostrarFormulario(code) {
    document.getElementById('form-scanner').classList.remove('hidden');
    document.getElementById('txt-lote-det').innerText = "Lote: " + code;
    const fields = document.getElementById('dynamic-fields');
    const est = app.memoriaEstandar[code] || "";

    if(app.modo === 'rapido') {
        // MODO RÁPIDO: Pide todo de una vez
        fields.innerHTML = `
            <label style="display:block; font-size:12px; color:#666; margin-top:10px;">ESTÁNDAR</label>
            <input type="number" id="f-est" value="${est}" style="width:100%; padding:10px; margin-bottom:10px;">
            <label style="display:block; font-size:12px; color:#666;">CAJAS COMPLETAS</label>
            <input type="number" id="f-com" placeholder="0" style="width:100%; padding:10px; margin-bottom:10px;">
            <label style="display:block; font-size:12px; color:#666;">UNIDADES PARCIALES</label>
            <input type="number" id="f-par" placeholder="0" style="width:100%; padding:10px; margin-bottom:10px;">
            <button class="btn-action" style="background:var(--p); width:100%; color:white; padding:15px; border:none; border-radius:8px;" onclick="finalizarRegistro('${code}')">GUARDAR TODO</button>
        `;
    } else {
        // MODO UNO A UNO (DINÁMICO)
        if(!est) {
            fields.innerHTML = `
                <label>Define el estándar para este nuevo lote:</label>
                <input type="number" id="f-est" placeholder="Ej: 12" style="width:100%; padding:10px; margin-top:10px;">
                <button class="btn-action" style="background:var(--s); width:100%; color:white; padding:15px; border:none; border-radius:8px; margin-top:10px;" onclick="definirEst('${code}')">CONTINUAR</button>
            `;
        } else {
            fields.innerHTML = `
                <div style="background:#e7f3ff; padding:10px; border-radius:8px; margin-bottom:15px; font-size:14px;">
                    Lote con estándar: <b>${est}</b>
                </div>
                <label style="display:block; font-size:12px; color:#666;">¿AGREGAR UNIDADES PARCIALES?</label>
                <input type="number" id="f-par" placeholder="0" style="width:100%; padding:10px; margin-bottom:15px; font-size:18px; text-align:center;">
                
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <button class="btn-action" style="background:var(--s); color:white; padding:15px; border:none; border-radius:8px;" onclick="finalizarRegistro('${code}', 1, 0)">+1 CAJA<br>COMPLETA</button>
                    <button class="btn-action" style="background:var(--p); color:white; padding:15px; border:none; border-radius:8px;" onclick="finalizarRegistro('${code}', 0, undefined)">SUMAR<br>PARCIAL</button>
                </div>
            `;
        }
    }
}

function definirEst(code) {
    app.memoriaEstandar[code] = parseInt(document.getElementById('f-est').value);
    mostrarFormulario(code);
}

function finalizarRegistro(code, cNominal, pNominal) {
    const est = app.memoriaEstandar[code];
    
    // Si pNominal es undefined, significa que viene del botón "Sumar Parcial" y debe leer el input
    let com = cNominal !== undefined ? cNominal : 0;
    let par = pNominal !== undefined ? pNominal : (parseInt(document.getElementById('f-par').value) || 0);

    if (par >= est) {
        alert("Error: El parcial (" + par + ") no puede ser mayor o igual al estándar (" + est + ")");
        return;
    }

    const idx = app.lotes.findIndex(l => l.id === code);

    if (idx !== -1) {
        // ACUMULAR
        app.lotes[idx].com += com;
        app.lotes[idx].par += par;

        // Si la suma de parciales completa una caja nueva
        if (app.lotes[idx].par >= est) {
            app.lotes[idx].com += Math.floor(app.lotes[idx].par / est);
            app.lotes[idx].par = app.lotes[idx].par % est;
        }
        app.lotes[idx].updated = true;
    } else {
        // NUEVO
        app.lotes.unshift({ id: code, est, com, par, updated: false });
    }

    actualizarLista();
    cerrarEscaner();
}

function actualizarLista() {
    const div = document.getElementById('container-lotes');
    div.innerHTML = app.lotes.map((l, i) => {
        const totU = (l.com * l.est) + l.par;
        const totC = l.com + (l.par > 0 ? 1 : 0);
        const animClass = l.updated ? 'updated' : '';
        l.updated = false; // Reset flag
        return `
            <div class="lote-item ${animClass}">
                <b>${l.id}</b> <small>(Est: ${l.est})</small>
                <div style="margin-top:5px;">
                    Cjs: <input type="number" class="input-edit" value="${l.com}" onchange="edit(${i},'com',this.value)">
                    Prc: <input type="number" class="input-edit" value="${l.par}" onchange="edit(${i},'par',this.value)">
                </div>
                <div class="calc-res">
                    <span>Cjs Totales: <b>${totC}</b></span>
                    <span>Unid Totales: <b>${totU}</b></span>
                </div>
            </div>`;
    }).join('');
}

function cerrarEscaner() { Quagga.stop(); document.getElementById('overlay-scanner').classList.add('hidden'); }