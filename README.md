# Cotizaciones Sonymat

Aplicación web para generar cotizaciones comerciales de Sonymat desde un formulario y exportarlas como PDF.

El proyecto está construido con Astro y usa jsPDF en el navegador para crear una vista previa de la cotización, actualizarla con los datos ingresados y descargar el archivo final.

## Funcionalidades

- Formulario para registrar datos generales de la cotización: número, fecha, empresa, RUC, contacto, dirección y asunto.
- Registro dinámico de productos o servicios con descripción, cantidad y precio unitario.
- Vista previa del PDF dentro de la página mediante un `embed`.
- Generación de PDF con datos de Sonymat, tabla de ítems, subtotales, IGV, total y condiciones de la oferta.
- Cálculo de total por ítem a partir de cantidad y precio unitario.
- Descarga del archivo como `cotizacion#<numero>.pdf`.

## Stack

- Astro 4
- TypeScript
- jsPDF
- CSS propio con tema oscuro fijo
- npm con `package-lock.json`

## Requisitos

- Node.js 18.17 o superior, compatible con Astro 4.
- npm.

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Astro levanta el servidor local normalmente en:

```text
http://localhost:4321
```

También existe el alias:

```bash
npm start
```

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo de Astro. |
| `npm start` | Alias de `npm run dev`. |
| `npm run build` | Ejecuta `astro check` y genera el build de producción. |
| `npm run preview` | Sirve localmente el build generado. |
| `npm run astro` | Permite ejecutar comandos del CLI de Astro. |

## Estructura del proyecto

```text
.
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── CotizacionForm.astro
│   ├── lib/
│   │   ├── cotizacion.ts
│   │   └── cotizacionPdf.ts
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
├── astro.config.mjs
├── package.json
├── package-lock.json
└── tsconfig.json
```

## Archivos principales

- `src/pages/index.astro`: compone la pantalla principal y conecta el formulario con la vista previa y descarga del PDF.
- `src/components/CotizacionForm.astro`: contiene el formulario de datos generales, ítems y totales.
- `src/lib/cotizacion.ts`: normaliza los datos del formulario y define tipos/helpers de cotización.
- `src/lib/cotizacionPdf.ts`: genera el PDF con jsPDF.
- `src/layouts/Layout.astro`: define la estructura HTML base, metadatos, favicon y estilos globales.
- `astro.config.mjs`: configuración base de Astro.

## Flujo de uso

1. Ejecutar el servidor de desarrollo.
2. Abrir la aplicación en el navegador.
3. Completar los datos de la cotización.
4. Presionar `Actualizar cotización` para refrescar la vista previa del PDF.
5. Presionar `Descarga la cotización` para guardar el PDF.

## Estado actual y próximos pasos sugeridos

- La aplicación funciona del lado del cliente; no tiene backend ni persistencia de cotizaciones.
- Los campos `subtotal`, `igv` y `total` pueden ingresarse manualmente; si `subtotal` o `total` quedan vacíos se usan cálculos base de los ítems.
- Sería útil agregar validaciones de formulario para evitar PDFs con campos vacíos o valores inválidos.
