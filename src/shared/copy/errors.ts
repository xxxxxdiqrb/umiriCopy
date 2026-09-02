export const CopyStage = {
  Collect: 'collect',
  Translation: 'translation',
  Image: 'image',
  Screenshot: 'screenshot',
  Compose: 'compose',
  Resource: 'resource',
} as const;

export type CopyStage = (typeof CopyStage)[keyof typeof CopyStage];

export class CopyStageError extends Error {
  public readonly cause?: unknown;
  constructor(
    public readonly stage: CopyStage,
    message: string,
    cause?: unknown,
  ) {
    super(message);
    if (cause !== undefined) this.cause = cause;
    this.name = 'CopyStageError';
  }
}

export function toCopyStageError(
  stage: CopyStage,
  message: string,
  error: unknown,
): CopyStageError {
  return error instanceof CopyStageError ? error : new CopyStageError(stage, message, error);
}

export async function withCopyStage<T>(
  stage: CopyStage,
  message: string,
  action: () => Promise<T>,
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    throw toCopyStageError(stage, message, error);
  }
}
