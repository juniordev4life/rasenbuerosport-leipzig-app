/** Any image type except SVG, which can carry script; see storage.rules. */
const UPLOADABLE_IMAGE_TYPE = /^image\/(?!svg).+/;

/**
 * Whether a file type passes the Storage rules' image check: any image type
 * except SVG, compared case-insensitively like the rules do.
 * @param {string|undefined} type - MIME type, usually `File.type`
 * @returns {boolean}
 * @example
 * isUploadableImageType("image/png"); // → true
 * isUploadableImageType("image/svg+xml"); // → false
 */
export function isUploadableImageType(type) {
	return UPLOADABLE_IMAGE_TYPE.test((type ?? "").toLowerCase());
}

/**
 * Resizes an image file to a maximum width, preserving aspect ratio, and
 * re-encodes it as JPEG. Returns the original file if it is narrow enough and
 * not larger than `maxBytes`; a narrow file over `maxBytes` is re-encoded at
 * its own width.
 * @param {File} file - The image file to resize
 * @param {number} [maxWidth] - Maximum width in pixels
 * @param {number} [maxBytes] - Largest file size returned unchanged
 * @returns {Promise<Blob>} - Resized image as JPEG blob, or original file
 * @example
 * // A 1170 px wide, 12 MiB PNG screenshot comes back as a 1170 px JPEG
 * const blob = await resizeImage(file, 1920, 10 * 1024 * 1024);
 */
export function resizeImage(
	file,
	maxWidth = 1920,
	maxBytes = Number.POSITIVE_INFINITY,
) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			if (img.width <= maxWidth && file.size <= maxBytes) {
				URL.revokeObjectURL(img.src);
				resolve(file);
				return;
			}

			const scale = Math.min(1, maxWidth / img.width);
			const canvas = document.createElement("canvas");
			canvas.width = Math.round(img.width * scale);
			canvas.height = Math.round(img.height * scale);

			const ctx = canvas.getContext("2d");
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
			URL.revokeObjectURL(img.src);

			canvas.toBlob(
				(blob) =>
					blob ? resolve(blob) : reject(new Error("Canvas toBlob failed")),
				"image/jpeg",
				0.85,
			);
		};
		img.onerror = () => {
			URL.revokeObjectURL(img.src);
			reject(new Error("Failed to load image"));
		};
		img.src = URL.createObjectURL(file);
	});
}
