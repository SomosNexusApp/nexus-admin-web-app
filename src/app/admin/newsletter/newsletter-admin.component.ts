import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AdminNewsletterService, NewsletterStats } from '../services/admin-newsletter.service';

@Component({
  selector: 'app-newsletter-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './newsletter-admin.component.html',
  styleUrls: ['./newsletter-admin.component.css']
})
export class NewsletterAdminComponent implements OnInit {
  private newsletterSvc = inject(AdminNewsletterService);
  private sanitizer = inject(DomSanitizer);

  stats = signal<NewsletterStats | null>(null);
  loading = signal(true);
  sending = signal(false);

  asunto = '';
  thisWeekAsunto = 'Nexus Elite: Tu selección semanal personalizada ✨';
  contenido = '';
  showTestModal = false;
  showConfirmSendModal = false;
  showConfirmWeeklyModal = false;
  testEmail = '';
  
  // Plantillas predefinidas
  templates = [
    { 
      name: 'Bienvenida', 
      icon: 'fa-hand-peace',
      subject: '¡Bienvenido a Nexus Elite!',
      html: `<h2>¡Bienvenido a la comunidad más exclusiva!</h2>
<p>Estamos encantados de tenerte con nosotros. En Nexus Elite no solo compras y vendes, sino que formas parte de un ecosistema de alta fidelidad.</p>
<div class="data-card">
  <h3>¿Qué puedes hacer ahora?</h3>
  <ul>
    <li>Explorar los <b>Chollazos</b> del día.</li>
    <li>Publicar tu primer producto "Elite".</li>
    <li>Configurar tus alertas personalizadas.</li>
  </ul>
</div>
<div style="text-align: center;">
  <a href="https://nexus-app.es/market" class="btn">Explorar el Marketplace</a>
</div>`
    },
    {
      name: 'Oferta Flash',
      icon: 'fa-bolt',
      subject: '🔥 ¡OFERTA FLASH: Solo hoy!',
      html: `<h2 style="color: #7c3aed;">¡SOLO HOY: DESCUENTO EXCLUSIVO!</h2>
<p>Hemos activado una promoción especial para nuestros suscriptores más fieles. Solo durante las próximas 24 horas podrás disfrutar de un <b>20% de descuento adicional</b> en la categoría de Electrónica.</p>
<div class="code-container">
  <p style="margin:0; font-size:12px; color:#6b7280;">USA EL CÓDIGO:</p>
  <p class="code-box">NEXUS20</p>
</div>
<p class="text-muted">Aprovecha antes de que se agote el stock de los productos seleccionados.</p>`
    },
    {
      name: 'Anuncio Importante',
      icon: 'fa-bullhorn',
      subject: 'Actualización importante en Nexus',
      html: `<h2>Novedades en nuestra plataforma</h2>
<p>En nuestro afán por ofrecerte la mejor experiencia "Elite", hemos actualizado nuestros términos de servicio y mejorado el sistema de protección al comprador.</p>
<div class="data-card">
  <p><b>Cambios principales:</b></p>
  <ul>
    <li>Envíos más rápidos con Nexus Express.</li>
    <li>Nueva interfaz de gestión de pedidos.</li>
    <li>Soporte prioritario 24/7 para usuarios verificados.</li>
  </ul>
</div>
<p>Gracias por seguir confiando en Nexus.</p>`
    }
  ];

  activeTab: 'manual' | 'automated' = 'manual';
  config = signal<any>({ automatedEnabled: false, dayOfWeek: 1, timeOfDay: '10:00' });
  weeklyPreviewHtml = signal<string>('');

