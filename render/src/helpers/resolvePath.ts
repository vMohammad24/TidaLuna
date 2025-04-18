/**
 * Resolves a relative path against a base path to produce an absolute path using the URL constructor.
 * Assumes paths use '/' separators.
 * @param basePath - The absolute path serving as the starting point (e.g., /folder/file.txt).
 * @param relativePath - The path to resolve (e.g., ../other.txt).
 * @returns The resolved absolute path (e.g., /folder/other.txt).
 */
export const resolveAbsolutePath = (basePath: string, relativePath: string): string => {
	// Create a base URL. 'file://' is a common dummy base for path manipulation.
	// Ensure the base path ends with '/' if it represents a directory context.
	const baseDirectory = basePath.replace(/\/[^/]*$/, "/");
	const baseUrl = new URL(baseDirectory, "file://");

	// Create a new URL by resolving the relative path against the base URL.
	const resolvedUrl = new URL(relativePath, baseUrl);

	// Return the pathname part of the resolved URL.
	return resolvedUrl.pathname;
};
