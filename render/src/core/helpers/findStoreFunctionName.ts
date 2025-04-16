/**
 * Finds the name of the getStore redux function based on it throwing `Error("No global store set")`
 */
export const findStoreFunctionName = (bundleCode) => {
	// Find index of store error typically seen inside getStore func
	const errorMessageIndex = bundleCode.indexOf('Error("No global store set")');
	if (errorMessageIndex === -1) return null;

	// Walk back to the function declaration
	for (let charIdx = errorMessageIndex - 1; charIdx > 0; charIdx--) {
		// If we arent at the func declaration continue to walk back
		if (bundleCode[charIdx] + bundleCode[charIdx + 1] != "()") continue;

		let strBuf = [];
		for (let nameIdx = charIdx - 1; nameIdx > 0; nameIdx--) {
			const char = bundleCode[nameIdx];

			// If we have the full name return the name
			if (char == " ") return strBuf.reverse().join("");
			strBuf.push(char);
		}
	}
	return null;
};
