export class AppError {
  public readonly status_code: number;
  public readonly error_code: string;
  public readonly error_description: string;

  constructor(
    status_code: number,
    error_code: string,
    error_description: string
  ) {
    this.status_code = status_code;
    this.error_code = error_code;
    this.error_description = error_description;
  }
}
