let app = { 
    modo: "", 
    lotes: [], 
    estandaresPorTipo: {},  // { "ארגז": 1000, "עלון": 50, ... }
    tipoSeleccionado: null,
    ultimoCodigo: "" 
};

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

// --- ESCANEO ---
function activarEscaneo() {
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

// --- FORMULARIO PRINCIPAL ---
function mostrarFormulario(code) {
    document.getElementById('form-scanner').classList.remove('hidden');
    document.getElementById('txt-lote-det').innerText = "אצווה: " + code;
    
    // Siempre mostrar selector de tipos primero
    mostrarSelectorTipos(code);
}

function mostrarSelectorTipos(code) {
    const fields = document.getElementById('dynamic-fields');
    
    // Generar opciones de tipos con indicador de estándar configurado
    const opcionesHTML = TIPOS_PRODUCTO.map(tipo => {
        const tieneEstandar = app.estandaresPorTipo[tipo.value];
        const indicador = tieneEstandar 
            ? `<span style="color:#28a745; font-size:10px; font-weight:bold;">✓ ${fNum(tieneEstandar)}</span>` 
            : '<span style="color:#dc3545; font-size:10px;">⚠ חסר</span>';
        
        return `
            <div class="icon-option" 
                 onclick="seleccionarTipoRapido('${tipo.id}', '${tipo.value}', ${!!tieneEstandar})"
                 style="position:relative; cursor:pointer;">
                <i class="fas ${tipo.id}"></i>
                <span style="font-size:11px;">${tipo.nombre}</span>
                ${indicador}
            </div>
        `;
    }).join('');
    
    fields.innerHTML = `
        <div style="background:#e7f3ff; padding:15px; border-radius:8px; margin-bottom:15px; text-align:center;">
            <span style="font-size:14px; color:#666;">בחר סוג מוצר:</span><br>
            <b style="font-size:20px; color:var(--dark); margin-top:5px; display:block;">${code}</b>
        </div>
        
        <label style="display:block; font-size:12px; color:#666; margin-bottom:10px; text-align:center;">
            💡 ירוק = סטנדרט מוגדר | אדום = נדרש הגדרה
        </label>
        
        <div class="icon-selector" style="margin-bottom:15px;">
            ${opcionesHTML}
        </div>
        
        <button class="btn-action" style="background:#dc3545; color:white; padding:15px; font-size:16px;" onclick="cancelarEscaneo()">
            <i class="fas fa-times"></i> ביטול סריקה
        </button>
    `;
}

// 🆕 SELECCIÓN RÁPIDA: Si tiene estándar, va directo; si no, pide configurarlo
function seleccionarTipoRapido(iconName, tipoNombre, tieneEstandar) {
    iconoSeleccionado = iconName;
    tipoProductoSeleccionado = tipoNombre;
    app.tipoSeleccionado = tipoNombre;
    
    if (tieneEstandar) {
        // Tiene estándar → Ir directo al registro
        mostrarFormularioRegistro(app.ultimoCodigo);
    } else {
        // No tiene estándar → Pedir configuración
        mostrarConfiguracionEstandar(tipoNombre, null);
    }
}

// --- CONFIGURACIÓN DE ESTÁNDAR (solo cuando no existe o se edita desde totales) ---
function mostrarConfiguracionEstandar(tipoNombre, valorActual, esDesdeTotales = false) {
    const fields = document.getElementById('dynamic-fields');
    const estaEditando = valorActual !== null && valorActual !== undefined;
    const tituloColor = estaEditando ? '#fd7e14' : '#dc3545';
    
    fields.innerHTML = `
        <div style="background:${estaEditando ? '#fff3cd' : '#f8d7da'}; padding:20px; border-radius:10px; margin-bottom:15px; text-align:center; border:3px solid ${tituloColor};">
            <i class="fas ${iconoSeleccionado} fa-3x" style="margin-bottom:10px; color:${tituloColor};"></i><br>
            <span style="font-size:18px; font-weight:bold; color:${tituloColor}; display:block; margin-bottom:5px;">
                ${tipoNombre}
            </span>
            <span style="font-size:14px; color:#666;">
                ${estaEditando ? 'עריכת כמות סטנדרטית' : 'הגדרת כמות סטנדרטית חדשה'}
            </span>
        </div>
        
        <div style="background:#f8f9fa; padding:20px; border-radius:8px; margin-bottom:15px;">
            <label style="display:block; font-size:16px; color:#333; margin-bottom:10px; font-weight:bold;">
                הזן כמות סטנדרטית:
            </label>
            <input type="number" 
                   id="f-estandar-tipo" 
                   placeholder="לדוגמה: 1000" 
                   value="${valorActual || ''}"
                   style="width:100%; padding:16px; border:3px solid ${tituloColor}; border-radius:8px; font-size:24px; text-align:center;"
                   onkeypress="if(event.key==='Enter') guardarEstandarTipo(${esDesdeTotales})">
        </div>

        <button class="btn-action" 
                style="background:${tituloColor}; color:white; padding:18px; font-size:18px; font-weight:bold; border-radius:10px; margin-bottom:10px;" 
                onclick="guardarEstandarTipo(${esDesdeTotales})">
            <i class="fas fa-save"></i> 
            ${estaEditando ? 'עדכן סטנדרט' : 'שמור סטנדרט'}
        </button>
        
        ${!esDesdeTotales ? `
        <button class="btn-action" style="background:#6c757d; color:white; padding:15px;" onclick="volverASelectorTipos()">
            <i class="fas fa-arrow-left"></i> חזרה לבחירת סוג
        </button>
        ` : `
        <button class="btn-action" style="background:#6c757d; color:white; padding:15px;" onclick="cerrarFormulario(); actualizarLista();">
            <i class="fas fa-times"></i> ביטול
        </button>
        `}
    `;
    
    setTimeout(() => {
        const input = document.getElementById('f-estandar-tipo');
        if(input) {
            input.focus();
            input.select();
        }
    }, 100);
}

function guardarEstandarTipo(esDesdeTotales = false) {
    const val = parseInt(document.getElementById('f-estandar-tipo').value);
    if(!val || val <= 0) return alert("הזן כמות סטנדרטית תקינה (גדולה מ-0)");
    
    // Guardar estándar por tipo
    app.estandaresPorTipo[tipoProductoSeleccionado] = val;
    
    if (esDesdeTotales) {
        // Vino desde el botón de editar en totales → cerrar y actualizar lista
        cerrarFormulario();
        actualizarLista();
        // Resetear selección
        app.tipoSeleccionado = null;
    } else {
        // Vino desde escaneo → continuar al registro
        mostrarFormularioRegistro(app.ultimoCodigo);
    }
}

function volverASelectorTipos() {
    mostrarSelectorTipos(app.ultimoCodigo);
}

function cancelarEscaneo() {
    app.ultimoCodigo = "";
    app.tipoSeleccionado = null;
    cerrarEscaner();
}

// --- FORMULARIO DE REGISTRO ---
function mostrarFormularioRegistro(code) {
    const fields = document.getElementById('dynamic-fields');
    const est = app.estandaresPorTipo[tipoProductoSeleccionado];
    
    fields.innerHTML = `
        <div style="background:#d4edda; padding:15px; border-radius:8px; margin-bottom:15px; text-align:center; border:2px solid #28a745;">
            <i class="fas ${iconoSeleccionado} fa-2x" style="margin-bottom:8px; color:#28a745;"></i><br>
            <span style="font-size:16px; font-weight:bold; color:#155724;">${tipoProductoSeleccionado}</span><br>
            <span style="font-size:14px; color:#155724;">סטנדרט: <b style="font-size:22px;">${fNum(est)}</b></span>
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
            
            <div style="font-size:13px; color:#28a745; text-align:center; margin-top:5px; font-weight:bold;" id="preview-accion">
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
            <button class="btn-action" style="background:#6c757d; color:white; padding:12px; font-size:14px;" onclick="volverASelectorTipos()">
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
            est: est,
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
    app.tipoSeleccionado = null;
}

// --- LISTA CON TOTALES POR TIPO Y BOTÓN DE EDITAR ---
function actualizarLista() {
    const div = document.getElementById('container-lotes');
    if (app.lotes.length === 0) { 
        div.innerHTML = ""; 
        return; 
    }

    // Agrupar lotes por tipo
    const lotesPorTipo = {};
    
    app.lotes.forEach(l => {
        if (!lotesPorTipo[l.tipo]) {
            lotesPorTipo[l.tipo] = {
                lotes: [],
                estandar: l.est,
                icon: l.icon
            };
        }
        lotesPorTipo[l.tipo].lotes.push(l);
    });

    const ordenTipos = ['ארגז', 'עלון', 'מדבקה', 'T.E', 'קרטון', 'חומר 1', 'חומר 2', 'חומר 3'];
    
    let html = '';

    ordenTipos.forEach(tipo => {
        if (!lotesPorTipo[tipo]) return;
        
        const tipoData = lotesPorTipo[tipo];
        const tipoInfo = TIPOS_PRODUCTO.find(tp => tp.value === tipo);
        const iconoTipo = tipoInfo ? tipoInfo.id : 'fa-box';
        
        // Calcular total del tipo
        let totalTipoUnidades = 0;
        tipoData.lotes.forEach(l => {
            const sumaParciales = l.listaParciales.reduce((a, b) => a + b, 0);
            totalTipoUnidades += (l.com * l.est) + sumaParciales;
        });

        html += `
            <div class="tipo-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 12px; margin-bottom: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fas ${iconoTipo} fa-lg"></i>
                        <div>
                            <div style="font-size: 18px; font-weight: bold;">${tipo}</div>
                            <div style="font-size: 13px; opacity: 0.9;">סטנדרט: ${fNum(tipoData.estandar)} יח'/יח'</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 22px; font-weight: bold;">${fNum(totalTipoUnidades)} יח'</div>
                        <button onclick="editarEstandarDesdeTotales('${tipo}', '${iconoTipo}')" 
                                style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.5); 
                                       color: white; padding: 5px 12px; border-radius: 15px; font-size: 12px; 
                                       cursor: pointer; margin-top: 5px;">
                            <i class="fas fa-edit"></i> ערוך סטנדרט
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="tipo-lotes" style="margin-bottom: 20px; padding: 0 5px;">
        `;

        // Lotos de este tipo
        tipoData.lotes.forEach((l) => {
            const idxReal = app.lotes.findIndex(item => item === l);
            const sumaParciales = l.listaParciales.reduce((a, b) => a + b, 0);
            const totalUnid = (l.com * l.est) + sumaParciales;
            // 🆕 CORRECCIÓN: Contar cajas completas + cada parcial como 1 caja
            const totalCajas = l.com + l.listaParciales.length;

            html += `
                <div class="lote-card" style="background: white; border-radius: 10px; margin-bottom: 12px; 
                                              box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; 
                                              border-left: 4px solid var(--s);">
                    
                    <!-- Línea 1: Número de lote -->
                    <div style="background: #f8f9fa; padding: 12px 15px; border-bottom: 1px solid #e9ecef; 
                                display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 16px; font-weight: bold; color: #2d3748;">
                            <i class="fas fa-barcode" style="color: var(--s); margin-left: 8px;"></i>
                            ${l.id}
                        </span>
                        <button onclick="eliminarLote(${idxReal})" 
                                style="background: #fee; color: #e53e3e; border: none; padding: 8px 12px; 
                                       border-radius: 6px; cursor: pointer; font-size: 13px;">
                            <i class="fas fa-trash"></i> מחק
                        </button>
                    </div>
                    
                    <!-- Línea 2: Total unidades y total cajas -->
                    <div style="padding: 12px 15px; background: white; 
                                display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span style="font-size: 13px; color: #666;">סה"כ יחידות:</span>
                            <span style="font-size: 20px; font-weight: bold; color: #28a745; margin-right: 5px;">
                                ${fNum(totalUnid)}
                            </span>
                        </div>
                        <div style="background: #e6fffa; padding: 6px 12px; border-radius: 15px;">
                            <span style="font-size: 13px; color: #319795;">
                                <i class="fas fa-boxes"></i> ${totalCajas} ארגזים
                            </span>
                        </div>
                    </div>
                    
                    <!-- Línea 3: Cajas completas (editable) -->
                    <div style="padding: 12px 15px; border-top: 1px dashed #e2e8f0; 
                                display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 14px; color: #4a5568; min-width: 100px;">
                            <i class="fas fa-box" style="color: #d69e2e;"></i> ארגזים שלמים:
                        </span>
                        <input type="number" 
                               value="${l.com}" 
                               onchange="editCajas(${idxReal}, this.value)"
                               style="width: 80px; padding: 10px; border: 2px solid #38a169; 
                                      border-radius: 8px; text-align: center; font-size: 16px; 
                                      font-weight: bold; color: #2d3748;">
                        <span style="font-size: 12px; color: #999;">× ${fNum(l.est)} = ${fNum(l.com * l.est)} יח'</span>
                    </div>
                    
                    <!-- Líneas 4+: Cajas parciales -->
                    ${l.listaParciales.map((p, idxPar) => `
                        <div style="padding: 10px 15px; border-top: 1px solid #f7fafc; 
                                    background: #fffaf0; display: flex; justify-content: space-between; 
                                    align-items: center;">
                            <span style="font-size: 13px; color: #c05621;">
                                <i class="fas fa-box-open" style="margin-left: 5px;"></i>
                                קופסה חלקית:
                            </span>
                            <div>
                                <span style="font-weight: bold; color: #c05621;">${fNum(p)} יחידות</span>
                                <button onclick="eliminarParcial(${idxReal}, ${idxPar})" 
                                        style="background: none; border: none; color: #e53e3e; 
                                               margin-right: 10px; cursor: pointer; font-size: 14px;">
                                    <i class="fas fa-times-circle"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                    
                </div>
            `;
        });

        html += `</div>`;
    });

    // Total general - 🆕 MOVIDO FUERA DEL CONTENEDOR SCROLL O CON MARGEN SUFICIENTE
    const totalGeneral = app.lotes.reduce((sum, l) => {
        const parciales = l.listaParciales.reduce((a, b) => a + b, 0);
        return sum + (l.com * l.est) + parciales;
    }, 0);

    html += `
        <div style="background: #2d3748; color: white; padding: 20px; border-radius: 12px; 
                    margin: 20px 0 100px 0; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
            <div style="font-size: 14px; opacity: 0.8; margin-bottom: 5px;">סה"כ כללי בהזמנה</div>
            <div style="font-size: 32px; font-weight: bold; color: #48bb78;">${fNum(totalGeneral)} יח'</div>
        </div>
    `;

    div.innerHTML = html;
}

