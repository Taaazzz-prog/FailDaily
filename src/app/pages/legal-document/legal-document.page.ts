import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonBackButton, IonButtons, IonIcon
} from '@ionic/angular/standalone';
import { LegalService, LegalDocument } from '../../services/legal.service';

@Component({
    selector: 'app-legal-document',
    templateUrl: './legal-document.page.html',
    styleUrls: ['./legal-document.page.scss'],
    imports: [
        CommonModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
        IonBackButton, IonButtons, IonIcon
    ]
})
export class LegalDocumentPage implements OnInit {
    document: LegalDocument | null = null;
    documentId: string = '';

    constructor(
        private route: ActivatedRoute,
        private legalService: LegalService
    ) { }

    ngOnInit() {
        this.documentId = this.route.snapshot.paramMap.get('id') || '';
        this.loadDocument();
    }

    private loadDocument() {
        const allDocuments = this.legalService.getAllLegalDocuments();
        this.document = allDocuments.find(doc => doc.id === this.documentId) || null;
    }

    getFormattedDate(): string {
        if (!this.document) return '';
        return new Intl.DateTimeFormat('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(this.document.lastUpdated);
    }
}
