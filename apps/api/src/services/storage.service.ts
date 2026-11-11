import { mkdir } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { BadRequestError } from "../utils/errors";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const UPLOAD_MAX_BYTES =
  Number(process.env.UPLOAD_MAX_BYTES) || 10 * 1024 * 1024; // 10MB

// Allowlist extensions & MIME types per PRD Section 14.4
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
  "image/png",
  "image/jpeg",
]);

export interface UploadedFileInfo {
  fileKey: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
}

export class StorageService {
  private uploadDir: string;
  private maxBytes: number;

  constructor(uploadDir = UPLOAD_DIR, maxBytes = UPLOAD_MAX_BYTES) {
    this.uploadDir = uploadDir;
    this.maxBytes = maxBytes;
  }

  private async ensureDir() {
    await mkdir(this.uploadDir, { recursive: true });
  }

  /**
   * Save an uploaded file to persistent storage with a randomized safe key.
   */
  async saveFile(file: File): Promise<UploadedFileInfo> {
    if (!file || !(file instanceof File)) {
      throw new BadRequestError("Berkas tidak valid.");
    }

    if (file.size > this.maxBytes) {
      throw new BadRequestError(
        `Ukuran berkas (${(file.size / 1024 / 1024).toFixed(
          2
        )} MB) melebihi batas maksimum ${(
          this.maxBytes /
          1024 /
          1024
        ).toFixed(0)} MB.`
      );
    }

    // Validate MIME type
    if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
      throw new BadRequestError(
        `Tipe berkas "${file.type}" tidak diizinkan. Gunakan format PDF, DOCX, TXT, ZIP, atau Gambar (PNG/JPEG).`
      );
    }

    await this.ensureDir();

    const originalName = file.name || "unnamed_file";
    const ext = extname(originalName).toLowerCase();
    const fileKey = `${crypto.randomUUID()}${ext}`;
    const destinationPath = join(this.uploadDir, fileKey);

    // Write file content safely using Bun.write
    await Bun.write(destinationPath, file);

    return {
      fileKey,
      originalFileName: originalName,
      mimeType: file.type || "application/octet-stream",
      fileSizeBytes: file.size,
    };
  }

  /**
   * Get file path for authorized download.
   */
  getFilePath(fileKey: string): string {
    // Prevent path traversal by extracting only the base file name and stripping hazardous characters
    const safeKey = basename(fileKey).replace(/[^a-zA-Z0-9_.-]/g, "");
    return join(this.uploadDir, safeKey);
  }

  /**
   * Delete a file if it exists.
   */
  async deleteFile(fileKey: string): Promise<void> {
    try {
      const filePath = this.getFilePath(fileKey);
      const file = Bun.file(filePath);
      if (await file.exists()) {
        const { unlink } = await import("node:fs/promises");
        await unlink(filePath);
      }
    } catch {
      // Ignore errors when deleting orphaned files
    }
  }
}

export const storageService = new StorageService();
