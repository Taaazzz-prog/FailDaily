import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AvatarService } from './avatar.service';

describe('AvatarService', () => {
  let service: AvatarService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(AvatarService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getDefaultAvatar returns the default path', () => {
    expect(service.getDefaultAvatar()).toBe('/assets/profil/face.png');
  });

  it('getAvailableAvatars falls back to default on HTTP error (no fake images needed)', async () => {
    const promise = service.getAvailableAvatars();
    const req = httpMock.expectOne('/assets/profil/avatars-list.json');
    req.error(new ProgressEvent('NetworkError'));

    const avatars = await promise;
    expect(avatars.length).toBe(1);
    expect(avatars[0].url).toBe('/assets/profil/face.png');
    expect(avatars[0].isDefault).toBeTrue();
  });

  it('getAvailableAvatars returns entries from JSON without loading actual images', async () => {
    // Spy on private checker to avoid real image loading
    const spy = spyOn<any>(service, 'checkImageExists').and.returnValue(Promise.resolve(true));

    const promise = service.getAvailableAvatars();
    const req = httpMock.expectOne('/assets/profil/avatars-list.json');
    req.flush(['face.png', 'base.png']);

    const avatars = await promise;
    expect(avatars.map(a => a.name)).toEqual(['face.png', 'base.png']);
    expect(spy).toHaveBeenCalled();
  });
});

