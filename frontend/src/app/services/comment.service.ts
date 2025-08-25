import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface CommentItem {
  id: string;
  userId: string;
  failId: string;
  content: string;
  isEncouragement: boolean;
  createdAt: string;
  author?: { displayName: string; avatarUrl?: string };
}

@Injectable({ providedIn: 'root' })
export class CommentService {
  private apiUrl = environment.api.baseUrl || 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('faildaily_token') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  async list(failId: string): Promise<CommentItem[]> {
    const res: any = await this.http.get(`${this.apiUrl}/fails/${failId}/comments`, { headers: this.getAuthHeaders() }).toPromise();
    if (res?.success && Array.isArray(res.comments)) return res.comments;
    // Some routes return bare arrays
    if (Array.isArray(res)) return res as CommentItem[];
    // Fallback to common structure with data.comments
    if (res?.data?.comments) return res.data.comments;
    return [];
  }

  async add(failId: string, content: string, isEncouragement: boolean = true): Promise<boolean> {
    const body = { content, isEncouragement } as any;
    const res: any = await this.http.post(`${this.apiUrl}/fails/${failId}/comments`, body, { headers: this.getAuthHeaders() }).toPromise();
    return !!res?.success || !!res?.comment?.id;
  }

  async update(failId: string, commentId: string, content: string): Promise<boolean> {
    const res: any = await this.http.put(`${this.apiUrl}/fails/${failId}/comments/${commentId}`, { content }, { headers: this.getAuthHeaders() }).toPromise();
    return !!res?.success;
  }

  async remove(failId: string, commentId: string): Promise<boolean> {
    const res: any = await this.http.delete(`${this.apiUrl}/fails/${failId}/comments/${commentId}`, { headers: this.getAuthHeaders() }).toPromise();
    return !!res?.success;
  }
}
