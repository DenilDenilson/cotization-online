import { jsPDF } from 'jspdf';
import {
	displayText,
	formatMoney,
	type CotizacionData,
	type CotizacionItem,
} from './cotizacion.js';

type PdfDocument = InstanceType<typeof jsPDF>;
type Align = 'left' | 'center' | 'right';
type FontStyle = 'normal' | 'bold';
type Rgb = [number, number, number];

const COMPANY = {
	name: 'Sonymat',
	ruc: '10158643095',
	phones: '933156539 | 998085837',
};

const COLORS = {
	ink: [22, 30, 43] as Rgb,
	muted: [92, 107, 129] as Rgb,
	border: [209, 218, 230] as Rgb,
	surface: [247, 249, 252] as Rgb,
	tableAlt: [251, 253, 255] as Rgb,
	headerBg: [231, 246, 254] as Rgb,
	accent: [37, 169, 225] as Rgb,
	accentDark: [17, 102, 166] as Rgb,
	white: [255, 255, 255] as Rgb,
};

const CONDITIONS_AFTER_TAX_MODE = [
	'2. La validez de la oferta es de 30 días calendario.',
	'3. La forma de pago es 50 % de adelanto y 50 % antes de la entrega.',
	'4. La entrega de los productos es de 15 días calendario de emitida la orden de compra.',
];

const PAGE = {
	width: 210,
	marginX: 14,
	bottomY: 274,
	footerLineY: 286,
	footerTextY: 291,
	continuationTitleY: 20,
	continuationTableY: 34,
	totalsGap: 8,
	totalsHeight: 27,
};

