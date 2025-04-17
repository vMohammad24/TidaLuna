import type { Signal, VoidLike } from "@inrixia/helpers";
import { actions } from "../window.luna.js";

type LoggerFunc = (...data: any[]) => VoidLike;

type Logger<T extends LoggerFunc = LoggerFunc> = {
	(...data: Parameters<T>): VoidLike;
	/** Prefix log with given context */
	withContext(...context: Parameters<T>): {
		(...data: Parameters<T>): VoidLike;
		/** Throw data after logging */
		throw: (...data: Parameters<T>) => VoidLike;
	};
};
type Messenger = {
	(message: unknown): VoidLike;
	/** Prefix message with given context */
	withContext(context: string): {
		(message: unknown): VoidLike;
		/** Throw message after logging */
		throw: (message: unknown) => VoidLike;
	};
};
/**
 * Helper for providing contextual logging to both console and tidal messages (trace.msg.log etc)
 * @param source Prefixed to every log
 * @param errSignal Optional, Set to console.err args (excluding source prefix) when .err called
 * @example
 * const trace = Tracer("[My Tracer]");
 *
 * // trace.err/log/warn is equivilent to console.error/log/warn
 *
 * // myValue is undefined if someFunc throws. Error plus context and source is logged
 * const myValue = await someFunc().catch(trace.err.withContext("someFunc had a error"));
 *
 * // Error plus context and source is logged, error is re thrown
 * await someFunc().catch(trace.err.withContext("someFunc had a error").throw);
 *
 * // Log to console and display a tidal alert message
 * await someFunc().catch(trace.msg.err.withContext("someFunc had a error").throw);
 */
export const Tracer = (window.luna.Tracer = (source: string, errSignal?: Signal<string | undefined>) => {
	const createLogger = <T extends LoggerFunc>(logger: T): Logger<T> => {
		const _logger = (...data: Parameters<T>) => logger(source, ...data);
		_logger.withContext = (...context: Parameters<T>) => {
			const logWithContext = (...data: Parameters<T>) => logger(source, ...context, ...data);
			logWithContext.throw = (...data: Parameters<T>) => {
				logWithContext(...data);
				throw data?.[0];
			};
			return logWithContext;
		};

		return _logger;
	};

	const log = createLogger(console.log);
	const warn = createLogger(console.warn);
	const err = createLogger(
		errSignal
			? (source, ...args) => {
					console.error(source, ...args);
					errSignal._ = args
						.map((arg) => {
							if (arg instanceof Error) return arg.message;
							if (typeof arg === "object") return "";
							return String(arg);
						})
						.join(" ");
				}
			: console.error,
	);
	const debug = createLogger(console.debug);

	const createMessager = (
		logger: Logger,
		messager: "message/MESSAGE_INFO" | "message/MESSAGE_WARN" | "message/MESSAGE_ERROR",
		severity: "DEBUG" | "ERROR" | "INFO" | "WARN",
	): Messenger => {
		const _messager = (message: unknown) => {
			logger(message);
			actions[messager]?.({ message: `${source} - ${message}`, category: "OTHER", severity });
		};
		_messager.withContext = (context: string) => {
			const loggerWithContext = logger.withContext(context);
			const msgWithContext = (message: unknown) => {
				loggerWithContext(message);
				if (message instanceof Error) message = message.message;
				actions[messager]?.({ message: `${source} (${context}) - ${message}`, category: "OTHER", severity });
			};
			msgWithContext.throw = (message: unknown) => {
				msgWithContext(message);
				throw message;
			};
			return msgWithContext;
		};
		return _messager;
	};

	return {
		log,
		warn,
		err,
		debug,
		msg: {
			log: createMessager(log, "message/MESSAGE_INFO", "INFO"),
			warn: createMessager(warn, "message/MESSAGE_WARN", "WARN"),
			err: createMessager(err, "message/MESSAGE_ERROR", "ERROR"),
		},
	};
});
export const llTrace = Tracer("[Luna.lib]");
