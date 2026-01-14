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
        fields.innerHTML = `
            <input type="number" id="f-est" value="${est}" placeholder="Estándar">
            <input type="number" id="f-com" placeholder="Cajas">
            <input type="number" id="f-par" placeholder="Parcial">
            <button class="btn-action" style="background:var(--p); width:100%; color:white; padding:10px;" onclick="finalizarRegistro('${code}')">GUARDAR</button>
        `;
    } else {
        // Lógica Dinámica
        if(!est) {
            fields.innerHTML = `<input type="number" id="f-est" placeholder="Definir Estándar">
                                <button onclick="definirEst('${code}')">OK</button>`;
        } else {
            fields.innerHTML = `<button class="btn-action" style="background:var(--s); width:100%; color:white; padding:10px;" onclick="finalizarRegistro('${code}', 1, 0)">+1 CAJA COMPLETA</button>`;
        }
    }
}

function definirEst(code) {
    app.memoriaEstandar[code] = parseInt(document.getElementById('f-est').value);
    mostrarFormulario(code);
}

function finalizarRegistro(code, cNominal, pNominal) {
    const est = app.memoriaEstandar[code] || parseInt(document.getElementById('f-est').value);
    const com = cNominal !== undefined ? cNominal : (parseInt(document.getElementById('f-com').value) || 0);
    const par = pNominal !== undefined ? pNominal : (parseInt(document.getElementById('f-par').value) || 0);

    app.memoriaEstandar[code] = est;
    const idx = app.lotes.findIndex(l => l.id === code);

    if (idx !== -1) {
        // ACUMULAR EN LOTE EXISTENTE
        app.lotes[idx].com += com;
        app.lotes[idx].par += par;
        // Ajustar si el parcial completa una caja
        if (app.lotes[idx].par >= est) {
            app.lotes[idx].com += Math.floor(app.lotes[idx].par / est);
            app.lotes[idx].par = app.lotes[idx].par % est;
        }
        app.lotes[idx].updated = true; // Flag para animación
    } else {
        // NUEVO REGISTRO
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