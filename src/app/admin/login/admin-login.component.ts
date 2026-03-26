import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStore } from '../../core/auth/auth-store';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css'],
})
export class AdminLoginComponent {
  private authService = inject(AuthService);
  private auth        = inject(AuthStore);
  private router      = inject(Router);

  email    = '';
  password = '';
  error    = signal('');
  loading  = signal(false);
  year     = new Date().getFullYear();
  show2FA   = signal(false);
  otpCode   = signal('');
  tempUser  = ''; // Para guardar el username/email entre pasos

  submit(): void {
    const cleanEmail = this.email?.trim();
    const cleanPass = this.password?.trim();

    console.log('[DEBUG] Submit pulsado. Email:', cleanEmail, 'Pass length:', cleanPass?.length);
    if (!cleanEmail || !cleanPass) {
      console.warn('[DEBUG] Formulario incompleto');
      return;
    }
    this.loading.set(true);
    this.error.set('');

    this.authService.login({ email: cleanEmail, password: cleanPass }, true).subscribe({
      next: (res: any) => {
        if (res.requires2FA) {
          this.show2FA.set(true);
          this.tempUser = res.username || this.email;
          this.loading.set(false);
        } else {
          this.handleLoginSuccess();
        }
      },
      error: (err: any) => this.handleError(err),
    });
  }

  verifyOtp(): void {
    if (this.otpCode().length !== 6) return;
    this.loading.set(true);
    this.error.set('');

    this.authService.verify2FA(this.tempUser, this.otpCode(), true).subscribe({
      next: () => this.handleLoginSuccess(),
      error: (err: any) => {
        this.error.set('Código de verificación incorrecto.');
        this.loading.set(false);
      }
    });
  }

  private handleLoginSuccess(): void {
    if (this.auth.isAdminLoggedIn()) {
      this.router.navigate(['/dashboard']);
    } else {
      this.auth.clearAdmin();
      this.error.set('Esta cuenta no tiene privilegios de administrador.');
    }
    this.loading.set(false);
  }

  private handleError(err: any): void {
    const errorMsg = err.error?.error || err.error?.message || 'Credenciales incorrectas o servidor no disponible';
    this.error.set(errorMsg);
    this.loading.set(false);
  }
}
