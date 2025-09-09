# FailDaily - Page Post-Fail Structure Complète

## ✍️ Page Post-Fail (post-fail.page.html + post-fail.page.scss)

### Structure HTML Complète - Page Post-Fail
```html
<ion-header [translucent]="true">
  <ion-toolbar>
    <ion-title class="handwriting">Partager un Fail</ion-title>
    <ion-buttons slot="start">
      <ion-back-button defaultHref="/tabs/home"></ion-back-button>
    </ion-buttons>
    <ion-buttons slot="end">
      <ion-button fill="clear" (click)="showTips()">
        <ion-icon name="help-circle-outline"></ion-icon>
      </ion-button>
    </ion-buttons>
  </ion-toolbar>
</ion-header>

<ion-content [fullscreen]="true" class="ion-padding">
  <div class="post-fail-container">
    <!-- SECTION D'ENCOURAGEMENT -->
    <div class="encouragement-section imperfect-element">
      <h2 class="handwriting">Courage ! 💪</h2>
      <p class="comfort-text">Partagez votre fail quotidien et recevez du soutien de la communauté</p>
      <div class="daily-motivation">
        <ion-icon name="heart-outline" class="motivation-icon"></ion-icon>
        <span class="comfort-text">{{ dailyMotivationalMessage }}</span>
      </div>
    </div>

    <!-- FORMULAIRE DE PUBLICATION -->
    <form [formGroup]="postFailForm" (ngSubmit)="onPostFail()" class="post-fail-form">

      <!-- ÉTAPE 1 : TITRE DU FAIL -->
      <div class="form-step active" id="step-title">
        <div class="step-header">
          <h3 class="handwriting">
            <span class="step-number">1</span>
            Donnez un titre à votre fail
          </h3>
          <p class="comfort-text">Un titre court et authentique</p>
        </div>

        <ion-item class="imperfect-element title-input">
          <ion-label position="stacked" class="comfort-text">Titre de votre fail</ion-label>
          <ion-textarea 
            formControlName="title" 
            placeholder="Exemple: J'ai encore raté mon café ce matin..." 
            rows="2" 
            maxlength="100"
            (ionInput)="onTitleInput($event)">
          </ion-textarea>
          <div class="character-count" slot="helper">
            <span class="comfort-text">{{ titleCharCount }}/100</span>
          </div>
        </ion-item>

        @if (postFailForm.get('title')?.errors?.['required'] && postFailForm.get('title')?.touched) {
        <div class="error-message">
          <ion-icon name="alert-circle-outline"></ion-icon>
          <span class="comfort-text">Le titre est obligatoire</span>
        </div>
        }
      </div>

      <!-- ÉTAPE 2 : CONTENU DU FAIL -->
      <div class="form-step" id="step-content">
        <div class="step-header">
          <h3 class="handwriting">
            <span class="step-number">2</span>
            Racontez votre fail
          </h3>
          <p class="comfort-text">Exprimez-vous librement, sans jugement</p>
        </div>

        <ion-item class="imperfect-element content-input">
          <ion-label position="stacked" class="comfort-text">Votre fail du jour</ion-label>
          <ion-textarea 
            formControlName="content" 
            placeholder="Racontez-nous ce qui s'est passé... Pas de jugement ici ! Soyez authentique et honnête avec vos émotions."
            rows="6" 
            maxlength="500"
            (ionInput)="onContentInput($event)">
          </ion-textarea>
          <div class="character-count" slot="helper">
            <span class="comfort-text">{{ contentCharCount }}/500</span>
          </div>
        </ion-item>

        <!-- Suggestions d'aide -->
        <div class="writing-tips">
          <h4 class="comfort-text">💡 Conseils pour bien partager :</h4>
          <ul class="tips-list">
            <li class="comfort-text">Décrivez ce qui s'est passé</li>
            <li class="comfort-text">Partagez vos émotions du moment</li>
            <li class="comfort-text">Mentionnez ce que vous avez appris</li>
            <li class="comfort-text">Restez bienveillant envers vous-même</li>
          </ul>
        </div>
      </div>

      <!-- ÉTAPE 3 : CATÉGORIE -->
      <div class="form-step" id="step-category">
        <div class="step-header">
          <h3 class="handwriting">
            <span class="step-number">3</span>
            Dans quelle catégorie ?
          </h3>
          <p class="comfort-text">Aidez les autres à trouver des fails similaires</p>
        </div>

        <div class="category-selection">
          @for (category of failCategories; track category.value) {
          <div class="category-option imperfect-element" 
               [class.selected]="postFailForm.get('category')?.value === category.value"
               (click)="selectCategory(category.value)">
            <div class="category-icon">
              <ion-icon [name]="category.icon" [style.color]="category.color"></ion-icon>
            </div>
            <div class="category-info">
              <h4 class="category-name comfort-text">{{ category.label }}</h4>
              <p class="category-description comfort-text">{{ category.description }}</p>
            </div>
            @if (postFailForm.get('category')?.value === category.value) {
            <div class="selection-check">
              <ion-icon name="checkmark-circle" color="success"></ion-icon>
            </div>
            }
          </div>
          }
        </div>
      </div>

      <!-- ÉTAPE 4 : MÉDIA AUTHENTIQUE (OPTIONNEL) -->
      <div class="form-step" id="step-media">
        <div class="step-header">
          <h3 class="handwriting">
            <span class="step-number">4</span>
            Capturer l'instant (optionnel)
          </h3>
          <p class="comfort-text">Une photo ou vidéo courte pour illustrer votre fail</p>
        </div>

        <div class="media-section">
          @if (!selectedMedia) {
          <div class="media-options">
            <ion-button fill="outline" (click)="capturePhoto()" class="media-btn imperfect-element">
              <ion-icon name="camera-outline" slot="start"></ion-icon>
              <div class="btn-content">
                <span class="comfort-text">Prendre une photo</span>
                <small class="comfort-text">Direct depuis la caméra</small>
              </div>
            </ion-button>

            <ion-button fill="outline" (click)="recordVideo()" class="media-btn imperfect-element">
              <ion-icon name="videocam-outline" slot="start"></ion-icon>
              <div class="btn-content">
                <span class="comfort-text">Vidéo courte</span>
                <small class="comfort-text">Maximum 30 secondes</small>
              </div>
            </ion-button>

            <ion-button fill="clear" (click)="skipMedia()" class="skip-btn">
              <span class="comfort-text">Passer cette étape</span>
              <ion-icon name="arrow-forward-outline" slot="end"></ion-icon>
            </ion-button>
          </div>

          <div class="authenticity-note">
            <ion-icon name="shield-checkmark-outline" color="success"></ion-icon>
            <p class="comfort-text">📱 Médias directs uniquement - pas de retouche possible pour préserver l'authenticité !</p>
          </div>
          } @else {
          <div class="selected-media">
            @if (selectedMedia.type === 'photo') {
            <div class="media-preview photo-preview">
              <img [src]="selectedMedia.url" [alt]="'Photo du fail: ' + postFailForm.get('title')?.value">
              <div class="authentic-badge">
                <ion-icon name="camera-outline" color="success"></ion-icon>
                <span class="comfort-text">Authentique</span>
              </div>
            </div>
            } @else if (selectedMedia.type === 'video') {
            <div class="media-preview video-preview">
              <video [src]="selectedMedia.url" controls preload="metadata">
                Votre navigateur ne supporte pas la lecture vidéo.
              </video>
              <div class="authentic-badge">
                <ion-icon name="videocam-outline" color="success"></ion-icon>
                <span class="comfort-text">Authentique</span>
              </div>
            </div>
            }

            <div class="media-actions">
              <ion-button fill="outline" color="danger" size="small" (click)="removeMedia()">
                <ion-icon name="trash-outline" slot="start"></ion-icon>
                Supprimer
              </ion-button>

              <ion-button fill="clear" size="small" (click)="retakeMedia()">
                <ion-icon name="refresh-outline" slot="start"></ion-icon>
                Reprendre
              </ion-button>
            </div>
          </div>
          }
        </div>
      </div>

      <!-- ÉTAPE 5 : OPTIONS DE PUBLICATION -->
      <div class="form-step" id="step-options">
        <div class="step-header">
          <h3 class="handwriting">
            <span class="step-number">5</span>
            Options de publication
          </h3>
          <p class="comfort-text">Choisissez comment publier votre fail</p>
        </div>

        <div class="publication-options">
          <!-- Option anonyme -->
          <div class="option-item imperfect-element">
            <div class="option-content">
              <div class="option-header">
                <ion-icon name="glasses-outline" color="medium"></ion-icon>
                <h4 class="comfort-text">Publication anonyme</h4>
              </div>
              <p class="comfort-text">Votre nom ne sera pas affiché, seul votre niveau apparaîtra</p>
            </div>
            <ion-toggle formControlName="isAnonymous" (ionChange)="onAnonymousChange($event)"></ion-toggle>
          </div>

          <!-- Permissions de partage -->
          <div class="option-item imperfect-element">
            <div class="option-content">
              <div class="option-header">
                <ion-icon name="people-outline" color="medium"></ion-icon>
                <h4 class="comfort-text">Qui peut voir ce fail ?</h4>
              </div>
              <ion-radio-group formControlName="visibility" (ionChange)="onVisibilityChange($event)">
                <ion-radio value="public" slot="start"></ion-radio>
                <ion-label class="comfort-text">Public - Visible par tous</ion-label>
              </ion-radio-group>
              
              <ion-radio-group formControlName="visibility" (ionChange)="onVisibilityChange($event)">
                <ion-radio value="community" slot="start"></ion-radio>
                <ion-label class="comfort-text">Communauté - Utilisateurs connectés uniquement</ion-label>
              </ion-radio-group>
            </div>
          </div>

          <!-- Autoriser les encouragements -->
          <div class="option-item imperfect-element">
            <div class="option-content">
              <div class="option-header">
                <ion-icon name="heart-outline" color="medium"></ion-icon>
                <h4 class="comfort-text">Encouragements</h4>
              </div>
              <p class="comfort-text">Permettre aux autres de vous encourager</p>
            </div>
            <ion-toggle formControlName="allowSupport" checked="true"></ion-toggle>
          </div>
        </div>
      </div>

      <!-- APERÇU ET PUBLICATION -->
      <div class="preview-section">
        <h3 class="handwriting">Aperçu de votre fail</h3>
        <div class="fail-preview imperfect-element">
          <div class="preview-header">
            <div class="author-info">
              @if (postFailForm.get('isAnonymous')?.value) {
              <div class="anonymous-avatar">
                <ion-icon name="glasses-outline"></ion-icon>
              </div>
              <div class="author-details">
                <span class="author-name comfort-text">Utilisateur anonyme</span>
                <span class="author-level comfort-text">Niveau {{ currentUser?.level }}</span>
              </div>
              } @else {
              <img [src]="currentUser?.avatar || '/assets/default-avatar.png'" 
                   [alt]="currentUser?.displayName + ' avatar'" 
                   class="author-avatar">
              <div class="author-details">
                <span class="author-name comfort-text">{{ currentUser?.displayName }}</span>
                <span class="author-level comfort-text">Niveau {{ currentUser?.level }}</span>
              </div>
              }
            </div>
            <div class="post-time">
              <span class="comfort-text">{{ 'À l\'instant' }}</span>
            </div>
          </div>

          <div class="preview-content">
            <h4 class="fail-title comfort-text">{{ postFailForm.get('title')?.value || 'Votre titre ici...' }}</h4>
            <p class="fail-content comfort-text">{{ postFailForm.get('content')?.value || 'Votre contenu ici...' }}</p>
            
            @if (selectedMedia) {
            <div class="preview-media">
              @if (selectedMedia.type === 'photo') {
              <img [src]="selectedMedia.url" alt="Aperçu de l'image">
              } @else {
              <video [src]="selectedMedia.url" controls></video>
              }
            </div>
            }

            <div class="preview-category">
              <ion-chip color="primary" outline="true">
                <ion-icon [name]="getSelectedCategoryIcon()"></ion-icon>
                <ion-label class="comfort-text">{{ getSelectedCategoryLabel() }}</ion-label>
              </ion-chip>
            </div>
          </div>
        </div>
      </div>

      <!-- NAVIGATION DU FORMULAIRE -->
      <div class="form-navigation">
        @if (currentStep > 1) {
        <ion-button fill="outline" (click)="previousStep()" class="nav-btn">
          <ion-icon name="chevron-back-outline" slot="start"></ion-icon>
          Précédent
        </ion-button>
        }

        @if (currentStep < totalSteps) {
        <ion-button (click)="nextStep()" class="nav-btn" [disabled]="!isCurrentStepValid()">
          Suivant
          <ion-icon name="chevron-forward-outline" slot="end"></ion-icon>
        </ion-button>
        } @else {
        <!-- BOUTON DE PUBLICATION FINAL -->
        <ion-button 
          type="submit" 
          expand="block" 
          class="publish-button imperfect-element"
          [disabled]="!postFailForm.valid || isLoading">
          @if (isLoading) {
          <ion-spinner name="crescent"></ion-spinner>
          <span class="comfort-text">Publication en cours...</span>
          } @else {
          <ion-icon name="send-outline" slot="start"></ion-icon>
          <span class="comfort-text">Publier avec courage</span>
          }
        </ion-button>
        }
      </div>
    </form>

    <!-- SECTION DE MOTIVATION -->
    <div class="motivation-section">
      <div class="motivation-card imperfect-element">
        <h3 class="handwriting">Pourquoi partager ?</h3>
        <div class="motivation-points">
          <div class="motivation-point">
            <ion-icon name="heart-outline" color="danger"></ion-icon>
            <span class="comfort-text">Recevez du soutien de la communauté</span>
          </div>
          <div class="motivation-point">
            <ion-icon name="trending-up-outline" color="success"></ion-icon>
            <span class="comfort-text">Progressez et gagnez de l'expérience</span>
          </div>
          <div class="motivation-point">
            <ion-icon name="people-outline" color="primary"></ion-icon>
            <span class="comfort-text">Aidez d'autres personnes dans la même situation</span>
          </div>
          <div class="motivation-point">
            <ion-icon name="trophy-outline" color="warning"></ion-icon>
            <span class="comfort-text">Débloquez des badges de courage</span>
          </div>
        </div>
      </div>

      <!-- Message d'encouragement final -->
      <div class="final-encouragement">
        <p class="handwriting">Rappelez-vous : chaque fail est un pas vers le succès ! 🌟</p>
        <p class="comfort-text">Votre courage inspire les autres.</p>
      </div>
    </div>
  </div>
</ion-content>
```

