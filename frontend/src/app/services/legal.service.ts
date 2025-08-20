import { Injectable } from '@angular/core';

export interface LegalDocument {
    id: string;
    title: string;
    content: string;
    lastUpdated: Date;
    version: string;
}

@Injectable({
    providedIn: 'root'
})
export class LegalService {

    constructor() { }

    /**
     * Récupère les mentions légales
     */
    getLegalNotice(): LegalDocument {
        return {
            id: 'legal-notice',
            title: 'Mentions légales',
            version: '1.0',
            lastUpdated: new Date('2025-08-08'),
            content: `
        <h2>Informations légales</h2>
        
        <h3>Éditeur de l'application</h3>
        <p><strong>Dénomination :</strong> FailDaily</p>
        <p><strong>Statut :</strong> Application en développement</p>
        <p><strong>Contact :</strong> contact@faildaily.app</p>
        
        <h3>Hébergement</h3>
        <p><strong>Hébergeur :</strong> Supabase Inc.</p>
        <p><strong>Adresse :</strong> 970 Toa Payoh North, #07-04, Singapore 318992</p>
        
        <h3>Propriété intellectuelle</h3>
        <p>L'ensemble des contenus présents dans l'application FailDaily (textes, images, graphismes, logos, icônes, etc.) est protégé par le droit d'auteur.</p>
        
        <h3>Responsabilité</h3>
        <p>L'éditeur s'efforce de fournir des informations exactes mais ne peut garantir l'exactitude, la complétude ou l'actualité des informations diffusées.</p>
      `
        };
    }

    /**
     * Récupère les conditions générales d'utilisation
     */
    getTermsOfService(): LegalDocument {
        return {
            id: 'terms-of-service',
            title: 'Conditions Générales d\'Utilisation',
            version: '1.0',
            lastUpdated: new Date('2025-08-08'),
            content: `
        <h2>Conditions Générales d'Utilisation</h2>
        
        <h3>1. Objet</h3>
        <p>FailDaily est une application de partage et de soutien communautaire permettant aux utilisateurs de partager leurs expériences d'échec de manière bienveillante.</p>
        
        <h3>2. Acceptation des conditions</h3>
        <p>L'utilisation de l'application implique l'acceptation pleine et entière de ces conditions générales d'utilisation.</p>
        
        <h3>3. Inscription et compte utilisateur</h3>
        <p>L'inscription est gratuite et nécessite :</p>
        <ul>
          <li>Un âge minimum de 13 ans</li>
          <li>Une autorisation parentale pour les 13-16 ans</li>
          <li>Une adresse email valide</li>
          <li>L'acceptation de ces CGU</li>
        </ul>
        
        <h3>4. Règles d'usage</h3>
        <p>Il est strictement interdit de publier du contenu :</p>
        <ul>
          <li>Haineux, discriminatoire ou offensant</li>
          <li>Contenant des informations personnelles d'autrui</li>
          <li>À caractère pornographique ou violent</li>
          <li>Constituant du spam ou de la publicité</li>
          <li>Encourageant l'automutilation ou le suicide</li>
        </ul>
        
        <h3>5. Modération</h3>
        <p>Nous nous réservons le droit de modérer, supprimer ou signaler tout contenu inapproprié. Les sanctions peuvent inclure :</p>
        <ul>
          <li>Avertissement</li>
          <li>Suppression de contenu</li>
          <li>Suspension temporaire</li>
          <li>Bannissement définitif</li>
        </ul>
        
        <h3>6. Responsabilités</h3>
        <p>L'utilisateur est seul responsable des contenus qu'il publie. FailDaily n'est pas responsable des conséquences liées à l'utilisation de l'application.</p>
        
        <h3>7. Résiliation</h3>
        <p>L'utilisateur peut supprimer son compte à tout moment depuis les paramètres de l'application.</p>
      `
        };
    }

