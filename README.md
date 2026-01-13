# 📦 Scanner Pro - Control de Inventario

Aplicación web optimizada para dispositivos móviles (PWA) diseñada para el escaneo de lotes, validación de estándares y gestión de inventario en tiempo real. Funciona 100% local una vez instalada.

## 🚀 Características principales

- **Cámara integrada:** Interfaz dividida con visor superior para escaneo continuo.
- **Validación Inteligente:** Detecta si un lote ya tiene un estándar definido para agilizar la carga.
- **Modo Offline:** Gracias a su Service Worker, funciona sin conexión a internet en almacenes.
- **Gestión de Parciales:** Diferencia entre cajas completas y bultos sobrantes (parciales).
- **Exportación:** Genera reportes en formato CSV listos para Excel.

## 🛠️ Estructura del Proyecto

Para que la app funcione correctamente en GitHub Pages, los archivos están organizados en la raíz:

- `index.html`: Interfaz y lógica principal.
- `html5-qrcode.min.js`: Librería de escaneo (uso local).
- `sw.js`: Motor para funcionamiento sin internet.
- `manifest.json`: Configuración de instalación para Android.

## 📱 Instalación en Android

1. Abre el enlace de **GitHub Pages** en Chrome desde tu celular.
2. Espera a que cargue y selecciona los tres puntos (⋮) del navegador.
3. Toca en **"Instalar aplicación"** o **"Añadir a la pantalla de inicio"**.
4. ¡Listo! Ahora tendrás el icono en tu menú y funcionará sin internet.

## ⚙️ Uso

1. **Escanear:** Apunta al código del lote.
2. **Definir:** La primera vez, indica cuántas piezas tiene una caja estándar.
3. **Sumar:** Las siguientes veces, solo toca "Caja Estándar" y se sumará automáticamente.
4. **Exportar:** Al terminar el turno, descarga el CSV y limpia el inventario para el siguiente pallet.

---
Desarrollado para optimización de procesos logísticos.