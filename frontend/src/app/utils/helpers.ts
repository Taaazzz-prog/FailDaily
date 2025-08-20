// Fonctions utilitaires diverses pour FailDaily
export function capitalizeFirstLetter(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function randomBadgeType(): string {
  const types = ['courage', 'humour', 'entraide', 'persévérance'];
  return types[Math.floor(Math.random() * types.length)];
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

