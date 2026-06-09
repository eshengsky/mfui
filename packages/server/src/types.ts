export type MFUIServerError = Error & {
  code: string;
  status: number;
};
