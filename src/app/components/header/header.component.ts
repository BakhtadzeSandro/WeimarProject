import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { User } from 'firebase/auth';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/index';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink],
})
export class HeaderComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser$: Observable<User | null> | undefined;

  today = new Date();

  constructor() {}

  logout() {
    this.authService.logout().subscribe(() => this.router.navigate(['login']));
  }

  ngOnInit() {
    this.currentUser$ = this.authService.getCurrentUser();
  }
}
