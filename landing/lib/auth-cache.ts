const KEY = 'ptone_was_logged_in';

export function markAsLoggedIn()  { localStorage.setItem(KEY, '1'); }
export function markAsLoggedOut() { localStorage.removeItem(KEY); }
export function wasLoggedIn()     { return localStorage.getItem(KEY) === '1'; }
