import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonItem, IonList, IonLabel, IonTextarea, IonSpinner, ToastController, IonChip, IonIcon } from '@ionic/angular/standalone';
import { CommentService, CommentItem } from '../../services/comment.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-comments-thread',
  standalone: true,
  templateUrl: './comments-thread.component.html',
  styleUrls: ['./comments-thread.component.scss'],
  imports: [CommonModule, FormsModule, IonList, IonItem, IonLabel, IonTextarea, IonButton, IonSpinner, IonChip, IonIcon]
})
export class CommentsThreadComponent implements OnInit {
  @Input() failId!: string;

  comments: CommentItem[] = [];
  loading = false;
  newComment = '';
  isAuthenticated = false;

  constructor(private commentsSvc: CommentService, private auth: AuthService, private toast: ToastController) {}

  async ngOnInit() {
    this.isAuthenticated = this.auth.isAuthenticated();
    await this.refresh();
  }

  async refresh() {
    try {
      this.loading = true;
      this.comments = await this.commentsSvc.list(this.failId);
    } finally { this.loading = false; }
  }

  async addComment() {
    if (!this.newComment?.trim()) return;
    const created = await this.commentsSvc.add(this.failId, this.newComment.trim(), true);
    if (created) {
      // Affichage immédiat (optimiste)
      this.comments = [created, ...this.comments];
      this.newComment = '';
      (await this.toast.create({ message: 'Commentaire publié', duration: 1500, color: 'success' })).present();
    }
  }

  async onReport(c: CommentItem) {
    try {
      const ok = await this.commentsSvc.report(this.failId, c.id);
      if (ok) {
        // Masquer immédiatement localement
        this.comments = this.comments.filter(x => x.id !== c.id);
        (await this.toast.create({ message: 'Commentaire signalé', duration: 1500, color: 'warning' })).present();
      }
    } catch {}
  }
}
