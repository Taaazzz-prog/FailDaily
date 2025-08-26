import { Component } from '@angular/core';
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
export class ModerationPage {
  // Segments
  selectedSegment: 'fails' | 'pseudos' = 'fails';

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

  async ionViewWillEnter() {
    await this.loadReports();
  }

  async loadReports() {
    try {
      this.reportedFails = await this.mysql.getReportedFails(1);
      this.reportedComments = await this.mysql.getReportedComments(1);
    } catch {}
  }

  async approveFail(failId: string) {
    await this.mysql.setFailModerationStatus(failId, 'approved');
    this.reportedFails = this.reportedFails.filter(f => f.fail_id !== failId);
    await this.showToast('Fail approuvé', 'success');
  }

  async hideFail(failId: string) {
    await this.mysql.setFailModerationStatus(failId, 'hidden');
    this.reportedFails = this.reportedFails.filter(f => f.fail_id !== failId);
    await this.showToast('Fail masqué', 'warning');
  }

  async approveComment(commentId: string) {
    await this.mysql.setCommentModerationStatus(commentId, 'approved');
    this.reportedComments = this.reportedComments.filter(c => c.comment?.id !== commentId);
    await this.showToast('Commentaire approuvé', 'success');
  }

  async hideComment(commentId: string) {
    await this.mysql.setCommentModerationStatus(commentId, 'hidden');
    this.reportedComments = this.reportedComments.filter(c => c.comment?.id !== commentId);
    await this.showToast('Commentaire masqué', 'warning');
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
