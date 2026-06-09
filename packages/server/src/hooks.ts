import type { ProjectedMessage } from '@mfui/protocol';

export type MFUIMessageHandler = (
  message: ProjectedMessage,
) => void | Promise<void>;

export type MFUIErrorHandler = (error: unknown) => void | Promise<void>;

export type MFUIResponseHooks = {
  onMessage?: MFUIMessageHandler;
  onError?: MFUIErrorHandler;
};
