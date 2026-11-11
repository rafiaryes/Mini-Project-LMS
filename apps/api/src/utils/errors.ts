export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    message: string = "Autentikasi diperlukan. Silakan login terlebih dahulu."
  ) {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message: string = "Anda tidak memiliki izin untuk mengakses resource ini."
  ) {
    super(403, "FORBIDDEN", message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource tidak ditemukan.") {
    super(404, "NOT_FOUND", message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Data sudah ada atau terjadi konflik.") {
    super(409, "CONFLICT", message);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Permintaan tidak valid.") {
    super(400, "BAD_REQUEST", message);
  }
}