  get previewHtml(): SafeHtml {
    const isAutomated = this.activeTab === 'automated';
    const body = isAutomated ? this.weeklyPreviewHtml() : this.contenido;
    
    if (!body) return this.sanitizer.bypassSecurityTrustHtml('');

    // Mocking the HTML_WRAPPER for a real preview (Nexus Elite Design)
    const wrapper = `
      <div style="background:#0f172a; padding:40px 20px; font-family:'Outfit', sans-serif;">
        <div style="max-width:600px; margin:0 auto; background:#fff; border-radius:20px; overflow:hidden; box-shadow:0 20px 50px rgba(0,0,0,0.3);">
          <div style="background:#000; padding:40px; text-align:center; border-bottom:4px solid #7c3aed;">
            <img src="/logo.webp" alt="Nexus Elite" style="height:60px; margin:0 auto;">
          </div>
          <div style="padding:40px; color:#1e293b; line-height:1.8; font-size:16px;">
            ${body}
          </div>
          <div style="background:#f1f5f9; padding:40px; text-align:center; font-size:13px; color:#64748b; border-top:1px solid #e2e8f0;">
            <p>Has recibido este correo electrónico porque eres parte de la comunidad de <b>Nexus Elite</b>.</p>
            <p><a href="#" style="color:#7c3aed; text-decoration:none; font-weight:600;">Darse de baja</a> | <a href="#" style="color:#7c3aed; text-decoration:none; font-weight:600;">Preferencias</a></p>
            <p style="margin-top:20px; font-weight:600;">&copy; 2026 Nexus App S.L. · Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    `;
    return this.sanitizer.bypassSecurityTrustHtml(wrapper);
  }

  ngOnInit() {
    this.loadStats();
    this.loadConfig();
    this.loadWeeklyPreview();
  }

  setTab(tab: 'manual' | 'automated') {
    this.activeTab = tab;
  }

  loadConfig() {
    this.newsletterSvc.getConfig().subscribe(c => this.config.set(c));
  }

  saveConfig() {
    this.newsletterSvc.saveConfig(this.config()).subscribe(() => {
      console.log('Configuración guardada correctamente');
    });
  }

  loadWeeklyPreview() {
    this.newsletterSvc.getWeeklyPreview().subscribe(r => this.weeklyPreviewHtml.set(r.html));
  }

  confirmSendAll() {
    if (!this.asunto || !this.contenido) return;
    this.showConfirmSendModal = true;
  }

  confirmTriggerWeekly() {
    this.showConfirmWeeklyModal = true;
  }

  applyTemplate(template: any) {
    this.asunto = template.subject;
    this.contenido = template.html;
  }

  insertTag(tag: string) {
    const textarea = document.getElementById('manual-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = this.contenido;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const selected = text.substring(start, end);

    let newContent = '';
    switch(tag) {
      case 'b': newContent = `<b>${selected}</b>`; break;
      case 'h2': newContent = `<h2>${selected || 'Título'}</h2>\n`; break;
      case 'p': newContent = `<p>${selected || 'Párrafo'}</p>\n`; break;
      case 'ul': newContent = `<ul>\n  <li>${selected || 'Item'}</li>\n</ul>\n`; break;
      case 'btn': newContent = `<div style="text-align: center; margin: 20px 0;">\n  <a href="#" style="background:#7c3aed; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; display:inline-block; font-weight:600;">${selected || 'Botón'}</a>\n</div>\n`; break;
      case 'card': newContent = `<div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:15px; margin:15px 0;">\n  ${selected || 'Contenido de la tarjeta'}\n</div>\n`; break;
    }

    this.contenido = before + newContent + after;
    
    setTimeout(() => {
      textarea.focus();
      const newPos = start + newContent.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  }

  enviarATodos() {
    this.showConfirmSendModal = false;
    this.sending.set(true);
    this.newsletterSvc.enviarATodos(this.asunto, this.contenido).subscribe({
      next: () => {
        console.log('Emisión masiva iniciada');
        this.sending.set(false);
        this.asunto = '';
        this.contenido = '';
      },
      error: () => {
        console.error('Error al iniciar la emisión');
        this.sending.set(false);
      }
    });
  }

  triggerWeekly() {
    this.showConfirmWeeklyModal = false;
    this.sending.set(true);
    this.newsletterSvc.triggerWeekly().subscribe({
      next: () => {
        console.log('Emisión semanal forzada iniciada');
        this.sending.set(false);
      },
      error: () => {
        console.error('Error al forzar la emisión');
        this.sending.set(false);
      }
    });
  }

  loadStats() {
    this.loading.set(true);
    this.newsletterSvc.getStats().subscribe({
      next: r => { this.stats.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openTestModal() {
    this.showTestModal = true;
  }

  enviarPrueba() {
    if (!this.testEmail) return;
    this.sending.set(true);
    this.newsletterSvc.enviarPrueba(this.testEmail, this.asunto, this.contenido).subscribe({
      next: () => {
        console.log('Correo de prueba enviado con éxito');
        this.showTestModal = false;
        this.sending.set(false);
      },
      error: () => {
        console.error('Error al enviar la prueba');
        this.sending.set(false);
      }
    });
  }
}