// 🆕 NUEVA FUNCIÓN: Editar estándar desde la sección de totales
function editarEstandarDesdeTotales(tipoNombre, iconoTipo) {
    const valorActual = app.estandaresPorTipo[tipoNombre];
    
    // Configurar variables globales
    tipoProductoSeleccionado = tipoNombre;
    iconoSeleccionado = iconoTipo;
    app.tipoSeleccionado = tipoNombre;
    
    // Abrir el overlay del scanner para usar el mismo formulario
    document.getElementById('overlay-scanner').classList.remove('hidden');
    document.getElementById('txt-lote-det').innerText = "עריכת סטנדרט: " + tipoNombre;
    
    // Mostrar configuración de estándar
    mostrarConfiguracionEstandar(tipoNombre, valorActual, true);
}

// --- FUNCIONES AUXILIARES ---
function editCajas(idx, val) {
    const nuevaCantidad = parseInt(val) || 0;
    if (nuevaCantidad < 0) return;
    
    app.lotes[idx].com = nuevaCantidad;
    actualizarLista();
}

function eliminarParcial(idxLote, idxPar) {
    if(confirm("האם למחוק קופסה חלקית זו?")) {
        app.lotes[idxLote].listaParciales.splice(idxPar, 1);
        actualizarLista();
    }
}

