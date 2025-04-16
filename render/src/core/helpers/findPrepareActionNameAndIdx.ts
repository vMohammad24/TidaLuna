/**
 * Finds the name and index of the Redux action handler? Based on the existance of `.payload,..."meta"in `
 */
export function findPrepareActionNameAndIdx(bundleCode) {
	const searchIdx = bundleCode.indexOf(`.payload,..."meta"in `);
	if (searchIdx === -1) return null;

	const sliced = bundleCode.slice(0, searchIdx);
	const funcIndex = sliced.lastIndexOf("{function");

	let strBuf = [];
	for (let nameIdx = bundleCode.slice(0, funcIndex).lastIndexOf("(") - 1; nameIdx > 0; nameIdx--) {
		const char = bundleCode[nameIdx];
		if (char == " ")
			return {
				name: strBuf.reverse().join(""),
				idx: nameIdx + 1,
			};

		strBuf.push(char);
	}
	return null;
}
