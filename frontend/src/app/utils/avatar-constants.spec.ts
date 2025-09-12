import { DEFAULT_AVATAR, DEFAULT_AVATARS } from './avatar-constants';

describe('Avatar constants', () => {
  it('DEFAULT_AVATAR should be a frontend asset path', () => {
    expect(DEFAULT_AVATAR.startsWith('/assets/profil/')).toBeTrue();
  });

  it('DEFAULT_AVATARS should only contain frontend asset paths', () => {
    expect(DEFAULT_AVATARS.length).toBeGreaterThan(0);
    for (const url of DEFAULT_AVATARS) {
      expect(url.startsWith('/assets/profil/')).toBeTrue();
    }
  });
});

