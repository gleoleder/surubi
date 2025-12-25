// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    ARCHIVO DE CONFIGURACIÓN - config.js                      ║
// ║                      Sistema Transporte Surubí v1.0                          ║
// ║                          Elaborado por GLEO                                  ║
// ║                                                                              ║
// ║  Este archivo contiene todas las configuraciones necesarias para conectar   ║
// ║  el sistema con Google Sheets. Aquí se definen:                             ║
// ║  - ID del documento de Google Sheets                                        ║
// ║  - Credenciales de la API de Google                                         ║
// ║  - Nombres de las 6 hojas que componen la base de datos                     ║
// ╚════════════════════════════════════════════════════════════════════════════╝

const CONFIG = {
    
    // ══════════════════════════════════════════════════════════════════════════
    // ID DEL DOCUMENTO DE GOOGLE SHEETS
    // ══════════════════════════════════════════════════════════════════════════
    // Este ID se encuentra en la URL de tu Google Sheet:
    // https://docs.google.com/spreadsheets/d/[ESTE_ES_EL_ID]/edit
    // ══════════════════════════════════════════════════════════════════════════
    GOOGLE_SHEET_ID: '1m4lBpPC1Nly49Zk8DYLA5sSZzQrZo9zTfE7ASMkGXW8',
    
    // ══════════════════════════════════════════════════════════════════════════
    // CREDENCIALES DE GOOGLE API
    // ══════════════════════════════════════════════════════════════════════════
    // Estas credenciales se obtienen desde la consola de Google Cloud Platform.
    // CLIENT_ID: Identifica la aplicación ante Google
    // API_KEY: Clave para acceder a la API de Google Sheets
    // ══════════════════════════════════════════════════════════════════════════
    CLIENT_ID: '814005655098-8csk41qts3okv4b2fjnq7ls4qc2kq0vc.apps.googleusercontent.com',
    API_KEY: 'AIzaSyAOhGTjJXHhuUhqf1g2DPCla59xNzftb-Q',
    
    // ══════════════════════════════════════════════════════════════════════════
    // NOMBRES DE LAS 6 HOJAS DE LA BASE DE DATOS
    // ══════════════════════════════════════════════════════════════════════════
    // Estos nombres deben coincidir EXACTAMENTE con los nombres de las hojas
    // en tu documento de Google Sheets (incluyendo mayúsculas/minúsculas)
    //
    // CONFIG:       Datos de la empresa (nombre, dirección, NIT, teléfono)
    // VEHICULOS:    Lista de vehículos (placa, marca, modelo, capacidad, estado)
    // RUTAS:        Rutas disponibles (origen, destino, precio, duración)
    // PROGRAMACION: Viajes programados (fecha, hora, conductor, vehículo, ruta)
    // VENTAS:       Registro de boletos vendidos
    // CLIENTES:     Base de datos de clientes (NIT, nombre, teléfono, email)
    // ══════════════════════════════════════════════════════════════════════════
    SHEETS: {
        CONFIG: 'Config',
        VEHICULOS: 'Vehiculos',
        RUTAS: 'Rutas',
        PROGRAMACION: 'Programacion',
        VENTAS: 'Ventas',
        CLIENTES: 'Clientes'
    },
    
    // ══════════════════════════════════════════════════════════════════════════
    // CONFIGURACIÓN DEL VEHÍCULO SURUBÍ
    // ══════════════════════════════════════════════════════════════════════════
    CAPACIDAD_SURUBI: 7,
    
    // ══════════════════════════════════════════════════════════════════════════
    // GOOGLE API SCOPES Y DISCOVERY
    // ══════════════════════════════════════════════════════════════════════════
    SCOPES: 'https://www.googleapis.com/auth/spreadsheets',
    DISCOVERY_DOC: 'https://sheets.googleapis.com/$discovery/rest?version=v4'
};
