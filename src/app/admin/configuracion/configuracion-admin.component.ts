import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../admin.service';
import { finalize, forkJoin } from 'rxjs';

@Component({
  selector: 'app-configuracion-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion-admin.component.html',
  styleUrl: './configuracion-admin.component.css'
})
export class ConfiguracionAdminComponent implements OnInit {
  
  private adminService = inject(AdminService);
  saving = signal(false);
  showSuccess = signal(false);

  // Expanded Settings Model
  config = {
    // General
    siteName: 'Nexus',
    siteTagline: 'La plataforma definitiva de compra-venta',
    contactEmail: 'admin@nexus-app.es',
    maintenanceMode: false,
    
    // Commerce
    commissionRate: 12.5,
    minWithdrawal: 50,
    currencyCode: 'EUR',
    stripeEnabled: true,
    
    // Security
    require2FA: false,
    maxLoginAttempts: 5,
    openRegistration: true,
    recaptchaEnabled: true,
    
    // SMTP
    smtpHost: 'smtp.nexus.es',
    smtpPort: 587,
    smtpUser: 'no-reply@nexus-app.es',
    smtpPass: '********',
    
    
    
    // Storage
    cloudinaryName: 'dzahpgslo',
    cloudinaryApiKey: '8219318318318',
    storageProvider: 'Cloudinary',

    // Moderation
    autoApproveProducts: true,
    flagSensitiveContent: true,
    sensitiveKeywords: ''
  };

  // Tag Management
  keywordList = signal<string[]>([]);
  searchTerm = ''; // Changed to regular property for easy ngModel binding
  
  filteredKeywords = computed(() => {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) return this.keywordList();
    return this.keywordList().filter(w => w.toLowerCase().includes(term));
  });

  ngOnInit() {
    this.loadingData();
  }

  loadingData() {
    forkJoin({
      configs: this.adminService.getConfigs(),
      words: this.adminService.getModerationWords()
    }).subscribe(({ configs, words }) => {
      // 1. Process general configs
      if (configs && Object.keys(configs).length > 0) {
        Object.keys(configs).forEach(key => {
          if (key === 'sensitiveKeywords') return; // Skip here, handled below
          
          const val = (configs as any)[key];
          if (val === 'true') (this.config as any)[key] = true;
          else if (val === 'false') (this.config as any)[key] = false;
          else if (!isNaN(Number(val)) && typeof (this.config as any)[key] === 'number') {
            (this.config as any)[key] = Number(val);
          } else {
            (this.config as any)[key] = val;
          }
        });
      }

      // 2. Process moderation words (Combined list)
      if (words) {
        this.keywordList.set(words.split(',').map(w => w.trim()).filter(w => w));
      }
    });
  }

  addKeyword(word: string) {
    const cleanWord = word.trim();
    if (cleanWord && !this.keywordList().includes(cleanWord)) {
      this.keywordList.update(list => [...list, cleanWord]);
      this.searchTerm = ''; // Clear search after adding
    }
  }

  removeKeyword(word: string) {
    this.keywordList.update(list => list.filter(w => w !== word));
  }

  resetToDefaults() {
    this.adminService.getModerationWords().subscribe(words => {
      this.keywordList.set(words.split(',').map(w => w.trim()).filter(w => w));
    });
  }

  saveConfigs() {
    this.saving.set(true);
    
    // Sync keywordList back to config string
    this.config.sensitiveKeywords = this.keywordList().join(', ');
    
    // Convert everything to string for the batch update
    const batch: any = {};
    Object.keys(this.config).forEach(k => {
      batch[k] = String((this.config as any)[k]);
    });

    this.adminService.saveConfigsBatch(batch)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(() => {
        this.showSuccess.set(true);
        setTimeout(() => this.showSuccess.set(false), 3000);
      });
  }
}
