export const seconds = n => BigInt(n);
export const minutes = n => seconds(n) * 60n;
export const hours = n => minutes(n) * 60n;
export const days = n => hours(n) * 24n;
export const weeks = n => days(n) * 7n;
export const years = n => days(n) * 365n;
