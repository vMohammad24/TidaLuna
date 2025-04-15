/**
 * Resolves a relative path against a base path to produce an absolute path.
 * @param basePath - The absolute path serving as the starting point for resolution.
 * @param relativePath - The path to resolve, which can be relative (e.g., "./file.txt", "../folder/file.txt") or absolute (starting with "/").
 * @returns The resolved absolute path.
 */
export const resolveAbsolutePath = (basePath, relativePath) => {
	// Check if the relative path is already an absolute path.
	if (relativePath.startsWith("/")) {
		return relativePath; // If so, return it directly.
	}

	// Extract the base directory from the base path by removing the last segment (filename or last directory).
	const baseDirectory = basePath.replace(/\/[^/]+$/, "");

	// Delegate the actual path resolution to the dedicated function.
	return constructAbsolutePath(baseDirectory, relativePath);
};

/**
 * Constructs an absolute path from a base directory and a relative path using stack manipulation.
 * @param baseDirectory - The absolute directory to resolve the relative path against.
 * @param relativePath - The relative path to resolve.
 * @returns The constructed absolute path.
 */
export const constructAbsolutePath = (baseDirectory: string, relativePath: string) => {
	// Initialize an empty stack to hold the path segments.
	const pathSegments = [];

	// Split the base directory into individual directory names and add them to the stack.
	const baseDirParts = baseDirectory.split("/").filter(Boolean); // Split by '/', filter out empty strings.
	pathSegments.push(...baseDirParts);

	// Split the relative path into individual segments.
	const relativePathParts = relativePath.split("/");

	// Iterate through each segment of the relative path to build the absolute path.
	for (const segment of relativePathParts) {
		if (segment === "" || segment === ".") {
			// Ignore empty segments (resulting from consecutive slashes) and the current directory indicator ('.').
			continue;
		} else if (segment === "..") {
			// If the segment is '..', it indicates navigating one level up in the directory hierarchy.
			// Pop the last segment from the stack if the stack is not empty.
			if (pathSegments.length > 0) {
				pathSegments.pop();
			}
		} else {
			// For any other segment, it represents a directory or file name, so push it onto the stack.
			pathSegments.push(segment);
		}
	}

	// Join the segments in the stack with '/' to form the resolved absolute path and ensure it starts with '/'.
	return "/" + pathSegments.join("/");
};
