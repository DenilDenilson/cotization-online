export const ITEM_COUNT = 5;

export const COTIZACION_ITEM_INDEXES = Array.from(
	{ length: ITEM_COUNT },
	(_, index) => index + 1,
);

export type CotizacionItem = {
	index: number;
	description: string;
	amount: number;
	price: number;
	total: number;
};

export type CotizacionData = {
	number: string;
	date: string;
	companyName: string;
	companyRuc: string;
	clientContact: string;
	clientAddress: string;
	subject: string;
	items: CotizacionItem[];
	subtotal: number;
	igv: number;
	total: number;
};

const getStringField = (formData: FormData, name: string) => {
	const value = formData.get(name);
	return typeof value === 'string' ? value.trim() : '';
};

const hasFieldValue = (formData: FormData, name: string) =>
	getStringField(formData, name) !== '';

export const parseNumberField = (value: string) => {
	const parsedValue = Number.parseFloat(value.replace(',', '.'));
	return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const getNumberField = (formData: FormData, name: string) =>
	parseNumberField(getStringField(formData, name));

export const formatMoney = (value: number) => {
	const safeValue = Number.isFinite(value) ? value : 0;

	return `${safeValue.toLocaleString('es-PE', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})} S/.`;
};

export const displayText = (value: string) => value || '-';

export const createEmptyCotizacion = (): CotizacionData => ({
	number: '',
	date: '',
	companyName: '',
	companyRuc: '',
	clientContact: '',
	clientAddress: '',
	subject: '',
	items: COTIZACION_ITEM_INDEXES.map((index) => ({
		index,
		description: '',
		amount: 0,
		price: 0,
		total: 0,
	})),
	subtotal: 0,
	igv: 0,
	total: 0,
});

export const cotizacionFromFormData = (formData: FormData): CotizacionData => {
	const items = COTIZACION_ITEM_INDEXES.map((index) => {
		const amount = getNumberField(formData, `itemAmount${index}`);
		const price = getNumberField(formData, `itemPrice${index}`);

		return {
			index,
			description: getStringField(formData, `itemDescription${index}`),
			amount,
			price,
			total: amount * price,
		};
	});

	const calculatedSubtotal = items.reduce((sum, item) => sum + item.total, 0);
	const subtotal = hasFieldValue(formData, 'subtotal')
		? getNumberField(formData, 'subtotal')
		: calculatedSubtotal;
	const igv = hasFieldValue(formData, 'igv') ? getNumberField(formData, 'igv') : 0;
	const total = hasFieldValue(formData, 'total')
		? getNumberField(formData, 'total')
		: subtotal + igv;

	return {
		number: getStringField(formData, 'nCotization'),
		date: getStringField(formData, 'dateCotization'),
		companyName: getStringField(formData, 'nameCompany'),
		companyRuc: getStringField(formData, 'rucCompany'),
		clientContact: getStringField(formData, 'nameClient'),
		clientAddress: getStringField(formData, 'directionClient'),
		subject: getStringField(formData, 'asunto'),
		items,
		subtotal,
		igv,
		total,
	};
};

export const cotizacionTitle = (data: CotizacionData) =>
	`Cotización #${data.number || 'sin número'}`;

export const cotizacionFilename = (data: CotizacionData) => {
	const number = data.number.replace(/[\\/:*?"<>|\s]+/g, '-');
	return `cotizacion#${number || 'sin-numero'}.pdf`;
};
