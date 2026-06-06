import { describe, expect, it } from 'vitest';
import {
	calculateCotizacionTotals,
	cotizacionFromFormData,
	formatMoney,
	roundMoneyForConsumer,
} from './cotizacion.js';

const createBaseFormData = () => {
	const formData = new FormData();

	formData.set('nCotization', '001');
	formData.set('dateCotization', '2026-06-06');
	formData.set('nameCompany', 'SMART ELECTRONICS');
	formData.set('rucCompany', '201578985638');
	formData.set('nameClient', 'Javier');
	formData.set('directionClient', 'Av Lomas de Carabayllo');
	formData.set('asunto', 'Piñones estables');

	return formData;
};

describe('calculateCotizacionTotals', () => {
	it('calcula subtotal, IGV y total cuando los precios no incluyen IGV', () => {
		const totals = calculateCotizacionTotals(
			[{ amount: 1, price: 100, total: 100 }],
			'exclusive',
		);

		expect(totals).toEqual({
			subtotal: 100,
			igv: 18,
			total: 118,
		});
	});

	it('separa la base imponible cuando los precios ya incluyen IGV', () => {
		const totals = calculateCotizacionTotals(
			[{ amount: 1, price: 100, total: 100 }],
			'included',
		);

		expect(totals).toEqual({
			subtotal: 84.75,
			igv: 15.25,
			total: 100,
		});
	});

	it('redondea el IGV a favor del consumidor en modo no incluido', () => {
		const totals = calculateCotizacionTotals(
			[{ amount: 1, price: 0.05, total: 0.05 }],
			'exclusive',
		);

		expect(totals).toEqual({
			subtotal: 0.05,
			igv: 0,
			total: 0.05,
		});
	});
});

describe('cotizacionFromFormData', () => {
	it('construye la cotización desde una lista dinámica de items', () => {
		const formData = createBaseFormData();

		formData.set('taxMode', 'exclusive');
		formData.append('itemDescription', 'Piñones de acero');
		formData.append('itemAmount', '10');
		formData.append('itemPrice', '1000');
		formData.append('itemDescription', 'Piñones de fierro');
		formData.append('itemAmount', '50');
		formData.append('itemPrice', '100');

		const cotizacion = cotizacionFromFormData(formData);

		expect(cotizacion.items).toEqual([
			{
				index: 1,
				description: 'Piñones de acero',
				amount: 10,
				price: 1000,
				total: 10000,
			},
			{
				index: 2,
				description: 'Piñones de fierro',
				amount: 50,
				price: 100,
				total: 5000,
			},
		]);
		expect(cotizacion.subtotal).toBe(15000);
		expect(cotizacion.igv).toBe(2700);
		expect(cotizacion.total).toBe(17700);
	});

	it('usa los totales manuales cuando están habilitados', () => {
		const formData = createBaseFormData();

		formData.set('taxMode', 'exclusive');
		formData.set('manualTotals', 'true');
		formData.append('itemDescription', 'Servicio');
		formData.append('itemAmount', '2');
		formData.append('itemPrice', '100');
		formData.set('subtotal', '190');
		formData.set('igv', '34.20');
		formData.set('total', '224.20');

		const cotizacion = cotizacionFromFormData(formData);

		expect(cotizacion.subtotal).toBe(190);
		expect(cotizacion.igv).toBe(34.2);
		expect(cotizacion.total).toBe(224.2);
	});
});

describe('helpers de moneda', () => {
	it('formatea montos con separador peruano y dos decimales', () => {
		expect(formatMoney(15000)).toBe('15,000.00 S/.');
	});

	it('limita decimales hacia abajo cuando corresponde al consumidor', () => {
		expect(roundMoneyForConsumer(10.999)).toBe(10.99);
	});
});
