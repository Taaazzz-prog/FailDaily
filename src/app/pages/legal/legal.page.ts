import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonBackButton, IonButtons, IonIcon, IonItem, IonLabel,
    IonList
} from '@ionic/angular/standalone';
import { LegalService, LegalDocument } from '../../services/legal.service';

@Component({
    selector: 'app-legal',
    templateUrl: './legal.page.html',
    styleUrls: ['./legal.page.scss'],
    imports: [
        CommonModule, RouterModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
        IonBackButton, IonButtons, IonIcon, IonItem, IonLabel, IonList
    ]
})
export class LegalPage implements OnInit {
    documents: LegalDocument[] = [];

    legalSections = [
        {
            title: 'Documents obligatoires',
            icon: 'shield-checkmark',
            color: 'primary',
            documents: ['legal-notice', 'terms-of-service', 'privacy-policy']
        },
        {
            title: 'Sécurité et modération',
            icon: 'people',
            color: 'secondary',
            documents: ['moderation-charter', 'age-restrictions']
        },
        {
            title: 'Aide et soutien',
            icon: 'heart',
            color: 'tertiary',
            documents: ['help-resources']
        }
    ];

    constructor(private legalService: LegalService) { }

    ngOnInit() {
        this.documents = this.legalService.getAllLegalDocuments();
    }

    getDocumentIcon(documentId: string): string {
        const iconMap: { [key: string]: string } = {
            'legal-notice': 'information-circle',
            'terms-of-service': 'document-text',
            'privacy-policy': 'lock-closed',
            'moderation-charter': 'shield',
            'age-restrictions': 'people',
            'help-resources': 'medical'
        };
        return iconMap[documentId] || 'document-outline';
    }

    getDocumentColor(documentId: string): string {
        const colorMap: { [key: string]: string } = {
            'legal-notice': 'primary',
            'terms-of-service': 'secondary',
            'privacy-policy': 'tertiary',
            'moderation-charter': 'warning',
            'age-restrictions': 'success',
            'help-resources': 'danger'
        };
        return colorMap[documentId] || 'medium';
    }

    getDocument(documentId: string): LegalDocument | undefined {
        return this.documents.find(doc => doc.id === documentId);
    }
}
