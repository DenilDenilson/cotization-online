export const IGV_RATE = 0.18;

export type TaxMode = 'exclusive' | 'included';

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
	taxMode: TaxMode;
	items: CotizacionItem[];
	subtotal: number;
	igv: number;
	total: number;
};

const getStringField = (formData: FormData, name: string) => {
	const value = formData.get(name);
	return typeof value === 'string' ? value.trim() : '';
};

const getStringFields = (formData: FormData, name: string) =>
	formData
		.getAll(name)
		.map((value) => (typeof value === 'string' ? value.trim() : ''));

const hasFieldValue = (formData: FormData, name: string) =>
	getStringField(formData, name) !== '';

const getBooleanField = (formData: FormData, name: string) =>
	formData.get(name) === 'true';

const getTaxModeField = (formData: FormData): TaxMode =>
	getStringField(formData, 'taxMode') === 'included' ? 'included' : 'exclusive';

export const parseNumberField = (value: string) => {
	const parsedValue = Number.parseFloat(value.replace(',', '.'));
	return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const getNumberField = (formData: FormData, name: string) =>
	parseNumberField(getStringField(formData, name));

export const roundMoney = (value: number) => {
	const safeValue = Number.isFinite(value) ? value : 0;
	return Math.round((safeValue + Number.EPSILON) * 100) / 100;
};

export const roundMoneyForConsumer = (value: number) => {
	const safeValue = Number.isFinite(value) ? value : 0;
	return Math.floor((safeValue + Number.EPSILON) * 100) / 100;
};

export const toMoneyInputValue = (value: number) => roundMoney(value).toFixed(2);

export const formatMoney = (value: number) => {
	const safeValue = Number.isFinite(value) ? value : 0;

	return `${roundMoney(safeValue).toLocaleString('es-PE', {
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
	taxMode: 'exclusive',
	items: [
		{
			index: 1,
			description: '',
			amount: 0,
			price: 0,
			total: 0,
		},
	],
	subtotal: 0,
	igv: 0,
	total: 0,
});

export const calculateCotizacionTotals = (
	items: Pick<CotizacionItem, 'amount' | 'price' | 'total'>[],
	taxMode: TaxMode,
) => {
	const itemsTotal = roundMoneyForConsumer(
		items.reduce((sum, item) => sum + item.total, 0),
	);

	if (taxMode === 'included') {
		const subtotal = roundMoney(itemsTotal / (1 + IGV_RATE));
		const igv = roundMoney(itemsTotal - subtotal);

		return {
			subtotal,
			igv,
			total: itemsTotal,
		};
	}

	const subtotal = itemsTotal;
	const igv = roundMoneyForConsumer(subtotal * IGV_RATE);
	const total = roundMoneyForConsumer(subtotal + igv);

	return {
		subtotal,
		igv,
		total,
	};
};

const cotizacionItemsFromFormData = (formData: FormData) => {
	const descriptions = getStringFields(formData, 'itemDescription');
	const amounts = getStringFields(formData, 'itemAmount');
	const prices = getStringFields(formData, 'itemPrice');
	const itemCount = Math.max(descriptions.length, amounts.length, prices.length, 1);

	return Array.from({ length: itemCount }, (_, index) => {
		const amount = parseNumberField(amounts[index] ?? '');
		const price = parseNumberField(prices[index] ?? '');
		const total = roundMoneyForConsumer(amount * price);

		return {
			index: index + 1,
			description: descriptions[index] ?? '',
			amount,
			price,
			total,
		};
	});
};

export const cotizacionFromFormData = (formData: FormData): CotizacionData => {
	const taxMode = getTaxModeField(formData);
	const items = cotizacionItemsFromFormData(formData);
	const calculatedTotals = calculateCotizacionTotals(items, taxMode);
	const hasManualTotals = getBooleanField(formData, 'manualTotals');
	const subtotal = hasManualTotals && hasFieldValue(formData, 'subtotal')
		? getNumberField(formData, 'subtotal')
		: calculatedTotals.subtotal;
	const igv = hasManualTotals && hasFieldValue(formData, 'igv')
		? getNumberField(formData, 'igv')
		: calculatedTotals.igv;
	const total = hasManualTotals && hasFieldValue(formData, 'total')
		? getNumberField(formData, 'total')
		: calculatedTotals.total;

	return {
		number: getStringField(formData, 'nCotization'),
		date: getStringField(formData, 'dateCotization'),
		companyName: getStringField(formData, 'nameCompany'),
		companyRuc: getStringField(formData, 'rucCompany'),
		clientContact: getStringField(formData, 'nameClient'),
		clientAddress: getStringField(formData, 'directionClient'),
		subject: getStringField(formData, 'asunto'),
		taxMode,
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
