import { Memo } from "@inrixia/helpers";
import { findModuleProperty } from "@luna/core";

type TidalCredentials = {
	clientId: string;
	clientUniqueKey: string;
	expires: number;
	grantedScopes: string[];
	requestedScopes: string[];
	token: string;
	userId: string;
};

const _getCredentialsMemo = Memo.argless(() =>
	findModuleProperty<() => Promise<TidalCredentials>>((key, value) => key === "getCredentials" && typeof value === "function")!.value!(),
);
export const getCredentials = async () => {
	const creds = await _getCredentialsMemo();
	if (creds.expires < Date.now()) {
		_getCredentialsMemo.clear();
		return _getCredentialsMemo();
	}
	return creds;
};
