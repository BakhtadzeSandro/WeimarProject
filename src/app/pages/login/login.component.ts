import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    IftaLabelModule,
    InputTextModule,
    ButtonModule,
    RouterModule,
  ],
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);

  constructor() {}

  signInWithGoogle() {
    this.authService.signInWithGoodle();
  }

  ngOnInit() {}
}
