import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { MysqlService } from '../../services/mysql.service';

@Component({
  selector: 'app-moderation',
  templateUrl: './moderation.page.html',
  styleUrls: ['./moderation.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class ModerationPage implements OnDestroy {
  // Segments
  selectedSegment: 'fails_mod' | 'comments_mod' | 'validated' | 'hidden' = 'fails_mod';

  // Fails moderation
  failId: string = '';
  failDeleteReason: string = '';
  deleting = false;

  // Pseudo moderation
  searchQuery: string = '';
  users: any[] = [];
  selectedUser: any = null;
  newDisplayName: string = '';
  updateReason: string = '';
  loadingUsers = false;

  constructor(
    private adminService: AdminService,
    private mysql: MysqlService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  // Reported items for moderation
  reportedFails: any[] = [];
  reportedComments: any[] = [];
  // Approved/Hidden lists
  approvedFails: any[] = [];
  hiddenFails: any[] = [];
  approvedComments: any[] = [];
  hiddenComments: any[] = [];
  // Config thresholds (affiché en bas de page)
  failThreshold = 1;
  commentThreshold = 1;
  private configLoaded = false;
  refreshIntervalSec = 20;
  private refreshTimer: any = null;
  private loading = false;

  async ionViewWillEnter() {
    await this.loadConfigOnce();
    await this.loadVisibleData();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  private startAutoRefresh(intervalMs?: number) {
    this.stopAutoRefresh();
    const ms = Math.max(5000, Math.round((intervalMs ?? this.refreshIntervalSec * 1000)));
    this.refreshTimer = setInterval(() => {
      this.loadVisibleData();
    }, ms);
  }

  private stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private async loadConfigOnce() {
    if (this.configLoaded) return;
    try {
      const cfg = await this.mysql.getModerationConfig();
      this.failThreshold = cfg.failReportThreshold;
      this.commentThreshold = cfg.commentReportThreshold;
      this.refreshIntervalSec = Math.max(5, Number(cfg.panelAutoRefreshSec) || 20);
      this.configLoaded = true;
    } catch {}
  }

  async loadVisibleData() {
    if (this.loading) return;
    this.loading = true;
    try {
      switch (this.selectedSegment) {
        case 'fails_mod':
          this.reportedFails = await this.mysql.getReportedFails(1);
          break;
        case 'comments_mod':
          this.reportedComments = await this.mysql.getReportedComments(1);
          break;
        case 'validated':
          [this.approvedFails, this.approvedComments] = await Promise.all([
            this.mysql.getFailsByStatus('approved'),
            this.mysql.getCommentsByStatus('approved')
          ]);
          break;
        case 'hidden':
          [this.hiddenFails, this.hiddenComments] = await Promise.all([
            this.mysql.getFailsByStatus('hidden'),
            this.mysql.getCommentsByStatus('hidden')
          ]);
          break;
      }
    } finally { this.loading = false; }
  }

  async approveFail(failId: string) {
    await this.mysql.setFailModerationStatus(failId, 'approved');
    await this.loadVisibleData();
    await this.showToast('Fail approuvé', 'success');
  }

  async hideFail(failId: string) {
    await this.mysql.setFailModerationStatus(failId, 'hidden');
    await this.loadVisibleData();
    await this.showToast('Fail masqué', 'warning');
  }

  async approveComment(commentId: string) {
    if (!commentId) { await this.showToast('ID commentaire invalide', 'danger'); return; }
    await this.mysql.setCommentModerationStatus(commentId, 'approved');
    await this.loadVisibleData();
    await this.showToast('Commentaire approuvé', 'success');
  }

  async hideComment(commentId: string) {
    if (!commentId) { await this.showToast('ID commentaire invalide', 'danger'); return; }
    await this.mysql.setCommentModerationStatus(commentId, 'hidden');
    await this.loadVisibleData();
    await this.showToast('Commentaire masqué', 'warning');
  }

  async onSegmentChange(_: any) {
    // Recharge uniquement les listes visibles
    await this.loadVisibleData();
  }

  async saveThresholds() {
    try {
      await this.mysql.updateModerationConfig({
        failReportThreshold: this.failThreshold,
        commentReportThreshold: this.commentThreshold,
        panelAutoRefreshSec: this.refreshIntervalSec
      });
      // redémarre l'auto-refresh avec la nouvelle valeur
      this.startAutoRefresh();
      await this.showToast('Configuration enregistrée', 'success');
    } catch {
      await this.showToast('Erreur enregistrement configuration', 'danger');
    }
  }

  async deleteFail() {
    if (!this.failId || !this.failDeleteReason.trim()) {
      return this.showToast('ID du fail et raison requis', 'warning');
    }
    this.deleting = true;
    try {
      await this.adminService.deleteUserFail(this.failId, this.failDeleteReason);
      await this.showToast('Fail supprimé avec succès', 'success');
      this.failId = '';
      this.failDeleteReason = '';
    } catch (e) {
      await this.showToast("Erreur lors de la suppression du fail", 'danger');
    } finally {
      this.deleting = false;
    }
  }

  async searchUsers() {
    this.loadingUsers = true;
    try {
      // Récupérer liste et filtrer côté client (simple et immédiat)
      const all = await this.mysql.getAllUsersWithRoles();
      const q = this.searchQuery.toLowerCase();
      this.users = all.filter((u: any) =>
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.display_name && u.display_name.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.id && u.id.toString().includes(q))
      ).slice(0, 20);
    } catch (e) {
      await this.showToast('Erreur lors de la recherche utilisateurs', 'danger');
      this.users = [];
    } finally {
      this.loadingUsers = false;
    }
  }

  pickUser(user: any) {
    this.selectedUser = user;
    this.newDisplayName = user.display_name || user.username || '';
  }

  async updateDisplayName() {
    if (!this.selectedUser) return;
    if (!this.newDisplayName.trim() || !this.updateReason.trim()) {
      return this.showToast('Nouveau pseudo et raison requis', 'warning');
    }
    try {
      await this.adminService.updateUserAccount(this.selectedUser.id, { display_name: this.newDisplayName }, this.updateReason);
      await this.showToast('Pseudo mis à jour', 'success');
      this.selectedUser.display_name = this.newDisplayName;
      this.updateReason = '';
    } catch (e) {
      await this.showToast("Erreur lors de la mise à jour du pseudo", 'danger');
    }
  }

  private async showToast(message: string, color: 'success'|'warning'|'danger'|'primary'|'medium' = 'primary') {
    const t = await this.toastController.create({ message, duration: 2000, color });
    await t.present();
  }
}
