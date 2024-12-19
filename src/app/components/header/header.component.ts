import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { User } from 'firebase/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class HeaderComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser$: Observable<User | null> | undefined;

  constructor() {}

  logout() {
    this.authService.logout().subscribe(() => this.router.navigate(['login']));
  }

  ngOnInit() {
    this.currentUser$ = this.authService.getCurrentUser();
  }
}
