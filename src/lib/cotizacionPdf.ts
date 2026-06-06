import { jsPDF } from 'jspdf';
import {
	COTIZACION_ITEM_INDEXES,
	displayText,
	formatMoney,
	type CotizacionData,
	type CotizacionItem,
} from './cotizacion.js';

type PdfDocument = InstanceType<typeof jsPDF>;
type Align = 'left' | 'center' | 'right';
type FontStyle = 'normal' | 'bold';

const COMPANY = {
	name: 'Sonymat',
	ruc: '10158643095',
	phones: '933156539 | 998085837',
};

const CONDITIONS = [
	'1. Los precios son en moneda nacional y no incluyen IGV.',
	'2. La validez de la oferta es de 30 días calendario.',
	'3. La forma de pago es 50 % de adelanto y 50 % antes de la entrega.',
	'4. La entrega de los productos es de 15 días calendario de emitida la orden de compra.',
];

const TABLE = {
	x: 10,
	y: 85,
	headerHeight: 10,
	rowHeight: 20,
	columns: [
		{ label: 'Item', x: 10, width: 16, align: 'center' as const },
		{ label: 'Cant.', x: 26, width: 18, align: 'center' as const },
		{ label: 'Descripción del producto o servicio', x: 44, width: 86, align: 'left' as const },
		{ label: 'Precio (c/u)', x: 130, width: 32, align: 'right' as const },
		{ label: 'Total', x: 162, width: 32, align: 'right' as const },
	],
};

const setFont = (
	doc: PdfDocument,
	size: number,
	style: FontStyle = 'normal',
) => {
	doc.setFont('helvetica', style);
	doc.setFontSize(size);
};

const drawField = (
	doc: PdfDocument,
	label: string,
	value: string,
	y: number,
) => {
	setFont(doc, 12, 'bold');
	doc.text(label, 10, y);
	doc.text(': ', 32, y);
	setFont(doc, 12);
	doc.text(displayText(value), 34, y, { maxWidth: 160 });
};

const drawCell = (
	doc: PdfDocument,
	x: number,
	y: number,
	width: number,
	height: number,
	text: string,
	options: {
		align?: Align;
		fontSize?: number;
		style?: FontStyle;
	} = {},
) => {
	const align = options.align ?? 'center';
	const fontSize = options.fontSize ?? 9;
	const lineHeight = fontSize * 0.45;
	const textX =
		align === 'left' ? x + 2 : align === 'right' ? x + width - 2 : x + width / 2;

	doc.rect(x, y, width, height);
	setFont(doc, fontSize, options.style ?? 'normal');

	const rawLines = doc.splitTextToSize(text, width - 4);
	const lines = Array.isArray(rawLines) ? rawLines : [rawLines];
	const maxLines = Math.max(1, Math.floor((height - 2) / lineHeight));
	const visibleLines = lines.slice(0, maxLines);
	const textY =
		y + height / 2 - ((visibleLines.length - 1) * lineHeight) / 2 + 1.6;

	doc.text(visibleLines, textX, textY, { align });
};

const drawHeader = (doc: PdfDocument, data: CotizacionData) => {
	setFont(doc, 32, 'bold');
	doc.text(COMPANY.name, 10, 20);

	setFont(doc, 12, 'bold');
	doc.text('RUC:', 172, 15, { align: 'right' });
	setFont(doc, 12);
	doc.text(COMPANY.ruc, 200, 15, { align: 'right' });

	setFont(doc, 12, 'bold');
	doc.text('Cell:', 152, 20, { align: 'right' });
	setFont(doc, 12);
	doc.text(COMPANY.phones, 200, 20, { align: 'right' });

	drawField(doc, 'Fecha', data.date, 30);
	drawField(doc, 'Señores', data.companyName, 35);
	drawField(doc, 'RUC', data.companyRuc, 40);
	drawField(doc, 'Contacto', data.clientContact, 45);
	drawField(doc, 'Dirección', data.clientAddress, 50);
	drawField(doc, 'Asunto', data.subject, 55);

	doc.setLineWidth(0.1);
	doc.setDrawColor(0, 0, 0);
	doc.setLineDashPattern([2.5], 1);
	doc.line(10, 65, 200, 65);
	doc.setLineDashPattern([], 0);
};

const drawIntro = (doc: PdfDocument) => {
	setFont(doc, 12);
	doc.text('De nuestra consideración', 10, 70);
	doc.text(
		'En atención a su amable solicitud, tenemos el agrado de presentarle nuestra propuesta\ntécnico - económica de lo siguiente:',
		10,
		75,
	);
};

const normalizeItem = (index: number, item?: CotizacionItem): CotizacionItem => ({
	index,
	description: item?.description ?? '',
	amount: item?.amount ?? 0,
	price: item?.price ?? 0,
	total: item?.total ?? 0,
});

const drawItemsTable = (doc: PdfDocument, data: CotizacionData) => {
	doc.setLineWidth(0.5);

	for (const column of TABLE.columns) {
		drawCell(
			doc,
			column.x,
			TABLE.y,
			column.width,
			TABLE.headerHeight,
			column.label,
			{ align: column.align, fontSize: 8, style: 'bold' },
		);
	}

	for (const index of COTIZACION_ITEM_INDEXES) {
		const item = normalizeItem(index, data.items[index - 1]);
		const y = TABLE.y + TABLE.headerHeight + (index - 1) * TABLE.rowHeight;

		drawCell(doc, 10, y, 16, TABLE.rowHeight, String(index));
		drawCell(doc, 26, y, 18, TABLE.rowHeight, String(item.amount));
		drawCell(doc, 44, y, 86, TABLE.rowHeight, displayText(item.description), {
			align: 'left',
		});
		drawCell(doc, 130, y, 32, TABLE.rowHeight, formatMoney(item.price), {
			align: 'right',
		});
		drawCell(doc, 162, y, 32, TABLE.rowHeight, formatMoney(item.total), {
			align: 'right',
		});
	}
};

const drawTotals = (doc: PdfDocument, data: CotizacionData) => {
	const x = 130;
	const valueX = 162;
	const y = TABLE.y + TABLE.headerHeight + TABLE.rowHeight * COTIZACION_ITEM_INDEXES.length + 10;

	drawCell(doc, x, y, 32, 8, 'Sub Total:', {
		align: 'right',
		fontSize: 10,
		style: 'bold',
	});
	drawCell(doc, valueX, y, 32, 8, formatMoney(data.subtotal), {
		align: 'right',
		fontSize: 10,
	});

	drawCell(doc, x, y + 10, 32, 8, 'IGV:', {
		align: 'right',
		fontSize: 10,
		style: 'bold',
	});
	drawCell(doc, valueX, y + 10, 32, 8, formatMoney(data.igv), {
		align: 'right',
		fontSize: 10,
	});

	drawCell(doc, x, y + 20, 32, 8, 'Total:', {
		align: 'right',
		fontSize: 10,
		style: 'bold',
	});
	drawCell(doc, valueX, y + 20, 32, 8, formatMoney(data.total), {
		align: 'right',
		fontSize: 10,
	});
};

const drawConditions = (doc: PdfDocument) => {
	setFont(doc, 12, 'bold');
	doc.text('Condiciones de la oferta:', 10, 245);
	setFont(doc, 12);
	doc.text(CONDITIONS.join('\n'), 10, 250);
};

export const createCotizacionPdf = (data: CotizacionData) => {
	const doc = new jsPDF();

	drawHeader(doc, data);
	drawIntro(doc);
	drawItemsTable(doc, data);
	drawTotals(doc, data);
	drawConditions(doc);

	return doc;
};
