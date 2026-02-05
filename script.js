let app = { 
    modo: "", 
    lotes: [], 
    memoriaEstandar: {},    // Ahora por tipo: { "ארגז": 1000, "עלון": 50, ... }
    estandaresPorTipo: {},  // Nueva estructura para estándares por tipo
    tipoSeleccionado: null, // Tipo actualmente seleccionado
    ultimoCodigo: "" 
};

// Configuración de tipos disponibles
const TIPOS_PRODUCTO = [
    { id: 'fa-box', nombre: 'ארגז', value: 'ארגז' },
    { id: 'fa-file-alt', nombre: 'עלון', value: 'עלון' },
    { id: 'fa-tags', nombre: 'מדבקה', value: 'מדבקה' },
    { id: 'fa-shield-alt', nombre: 'T.E', value: 'T.E' },
    { id: 'fa-archive', nombre: 'קרטון', value: 'קרטון' },
    { id: 'fa-cube', nombre: 'חומר 1', value: 'חומר 1' },
    { id: 'fa-shapes', nombre: 'חומר 2', value: 'חומר 2' },
    { id: 'fa-folder', nombre: 'חומר 3', value: 'חומר 3' }
];

let iconoSeleccionado = "fa-box"; 
let tipoProductoSeleccionado = "ארגז";

// Auxiliar para formato
const fNum = (n) => new Intl.NumberFormat('es-ES').format(n || 0);

// --- INICIO ---
function iniciarApp(m) {
    const p = document.getElementById('inp-pedido').value;
    if(!p) return alert("Ingrese ID de pedido");
    app.modo = m;
    document.getElementById('txt-pedido').innerText = p.toUpperCase();
    document.getElementById('screen-intro').classList.add('hidden');
    document.getElementById('screen-main').classList.remove('hidden');
}

// --- CONFIGURACIÓN DE TIPO Y ESTÁNDAR ---
function selectIcon(el, iconName, tipoNombre) {
    // Quitar selección anterior
    document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('selected'));
    el.classList.add('selected');
    
    iconoSeleccionado = iconName;
    tipoProductoSeleccionado = tipoNombre;
    app.tipoSeleccionado = tipoNombre;
    
    // Verificar si este tipo ya tiene estándar configurado
    const estandarExistente = app.estandaresPorTipo[tipoNombre];
    
    // Mostrar configuración de estándar (siempre, para permitir corrección)
    mostrarConfiguracionEstandar(tipoNombre, estandarExistente);
}

function mostrarConfiguracionEstandar(tipoNombre, valorActual) {
    const fields = document.getElementById('dynamic-fields');
    const code = app.ultimoCodigo || "";
    
    const estaEditando = valorActual ? '(עריכה)' : '(חדש)';
    const tituloColor = valorActual ? '#fd7e14' : 'var(--s)';
    
    fields.innerHTML = `
        <div style="background:${valorActual ? '#fff3cd' : '#e7f3ff'}; padding:15px; border-radius:8px; margin-bottom:15px; text-align:center; border:2px solid ${tituloColor};">
            <i class="fas ${iconoSeleccionado} fa-2x" style="margin-bottom:8px; color:${tituloColor};"></i><br>
            <span style="font-size:16px; font-weight:bold; color:${tituloColor};">
                ${tipoNombre} ${estaEditando}
            </span><br>
            ${valorActual ? `<small style="color:#666;">ערך נוכחי: <b>${fNum(valorActual)}</b></small>` : ''}
        </div>
        
        <div style="background:#f8f9fa; padding:15px; border-radius:8px; margin-bottom:15px;">
            <label style="display:block; font-size:14px; color:#666; margin-bottom:8px; font-weight:bold;">
                הזן כמות סטנדרטית לסוג זה:
            </label>
            <input type="number" 
                   id="f-estandar-tipo" 
                   placeholder="לדוגמה: 1000" 
                   value="${valorActual || ''}"
                   style="width:100%; padding:14px; border:2px solid ${tituloColor}; border-radius:8px; font-size:20px; text-align:center;"
                   onkeypress="if(event.key==='Enter') guardarEstandarTipo()">
        </div>

        <button class="btn-action" 
                style="background:${tituloColor}; color:white; padding:18px; font-size:18px; font-weight:bold; border-radius:10px; margin-bottom:10px;" 
                onclick="guardarEstandarTipo()">
            <i class="fas fa-save"></i> 
            ${valorActual ? 'עדכן סטנדרט' : 'שמור סטנדרט'}
        </button>
        
        ${code ? `
        <button class="btn-action" style="background:#6c757d; color:white; padding:12px;" onclick="cancelarSeleccionTipo()">
            <i class="fas fa-times"></i> ביטול בחירה
        </button>
        ` : ''}
    `;
    
    setTimeout(() => {
        const input = document.getElementById('f-estandar-tipo');
        if(input) input.focus();
    }, 100);
}