    /**
     * Récupère la politique de confidentialité
     */
    getPrivacyPolicy(): LegalDocument {
        return {
            id: 'privacy-policy',
            title: 'Politique de confidentialité',
            version: '1.0',
            lastUpdated: new Date('2025-08-08'),
            content: `
        <h2>Politique de confidentialité (RGPD)</h2>
        
        <h3>1. Responsable du traitement</h3>
        <p>FailDaily en tant qu'éditeur de l'application est responsable du traitement de vos données personnelles.</p>
        
        <h3>2. Données collectées</h3>
        <p>Nous collectons uniquement les données nécessaires au fonctionnement de l'application :</p>
        <ul>
          <li><strong>Données d'inscription :</strong> email, pseudonyme</li>
          <li><strong>Données de contenu :</strong> publications, réactions, commentaires</li>
          <li><strong>Données techniques :</strong> adresse IP, type d'appareil (à des fins de sécurité)</li>
        </ul>
        
        <h3>3. Finalités du traitement</h3>
        <p>Vos données sont utilisées pour :</p>
        <ul>
          <li>Créer et gérer votre compte</li>
          <li>Permettre les interactions sociales</li>
          <li>Assurer la modération</li>
          <li>Améliorer l'application</li>
        </ul>
        
        <h3>4. Base légale</h3>
        <p>Le traitement se base sur :</p>
        <ul>
          <li>Votre consentement pour l'inscription</li>
          <li>L'exécution du service demandé</li>
          <li>L'intérêt légitime pour la sécurité</li>
        </ul>
        
        <h3>5. Conservation des données</h3>
        <p>Vos données sont conservées :</p>
        <ul>
          <li><strong>Compte actif :</strong> tant que votre compte existe</li>
          <li><strong>Après suppression :</strong> 30 jours pour permettre la récupération</li>
          <li><strong>Données de modération :</strong> 1 an maximum</li>
        </ul>
        
        <h3>6. Partage des données</h3>
        <p>Nous ne vendons jamais vos données. Elles peuvent être partagées uniquement :</p>
        <ul>
          <li>Avec votre consentement explicite</li>
          <li>Pour respecter une obligation légale</li>
          <li>Pour protéger la sécurité des utilisateurs</li>
        </ul>
        
        <h3>7. Vos droits (RGPD)</h3>
        <p>Vous disposez des droits suivants :</p>
        <ul>
          <li><strong>Accès :</strong> consulter vos données</li>
          <li><strong>Rectification :</strong> corriger vos données</li>
          <li><strong>Suppression :</strong> effacer vos données</li>
          <li><strong>Portabilité :</strong> récupérer vos données</li>
          <li><strong>Opposition :</strong> refuser le traitement</li>
        </ul>
        
        <h3>8. Contact</h3>
        <p>Pour exercer vos droits : <strong>privacy@faildaily.app</strong></p>
      `
        };
    }