function eliminarLote(idx) {
    if(confirm("האם למחוק את כל האצווה?")) {
        app.lotes.splice(idx, 1);
        actualizarLista();
    }
}

function editarEstandarDesdeTotales(tipoNombre, iconoTipo) {
    const valorActual = app.estandaresPorTipo[tipoNombre];
    
    tipoProductoSeleccionado = tipoNombre;
    iconoSeleccionado = iconoTipo;
    app.tipoSeleccionado = tipoNombre;
    
    document.getElementById('overlay-scanner').classList.remove('hidden');
    document.getElementById('txt-lote-det').innerText = "עריכת סטנדרט: " + tipoNombre;
    
    mostrarConfiguracionEstandar(tipoNombre, valorActual, true);
}
function cerrarFormulario() {
    document.getElementById('form-scanner').classList.add('hidden');
    document.getElementById('overlay-scanner').classList.add('hidden');
}

function cerrarEscaner() {
    try {
        Quagga.stop();
    } catch(e) {}
    document.getElementById('overlay-scanner').classList.add('hidden');
    document.getElementById('form-scanner').classList.add('hidden');
    app.ultimoCodigo = "";
    app.tipoSeleccionado = null;
}

function descargarCSV() {
    if (app.lotes.length === 0) return alert("No hay datos");
    const idPedido = document.getElementById('txt-pedido').innerText || "SIN_ID";
    
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
    
    csv += "RESUMEN POR TIPO:\n";
    csv += "Tipo,Estandar,Total Unidades\n";
    for (const [tipo, data] of Object.entries(totalesPorTipo)) {
        csv += `${tipo},${data.estandar},${data.unidades}\n`;
    }
    csv += "\n";
    
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