const TABLE = {
	y: 104,
	headerHeight: 9,
	rowHeight: 15,
	columns: [
		{ label: 'Item', x: 14, width: 14, align: 'center' as const },
		{ label: 'Cant.', x: 28, width: 18, align: 'center' as const },
		{ label: 'Descripción del producto o servicio', x: 46, width: 84, align: 'left' as const },
		{ label: 'Precio (c/u)', x: 130, width: 32, align: 'right' as const },
		{ label: 'Total', x: 162, width: 34, align: 'right' as const },
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

const setFillColor = (doc: PdfDocument, color: Rgb) => {
	doc.setFillColor(color[0], color[1], color[2]);
};

const setDrawColor = (doc: PdfDocument, color: Rgb) => {
	doc.setDrawColor(color[0], color[1], color[2]);
};

const setTextColor = (doc: PdfDocument, color: Rgb) => {
	doc.setTextColor(color[0], color[1], color[2]);
};

const splitText = (doc: PdfDocument, text: string, maxWidth: number) => {
	const lines = doc.splitTextToSize(text, maxWidth);
	return Array.isArray(lines) ? lines.map(String) : [String(lines)];
};

const drawPanel = (
	doc: PdfDocument,
	x: number,
	y: number,
	width: number,
	height: number,
	fillColor = COLORS.surface,
) => {
	doc.setLineWidth(0.2);
	setDrawColor(doc, COLORS.border);
	setFillColor(doc, fillColor);
	doc.rect(x, y, width, height, 'FD');
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
		fillColor?: Rgb;
		textColor?: Rgb;
		borderColor?: Rgb;
		paddingX?: number;
		lineWidth?: number;
	} = {},
) => {
	const align = options.align ?? 'center';
	const fontSize = options.fontSize ?? 8.5;
	const paddingX = options.paddingX ?? 2.4;
	const lineHeight = fontSize * 0.43;
	const textX =
		align === 'left'
			? x + paddingX
			: align === 'right'
				? x + width - paddingX
				: x + width / 2;

	doc.setLineWidth(options.lineWidth ?? 0.18);
	setDrawColor(doc, options.borderColor ?? COLORS.border);

	if (options.fillColor) {
		setFillColor(doc, options.fillColor);
		doc.rect(x, y, width, height, 'FD');
	} else {
		doc.rect(x, y, width, height, 'S');
	}

	setFont(doc, fontSize, options.style ?? 'normal');
	setTextColor(doc, options.textColor ?? COLORS.ink);

	const rawLines = splitText(doc, text, width - paddingX * 2);
	const maxLines = Math.max(1, Math.floor((height - 2.4) / lineHeight));
	const visibleLines = rawLines.slice(0, maxLines);
	const textY =
		y + height / 2 - ((visibleLines.length - 1) * lineHeight) / 2 + 1.4;

	doc.text(visibleLines, textX, textY, { align });
};

const drawSummaryField = (
	doc: PdfDocument,
	label: string,
	value: string,
	x: number,
	y: number,
	maxWidth: number,
) => {
	setFont(doc, 7.2, 'bold');
	setTextColor(doc, COLORS.accentDark);
	doc.text(label.toUpperCase(), x, y);

	setFont(doc, 8.5);
	setTextColor(doc, COLORS.ink);
	doc.text(splitText(doc, displayText(value), maxWidth), x, y + 4.2, {
		maxWidth,
	});
};

const drawTopAccent = (doc: PdfDocument) => {
	setFillColor(doc, COLORS.accent);
	doc.rect(0, 0, PAGE.width, 4, 'F');
};

const drawHeader = (doc: PdfDocument, data: CotizacionData) => {
	drawTopAccent(doc);

	setTextColor(doc, COLORS.accentDark);
	setFont(doc, 28, 'bold');
	doc.text(COMPANY.name, PAGE.marginX, 22);

	setTextColor(doc, COLORS.muted);
	setFont(doc, 9);
	doc.text('Propuesta técnico-económica', PAGE.marginX, 28);

	setTextColor(doc, COLORS.ink);
	setFont(doc, 16, 'bold');
	doc.text('Cotización', 196, 18, { align: 'right' });

	setTextColor(doc, COLORS.muted);
	setFont(doc, 8.5);
	doc.text(`Nro. ${displayText(data.number)}`, 196, 24, { align: 'right' });
	doc.text(`Fecha ${displayText(data.date)}`, 196, 29, { align: 'right' });
	doc.text(`RUC ${COMPANY.ruc}`, 196, 35, { align: 'right' });
	doc.text(`Cel. ${COMPANY.phones}`, 196, 40, { align: 'right' });
};

const drawClientPanel = (doc: PdfDocument, data: CotizacionData) => {
	const x = PAGE.marginX;
	const y = 43;
	const width = 182;

	drawPanel(doc, x, y, width, 38);

	setTextColor(doc, COLORS.ink);
	setFont(doc, 10, 'bold');
	doc.text('Datos del cliente', x + 4, y + 8);

	drawSummaryField(doc, 'Señores', data.companyName, x + 4, y + 18, 72);
	drawSummaryField(doc, 'RUC cliente', data.companyRuc, x + 86, y + 18, 34);
	drawSummaryField(doc, 'Contacto', data.clientContact, x + 130, y + 18, 48);
	drawSummaryField(doc, 'Dirección', data.clientAddress, x + 4, y + 31, 86);
	drawSummaryField(doc, 'Asunto', data.subject, x + 100, y + 31, 76);
};

const drawIntro = (doc: PdfDocument) => {
	setTextColor(doc, COLORS.ink);
	setFont(doc, 10, 'bold');
	doc.text('De nuestra consideración', PAGE.marginX, 90);

	setTextColor(doc, COLORS.muted);
	setFont(doc, 8.8);
	doc.text(
		splitText(
			doc,
			'En atención a su amable solicitud, tenemos el agrado de presentarle nuestra propuesta técnico-económica de lo siguiente:',
			182,
		),
		PAGE.marginX,
		96,
	);
};

const normalizeItem = (index: number, item?: CotizacionItem): CotizacionItem => ({
	index,
	description: item?.description ?? '',
	amount: item?.amount ?? 0,
	price: item?.price ?? 0,
	total: item?.total ?? 0,
});

const formatQuantity = (value: number) => {
	const safeValue = Number.isFinite(value) ? value : 0;

	return safeValue.toLocaleString('es-PE', {
		maximumFractionDigits: 2,
	});
};

const drawTableHeader = (doc: PdfDocument, y: number) => {
	for (const column of TABLE.columns) {
		drawCell(
			doc,
			column.x,
			y,
			column.width,
			TABLE.headerHeight,
			column.label,
			{
				align: column.align,
				fontSize: 7.8,
				style: 'bold',
				fillColor: COLORS.headerBg,
				textColor: COLORS.accentDark,
				borderColor: COLORS.border,
			},
		);
	}
};

const drawItemRow = (
	doc: PdfDocument,
	item: CotizacionItem,
	y: number,
	rowIndex: number,
) => {
	const fillColor = rowIndex % 2 === 0 ? COLORS.white : COLORS.tableAlt;

	drawCell(doc, 14, y, 14, TABLE.rowHeight, String(item.index), {
		fillColor,
		textColor: COLORS.muted,
	});
	drawCell(doc, 28, y, 18, TABLE.rowHeight, formatQuantity(item.amount), {
		fillColor,
	});
	drawCell(doc, 46, y, 84, TABLE.rowHeight, displayText(item.description), {
		align: 'left',
		fillColor,
	});
	drawCell(doc, 130, y, 32, TABLE.rowHeight, formatMoney(item.price), {
		align: 'right',
		fillColor,
	});
	drawCell(doc, 162, y, 34, TABLE.rowHeight, formatMoney(item.total), {
		align: 'right',
		fillColor,
		style: 'bold',
	});
};

const drawContinuationTitle = (doc: PdfDocument, data: CotizacionData) => {
	drawTopAccent(doc);

	setTextColor(doc, COLORS.accentDark);
	setFont(doc, 14, 'bold');
	doc.text(COMPANY.name, PAGE.marginX, PAGE.continuationTitleY);

	setTextColor(doc, COLORS.muted);
	setFont(doc, 8.5);
	doc.text('Cotización - continuación', 196, PAGE.continuationTitleY, {
		align: 'right',
	});
	doc.text(`Nro. ${displayText(data.number)}`, 196, PAGE.continuationTitleY + 5, {
		align: 'right',
	});
};

const addContinuationPage = (doc: PdfDocument, data: CotizacionData) => {
	doc.addPage();
	drawContinuationTitle(doc, data);
	drawTableHeader(doc, PAGE.continuationTableY);
	return PAGE.continuationTableY + TABLE.headerHeight;
};

const drawItemsTable = (doc: PdfDocument, data: CotizacionData) => {
	const items =
		data.items.length > 0 ? data.items : [normalizeItem(1, undefined)];
	let y = TABLE.y;

	drawTableHeader(doc, y);
	y += TABLE.headerHeight;

	for (const [rowIndex, item] of items.entries()) {
		if (y + TABLE.rowHeight > PAGE.bottomY) {
			y = addContinuationPage(doc, data);
		}

		drawItemRow(doc, item, y, rowIndex);
		y += TABLE.rowHeight;
	}

	return y;
};

const drawTotalRow = (
	doc: PdfDocument,
	label: string,
	value: string,
	y: number,
	emphasis = false,
) => {
	const fillColor = emphasis ? COLORS.accentDark : COLORS.white;
	const textColor = emphasis ? COLORS.white : COLORS.ink;
	const labelX = 122;
	const labelWidth = 34;
	const valueWidth = 40;

	drawCell(doc, labelX, y, labelWidth, 8.5, label, {
		align: 'right',
		fontSize: 8.8,
		style: 'bold',
		fillColor,
		textColor,
	});
	drawCell(doc, labelX + labelWidth, y, valueWidth, 8.5, value, {
		align: 'right',
		fontSize: 8.8,
		style: emphasis ? 'bold' : 'normal',
		fillColor,
		textColor,
	});
};

const drawTotals = (
	doc: PdfDocument,
	data: CotizacionData,
	startY: number,
) => {
	let y = startY + PAGE.totalsGap;

	if (y + PAGE.totalsHeight > PAGE.bottomY) {
		doc.addPage();
		drawContinuationTitle(doc, data);
		y = PAGE.continuationTableY;
	}

	drawTotalRow(doc, 'Sub total', formatMoney(data.subtotal), y);
	drawTotalRow(doc, 'IGV 18%', formatMoney(data.igv), y + 9.3);
	drawTotalRow(doc, 'Total', formatMoney(data.total), y + 18.6, true);

	return y + PAGE.totalsHeight;
};

const getTaxModeCondition = (data: CotizacionData) =>
	data.taxMode === 'included'
		? '1. Los precios son en moneda nacional e incluyen IGV.'
		: '1. Los precios son en moneda nacional y no incluyen IGV.';

const getConditionLines = (doc: PdfDocument, data: CotizacionData) =>
	[getTaxModeCondition(data), ...CONDITIONS_AFTER_TAX_MODE].flatMap((line) =>
		splitText(doc, line, 172),
	);

const drawConditions = (
	doc: PdfDocument,
	data: CotizacionData,
	startY: number,
) => {
	const lines = getConditionLines(doc, data);
	const panelHeight = Math.max(38, 18 + lines.length * 4.2);
	let y = startY + 12;

	if (y + panelHeight > PAGE.bottomY) {
		doc.addPage();
		drawContinuationTitle(doc, data);
		y = PAGE.continuationTableY;
	}

	drawPanel(doc, PAGE.marginX, y, 182, panelHeight, COLORS.surface);

	setTextColor(doc, COLORS.ink);
	setFont(doc, 10, 'bold');
	doc.text('Condiciones de la oferta', PAGE.marginX + 4, y + 8);

	setTextColor(doc, COLORS.muted);
	setFont(doc, 8.4);
	doc.text(lines, PAGE.marginX + 4, y + 16);
};

const drawFooter = (
	doc: PdfDocument,
	pageNumber: number,
	pageCount: number,
) => {
	doc.setLineWidth(0.55);
	setDrawColor(doc, COLORS.accent);
	doc.line(PAGE.marginX, PAGE.footerLineY, 196, PAGE.footerLineY);

	setTextColor(doc, COLORS.muted);
	setFont(doc, 7.5);
	doc.text(`${COMPANY.name} | RUC ${COMPANY.ruc}`, PAGE.marginX, PAGE.footerTextY);
	doc.text(`Página ${pageNumber} de ${pageCount}`, 196, PAGE.footerTextY, {
		align: 'right',
	});
};

const drawFooters = (doc: PdfDocument) => {
	const pageCount = doc.getNumberOfPages();

	for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
		doc.setPage(pageNumber);
		drawFooter(doc, pageNumber, pageCount);
	}
};

export const createCotizacionPdf = (data: CotizacionData) => {
	const doc = new jsPDF();

	drawHeader(doc, data);
	drawClientPanel(doc, data);
	drawIntro(doc);
	const endOfTableY = drawItemsTable(doc, data);
	const endOfTotalsY = drawTotals(doc, data, endOfTableY);
	drawConditions(doc, data, endOfTotalsY);
	drawFooters(doc);

	return doc;
};
