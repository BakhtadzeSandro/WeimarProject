import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from 'firebase/auth';
import { OverlayModule } from 'primeng/overlay';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/index';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule, OverlayModule],
})
export class HeaderComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  isTabletOrSmaller: boolean = window.innerWidth < 992;

  currentUser$: Observable<User | null> | undefined;

  overlayVisible = false;

  constructor() {}

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.isTabletOrSmaller = window.innerWidth < 992;
  }

  toggleOverlay() {
    if (this.isTabletOrSmaller) {
      this.overlayVisible = !this.overlayVisible;
    }
  }

  logout() {
    this.authService.logout().subscribe(() => this.router.navigate(['login']));
    this.overlayVisible = false;
  }

  ngOnInit() {
    this.currentUser$ = this.authService.getCurrentUser();
  }
}