    /**
     * Récupère la charte de modération
     */
    getModerationCharter(): LegalDocument {
        return {
            id: 'moderation-charter',
            title: 'Charte de modération',
            version: '1.0',
            lastUpdated: new Date('2025-08-08'),
            content: `
        <h2>Charte de modération FailDaily</h2>
        
        <h3>Notre mission</h3>
        <p>FailDaily vise à créer un espace bienveillant où chacun peut partager ses échecs et recevoir du soutien. Notre modération protège cette mission.</p>
        
        <h3>Contenus interdits</h3>
        <p><strong>🚫 Strictement interdits :</strong></p>
        <ul>
          <li>Incitation au suicide ou à l'automutilation</li>
          <li>Contenu haineux ou discriminatoire</li>
          <li>Harcèlement ou menaces</li>
          <li>Contenu sexuel ou pornographique</li>
          <li>Informations personnelles d'autrui</li>
          <li>Spam et publicité</li>
        </ul>
        
        <h3>Contenus sensibles acceptés avec vigilance</h3>
        <p><strong>⚠️ Autorisés mais surveillés :</strong></p>
        <ul>
          <li>Échecs personnels difficiles (avec soutien)</li>
          <li>Témoignages de difficultés mentales (orientés vers l'aide)</li>
          <li>Discussions sur la santé mentale (informatives)</li>
        </ul>
        
        <h3>Processus de modération</h3>
        <p><strong>1. Signalement :</strong> Tout utilisateur peut signaler un contenu</p>
        <p><strong>2. Évaluation :</strong> Équipe de modération (24h max)</p>
        <p><strong>3. Action :</strong> Suppression, avertissement, ou validation</p>
        <p><strong>4. Recours :</strong> Possibilité de contester via contact@faildaily.app</p>
        
        <h3>Sanctions progressives</h3>
        <ul>
          <li><strong>1er avertissement :</strong> Notification et éducation</li>
          <li><strong>2e avertissement :</strong> Restriction temporaire (7 jours)</li>
          <li><strong>3e avertissement :</strong> Suspension (30 jours)</li>
          <li><strong>Cas graves :</strong> Bannissement immédiat</li>
        </ul>
        
        <h3>Ressources d'aide</h3>
        <p>En cas de contenu alarmant, nous orientons vers :</p>
        <ul>
          <li><strong>Suicide Écoute :</strong> 01 45 39 40 00</li>
          <li><strong>SOS Amitié :</strong> 09 72 39 40 50</li>
          <li><strong>3114 :</strong> Numéro national gratuit</li>
        </ul>
      `
        };
    }

    /**
     * Récupère les ressources d'aide
     */
    getHelpResources(): LegalDocument {
        return {
            id: 'help-resources',
            title: 'Ressources d\'aide',
            version: '1.0',
            lastUpdated: new Date('2025-08-08'),
            content: `
        <h2>Ressources d'aide et de soutien</h2>
        
        <div class="disclaimer">
          <h3>⚠️ Clause de non-responsabilité médicale</h3>
          <p><strong>FailDaily n'est pas un service médical ou thérapeutique.</strong> Si vous traversez une crise ou ressentez des pensées suicidaires, contactez immédiatement un professionnel ou les services d'urgence.</p>
        </div>
        
        <h3>🆘 Urgences</h3>
        <ul>
          <li><strong>SAMU :</strong> 15</li>
          <li><strong>Police/Gendarmerie :</strong> 17</li>
          <li><strong>Pompiers :</strong> 18</li>
          <li><strong>Urgences (mobile) :</strong> 112</li>
        </ul>
        
        <h3>📞 Écoute et soutien psychologique</h3>
        <ul>
          <li><strong>3114 :</strong> Numéro national de prévention du suicide (gratuit, 24h/24)</li>
          <li><strong>Suicide Écoute :</strong> 01 45 39 40 00 (24h/24)</li>
          <li><strong>SOS Amitié :</strong> 09 72 39 40 50 (24h/24)</li>
          <li><strong>Croix-Rouge Écoute :</strong> 0 800 858 858 (gratuit)</li>
        </ul>
        
        <h3>👨‍⚕️ Professionnels de santé</h3>
        <ul>
          <li><strong>Psychologues.net :</strong> Trouvez un psychologue près de chez vous</li>
          <li><strong>Doctolib :</strong> Prenez rendez-vous en ligne</li>
          <li><strong>Centres Médico-Psychologiques (CMP) :</strong> Consultations gratuites</li>
        </ul>
        
        <h3>👨‍👩‍👧‍👦 Aide spécialisée</h3>
        <ul>
          <li><strong>Fil Santé Jeunes :</strong> 0 800 235 236 (12-25 ans)</li>
          <li><strong>SOS Violences Conjugales :</strong> 3919</li>
          <li><strong>Ligne Azur (LGBT) :</strong> 0 810 20 30 40</li>
          <li><strong>SOS Drogue International :</strong> 0 800 23 13 13</li>
        </ul>
        
        <h3>💻 Ressources en ligne</h3>
        <ul>
          <li><strong>Psycom.org :</strong> Information sur la santé mentale</li>
          <li><strong>Nightline France :</strong> Écoute par et pour les étudiants</li>
          <li><strong>Mon Parcours Psy :</strong> Remboursement de séances de psychologue</li>
        </ul>
        
        <h3>📱 Applications d'aide</h3>
        <ul>
          <li><strong>MindShift :</strong> Gestion de l'anxiété</li>
          <li><strong>Calm :</strong> Méditation et relaxation</li>
          <li><strong>Youper :</strong> Suivi de l'humeur avec IA</li>
        </ul>
      `
        };
    }

