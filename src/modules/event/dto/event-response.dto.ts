export class EventResponseDto {
  id!: number;
  projectId!: number;
  name!: string;
  payload!: Record<string, unknown>;
  idempotencyKey!: string | null;
  createdAt!: Date;
}
