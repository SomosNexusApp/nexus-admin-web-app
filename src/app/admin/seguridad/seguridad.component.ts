import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSeguridadService, TwoFactorSetup } from '../services/admin-seguridad.service';

@Component({
  selector: 'app-seguridad-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page-header">
      <h1 class="ancient-title">Seguridad y Acceso Ritual</h1>
      <p class="ancient-subtitle">Protege tu cuenta con el oráculo de doble factor (2FA).</p>
    </div>

    <div class="ritual-grid">
      <!-- Tarjeta de Estado 2FA -->
      <div class="ritual-card glass-panel highlight">
        <div class="card-glow"></div>
        <div class="ritual-card-header">
          <div class="ritual-icon">
            <i class="fas" [class.fa-shield-alt]="!setup()?.enabled" [class.fa-check-circle]="setup()?.enabled"></i>
          </div>
          <h3>Estado de la Protección</h3>
        </div>

        <div class="ritual-card-body">
          <div class="status-indicator" [class.enabled]="setup()?.enabled">
            <span class="pulse-dot"></span>
            {{ setup()?.enabled ? 'PROTECCIÓN ACTIVA' : 'PROTECCIÓN DESACTIVADA' }}
          </div>
          
          <p class="status-description">
            {{ setup()?.enabled 
                ? 'Tu cuenta está protegida por un oráculo de 6 dígitos. Cada vez que inicies sesión desde un nuevo dispositivo, se te pedirá el código.' 
                : 'Tu cuenta solo está protegida por una contraseña. Te recomendamos activar el 2FA para evitar accesos no autorizados.' 
            }}
          </p>

          @if (!setup()?.enabled && !showSetup()) {
            <button class="ritual-btn primary" (click)="iniciarSetup()">
              ACTIVAR ORÁCULO DE SEGURIDAD
            </button>
          }

          @if (setup()?.enabled) {
            <div class="danger-zone">
              <p>¿Deseas revocar la protección? Necesitarás un código válido.</p>
              <div class="ritual-input-group">
                <input type="text" [(ngModel)]="confirmCode" placeholder="000000" maxlength="6">
                <button class="ritual-btn danger" (click)="desactivar()" [disabled]="confirmCode.length !== 6">
                  DESACTIVAR
                </button>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Configuración Inicial (QR) -->
      @if (showSetup()) {
        <div class="ritual-card glass-panel setup-card">
          <div class="ritual-card-header">
            <h3>Vincular nuevo Oráculo</h3>
          </div>
          <div class="ritual-card-body setup-content">
            <ol class="setup-steps">
              <li>Descarga <strong>Google Authenticator</strong> o similar en tu móvil.</li>
              <li>Escanea este código QR desde la aplicación:</li>
            </ol>

            <div class="qr-container">
              <img [src]="setup()?.qrCode" alt="Código QR 2FA">
              <div class="secret-text">
                <small>Clave manual:</small>
                <code>{{ setup()?.secret }}</code>
              </div>
            </div>

            <div class="verification-step">
              <p>Introduce el código de 6 dígitos para confirmar:</p>
              <div class="ritual-input-group">
                <input type="text" [(ngModel)]="confirmCode" placeholder="000000" maxlength="6">
                <button class="ritual-btn primary" (click)="activar()" [disabled]="confirmCode.length !== 6">
                  CONFIRMAR ACTIVACIÓN
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./seguridad.component.css']
})
export class SeguridadComponent implements OnInit {
  private seguridadService = inject(AdminSeguridadService);
  
  setup = signal<TwoFactorSetup | null>(null);
  showSetup = signal(false);
  confirmCode = '';

  ngOnInit() {
    this.cargarEstado();
  }

  cargarEstado() {
    this.seguridadService.get2FASetup().subscribe(res => {
      this.setup.set(res);
    });
  }

  iniciarSetup() {
    this.showSetup.set(true);
  }

  activar() {
    this.seguridadService.activar2FA(this.confirmCode).subscribe({
      next: () => {
        this.showSetup.set(false);
        this.confirmCode = '';
        this.cargarEstado();
      },
      error: () => alert('Código inválido')
    });
  }

  desactivar() {
    this.seguridadService.desactivar2FA(this.confirmCode).subscribe({
      next: () => {
        this.confirmCode = '';
        this.cargarEstado();
      },
      error: () => alert('Código inválido')
    });
  }
}
