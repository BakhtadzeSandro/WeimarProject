import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { filter, map } from 'rxjs';
import { HeaderComponent } from './components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, ConfirmDialog],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'WeimarProject';

  // True while a route is resolving, including the first sign-in check.
  navigating = toSignal(
    inject(Router).events.pipe(
      filter(
        (event) =>
          event instanceof NavigationStart ||
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
      ),
      map((event) => event instanceof NavigationStart)
    ),
    { initialValue: true }
  );
}
