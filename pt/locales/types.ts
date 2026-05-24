export type Language = 'de' | 'en';

export type Strings<T extends Record<string, string>> = {
  [K in Language]: T;
};
