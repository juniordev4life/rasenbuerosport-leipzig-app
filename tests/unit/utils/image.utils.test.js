import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	isUploadableImageType,
	resizeImage,
} from "../../../src/lib/utils/image.utils.js";

describe("isUploadableImageType", () => {
	it.each([
		"image/jpeg",
		"image/png",
		"image/webp",
		"image/heic",
		"Image/PNG",
	])("accepts %s", (type) => {
		expect(isUploadableImageType(type)).toBe(true);
	});

	it.each([
		"image/svg+xml",
		"IMAGE/SVG+XML",
		"text/html",
		"application/pdf",
		"image/",
		"",
		undefined,
	])("rejects %s, as storage.rules does", (type) => {
		expect(isUploadableImageType(type)).toBe(false);
	});
});

describe("resizeImage", () => {
	let canvasSize;

	/**
	 * Makes `new Image()` report the given size and load as soon as its src
	 * is set; jsdom does not decode images.
	 * @param {number} w
	 * @param {number} h
	 */
	function stubImage(w, h) {
		vi.stubGlobal(
			"Image",
			class {
				width = w;
				height = h;
				set src(value) {
					this.url = value;
					queueMicrotask(() => this.onload());
				}
				get src() {
					return this.url;
				}
			},
		);
	}

	beforeEach(() => {
		canvasSize = null;
		URL.createObjectURL = vi.fn(() => "blob:image");
		URL.revokeObjectURL = vi.fn();
		// jsdom has no canvas backend; record what would be drawn instead.
		vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
			drawImage: vi.fn(),
		});
		vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
			function (callback, type) {
				canvasSize = { width: this.width, height: this.height };
				callback(new Blob(["jpeg"], { type }));
			},
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("returns a narrow file under the size cap unchanged", async () => {
		stubImage(1170, 2532);
		const file = new File(["png"], "shot.png", { type: "image/png" });

		const result = await resizeImage(file, 1920, 1024);

		expect(result).toBe(file);
		expect(canvasSize).toBeNull();
	});

	it("re-encodes a narrow file over the size cap at its own width", async () => {
		stubImage(1170, 2532);
		const file = new File([new Uint8Array(2048)], "shot.png", {
			type: "image/png",
		});

		const result = await resizeImage(file, 1920, 1024);

		expect(result.type).toBe("image/jpeg");
		expect(canvasSize).toEqual({ width: 1170, height: 2532 });
	});

	it("scales a wide image down to the maximum width", async () => {
		stubImage(4032, 3024);
		const file = new File(["jpg"], "photo.jpg", { type: "image/jpeg" });

		await resizeImage(file);

		expect(canvasSize).toEqual({ width: 1920, height: 1440 });
	});
});
