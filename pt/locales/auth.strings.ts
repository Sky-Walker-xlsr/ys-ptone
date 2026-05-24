import type { Language } from './types';

export const auth: Record<Language, Record<string, string>> = {
  de: {
    loginTitle:     'Willkommen zurück',
    loginSub:       'Melde dich bei deinem PT-Dashboard an.',
    email:          'E-Mail',
    password:       'Passwort',
    forgotPassword: 'Vergessen?',
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
    email:          'Email',
    password:       'Password',
    forgotPassword: 'Forgot?',
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
