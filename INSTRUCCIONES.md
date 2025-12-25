# 🚐 TRANSPORTE SURUBÍ
## Sistema de Venta de Pasajes - Instrucciones

**Versión:** 1.0  
**Elaborado por:** GLEO  
**Año:** 2025

---

## 📁 ARCHIVOS DEL SISTEMA

```
📂 transporte-surubi/
├── 📄 index.html      → Página principal
├── 📄 styles.css      → Estilos visuales
├── 📄 script.js       → Lógica del sistema
├── 📄 config.js       → Configuración de Google API
└── 📄 INSTRUCCIONES.md → Este archivo
```

---

## 🚀 REQUISITOS

1. **Navegador moderno** (Chrome, Firefox, Edge)
2. **Conexión a internet**
3. **Cuenta de Google** con acceso al Sheets configurado
4. **Servidor local** (para evitar CORS):
   - Python: `python -m http.server 8000`
   - Node.js: `npx serve`
   - VS Code: Extensión "Live Server"

---

## 📊 ESTRUCTURA DE GOOGLE SHEETS

Tu hoja de cálculo debe tener **6 pestañas** con la siguiente estructura:

---

### 📋 Pestaña: `Config`

| clave | valor |
|-------|-------|
| empresa | TRANSPORTE SURUBÍ |
| direccion | Terminal de Buses - La Paz |
| nit | 1234567890 |
| telefono | 71234567 |

---

### 🚐 Pestaña: `Vehiculos`

| id_vehiculo | placa | marca | modelo | color | capacidad | estado |
|-------------|-------|-------|--------|-------|-----------|--------|
| VEH001 | ABC-123 | Toyota | Ipsum | Azul | 7 | ACTIVO |
| VEH002 | DEF-456 | Hyundai | H1 | Blanco | 7 | ACTIVO |
| VEH003 | GHI-789 | Toyota | Ipsum | Gris | 7 | ACTIVO |

> **Nota:** `capacidad` siempre es 7 para el Surubí

---

### 🛣️ Pestaña: `Rutas`

| id_ruta | origen | destino | precio | duracion_min |
|---------|--------|---------|--------|--------------|
| R001 | La Paz | El Alto | 5 | 30 |
| R002 | La Paz | Viacha | 10 | 45 |
| R003 | El Alto | Laja | 8 | 40 |
| R004 | La Paz | Achocalla | 7 | 35 |

---

### 📅 Pestaña: `Programacion`

| id_viaje | id_ruta | id_vehiculo | fecha | hora_salida | conductor | estado |
|----------|---------|-------------|-------|-------------|-----------|--------|
| VJ001 | R001 | VEH001 | 2025-12-26 | 08:00 | Juan Pérez | ACTIVO |
| VJ002 | R002 | VEH002 | 2025-12-26 | 09:30 | Carlos López | ACTIVO |
| VJ003 | R003 | VEH003 | 2025-12-26 | 10:00 | Pedro Mamani | ACTIVO |

> **IMPORTANTE:**
> - `fecha` debe estar en formato **YYYY-MM-DD** (ejemplo: 2025-12-26)
> - `estado` debe ser **ACTIVO** para que aparezca en el sistema
> - `id_ruta` debe coincidir con un ID de la hoja Rutas
> - `id_vehiculo` debe coincidir con un ID de la hoja Vehiculos

---

### 🎫 Pestaña: `Ventas`

| id_boleto | id_viaje | nit_cliente | asiento | fecha_venta | hora_venta | precio | estado |
|-----------|----------|-------------|---------|-------------|------------|--------|--------|
| *(se llena automáticamente)* |

> El sistema agregará filas automáticamente al confirmar una venta.
> Cada asiento vendido genera una fila.

---

### 👥 Pestaña: `Clientes`

| nit | nombre | telefono | email | direccion |
|-----|--------|----------|-------|-----------|
| 12345678 | María García | 71234567 | maria@email.com | |
| 87654321 | José Mamani | 72345678 | jose@email.com | |
| 11111111 | Ana López | 73456789 | ana@email.com | |

