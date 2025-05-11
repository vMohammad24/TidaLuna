export const statusOK = (status: number): boolean => status !== undefined && status >= 200 && status < 300;

export const rejectNotOk = (res: Response): Response => {
	if (statusOK(res.status)) return res;
	throw new Error(`${res.status} ${res.statusText}`);
};

export const toJson = <T>(res: Response): Promise<T> => res.json();
export const toText = (res: Response): Promise<string> => res.text();

export const json = <T>(...args: Parameters<typeof fetch>) =>
	fetch(...args)
		.then(rejectNotOk)
		.then(toJson<T>);

export const text = (...args: Parameters<typeof fetch>) =>
	fetch(...args)
		.then(rejectNotOk)
		.then(toText);
