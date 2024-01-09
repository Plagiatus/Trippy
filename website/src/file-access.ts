export default class FileAccess {
	public async openFileDialog(options?: {accept?: string}): Promise<File> {
		return new Promise((res, rej) => {
			const fileInput = document.createElement("input");
			fileInput.type = "file";
			fileInput.accept = options?.accept ?? "";
			fileInput.click();
	
			fileInput.addEventListener("change", () => {
				const file = fileInput.files?.item(0)
				if (file) {
					res(file);
				} else {
					rej("No file was selected.");
				}
			});
		});
	}

	public async blobToBase64Uri(blob: Blob): Promise<string> {
		return new Promise<string>(res => {
			const fileReader = new FileReader();
			fileReader.onloadend = () => {
				res(fileReader.result + "");
			}
			fileReader.readAsDataURL(blob);
		});
	}

	public async imageFromFile(imageFile: File): Promise<HTMLImageElement> {
		const blobUrl = URL.createObjectURL(imageFile);
		try {
			return await new Promise((res, rej) => {
				const imageElement = document.createElement("img");
				imageElement.onload = () => {
					res(imageElement);
				}
				imageElement.onerror = (error) => {
					rej(error);
				}
				
				imageElement.src = blobUrl;
			});
		} finally {
			URL.revokeObjectURL(blobUrl);
		}
	}

	public bitmapToBlob(bitmap: ImageBitmap) {
		const canvas = document.createElement("canvas");
		canvas.width = bitmap.width;
		canvas.height = bitmap.height;

		const context = canvas.getContext("2d")!;
		context.drawImage(bitmap, 0, 0);

		return new Promise<Blob>((res, rej) => {
			canvas.toBlob((blob) => {
				if (blob) {
					res(blob);
				} else {
					rej(new Error("Failed to convert to blob"));
				}
			});
		});
	}
}