function guardarEstandarTipo() {
    const val = parseInt(document.getElementById('f-estandar-tipo').value);
    if(!val || val <= 0) return alert("הזן כמות סטנדרטית תקינה");
    
    // Guardar estándar por tipo
    app.estandaresPorTipo[tipoProductoSeleccionado] = val;
    
    // Si hay un código escaneado pendiente, continuar al registro
    if(app.ultimoCodigo) {
        mostrarFormularioRegistro(app.ultimoCodigo);
    } else {
        // Solo guardamos el estándar, cerramos el formulario
        cerrarFormulario();
        alert(`סטנדרט נשמר: ${tipoProductoSeleccionado} = ${fNum(val)} יח'`);
    }
}

function cancelarSeleccionTipo() {
    // Limpiar selección
    document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('selected'));
    app.tipoSeleccionado = null;
    
    // Si venimos de escanear, cerrar todo
    if(app.ultimoCodigo) {
        cerrarEscaner();
    }
}

// --- ESCANEO ---
function activarEscaneo() {
    // Resetear selección de tipo al abrir escáner
    app.tipoSeleccionado = null;
    app.ultimoCodigo = "";
    
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
    
    // Verificar si ya hay un tipo seleccionado con estándar configurado
    if(app.tipoSeleccionado && app.estandaresPorTipo[app.tipoSeleccionado]) {
        // Ya tenemos tipo y estándar, ir directo al registro
        mostrarFormularioRegistro(code);
    } else {
        // Mostrar selector de tipos primero
        mostrarSelectorTipos(code);
    }
}

function mostrarSelectorTipos(code) {
    const fields = document.getElementById('dynamic-fields');
    
    // Generar opciones de tipos con indicador de estándar configurado
    const opcionesHTML = TIPOS_PRODUCTO.map(tipo => {
        const tieneEstandar = app.estandaresPorTipo[tipo.value];
        const indicador = tieneEstandar ? `<span style="color:#28a745; font-size:10px;">✓ ${fNum(tieneEstandar)}</span>` : '<span style="color:#999; font-size:10px;">חדש</span>';
        const estaSeleccionado = tipoProductoSeleccionado === tipo.value ? 'selected' : '';
        
        return `
            <div class="icon-option ${estaSeleccionado}" 
                 onclick="selectIcon(this, '${tipo.id}', '${tipo.value}')"
                 style="position:relative;">
                <i class="fas ${tipo.id}"></i>
                <span>${tipo.nombre}</span>
                ${indicador}
            </div>
        `;
    }).join('');
    
    fields.innerHTML = `
        <div style="background:#e7f3ff; padding:12px; border-radius:8px; margin-bottom:15px; text-align:center;">
            <span style="font-size:14px; color:#666;">בחר סוג מוצר:</span><br>
            <b style="font-size:18px; color:var(--dark);">${code}</b>
        </div>
        
        <label style="display:block; font-size:12px; color:#666; margin-bottom:10px;">
            💡 לחץ על סוג כדי לקבוע/לערוך את הכמות הסטנדרטית
        </label>
        
        <div class="icon-selector" style="margin-bottom:15px;">
            ${opcionesHTML}
        </div>
        
        <button class="btn-action" style="background:#dc3545; color:white; padding:15px;" onclick="cancelarEscaneo()">
            <i class="fas fa-times"></i> ביטול סריקה
        </button>
    `;
}

