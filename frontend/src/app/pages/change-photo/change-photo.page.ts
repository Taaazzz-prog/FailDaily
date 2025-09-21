import { Component, OnInit, signal, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonGrid, IonRow, IonCol, IonItem, IonLabel, IonRange
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, imagesOutline, personCircleOutline, refreshOutline, saveOutline, closeOutline, repeatOutline, locateOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { MysqlService } from '../../services/mysql.service';
import { PhotoService } from '../../services/photo.service';
import { DEFAULT_AVATARS } from '../../utils/avatar-constants';
import { ToastController } from '@ionic/angular/standalone';
import { Filesystem } from '@capacitor/filesystem';

@Component({
  selector: 'app-change-photo',
  templateUrl: './change-photo.page.html',
  styleUrls: ['./change-photo.page.scss'],
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonButton, IonIcon, IonGrid, IonRow, IonCol, IonItem, IonLabel, IonRange
  ]
})
export class ChangePhotoPage implements OnInit, AfterViewInit {
  currentAvatar = '';
  previewDataUrl: string | null = null;
  defaultAvatars = DEFAULT_AVATARS;

  // Editor state
  zoom = signal(1.0);
  rotation = signal(0); // degrees
  panX = signal(0); // horizontal offset
  panY = signal(0); // vertical offset

  private imgEl: HTMLImageElement | null = null;
  private canvasSize = 300;
  
  // Touch/mouse interaction state
  private isDragging = false;
  private lastTouchX = 0;
  private lastTouchY = 0;

  constructor(
    private router: Router,
    private authService: AuthService,
    private mysqlService: MysqlService,
    private photoService: PhotoService,
    private toastController: ToastController
  ) {
    addIcons({ cameraOutline, imagesOutline, personCircleOutline, refreshOutline, saveOutline, closeOutline, repeatOutline, locateOutline });
  }

  async ngOnInit() {
    const u = this.authService.getCurrentUser();
    this.currentAvatar = u?.avatar || '';
  }

  ngAfterViewInit() {
    // Initialize canvas after view is loaded
    setTimeout(() => {
      this.setupCanvasInteractions();
      this.redraw();
    }, 100);
  }