> Clientes nuevos se agregan automáticamente al confirmar una venta.

---

## ⚙️ CONFIGURACIÓN DE config.js

El archivo `config.js` ya está configurado con:

```javascript
const CONFIG = {
    GOOGLE_SHEET_ID: '1m4lBpPC1Nly49Zk8DYLA5sSZzQrZo9zTfE7ASMkGXW8',
    CLIENT_ID: '814005655098-8csk41qts3okv4b2fjnq7ls4qc2kq0vc.apps.googleusercontent.com',
    API_KEY: 'AIzaSyAOhGTjJXHhuUhqf1g2DPCla59xNzftb-Q',
    // ...
};
```

> Si necesitas cambiar el ID del Sheet, solo modifica `GOOGLE_SHEET_ID`.

---

## 📱 CÓMO USAR EL SISTEMA

### 1️⃣ Iniciar el sistema
1. Abre un servidor local en la carpeta del proyecto
2. Navega a `http://localhost:8000` (o el puerto que uses)
3. El sistema pedirá acceso a Google - **Acepta los permisos**

### 2️⃣ Seleccionar un viaje
- Los viajes aparecen automáticamente desde Google Sheets
- Click en el viaje deseado
- Se mostrarán los asientos disponibles/ocupados

### 3️⃣ Seleccionar asientos
- Click en los asientos deseados (selección múltiple)
- Los asientos **neón** están seleccionados
- Los asientos **rojos** están ocupados

### 4️⃣ Registrar cliente
- Ingresa el NIT/CI y presiona 🔍
- Si existe, se cargan sus datos
- Si es nuevo, completa el nombre

### 5️⃣ Generar boleto
- Click en **"Generar Boleto"**
- Revisa la vista previa
- Click en **"✓ Confirmar"** para guardar en Sheets
- O **"🖨️ Imprimir"** para imprimir

---

## 💺 DISTRIBUCIÓN DE ASIENTOS

```
         ↓ < ENTRADA
    ╔═══════════════════════════════╗
    ║                               ║
    ║   [1]        [2]    [5]       ║
    ║                               ║
    ║             [3]    [6]        ║
    ║   [C]                         ║
    ║  CHOFER     [4]    [7]        ║
    ║                               ║
    ╚═══════════════════════════════╝
```

---

## 🎨 ESTADOS DE ASIENTOS

| Estado | Color | Descripción |
|--------|-------|-------------|
| Disponible | Blanco | Puede seleccionarse |
| **Seleccionado** | **Turquesa Neón** ✨ | Seleccionado para la venta |
| Ocupado | Rojo | Ya vendido |
| Chofer | Gris | No disponible |

---

## 🖨️ IMPRESIÓN DE BOLETOS

- El boleto está optimizado para impresoras térmicas de **80mm**
- Las letras son más grandes para mejor legibilidad
- Al imprimir, solo se imprime el boleto (sin el sistema)
- Incluye código QR para verificación

---

## ❓ SOLUCIÓN DE PROBLEMAS

### "Conectando a Google Sheets..."
- Verifica tu conexión a internet
- Acepta los permisos de Google cuando aparezcan
- Revisa que las credenciales en `config.js` sean correctas

### No aparecen viajes
- Verifica que la fecha sea hoy o futura
- Verifica que el estado sea `ACTIVO`
- Revisa que los IDs de ruta y vehículo existan

### Error al guardar venta
- Verifica permisos de escritura en el Sheet
- La hoja debe estar compartida con el email de la API

### Los asientos no se marcan como ocupados
- Verifica que la hoja `Ventas` tenga las columnas correctas
- El `id_viaje` debe coincidir exactamente

---

## 📞 SOPORTE

Sistema elaborado por **GLEO** | 2025

---

## 📄 LICENCIA

© 2025 - Todos los derechos reservados
