import { TestBed } from '@angular/core/testing';
import { ImageUrlService } from './image-url.service';
import { environment } from '../../environments/environment';

describe('ImageUrlService', () => {
  let service: ImageUrlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageUrlService);
  });

  it('should return backend absolute URL for uploads paths', () => {
    const base = environment.api.baseUrl.replace('/api', '');
    expect(service.getFullImageUrl('uploads/avatars/a.png')).toBe(`${base}/uploads/avatars/a.png`);
    expect(service.getFullImageUrl('/uploads/avatars/a.png')).toBe(`${base}/uploads/avatars/a.png`);
  });

  it('should passthrough http/https URLs', () => {
    expect(service.getFullImageUrl('http://cdn/img.png')).toBe('http://cdn/img.png');
    expect(service.getFullImageUrl('https://cdn/img.png')).toBe('https://cdn/img.png');
  });

  it('should return absolute frontend path for assets', () => {
    expect(service.getFullImageUrl('/assets/profil/face.png')).toBe('/assets/profil/face.png');
    expect(service.getFullImageUrl('assets/profil/face.png')).toBe('/assets/profil/face.png');
  });

  it('getAvatarUrl should fallback to base avatar when null', () => {
    expect(service.getAvatarUrl(null as any)).toBe('/assets/profil/base.png');
  });
});