  private setupCanvasInteractions() {
    const canvas = document.getElementById('avatarCanvas') as HTMLCanvasElement;
    if (!canvas) return;

    // Mouse events
    canvas.addEventListener('mousedown', (e) => this.onInteractionStart(e.clientX, e.clientY));
    canvas.addEventListener('mousemove', (e) => this.onInteractionMove(e.clientX, e.clientY));
    canvas.addEventListener('mouseup', () => this.onInteractionEnd());
    canvas.addEventListener('mouseleave', () => this.onInteractionEnd());

    // Touch events for mobile
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.onInteractionStart(touch.clientX, touch.clientY);
    });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.onInteractionMove(touch.clientX, touch.clientY);
    });
    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.onInteractionEnd();
    });
  }

  private onInteractionStart(clientX: number, clientY: number) {
    this.isDragging = true;
    this.lastTouchX = clientX;
    this.lastTouchY = clientY;
    
    // Change cursor to grabbing
    const canvas = document.getElementById('avatarCanvas') as HTMLCanvasElement;
    if (canvas) canvas.style.cursor = 'grabbing';
  }

  private onInteractionMove(clientX: number, clientY: number) {
    if (!this.isDragging || !this.imgEl) return;

    const deltaX = clientX - this.lastTouchX;
    const deltaY = clientY - this.lastTouchY;

    // Update pan position with sensitivity adjustment
    const sensitivity = 1.0;
    const newPanX = this.panX() + deltaX * sensitivity;
    const newPanY = this.panY() + deltaY * sensitivity;

    // Limit pan to reasonable bounds (half canvas size)
    const maxPan = this.canvasSize / 2;
    this.panX.set(Math.max(-maxPan, Math.min(maxPan, newPanX)));
    this.panY.set(Math.max(-maxPan, Math.min(maxPan, newPanY)));

    this.lastTouchX = clientX;
    this.lastTouchY = clientY;

    this.redraw();
  }

  private onInteractionEnd() {
    this.isDragging = false;
    
    // Reset cursor to grab
    const canvas = document.getElementById('avatarCanvas') as HTMLCanvasElement;
    if (canvas) canvas.style.cursor = 'grab';
  }

  async chooseFromCamera() {
    try {
      const src = await this.photoService.takePhoto();
      if (src) await this.loadForEdit(src);
    } catch (e) {
      const t = await this.toastController.create({ message: 'Erreur caméra', duration: 2500, color: 'danger' });
      await t.present();
    }
  }

  async chooseFromGallery() {
    try {
      const src = await this.photoService.selectFromGallery();
      if (src) await this.loadForEdit(src);
    } catch (e) {
      const t = await this.toastController.create({ message: 'Erreur sélection galerie', duration: 2500, color: 'danger' });
      await t.present();
    }
  }

  async chooseFromDefaults() {
    // Show grid in template; handled by click on an avatar
  }

  onDefaultAvatarClick(avatar: string) {
    this.previewDataUrl = avatar; // show preview directly
    this.imgEl = null; // bypass editor for assets; save uses direct URL
    this.panX.set(0); // Reset pan
    this.panY.set(0);
    this.redraw(); // Update canvas immediately
  }

  async importFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files && input.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async () => {
          const dataUrl = reader.result as string;
          await this.prepareEditor(dataUrl);
        };
        reader.readAsDataURL(file);
      } else {
        const t = await this.toastController.create({ message: 'Aucun fichier sélectionné', duration: 2000, color: 'medium' });
        await t.present();
      }
    };
    input.click();
  }

  private async loadForEdit(source: string) {
    // Convert file:// to data URL for preview
    if (source.startsWith('file://') || source.startsWith('capacitor://')) {
      const { data } = await Filesystem.readFile({ path: source });
      const dataUrl = `data:image/jpeg;base64,${data}`;
      await this.prepareEditor(dataUrl);
      return;
    }
    // assets or http can be drawn if CORS permits; use as is
    await this.prepareEditor(source);
  }

  private async prepareEditor(dataUrl: string) {
    this.previewDataUrl = dataUrl;
    this.zoom.set(1.0);
    this.rotation.set(0);
    this.panX.set(0);
    this.panY.set(0);

    this.imgEl = new Image();
    // CORS safe for same-origin; data URLs OK
    this.imgEl.src = dataUrl;
    await new Promise<void>((resolve, reject) => {
      if (!this.imgEl) return resolve();
      this.imgEl.onload = () => resolve();
      this.imgEl.onerror = () => resolve();
    });
    this.redraw();
  }

  zoomChanged(ev: CustomEvent) {
    this.zoom.set(Number(ev.detail.value));
    this.redraw();
  }

  rotateLeft() { this.rotation.set((this.rotation() - 90 + 360) % 360); this.redraw(); }
  rotateRight() { this.rotation.set((this.rotation() + 90) % 360); this.redraw(); }
  
  centerImage() { 
    this.panX.set(0); 
    this.panY.set(0); 
    this.redraw(); 
  }
  
  resetEditor() { 
    this.zoom.set(1.0); 
    this.rotation.set(0); 
    this.panX.set(0); 
    this.panY.set(0); 
    this.redraw(); 
  }

  private redraw() {
    const canvas = document.getElementById('avatarCanvas') as HTMLCanvasElement | null;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.width = this.canvasSize;
    canvas.height = this.canvasSize;

    // Background
    ctx.fillStyle = '#f4f4f4';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!this.imgEl) {
      // If no editor image (default avatar), draw preview image as cover
      if (this.previewDataUrl) {
        const tmp = new Image();
        tmp.src = this.previewDataUrl;
        tmp.onload = () => {
          this.drawCover(ctx, tmp);
        };
      }
      return;
    }

    // Draw image centered with zoom, rotation and pan
    const img = this.imgEl;
    const scale = this.zoom();
    const angle = (this.rotation() * Math.PI) / 180;
    const offsetX = this.panX();
    const offsetY = this.panY();

    ctx.save();
    ctx.translate(canvas.width / 2 + offsetX, canvas.height / 2 + offsetY);
    ctx.rotate(angle);

    // compute scale to cover square
    const ratio = Math.max(
      canvas.width / img.width,
      canvas.height / img.height
    ) * scale;

    const drawW = img.width * ratio;
    const drawH = img.height * ratio;
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }

  private drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
    const canvas = ctx.canvas;
    const ratio = Math.max(canvas.width / img.width, canvas.height / img.height);
    const w = img.width * ratio;
    const h = img.height * ratio;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  }

  async save() {
    try {
      // If default avatar path selected
      if (!this.imgEl && this.previewDataUrl && (this.previewDataUrl.startsWith('assets/') || this.previewDataUrl.startsWith('/assets/'))) {
        await this.authService.updateUserProfile({ avatarUrl: this.previewDataUrl });
        this.router.navigate(['/tabs/profile']);
        return;
      }

      // Export canvas as DataURL
      const canvas = document.getElementById('avatarCanvas') as HTMLCanvasElement | null;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const url = await this.mysqlService.uploadAvatarFromDataUrl(dataUrl, `avatar_${Date.now()}.jpg`);
      await this.authService.updateUserProfile({ avatarUrl: url });
      const t = await this.toastController.create({ message: 'Photo de profil mise à jour ✅', duration: 2500, color: 'success' });
      await t.present();
      this.router.navigate(['/tabs/profile']);
    } catch (error) {
      console.error('Erreur sauvegarde avatar:', error);
      const t = await this.toastController.create({ message: 'Erreur lors de l\'enregistrement', duration: 3000, color: 'danger' });
      await t.present();
    }
  }

  cancel() {
    this.router.navigate(['/tabs/profile']);
  }
}
