/**
 * Resizes an image file to a maximum width, preserving aspect ratio.
 * Returns the original file if it's already small enough.
 * @param {File} file - The image file to resize
 * @param {number} maxWidth - Maximum width in pixels
 * @returns {Promise<Blob>} - Resized image as JPEG blob, or original file
 */
export function resizeImage(file, maxWidth = 1920) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			if (img.width <= maxWidth) {
				URL.revokeObjectURL(img.src);
				resolve(file);
				return;
			}

			const scale = maxWidth / img.width;
			const canvas = document.createElement("canvas");
			canvas.width = maxWidth;
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
