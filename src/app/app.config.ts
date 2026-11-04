import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';
import { firebaseConfig } from '../../environment';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { ConfirmationService } from 'primeng/api';
import { provideToastr } from 'ngx-toastr';
import { provideAnimations } from '@angular/platform-browser/animations';

const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const palette = (color: string) =>
  Object.fromEntries(shades.map((shade) => [shade, `{${color}.${shade}}`]));

// Flat, Swiss-style PrimeNG: square corners, ink as the primary colour, signal orange-red for
// focus and selection. Mirrors the tokens in styles.scss.
const WeimarPreset = definePreset(Aura, {
  primitive: {
    borderRadius: { none: '0', xs: '0', sm: '0', md: '0', lg: '0', xl: '0' },
  },
  semantic: {
    primary: palette('neutral'),
    focusRing: { width: '2px', style: 'solid', color: '#ff3b00', offset: '2px' },
    colorScheme: {
      light: {
        surface: { 0: '#ffffff', ...palette('stone') },
        primary: {
          color: '#111111',
          contrastColor: '#ffffff',
          hoverColor: '#333333',
          activeColor: '#000000',
        },
        highlight: {
          background: '#ff3b00',
          focusBackground: '#ff3b00',
          color: '#111111',
          focusColor: '#111111',
        },
        formField: {
          background: '#ffffff',
          borderColor: '#111111',
          hoverBorderColor: '#111111',
          focusBorderColor: '#111111',
        },
      },
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    ConfirmationService,
    provideToastr({
      timeOut: 5000,
      positionClass: 'toast-top-center',
      preventDuplicates: true,
    }),
    provideRouter(routes),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    providePrimeNG({
      theme: {
        preset: WeimarPreset,
        options: {
          darkModeSelector: 'none',
        },
      },
    }),
  ],
};