function mostrarFormularioRegistro(code) {
    const fields = document.getElementById('dynamic-fields');
    const est = app.estandaresPorTipo[tipoProductoSeleccionado];
    
    fields.innerHTML = `
        <div style="background:#e7f3ff; padding:15px; border-radius:8px; margin-bottom:15px; text-align:center;">
            <i class="fas ${iconoSeleccionado} fa-2x" style="margin-bottom:8px;"></i><br>
            <span style="font-size:16px; font-weight:bold;">${tipoProductoSeleccionado}</span><br>
            <span style="font-size:14px; color:#666;">סטנדרט: <b style="font-size:20px; color:var(--s);">${fNum(est)}</b></span>
        </div>
        
        <div style="background:#f8f9fa; padding:15px; border-radius:8px; margin-bottom:15px; border:2px solid #e9ecef;">
            <label style="display:block; font-size:13px; color:#666; margin-bottom:8px; font-weight:bold;">
                💡 השאר ריק לקופסה שלמה / הזן כמות לחלקי
            </label>
            <input type="number" 
                   id="f-input-cantidad" 
                   placeholder="כמות יחידות (ריק = קופסה שלמה)" 
                   style="width:100%; padding:14px; border:2px solid #ddd; border-radius:8px; font-size:18px; text-align:center; margin-bottom:10px;"
                   onkeypress="if(event.key==='Enter') procesarRegistro('${code}')">
            
            <div style="font-size:12px; color:#28a745; text-align:center; margin-top:5px;" id="preview-accion">
                יתווסף: +1 ארגז שלם (${est} יח')
            </div>
        </div>

        <button class="btn-action" 
                style="background:var(--p); color:white; padding:18px; font-size:18px; font-weight:bold; border-radius:10px; box-shadow:0 4px 15px rgba(40,167,69,0.4); display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:10px;" 
                onclick="procesarRegistro('${code}')">
            <i class="fas fa-plus-circle fa-lg"></i> 
            <span id="txt-btn-principal">הוסף ארגז שלם</span>
        </button>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <button class="btn-action" style="background:#6c757d; color:white; padding:12px; font-size:14px;" onclick="volverASeleccionTipo('${code}')">
                <i class="fas fa-arrow-left"></i> שנה סוג
            </button>
            <button class="btn-action" style="background:#dc3545; color:white; padding:12px; font-size:14px;" onclick="cancelarEscaneo()">
                <i class="fas fa-times"></i> ביטול
            </button>
        </div>
    `;
    
    // Configurar comportamiento dinámico
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
                    btnText.innerHTML = 'הוסף ארגז שלם';
                    preview.innerHTML = `+1 ארגז שלם (${est} יח')`;
                    preview.style.color = '#28a745';
                } else if (!isNaN(cantidad) && cantidad > 0) {
                    btnText.innerHTML = `הוסף חלקי (${cantidad} יח')`;
                    preview.innerHTML = `+${cantidad} יחידות (חלקי)`;
                    preview.style.color = '#fd7e14';
                }
            });
        }
    }, 100);
}

function volverASeleccionTipo(code) {
    // Volver a la pantalla de selección de tipo para cambiarlo o corregir estándar
    app.ultimoCodigo = code;
    mostrarSelectorTipos(code);
}

function cancelarEscaneo() {
    app.ultimoCodigo = "";
    app.tipoSeleccionado = null;
    cerrarEscaner();
}

function procesarRegistro(code) {
    const input = document.getElementById('f-input-cantidad');
    const valor = input ? input.value.trim() : '';
    const estandar = app.estandaresPorTipo[tipoProductoSeleccionado];
    
    if (!estandar) {
        alert("שגיאה: אין סטנדרט מוגדר לסוג זה");
        return;
    }
    
    if (valor === '' || valor === '0') {
        finalizarRegistro(code, 1, 0);
    } else {
        const cantidad = parseInt(valor);
        if (isNaN(cantidad) || cantidad <= 0) {
            alert("כמות לא חוקית");
            return;
        }
        finalizarRegistro(code, 0, cantidad);
    }
}

// --- REGISTRO ---
function finalizarRegistro(code, cNominal, pNominal) {
    const est = app.estandaresPorTipo[tipoProductoSeleccionado];
    
    if (!est) {
        alert("שגיאה: לא הוגדר סטנדרט לסוג " + tipoProductoSeleccionado);
        return;
    }

    let lote = app.lotes.find(l => l.id === code && l.tipo === tipoProductoSeleccionado);

    if (lote) {
        lote.com += cNominal;
        if (pNominal > 0) lote.listaParciales.push(pNominal);
        lote.updated = true;
    } else {
        app.lotes.unshift({
            id: code,
            est: est,  // El estándar viene del tipo
            com: cNominal,
            listaParciales: pNominal > 0 ? [pNominal] : [],
            tipo: tipoProductoSeleccionado,
            icon: iconoSeleccionado,
            updated: true
        });
    }
    
    actualizarLista();
    cerrarFormulario();
    
    // Resetear para siguiente escaneo
    app.ultimoCodigo = "";
}

