import type { VoidLike } from "@inrixia/helpers";
import { sanitizeData } from "./sanitizeData";

export type LogConsumer = (...data: any[]) => VoidLike;
export type Logger<T extends LogConsumer = LogConsumer> = {
	(...data: Parameters<T>): VoidLike;
	/** Prefix log with given context */
	withContext(...context: Parameters<T>): {
		(...data: Parameters<T>): VoidLike;
		/** Throw data after logging */
		throw: (...data: Parameters<T>) => VoidLike;
	};
	throw: (...data: Parameters<T>) => VoidLike;
};
export const createLogger = <T extends LogConsumer>(source: string, logConsumer: T): Logger<T> => {
	const logger = (...data: any[]) => logConsumer(source, ...data);
	logger.withContext = (...context: any[]) => {
		const logWithContext = (...data: any[]) => logConsumer(source, ...context, ...data);
		logWithContext.throw = (...data: any[]) => {
			logWithContext(...data);
			if (data?.[0] instanceof Error) throw data?.[0];
			throw new Error(sanitizeData(source, ...data));
		};
		return logWithContext;
	};
	logger.throw = (...data: any[]) => {
		logger(...data);
		if (data?.[0] instanceof Error) throw data?.[0];
		throw new Error(sanitizeData(source, ...data));
	};
	return logger;
};
