export class ReadinessResponseDto {
  status: string;
  checks: {
    database: string;
  };
}
