import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { Fail } from '../models/fail.model';
import { FailCategory } from '../models/enums';
import { Preferences } from '@capacitor/preferences';

@Injectable({ providedIn: 'root' })
export class FailService {
  private failsSubject = new BehaviorSubject<Fail[]>([]);
  public fails$ = this.failsSubject.asObservable();

  constructor() {
    this.loadFailsFromStorage();
  }

  async loadFailsFromStorage() {
    const { value } = await Preferences.get({ key: 'fails' });
    if (value) {
      const fails = JSON.parse(value).map((fail: any) => ({
        ...fail,
        createdAt: new Date(fail.createdAt)
      }));
      this.failsSubject.next(fails);
    }
  }

  getFails(): Observable<Fail[]> {
    return this.fails$;
  }

  async addFail(fail: Fail): Promise<void> {
    const currentFails = this.failsSubject.value;
    const updatedFails = [fail, ...currentFails]; // Nouveau fail en premier

    await this.saveFailsToStorage(updatedFails);
    this.failsSubject.next(updatedFails);
  }

  async updateFail(failId: string, updates: Partial<Fail>): Promise<void> {
    const currentFails = this.failsSubject.value;
    const updatedFails = currentFails.map(fail =>
      fail.id === failId ? { ...fail, ...updates } : fail
    );

    await this.saveFailsToStorage(updatedFails);
    this.failsSubject.next(updatedFails);
  }

  async addReaction(failId: string, reactionType: 'courageHearts' | 'laughs' | 'supports'): Promise<void> {
    const currentFails = this.failsSubject.value;
    const updatedFails = currentFails.map(fail => {
      if (fail.id === failId) {
        return {
          ...fail,
          reactions: {
            ...fail.reactions,
            [reactionType]: (fail.reactions as any)[reactionType] + 1
          }
        };
      }
      return fail;
    });

    await this.saveFailsToStorage(updatedFails);
    this.failsSubject.next(updatedFails);
  }

  private async saveFailsToStorage(fails: Fail[]): Promise<void> {
    await Preferences.set({
      key: 'fails',
      value: JSON.stringify(fails)
    });
  }

  // Méthode pour générer des fails de démonstration
  async generateDemoFails(): Promise<void> {
    const demoFails: Fail[] = [
      {
        id: '1',
        content: 'J\'ai renversé mon café sur mon ordinateur portable pendant une réunion importante... Le silence qui a suivi était assourdissant 😅',
        category: FailCategory.WORK,
        author: {
          id: 'demo1',
          displayName: 'Sarah M.',
          avatar: 'assets/images/default-avatar.png'
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // Il y a 2h
        reactions: { courageHearts: 12, laughs: 8, supports: 5 },
        isAnonymous: false
      },
      {
        id: '2',
        content: 'Ma recette "secrète" de gâteau au chocolat s\'est transformée en brique... Mes invités ont été très polis en prétendant que c\'était "original" 🍰',
        category: FailCategory.COOKING,
        author: {
          id: 'demo2',
          displayName: 'Anonyme',
          avatar: 'assets/images/anonymous-avatar.png'
        },
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // Il y a 5h
        reactions: { courageHearts: 15, laughs: 22, supports: 8 },
        isAnonymous: true
      }
    ];

    await this.saveFailsToStorage(demoFails);
    this.failsSubject.next(demoFails);
  }
}
