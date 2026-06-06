import { describe, expect, it } from 'vitest';
import { createEmptyCotizacion, type CotizacionData } from './cotizacion.js';
import { createCotizacionPdf } from './cotizacionPdf.js';

const createCotizacion = (
	overrides: Partial<CotizacionData> = {},
): CotizacionData => ({
	...createEmptyCotizacion(),
	number: '001',
	date: '2026-06-06',
	companyName: 'SMART ELECTRONICS',
	companyRuc: '201578985638',
	clientContact: 'Javier',
	clientAddress: 'Av Lomas de Carabayllo',
	subject: 'Piñones estables',
	items: [
		{
			index: 1,
			description: 'Piñones de acero',
			amount: 10,
			price: 1000,
			total: 10000,
		},
	],
	subtotal: 10000,
	igv: 1800,
	total: 11800,
	...overrides,
});

describe('createCotizacionPdf', () => {
	it('genera un PDF válido para una cotización simple', () => {
		const doc = createCotizacionPdf(createCotizacion());
		const pdfBuffer = doc.output('arraybuffer');

		expect(doc.getNumberOfPages()).toBe(1);
		expect(pdfBuffer.byteLength).toBeGreaterThan(4000);
	});

	it('pagina automáticamente cuando la cotización tiene muchos items', () => {
		const items = Array.from({ length: 18 }, (_, index) => ({
			index: index + 1,
			description: `Producto industrial ${index + 1}`,
			amount: 2,
			price: 100,
			total: 200,
		}));
		const doc = createCotizacionPdf(
			createCotizacion({
				items,
				subtotal: 3600,
				igv: 648,
				total: 4248,
			}),
		);

		expect(doc.getNumberOfPages()).toBeGreaterThan(1);
	});
});