// --- LISTA CON TOTALES POR TIPO ---
function actualizarLista() {
    const div = document.getElementById('container-lotes');
    if (app.lotes.length === 0) { 
        div.innerHTML = ""; 
        return; 
    }

    // Calcular totales por tipo
    const totalesPorTipo = {};
    
    app.lotes.forEach(l => {
        const sumaParciales = l.listaParciales.reduce((a, b) => a + b, 0);
        const totalUnidades = (l.com * l.est) + sumaParciales;
        
        if (!totalesPorTipo[l.tipo]) {
            totalesPorTipo[l.tipo] = {
                cantidadCajas: 0,
                unidades: 0,
                icon: l.icon,
                estandar: l.est
            };
        }
        totalesPorTipo[l.tipo].cantidadCajas += l.com + l.listaParciales.length;
        totalesPorTipo[l.tipo].unidades += totalUnidades;
    });

    // Generar HTML de resumen por tipo
    let resumenTiposHTML = '';
    const ordenTipos = ['ארגז', 'עלון', 'מדבקה', 'T.E', 'קרטון', 'חומר 1', 'חומר 2', 'חומר 3'];
    
    ordenTipos.forEach(tipo => {
        if (totalesPorTipo[tipo]) {
            const t = totalesPorTipo[tipo];
            resumenTiposHTML += `
                <div style="display:flex; align-items:center; gap:8px; padding:10px 12px; background:#f8f9fa; border-radius:6px; border-left:3px solid var(--s);">
                    <i class="fas ${t.icon}" style="color:var(--s);"></i>
                    <div style="flex:1;">
                        <div style="font-size:13px; font-weight:bold;">${tipo}</div>
                        <div style="font-size:11px; color:#666;">סטנדרט: ${fNum(t.estandar)}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:bold; color:var(--dark);">${fNum(t.unidades)} יח'</div>
                        <div style="font-size:11px; color:#666;">${t.cantidadCajas} פריטים</div>
                    </div>
                </div>
            `;
        }
    });

    // Generar lista de lotes
    let lotesHTML = "";
    app.lotes.forEach((l, idxLote) => {
        const sumaParciales = l.listaParciales.reduce((a, b) => a + b, 0);
        const totalUnid = (l.com * l.est) + sumaParciales;

        lotesHTML += `
            <div class="lote-card" style="background:white; margin-bottom:10px; border-radius:8px; border:1px solid #ddd; overflow:hidden;">
                <div style="background:#2d2d2d; color:white; padding:10px; display:flex; justify-content:space-between; align-items:center;">
                    <span>
                        <i class="fas ${l.icon}" style="margin-right:5px; color:#aaa;"></i>
                        <b>${l.id}</b> 
                        <small style="opacity:0.8;">(${l.tipo} | Est: ${fNum(l.est)})</small>
                    </span>
                    <i class="fas fa-trash" onclick="eliminarLote(${idxLote})" style="color:#f87171; cursor:pointer;"></i>
                </div>

                <div style="padding:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span style="font-size:14px;"><i class="fas fa-box" style="color:#d97706"></i> ארגזים מלאים:</span>
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
                        <span style="color:#666; font-weight:bold;">סה"כ יחידות:</span>
                        <span style="font-size:20px; color:#10b981; font-weight:800;">${fNum(totalUnid)}</span>
                    </div>
                </div>
            </div>
        `;
    });

    div.innerHTML = `
        <div style="margin-bottom:15px; background:white; padding:15px; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
            <h4 style="margin:0 0 12px 0; color:var(--dark); font-size:14px; border-bottom:2px solid var(--s); padding-bottom:8px;">
                📊 סיכום לפי סוג (Resumen por tipo)
            </h4>
            <div style="display:grid; grid-template-columns:1fr; gap:8px;">
                ${resumenTiposHTML}
            </div>
            <div style="margin-top:12px; padding-top:12px; border-top:2px solid #e9ecef; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:bold; color:var(--dark);">סה"כ כללי:</span>
                <span style="font-size:18px; font-weight:800; color:var(--s);">
                    ${Object.values(totalesPorTipo).reduce((a, b) => a + b.unidades, 0).toLocaleString()} יח'
                </span>
            </div>
        </div>
        ${lotesHTML}
    `;
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

function cerrarEscaner() {
    Quagga.stop();
    document.getElementById('overlay-scanner').classList.add('hidden');
    document.getElementById('form-scanner').classList.add('hidden');
}

function descargarCSV() {
    if (app.lotes.length === 0) return alert("No hay datos");
    const idPedido = document.getElementById('txt-pedido').innerText || "SIN_ID";
    
    // Calcular totales por tipo
    const totalesPorTipo = {};
    app.lotes.forEach(l => {
        const sumaParciales = l.listaParciales.reduce((a, b) => a + b, 0);
        const totalUnidades = (l.com * l.est) + sumaParciales;
        
        if (!totalesPorTipo[l.tipo]) {
            totalesPorTipo[l.tipo] = { unidades: 0, estandar: l.est };
        }
        totalesPorTipo[l.tipo].unidades += totalUnidades;
    });
    
    let csv = "\uFEFFReporte Inventario\n";
    csv += "Pedido: " + idPedido + "\n";
    csv += "Fecha: " + new Date().toLocaleString() + "\n\n";
    
    // Resumen por tipo
    csv += "RESUMEN POR TIPO:\n";
    csv += "Tipo,Estandar,Total Unidades\n";
    for (const [tipo, data] of Object.entries(totalesPorTipo)) {
        csv += `${tipo},${data.estandar},${data.unidades}\n`;
    }
    csv += "\n";
    
    // Detalle por lote
    csv += "DETALLE POR LOTE:\n";
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