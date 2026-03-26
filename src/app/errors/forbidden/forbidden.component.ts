import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-login-wrap">
      <div class="mist-layer"></div>
      <div class="ritual-container">
        <div class="ancient-logo" style="margin-bottom: 3rem; display: flex; flex-direction: column; align-items: center; gap: 1rem;">
          <img src="/logo.webp" alt="Nexus Logo" style="height: 80px; filter: drop-shadow(0 0 20px rgba(255,255,255,0.4));">
          <div style="font-size: 2.5rem; letter-spacing: 0.5rem; opacity: 0.8;">403</div>
        </div>
        <div class="ritual-2fa-msg" style="font-size: 1.2rem; margin-bottom: 3rem; text-align: center; color: #fca5a5;">
          — ACCESO DENEGADO —<br>
          <span style="font-size: 0.9rem; opacity: 0.7; font-family: 'Playfair Display', serif; display: block; margin-top: 1rem;">
            Tu esencia no posee los permisos necesarios para este ritual.
          </span>
        </div>
        <button class="ritual-btn" (click)="goBack()" style="width: 100%">
          <span>REGRESAR AL NIVEL BASE</span>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['../../admin/login/admin-login.component.css']
})
export class ForbiddenComponent {
  private router = inject(Router);
  goBack() { this.router.navigate(['/']); }
}