    /**
     * Récupère les restrictions d'âge
     */
    getAgeRestrictions(): LegalDocument {
        return {
            id: 'age-restrictions',
            title: 'Restrictions d\'âge',
            version: '1.0',
            lastUpdated: new Date('2025-08-08'),
            content: `
        <h2>Restrictions d'âge et protection des mineurs</h2>
        
        <h3>🔞 Conditions d'âge</h3>
        
        <h4>Moins de 13 ans</h4>
        <p><strong>❌ Accès interdit</strong></p>
        <p>Conformément aux réglementations internationales sur la protection des données des enfants (COPPA, RGPD), FailDaily est strictement interdit aux utilisateurs de moins de 13 ans.</p>
        
        <h4>13-16 ans</h4>
        <p><strong>⚠️ Autorisation parentale requise</strong></p>
        <p>Les utilisateurs âgés de 13 à 16 ans doivent obtenir l'autorisation explicite de leurs parents ou tuteurs légaux pour :</p>
        <ul>
          <li>Créer un compte</li>
          <li>Publier du contenu</li>
          <li>Interagir avec d'autres utilisateurs</li>
        </ul>
        
        <h4>16 ans et plus</h4>
        <p><strong>✅ Accès libre</strong></p>
        <p>Utilisation autonome de l'application avec acceptation des conditions générales.</p>
        
        <h3>🛡️ Mesures de protection</h3>
        
        <h4>Vérification d'âge</h4>
        <ul>
          <li>Déclaration obligatoire de l'âge à l'inscription</li>
          <li>Validation de l'email parental pour les 13-16 ans</li>
          <li>Contrôles périodiques en cas de suspicion</li>
        </ul>
        
        <h4>Modération renforcée</h4>
        <ul>
          <li>Surveillance accrue des comptes mineurs</li>
          <li>Filtrage automatique du contenu sensible</li>
          <li>Signalement prioritaire des interactions inappropriées</li>
        </ul>
        
        <h4>Paramètres de confidentialité</h4>
        <ul>
          <li>Compte privé par défaut pour les mineurs</li>
          <li>Limitation des interactions avec des inconnus</li>
          <li>Blocage automatique des contenus à risque</li>
        </ul>
        
        <h3>👨‍👩‍👧‍👦 Conseils aux parents</h3>
        
        <h4>Communication</h4>
        <ul>
          <li>Discutez avec votre enfant de l'utilisation de l'app</li>
          <li>Expliquez les règles de sécurité en ligne</li>
          <li>Encouragez le signalement de contenus inappropriés</li>
        </ul>
        
        <h4>Surveillance</h4>
        <ul>
          <li>Vérifiez régulièrement l'activité de votre enfant</li>
          <li>Utilisez les outils de contrôle parental</li>
          <li>Restez disponible pour répondre aux questions</li>
        </ul>
        
        <h3>📧 Contact</h3>
        <p>Pour toute question concernant la protection des mineurs :</p>
        <p><strong>parents@faildaily.app</strong></p>
      `
        };
    }

    /**
     * Récupère tous les documents légaux
     */
    getAllLegalDocuments(): LegalDocument[] {
        return [
            this.getLegalNotice(),
            this.getTermsOfService(),
            this.getPrivacyPolicy(),
            this.getModerationCharter(),
            this.getHelpResources(),
            this.getAgeRestrictions()
        ];
    }
}
