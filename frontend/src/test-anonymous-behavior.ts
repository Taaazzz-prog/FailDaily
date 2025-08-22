// Test rapide pour vérifier le comportement des fails anonymes vs publics
// Ce fichier peut être supprimé après vérification

export const testFailCards = {
    publicFail: {
        id: '1',
        content: 'Fail public',
        authorName: 'John Doe',
        authorAvatar: '/assets/avatar.jpg',
        authorId: 'user-123',
        is_public: true, // ✅ Clickable
        createdAt: new Date(),
        reactions: [],
        comments: []
    },

    anonymousFail: {
        id: '2',
        content: 'Fail anonyme',
        authorName: 'Utilisateur anonyme',
        authorAvatar: '/assets/anonymous-avatar.jpg',
        authorId: 'user-456',
        is_public: false, // ❌ Non clickable
        createdAt: new Date(),
        reactions: [],
        comments: []
    }
};

// Comportement attendu :
// - publicFail : Avatar et nom clickables → navigation vers profil
// - anonymousFail : Avatar et nom grisés, non clickables → pas de navigation
