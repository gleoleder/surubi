/* ═══════════════════════════════════════════════════════════════════════════════
   TRANSPORTE SURUBÍ - Sistema de Pasajes
   script.js - Lógica principal con integración Google Sheets
   Elaborado por GLEO | 2025
   ═══════════════════════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════════════════════════
// ESTADO GLOBAL DE LA APLICACIÓN
// ═══════════════════════════════════════════════════════════════════════════════
const state = {
    isSignedIn: false,
    empresa: {},
    vehiculos: [],
    rutas: [],
    programacion: [],
    ventas: [],
    clientes: [],
    viajes: [],
    viaje: null,
    seats: [],
    occupied: [],
    occupiedInfo: {}, // Info de quién ocupó cada asiento { asiento: { nombre, nit } }
    client: null,
    boleto: null
};

// ═══════════════════════════════════════════════════════════════════════════════
// INICIALIZACIÓN DE GOOGLE API
// ═══════════════════════════════════════════════════════════════════════════════
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    try {
        await gapi.client.init({
            apiKey: CONFIG.API_KEY,
            discoveryDocs: [CONFIG.DISCOVERY_DOC],
        });
        console.log('✅ GAPI client inicializado');
        maybeEnableButtons();
    } catch (error) {
        console.error('❌ Error inicializando GAPI:', error);
        showAlert('error', 'Error de conexión', 'No se pudo conectar con Google');
    }
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CONFIG.CLIENT_ID,
        scope: CONFIG.SCOPES,
        callback: handleAuthCallback,
    });
    console.log('✅ GIS client inicializado');
    maybeEnableButtons();
}

let tokenClient;
let gapiInited = false;
let gisInited = false;

function maybeEnableButtons() {
    gapiInited = typeof gapi !== 'undefined' && gapi.client;
    gisInited = typeof tokenClient !== 'undefined';
    
    if (gapiInited && gisInited) {
        // Intentar autenticación automática
        handleAuthClick();
    }
}

function handleAuthClick() {
    if (!tokenClient) {
        showAlert('error', 'Error', 'Cliente de autenticación no inicializado');
        return;
    }
    
    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

function handleAuthCallback(response) {
    if (response.error) {
        console.error('❌ Error de autenticación:', response.error);
        showAlert('error', 'Error de autenticación', 'No se pudo iniciar sesión');
        return;
    }
    
    state.isSignedIn = true;
    updateConnectionStatus(true);
    showAlert('success', 'Conectado', 'Sistema conectado a Google Sheets');
    
    // Cargar todos los datos
    loadAllData();
}

function updateConnectionStatus(connected) {
    const badge = document.querySelector('.badge');
    const statusText = badge.querySelector('span');
    
    if (connected) {
        badge.classList.add('online');
        statusText.textContent = 'Conectado';
    } else {
        badge.classList.remove('online');
        statusText.textContent = 'Desconectado';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LECTURA DE GOOGLE SHEETS
// ═══════════════════════════════════════════════════════════════════════════════
async function readSheet(sheetName) {
    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: CONFIG.GOOGLE_SHEET_ID,
            range: `${sheetName}!A:Z`,
        });
        
        const values = response.result.values || [];
        if (values.length === 0) return [];
        
        const headers = values[0];
        const data = values.slice(1).map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index] || '';
            });
            return obj;
        });
        
        return data;
    } catch (error) {
        console.error(`❌ Error leyendo ${sheetName}:`, error);
        return [];
    }
}

async function appendRow(sheetName, values) {
    try {
        const response = await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: CONFIG.GOOGLE_SHEET_ID,
            range: `${sheetName}!A:Z`,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: { values: [values] }
        });
        return response.result;
    } catch (error) {
        console.error(`❌ Error escribiendo en ${sheetName}:`, error);
        throw error;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CARGA DE TODOS LOS DATOS
// ═══════════════════════════════════════════════════════════════════════════════
async function loadAllData() {
    showAlert('warning', 'Cargando...', 'Obteniendo datos del sistema');
    
    try {
        // Cargar todas las hojas en paralelo
        const [config, vehiculos, rutas, programacion, ventas, clientes] = await Promise.all([
            readSheet(CONFIG.SHEETS.CONFIG),
            readSheet(CONFIG.SHEETS.VEHICULOS),
            readSheet(CONFIG.SHEETS.RUTAS),
            readSheet(CONFIG.SHEETS.PROGRAMACION),
            readSheet(CONFIG.SHEETS.VENTAS),
            readSheet(CONFIG.SHEETS.CLIENTES)
        ]);
        
        // Procesar configuración de empresa
        state.empresa = {};
        config.forEach(row => {
            if (row.clave && row.valor) {
                state.empresa[row.clave] = row.valor;
            }
        });
        
        state.vehiculos = vehiculos;
        state.rutas = rutas;
        state.programacion = programacion;
        state.ventas = ventas;
        state.clientes = clientes;
        
        // Procesar viajes (unir programación con rutas y vehículos)
        processViajes();
        
        showAlert('success', 'Datos cargados', `${state.viajes.length} viajes disponibles`);
        
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
        showAlert('error', 'Error', 'No se pudieron cargar los datos');
    }
}

function processViajes() {
    state.viajes = state.programacion
        .filter(p => p.estado === 'ACTIVO')
        .map(p => {
            const ruta = state.rutas.find(r => r.id_ruta === p.id_ruta) || {};
            const vehiculo = state.vehiculos.find(v => v.id_vehiculo === p.id_vehiculo) || {};
            
            return {
                id: p.id_viaje,
                id_ruta: p.id_ruta,
                id_vehiculo: p.id_vehiculo,
                origen: ruta.origen || 'N/A',
                destino: ruta.destino || 'N/A',
                fecha: p.fecha,
                hora: p.hora_salida,
                precio: parseFloat(ruta.precio) || 0,
                placa: vehiculo.placa || 'N/A',
                conductor: p.conductor || 'N/A',
                estado: p.estado
            };
        })
        .filter(v => {
            // Filtrar viajes de hoy o futuros
            const viajeDate = new Date(v.fecha + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return viajeDate >= today;
        });
    
    renderViajes();
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENDERIZADO DE VIAJES
// ═══════════════════════════════════════════════════════════════════════════════
function renderViajes() {
    const list = document.getElementById('tripList');
    if (!list) return;
    
    if (state.viajes.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:1rem;">No hay viajes disponibles</p>';
        return;
    }
    
    list.innerHTML = state.viajes.map(v => `
        <div class="trip-card" data-id="${v.id}" onclick="selectViaje('${v.id}')">
            <div class="trip-route">
                <span>${v.origen}</span>
                <span class="arrow">→</span>
                <span>${v.destino}</span>
            </div>
            <div class="trip-info">
                <span>📅 ${formatDate(v.fecha)}</span>
                <span>🕐 ${v.hora}</span>
                <span>🚐 ${v.placa}</span>
                <span class="trip-price">Bs. ${v.precio}</span>
            </div>
            <div class="trip-driver">👤 Conductor: ${v.conductor}</div>
        </div>
    `).join('');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SELECCIÓN DE VIAJE
// ═══════════════════════════════════════════════════════════════════════════════
function selectViaje(id) {
    // Quitar selección anterior
    document.querySelectorAll('.trip-card').forEach(c => c.classList.remove('selected'));
    
    // Seleccionar nuevo
    const card = document.querySelector(`[data-id="${id}"]`);
    if (card) card.classList.add('selected');
    
    // Actualizar estado
    state.viaje = state.viajes.find(v => v.id === id);
    state.seats = [];
    
    // Obtener asientos ocupados de las ventas con info del cliente
    const ventasViaje = state.ventas.filter(v => v.id_viaje === id && v.estado !== 'CANCELADO');
    
    state.occupied = ventasViaje
        .map(v => parseInt(v.asiento))
        .filter(n => !isNaN(n));
    
    // Guardar info de quién ocupó cada asiento
    state.occupiedInfo = {};
    ventasViaje.forEach(venta => {
        const asiento = parseInt(venta.asiento);
        if (!isNaN(asiento)) {
            // Buscar el cliente en la lista de clientes
            const cliente = state.clientes.find(c => c.nit === venta.nit_cliente);
            state.occupiedInfo[asiento] = {
                nombre: cliente ? cliente.nombre : 'Cliente',
                nit: venta.nit_cliente || 'N/A',
                boleto: venta.id_boleto || ''
            };
        }
    });
    
    updateSeats();
    updateSummary();
    
    showAlert('success', 'Viaje seleccionado', `${state.viaje.origen} → ${state.viaje.destino}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// GESTIÓN DE ASIENTOS
// ═══════════════════════════════════════════════════════════════════════════════
function updateSeats() {
    for (let i = 1; i <= 7; i++) {
        const seat = document.querySelector(`[data-seat="${i}"]`);
        if (seat) {
            seat.classList.remove('selected', 'occupied');
            if (state.occupied.includes(i)) {
                seat.classList.add('occupied');
            }
            if (state.seats.includes(i)) {
                seat.classList.add('selected');
            }
        }
    }
    updateSelectedDisplay();
}

function toggleSeat(n) {
    if (!state.viaje) {
        showAlert('warning', 'Atención', 'Primero selecciona un viaje');
        return;
    }
    
    // Si está ocupado, mostrar info del ocupante
    if (state.occupied.includes(n)) {
        const info = state.occupiedInfo[n];
        if (info) {
            showOccupantInfo(n, info);
        } else {
            showAlert('error', 'Ocupado', `El asiento ${n} no está disponible`);
        }
        return;
    }
    
    const idx = state.seats.indexOf(n);
    if (idx > -1) {
        state.seats.splice(idx, 1);
    } else {
        state.seats.push(n);
    }
    
    state.seats.sort((a, b) => a - b);
    
    updateSeats();
    updateSummary();
}

// Mostrar información del ocupante del asiento
function showOccupantInfo(asiento, info) {
    // Crear modal de info
    const existingModal = document.getElementById('occupantModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'occupantModal';
    modal.className = 'occupant-modal';
    modal.innerHTML = `
        <div class="occupant-content">
            <div class="occupant-header">
                <span class="occupant-icon">💺</span>
                <h3>Asiento ${asiento} - Ocupado</h3>
            </div>
            <div class="occupant-body">
                <div class="occupant-row">
                    <span class="occupant-label">👤 Pasajero:</span>
                    <span class="occupant-value">${info.nombre}</span>
                </div>
                <div class="occupant-row">
                    <span class="occupant-label">🪪 NIT/CI:</span>
                    <span class="occupant-value">${info.nit}</span>
                </div>
                ${info.boleto ? `
                <div class="occupant-row">
                    <span class="occupant-label">🎫 Boleto:</span>
                    <span class="occupant-value">${info.boleto}</span>
                </div>
                ` : ''}
            </div>
            <button class="occupant-close" onclick="closeOccupantModal()">Cerrar</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cerrar al hacer click fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeOccupantModal();
    });
}

function closeOccupantModal() {
    const modal = document.getElementById('occupantModal');
    if (modal) modal.remove();
}

function updateSelectedDisplay() {
    const box = document.getElementById('selectedBox');
    const tags = document.getElementById('selectedTags');
    
    if (!box || !tags) return;
    
    if (state.seats.length > 0) {
        box.classList.add('show');
        tags.innerHTML = state.seats.map(s => `<span class="seat-tag">${s}</span>`).join('');
    } else {
        box.classList.remove('show');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BÚSQUEDA DE CLIENTE EN GOOGLE SHEETS
// ═══════════════════════════════════════════════════════════════════════════════
function searchClient() {
    const nitInput = document.getElementById('nitInput');
    const nit = nitInput ? nitInput.value.trim() : '';
    
    if (!nit) {
        showAlert('warning', 'Atención', 'Ingrese NIT o CI');
        return;
    }
    
    // Buscar en los clientes cargados
    const client = state.clientes.find(c => c.nit === nit);
    
    if (client) {
        state.client = client;
        
        document.getElementById('clientName').textContent = client.nombre;
        document.getElementById('clientInfo').textContent = `Tel: ${client.telefono || '-'} | ${client.email || '-'}`;
        document.getElementById('clientBox').classList.add('show');
        
        document.getElementById('nameInput').value = client.nombre || '';
        document.getElementById('phoneInput').value = client.telefono || '';
        document.getElementById('emailInput').value = client.email || '';
        
        showAlert('success', 'Cliente encontrado', client.nombre);
    } else {
        state.client = null;
        document.getElementById('clientBox').classList.remove('show');
        showAlert('warning', 'Cliente nuevo', 'Complete los datos del pasajero');
    }
    
    updateSummary();
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESUMEN DE VENTA
// ═══════════════════════════════════════════════════════════════════════════════
function updateSummary() {
    const v = state.viaje;
    const s = state.seats;
    const qty = s.length;
    const price = v ? v.precio : 0;
    const total = qty * price;
    
    document.getElementById('sumRoute').textContent = v ? `${v.origen} → ${v.destino}` : '-';
    document.getElementById('sumDate').textContent = v ? formatDate(v.fecha) : '-';
    document.getElementById('sumTime').textContent = v ? v.hora : '-';
    document.getElementById('sumVeh').textContent = v ? v.placa : '-';
    document.getElementById('sumDriver').textContent = v ? v.conductor : '-';
    
    const sumSeats = document.getElementById('sumSeats');
    if (sumSeats) {
        sumSeats.innerHTML = s.length > 0 
            ? s.map(x => `<span class="sum-seat">${x}</span>`).join('') 
            : '-';
    }
    
    document.getElementById('sumQty').textContent = qty;
    document.getElementById('sumPrice').textContent = `Bs. ${price}`;
    
    const clientName = state.client?.nombre || document.getElementById('nameInput')?.value || '-';
    document.getElementById('sumClient').textContent = clientName;
    
    document.getElementById('sumTotal').textContent = `Bs. ${total}`;
    
    const btn = document.getElementById('btnBoleto');
    const nitValue = document.getElementById('nitInput')?.value.trim();
    if (btn) {
        btn.disabled = !(v && qty > 0 && nitValue);
    }
}

// Event listeners para actualizar resumen
document.addEventListener('DOMContentLoaded', () => {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    const nitInput = document.getElementById('nitInput');
    const nameInput = document.getElementById('nameInput');
    
    if (nitInput) nitInput.addEventListener('input', updateSummary);
    if (nameInput) nameInput.addEventListener('input', updateSummary);
});

// ═══════════════════════════════════════════════════════════════════════════════
// GENERACIÓN DE BOLETO
// ═══════════════════════════════════════════════════════════════════════════════
function genBoletoNum() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `BOL-${year}${month}${day}-${rand}`;
}

function showInvoice() {
    const v = state.viaje;
    const s = state.seats;
    const qty = s.length;
    const total = qty * v.precio;
    const name = state.client?.nombre || document.getElementById('nameInput').value;
    const nit = document.getElementById('nitInput').value;
    
    state.boleto = genBoletoNum();
    
    // Usar datos de empresa de Google Sheets
    document.getElementById('invCompany').textContent = state.empresa.empresa || 'TRANSPORTE SURUBÍ';
    document.getElementById('invAddress').textContent = state.empresa.direccion || '';
    document.getElementById('invNit').textContent = state.empresa.nit || '';
    document.getElementById('invNumber').textContent = state.boleto;
    document.getElementById('invRoute').textContent = `${v.origen} → ${v.destino}`;
    document.getElementById('invDate').textContent = formatDateShort(v.fecha);
    document.getElementById('invTime').textContent = v.hora;
    document.getElementById('invVeh').textContent = v.placa;
    document.getElementById('invDriver').textContent = v.conductor;
    document.getElementById('invPassenger').textContent = name;
    document.getElementById('invClientNit').textContent = nit;
    document.getElementById('invSeats').innerHTML = s.map(x => `<span class="inv-seat">${x}</span>`).join('');
    document.getElementById('invQty').textContent = qty;
    document.getElementById('invPrice').textContent = `Bs. ${v.precio}`;
    document.getElementById('invTotal').textContent = `Bs. ${total}`;
    
    // Generar código QR
    const qrContainer = document.getElementById('invoiceQR');
    qrContainer.innerHTML = '';
    
    new QRCode(qrContainer, {
        text: JSON.stringify({
            boleto: state.boleto,
            ruta: `${v.origen}-${v.destino}`,
            fecha: v.fecha,
            hora: v.hora,
            asientos: s.join(','),
            pasajero: name,
            total
        }),
        width: 100,
        height: 100
    });
    
    document.getElementById('modal').classList.add('show');
}

function closeModal() {
    document.getElementById('modal').classList.remove('show');
}

function printInvoice() {
    window.print();
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIRMAR VENTA - GUARDAR EN GOOGLE SHEETS
// ═══════════════════════════════════════════════════════════════════════════════
async function confirmSale() {
    const btn = document.getElementById('btnConfirm');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';
    
    const v = state.viaje;
    const name = state.client?.nombre || document.getElementById('nameInput').value;
    const nit = document.getElementById('nitInput').value;
    const phone = document.getElementById('phoneInput').value;
    const email = document.getElementById('emailInput').value;
    const fechaVenta = new Date().toISOString().split('T')[0];
    const horaVenta = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    try {
        // Guardar cada asiento como una venta separada
        for (const asiento of state.seats) {
            await appendRow(CONFIG.SHEETS.VENTAS, [
                state.boleto,           // id_boleto
                v.id,                   // id_viaje
                nit,                    // nit_cliente
                asiento,                // asiento
                fechaVenta,             // fecha_venta
                horaVenta,              // hora_venta
                v.precio,               // precio
                'ACTIVO'                // estado
            ]);
        }
        
        // Si es cliente nuevo, guardarlo
        if (!state.client) {
            const existingClient = state.clientes.find(c => c.nit === nit);
            if (!existingClient && name) {
                await appendRow(CONFIG.SHEETS.CLIENTES, [
                    nit,                // nit
                    name,               // nombre
                    phone,              // telefono
                    email,              // email
                    ''                  // direccion
                ]);
            }
        }
        
        showAlert('success', '¡Venta registrada!', `Boleto: ${state.boleto}`);
        closeModal();
        clearForm();
        
        // Recargar datos para actualizar asientos ocupados
        await loadAllData();
        
    } catch (error) {
        console.error('❌ Error guardando venta:', error);
        showAlert('error', 'Error', 'No se pudo guardar la venta');
    }
    
    btn.disabled = false;
    btn.innerHTML = '✓ Confirmar';
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIMPIAR FORMULARIO
// ═══════════════════════════════════════════════════════════════════════════════
function clearForm() {
    state.viaje = null;
    state.seats = [];
    state.occupied = [];
    state.occupiedInfo = {};
    state.client = null;
    
    document.getElementById('nitInput').value = '';
    document.getElementById('nameInput').value = '';
    document.getElementById('phoneInput').value = '';
    document.getElementById('emailInput').value = '';
    document.getElementById('clientBox').classList.remove('show');
    
    document.querySelectorAll('.trip-card').forEach(c => c.classList.remove('selected'));
    
    updateSeats();
    updateSummary();
}

// ═══════════════════════════════════════════════════════════════════════════════
// REFRESCAR DATOS
// ═══════════════════════════════════════════════════════════════════════════════
function loadViajes() {
    if (state.isSignedIn) {
        loadAllData();
    } else {
        showAlert('warning', 'No conectado', 'Esperando conexión a Google Sheets...');
        handleAuthClick();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════════════════════
function updateDateTime() {
    const el = document.getElementById('datetime');
    if (el) {
        el.textContent = new Date().toLocaleDateString('es-ES', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

function formatDate(d) {
    return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    });
}

function formatDateShort(d) {
    return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SISTEMA DE ALERTAS
// ═══════════════════════════════════════════════════════════════════════════════
function showAlert(type, title, msg) {
    const container = document.getElementById('alerts');
    if (!container) return;
    
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠'
    };
    
    alert.innerHTML = `
        <span class="alert-icon">${icons[type]}</span>
        <div class="alert-text">
            <strong>${title}</strong>
            <span>${msg}</span>
        </div>
        <button class="alert-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(alert);
    
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 3500);
}
