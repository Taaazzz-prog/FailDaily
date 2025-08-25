import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonItem, IonList, IonLabel, IonTextarea, IonSpinner } from '@ionic/angular/standalone';
import { CommentService, CommentItem } from '../../services/comment.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-comments-thread',
  standalone: true,
  templateUrl: './comments-thread.component.html',
  styleUrls: ['./comments-thread.component.scss'],
  imports: [CommonModule, FormsModule, IonList, IonItem, IonLabel, IonTextarea, IonButton, IonSpinner]
})
export class CommentsThreadComponent implements OnInit {
  @Input() failId!: string;

  comments: CommentItem[] = [];
  loading = false;
  newComment = '';
  isAuthenticated = false;

  constructor(private commentsSvc: CommentService, private auth: AuthService) {}

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
    const ok = await this.commentsSvc.add(this.failId, this.newComment.trim(), true);
    if (ok) {
      this.newComment = '';
      await this.refresh();
    }
  }
}
