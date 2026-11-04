import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ShawarmaGraphicComponent } from '../../components/shawarma-graphic/shawarma-graphic.component';
import { AuthService } from '../../services/auth.service';
import { DEMO_LAYERS } from '../../utils/graphic.utils';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [ButtonModule, ShawarmaGraphicComponent],
})
export class LoginComponent {
  private authService = inject(AuthService);

  demoLayers = DEMO_LAYERS;

  signInWithGoogle() {
    this.authService.signInWithGoodle();
  }
}