### Styles SCSS Complets - Page Post-Fail
```scss
// Variables pour le design "imparfait" avec couleurs douces et pastel
:root {
    --post-primary: #6366f1;
    --post-secondary: #8b5cf6;
    --post-success: #10b981;
    --post-warning: #f59e0b;
    --post-danger: #ef4444;
    
    --step-bg: rgba(99, 102, 241, 0.05);
    --step-border: rgba(99, 102, 241, 0.1);
    --preview-bg: rgba(255, 255, 255, 0.9);
    
    --soft-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    --gentle-glow: 0 0 12px rgba(0, 0, 0, 0.1);
}

ion-content {
    --background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%);
}

.post-fail-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 1rem;

    // Section d'encouragement
    .encouragement-section {
        text-align: center;
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05));
        border-radius: 16px;
        padding: 1.5rem;
        margin-bottom: 2rem;
        border: 1px solid var(--step-border);
        transform: rotate(-0.5deg);

        h2 {
            font-size: 2rem;
            color: var(--post-primary);
            margin-bottom: 0.5rem;
            font-family: 'Caveat', cursive;
            font-weight: 600;
        }

        .comfort-text {
            color: #64748b;
            font-size: 1rem;
            margin-bottom: 1rem;
            font-family: 'Comfortaa', sans-serif;
        }

        .daily-motivation {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            background: white;
            border-radius: 12px;
            padding: 0.75rem;
            box-shadow: var(--soft-shadow);
            transform: rotate(1deg);

            .motivation-icon {
                color: var(--post-danger);
                font-size: 1.2rem;
                animation: heartbeat 2s ease-in-out infinite;
            }

            .comfort-text {
                color: var(--post-primary);
                margin: 0;
                font-weight: 500;
                font-style: italic;
            }
        }
    }

    // Formulaire de publication
    .post-fail-form {
        .form-step {
            background: white;
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            box-shadow: var(--soft-shadow);
            border: 1px solid var(--step-border);
            transform: rotate(0.3deg);

            &:nth-child(even) {
                transform: rotate(-0.3deg);
            }

            .step-header {
                margin-bottom: 1.5rem;
                text-align: center;

                h3 {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    color: var(--post-primary);
                    font-size: 1.3rem;
                    margin: 0 0 0.5rem 0;
                    font-family: 'Caveat', cursive;
                    font-weight: 600;

                    .step-number {
                        width: 32px;
                        height: 32px;
                        background: var(--post-primary);
                        color: white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1rem;
                        font-family: 'Comfortaa', sans-serif;
                        font-weight: 600;
                    }
                }

                .comfort-text {
                    color: #64748b;
                    font-size: 0.9rem;
                    font-family: 'Comfortaa', sans-serif;
                }
            }

            // Styles pour les champs de saisie
            ion-item {
                --background: rgba(99, 102, 241, 0.02);
                --border-radius: 12px;
                --box-shadow: none;
                border: 1px solid var(--step-border);
                margin-bottom: 1rem;
                transform: rotate(-0.5deg);

                &.title-input,
                &.content-input {
                    ion-textarea {
                        font-family: 'Kalam', cursive;
                        font-size: 1rem;
                        line-height: 1.4;

                        &::placeholder {
                            color: #94a3b8;
                            font-style: italic;
                        }
                    }
                }

                ion-label {
                    color: var(--post-primary);
                    font-family: 'Comfortaa', sans-serif;
                    font-weight: 600;
                }

                .character-count {
                    text-align: right;
                    margin-top: 0.5rem;

                    .comfort-text {
                        font-size: 0.75rem;
                        color: #94a3b8;
                        font-family: 'Comfortaa', sans-serif;
                    }
                }
            }

            // Messages d'erreur
            .error-message {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem;
                background: rgba(239, 68, 68, 0.1);
                border-radius: 8px;
                border: 1px solid rgba(239, 68, 68, 0.2);
                margin-top: 0.5rem;

                ion-icon {
                    color: var(--post-danger);
                    font-size: 1rem;
                }

                .comfort-text {
                    color: var(--post-danger);
                    font-size: 0.8rem;
                    font-family: 'Comfortaa', sans-serif;
                    margin: 0;
                }
            }

            // Conseils d'écriture
            .writing-tips {
                background: var(--step-bg);
                border-radius: 12px;
                padding: 1rem;
                margin-top: 1rem;
                border: 1px solid var(--step-border);

                h4 {
                    color: var(--post-primary);
                    font-size: 0.9rem;
                    margin: 0 0 0.75rem 0;
                    font-family: 'Comfortaa', sans-serif;
                    font-weight: 600;
                }

                .tips-list {
                    margin: 0;
                    padding-left: 1rem;

                    li {
                        color: #64748b;
                        font-size: 0.8rem;
                        margin-bottom: 0.25rem;
                        font-family: 'Kalam', cursive;
                        line-height: 1.3;
                    }
                }
            }

            // Sélection de catégories
            .category-selection {
                .category-option {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    border-radius: 12px;
                    border: 2px solid var(--step-border);
                    margin-bottom: 0.75rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: rgba(255, 255, 255, 0.5);
                    transform: rotate(-0.5deg);

                    &:nth-child(even) {
                        transform: rotate(0.5deg);
                    }

                    &:hover {
                        transform: rotate(0deg) scale(1.02);
                        border-color: var(--post-primary);
                        background: rgba(99, 102, 241, 0.05);
                    }

                    &.selected {
                        border-color: var(--post-primary);
                        background: rgba(99, 102, 241, 0.1);
                        transform: rotate(0deg);
                    }

                    .category-icon {
                        width: 48px;
                        height: 48px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: white;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

                        ion-icon {
                            font-size: 1.5rem;
                        }
                    }

                    .category-info {
                        flex: 1;

                        .category-name {
                            color: #1e293b;
                            font-size: 1rem;
                            margin: 0 0 0.25rem 0;
                            font-family: 'Comfortaa', sans-serif;
                            font-weight: 600;
                        }

                        .category-description {
                            color: #64748b;
                            font-size: 0.8rem;
                            margin: 0;
                            font-family: 'Kalam', cursive;
                            line-height: 1.3;
                        }
                    }

                    .selection-check {
                        ion-icon {
                            font-size: 1.5rem;
                        }
                    }
                }
            }

            // Section média
            .media-section {
                .media-options {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    margin-bottom: 1.5rem;

                    .media-btn {
                        --border-color: var(--post-primary);
                        --color: var(--post-primary);
                        --border-radius: 12px;
                        height: 60px;
                        justify-content: flex-start;
                        padding-left: 1rem;
                        transform: rotate(-0.5deg);

                        &:nth-child(even) {
                            transform: rotate(0.5deg);
                        }

                        &:hover {
                            transform: rotate(0deg);
                            --background: rgba(99, 102, 241, 0.05);
                        }

                        .btn-content {
                            display: flex;
                            flex-direction: column;
                            align-items: flex-start;
                            margin-left: 0.5rem;

                            span {
                                font-size: 1rem;
                                font-weight: 600;
                                font-family: 'Comfortaa', sans-serif;
                            }

                            small {
                                font-size: 0.75rem;
                                color: #64748b;
                                font-family: 'Kalam', cursive;
                            }
                        }
                    }

                    .skip-btn {
                        --color: #64748b;
                        font-family: 'Comfortaa', sans-serif;
                        align-self: center;
                        margin-top: 0.5rem;
                    }
                }

                .authenticity-note {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.5rem;
                    padding: 1rem;
                    background: rgba(16, 185, 129, 0.05);
                    border-radius: 12px;
                    border: 1px solid rgba(16, 185, 129, 0.2);

                    ion-icon {
                        font-size: 1.2rem;
                        margin-top: 0.1rem;
                    }

                    .comfort-text {
                        color: #059669;
                        font-size: 0.8rem;
                        margin: 0;
                        font-family: 'Kalam', cursive;
                        line-height: 1.4;
                    }
                }

                .selected-media {
                    .media-preview {
                        position: relative;
                        text-align: center;
                        margin-bottom: 1rem;

                        &.photo-preview img {
                            max-width: 100%;
                            max-height: 300px;
                            border-radius: 12px;
                            box-shadow: var(--soft-shadow);
                        }

                        &.video-preview video {
                            max-width: 100%;
                            max-height: 300px;
                            border-radius: 12px;
                            box-shadow: var(--soft-shadow);
                        }

                        .authentic-badge {
                            position: absolute;
                            top: 8px;
                            right: 8px;
                            background: rgba(16, 185, 129, 0.9);
                            color: white;
                            padding: 0.25rem 0.5rem;
                            border-radius: 20px;
                            display: flex;
                            align-items: center;
                            gap: 0.25rem;
                            backdrop-filter: blur(4px);

                            ion-icon {
                                font-size: 0.9rem;
                            }

                            .comfort-text {
                                font-size: 0.7rem;
                                font-family: 'Comfortaa', sans-serif;
                                font-weight: 600;
                                margin: 0;
                            }
                        }
                    }

                    .media-actions {
                        display: flex;
                        justify-content: center;
                        gap: 0.5rem;

                        ion-button {
                            font-family: 'Comfortaa', sans-serif;
                            font-size: 0.8rem;
                        }
                    }
                }
            }

            // Options de publication
            .publication-options {
                .option-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 1rem;
                    border-radius: 12px;
                    border: 1px solid var(--step-border);
                    margin-bottom: 0.75rem;
                    background: rgba(255, 255, 255, 0.5);
                    transform: rotate(-0.3deg);

                    &:nth-child(even) {
                        transform: rotate(0.3deg);
                    }

                    .option-content {
                        flex: 1;

                        .option-header {
                            display: flex;
                            align-items: center;
                            gap: 0.5rem;
                            margin-bottom: 0.5rem;

                            ion-icon {
                                font-size: 1.2rem;
                            }

                            h4 {
                                color: #1e293b;
                                font-size: 0.9rem;
                                margin: 0;
                                font-family: 'Comfortaa', sans-serif;
                                font-weight: 600;
                            }
                        }

                        .comfort-text {
                            color: #64748b;
                            font-size: 0.8rem;
                            margin: 0;
                            font-family: 'Kalam', cursive;
                            line-height: 1.3;
                        }

                        ion-radio-group {
                            margin-top: 0.5rem;

                            ion-radio {
                                margin-right: 0.5rem;
                            }

                            ion-label {
                                color: #64748b;
                                font-size: 0.8rem;
                                font-family: 'Comfortaa', sans-serif;
                            }
                        }
                    }

                    ion-toggle {
                        --track-background: #e2e8f0;
                        --track-background-checked: var(--post-primary);
                        --handle-background: white;
                        --handle-background-checked: white;
                    }
                }
            }
        }

        // Aperçu du fail
        .preview-section {
            background: white;
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            box-shadow: var(--soft-shadow);
            border: 1px solid var(--step-border);
            transform: rotate(-0.2deg);

            h3 {
                color: var(--post-primary);
                font-size: 1.3rem;
                margin: 0 0 1rem 0;
                text-align: center;
                font-family: 'Caveat', cursive;
                font-weight: 600;
            }

            .fail-preview {
                background: var(--preview-bg);
                border-radius: 12px;
                padding: 1rem;
                border: 1px solid rgba(0, 0, 0, 0.1);
                transform: rotate(0.5deg);

                .preview-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;

                    .author-info {
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;

                        .author-avatar {
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            object-fit: cover;
                            border: 2px solid var(--post-primary);
                        }

                        .anonymous-avatar {
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            background: #e2e8f0;
                            border: 2px solid #94a3b8;
                            display: flex;
                            align-items: center;
                            justify-content: center;

                            ion-icon {
                                color: #64748b;
                                font-size: 1.2rem;
                            }
                        }

                        .author-details {
                            display: flex;
                            flex-direction: column;

                            .author-name {
                                color: #1e293b;
                                font-size: 0.9rem;
                                font-family: 'Comfortaa', sans-serif;
                                font-weight: 600;
                            }

                            .author-level {
                                color: #64748b;
                                font-size: 0.75rem;
                                font-family: 'Comfortaa', sans-serif;
                            }
                        }
                    }

                    .post-time {
                        .comfort-text {
                            color: #94a3b8;
                            font-size: 0.75rem;
                            font-family: 'Comfortaa', sans-serif;
                        }
                    }
                }

                .preview-content {
                    .fail-title {
                        color: #1e293b;
                        font-size: 1.1rem;
                        margin: 0 0 0.75rem 0;
                        font-family: 'Comfortaa', sans-serif;
                        font-weight: 600;
                        line-height: 1.3;
                    }

                    .fail-content {
                        color: #475569;
                        font-size: 0.9rem;
                        margin: 0 0 1rem 0;
                        font-family: 'Kalam', cursive;
                        line-height: 1.5;
                    }

                    .preview-media {
                        margin: 1rem 0;
                        text-align: center;

                        img, video {
                            max-width: 100%;
                            max-height: 200px;
                            border-radius: 8px;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                        }
                    }

                    .preview-category {
                        ion-chip {
                            --background: rgba(99, 102, 241, 0.1);
                            --color: var(--post-primary);

                            ion-icon {
                                font-size: 0.9rem;
                                margin-right: 0.25rem;
                            }

                            ion-label {
                                font-family: 'Comfortaa', sans-serif;
                                font-weight: 500;
                                font-size: 0.8rem;
                            }
                        }
                    }
                }
            }
        }

        // Navigation du formulaire
        .form-navigation {
            display: flex;
            justify-content: space-between;
            gap: 1rem;
            margin-top: 2rem;

            .nav-btn {
                flex: 1;
                --border-radius: 20px;
                font-family: 'Comfortaa', sans-serif;
                font-weight: 600;

                &:first-child:last-child {
                    max-width: none;
                }
            }

            .publish-button {
                --background: var(--post-primary);
                --color: white;
                --border-radius: 20px;
                height: 50px;
                font-family: 'Comfortaa', sans-serif;
                font-weight: 600;
                transform: rotate(-0.5deg);
                flex: 1;

                &:hover {
                    transform: rotate(0deg) scale(1.02);
                }

                &:disabled {
                    opacity: 0.6;
                    transform: rotate(-0.5deg);
                }

                ion-spinner {
                    margin-right: 0.5rem;
                }
            }
        }
    }

    // Section de motivation
    .motivation-section {
        .motivation-card {
            background: white;
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            box-shadow: var(--soft-shadow);
            border: 1px solid var(--step-border);
            transform: rotate(0.3deg);

            h3 {
                color: var(--post-primary);
                font-size: 1.3rem;
                margin: 0 0 1rem 0;
                text-align: center;
                font-family: 'Caveat', cursive;
                font-weight: 600;
            }

            .motivation-points {
                .motivation-point {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 0.75rem;

                    ion-icon {
                        font-size: 1.2rem;
                    }

                    .comfort-text {
                        color: #475569;
                        font-size: 0.9rem;
                        margin: 0;
                        font-family: 'Kalam', cursive;
                        line-height: 1.4;
                    }
                }
            }
        }

        .final-encouragement {
            text-align: center;

            .handwriting {
                color: var(--post-primary);
                font-size: 1.3rem;
                margin: 0 0 0.5rem 0;
                font-family: 'Caveat', cursive;
                font-weight: 600;
            }

            .comfort-text {
                color: #64748b;
                font-size: 0.9rem;
                margin: 0;
                font-family: 'Comfortaa', sans-serif;
                font-style: italic;
            }
        }
    }
}

// Animations
@keyframes heartbeat {
    0%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.1);
    }
}

// Responsive
@media (max-width: 480px) {
    .post-fail-container {
        padding: 0.5rem;

        .form-step {
            padding: 1rem;
            margin-bottom: 1rem;

            .category-selection .category-option {
                flex-direction: column;
                text-align: center;
                gap: 0.5rem;
            }

            .media-section .media-options .media-btn {
                height: 50px;

                .btn-content {
                    align-items: center;
                }
            }
        }

        .form-navigation {
            flex-direction: column;

            .nav-btn {
                width: 100%;
            }
        }
    }
}

@media (min-width: 768px) {
    .post-fail-container {
        max-width: 700px;

        .category-selection {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
        }

        .media-section .media-options {
            flex-direction: row;
            justify-content: center;

            .media-btn {
                flex: 1;
                max-width: 200px;
            }
        }
    }
}
```
