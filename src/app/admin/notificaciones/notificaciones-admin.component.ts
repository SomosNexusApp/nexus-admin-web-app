import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/enviroment';

interface Plantilla {
  id: string;
  tipo: string;
  tituloSugerido: string;
  mensajeSugerido: string;
  urlSugerida: string;
  ayuda: string;
}

@Component({
  selector: 'app-notificaciones-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notificaciones-admin.component.html',
  styleUrl: './notificaciones-admin.component.css',
})
export class NotificacionesAdminComponent {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/admin`;

  plantillas = signal<Plantilla[]>([]);
  loadingPlantillas = signal(true);

  titulo = signal('');
  mensaje = signal('');
  url = signal('');
  tipo = signal('SISTEMA');
  broadcastTodos = signal(false);
  actorIdsText = signal('');
  enviando = signal(false);
  resultado = signal<string | null>(null);
  error = signal<string | null>(null);

  constructor() {
    this.cargarPlantillas();
  }

  cargarPlantillas(): void {
    this.loadingPlantillas.set(true);
    this.http.get<Plantilla[]>(`${this.base}/notificaciones/plantillas`).subscribe({
      next: (list) => {
        this.plantillas.set(list);
        this.loadingPlantillas.set(false);
      },
      error: () => this.loadingPlantillas.set(false),
    });
  }

  aplicarPlantilla(p: Plantilla): void {
    this.titulo.set(p.tituloSugerido);
    this.mensaje.set(p.mensajeSugerido);
    this.url.set(p.urlSugerida);
    this.tipo.set(p.tipo);
  }

  enviar(): void {
    this.resultado.set(null);
    this.error.set(null);
    const body: Record<string, unknown> = {
      broadcastTodos: this.broadcastTodos(),
      titulo: this.titulo().trim(),
      mensaje: this.mensaje().trim(),
      url: this.url().trim() || null,
      tipo: this.tipo().trim(),
    };
    if (!this.broadcastTodos()) {
      const raw = this.actorIdsText().trim();
      const ids = raw
        .split(/[\s,;]+/)
        .map((s) => parseInt(s, 10))
        .filter((n) => !isNaN(n));
      body['actorIds'] = ids;
    }
    this.enviando.set(true);
    this.http.post<{ enviados: number }>(`${this.base}/notificaciones/enviar`, body).subscribe({
      next: (res) => {
        this.enviando.set(false);
        this.resultado.set(`Enviadas: ${res.enviados} notificaciones.`);
      },
      error: (err) => {
        this.enviando.set(false);
        this.error.set(err.error?.error || err.message || 'Error al enviar');
      },
    });
  }
}
