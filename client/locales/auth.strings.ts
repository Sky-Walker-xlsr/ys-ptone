import type { Language } from './types';

export const auth: Record<Language, Record<string, string>> = {
  de: {
    loginTitle:     'Willkommen zurück',
    loginSub:       'Melde dich bei deinem PT-Dashboard an.',
    loginSubClient: 'Melde dich bei deinem Training an.',
    email:          'E-Mail',
    password:       'Passwort',
    loginBtn:       'Anmelden',
    loading:        'Wird geladen…',
    loginError:     'E-Mail oder Passwort falsch.',
    googleBtn:      'Mit Google anmelden',
    orDivider:      'oder',
    noAccount:      'Noch kein Account?',
    signUp:         'Registrieren',
    backToHome:     'Zurück zur Website',
  },
  en: {
    loginTitle:     'Welcome back',
    loginSub:       'Sign in to your PT dashboard.',
    loginSubClient: 'Sign in to your training.',
    email:          'Email',
    password:       'Password',
    loginBtn:       'Sign in',
    loading:        'Loading…',
    loginError:     'Wrong email or password.',
    googleBtn:      'Continue with Google',
    orDivider:      'or',
    noAccount:      'No account yet?',
    signUp:         'Register',
    backToHome:     'Back to website',
  },
};
