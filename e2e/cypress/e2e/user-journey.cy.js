function api(path) {
  return ;
}

function randomEmail() {
  const ts = Date.now();
  return ;
}

describe('FailDaily user journey', () => {
  let token; let userId; let failId;

  it('registers an adult user', () => {
    const email = randomEmail();
    const password = 'P@ssw0rd!';
    const displayName = ;
    cy.request('POST', api('/auth/register'), {
      email, password, displayName, birthDate: '1990-01-01', agreeToTerms: true
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 201]);
      expect(res.body).to.have.property('token');
      token = res.body.token;
      expect(res.body).to.have.nested.property('user.id');
      userId = res.body.user.id;
    });
  });

  it('elevates user to admin for tests', () => {
    cy.request({
      method: 'POST', url: api('/test/elevate'),
      headers: { Authorization:  },
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('success', true);
    });
  });

  it('creates a fail with uploaded image and approves it', () => {
    // upload tiny png as image
    const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P8z/C/HwAF/gL+9o95VwAAAABJRU5ErkJggg==';
    const blob = Cypress.Blob.base64StringToBlob(png, 'image/png');
    const form = new FormData();
    form.append('image', blob, 'tiny.png');

    cy.request({
      method: 'POST', url: api('/upload/image'),
      headers: { Authorization:  },
      body: form,
    }).then((res) => {
      expect(res.status).to.eq(200);
      const imageUrl = res.body.data?.imageUrl || res.body.url;
      expect(imageUrl).to.be.a('string');

      // create fail
      return cy.request({
        method: 'POST', url: api('/fails'),
        headers: { Authorization:  },
        body: {
          title: ,
          description: 'Desc e2e',
          category: 'Général',
          is_anonyme: false,
          imageUrl
        }
      });
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 201]);
      expect(res.body).to.have.nested.property('fail.id');
      failId = res.body.fail.id;

      // approve it
      return cy.request({
        method: 'POST', url: api(),
        headers: { Authorization:  }
      });
    }).then((res) => {
      expect(res.status).to.eq(200);
    });
  });

  it('comments and reacts, then awards points', () => {
    // comment
    cy.request({
      method: 'POST', url: api(),
      headers: { Authorization:  },
      body: { content: 'Bravo e2e! super test.' }
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 201]);
    });

    // react (courage)
    cy.request({
      method: 'POST', url: api(),
      headers: { Authorization:  },
      body: { reactionType: 'courage' }
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 201]);
    });

    // award points to unlock potential badges quickly
    cy.request({
      method: 'POST', url: api('/test/points'),
      headers: { Authorization:  },
      body: { amount: 100 }
    }).then((res) => {
      expect(res.status).to.eq(200);
    });
  });

  it('updates profile (displayName, bio) and lists public fails', () => {
    cy.request({
      method: 'PUT', url: api('/auth/profile'),
      headers: { Authorization:  },
      body: { displayName: , bio: 'Bio e2e OK' }
    }).then((res) => {
      expect(res.status).to.eq(200);
    });

    cy.request({
      method: 'GET', url: api('/fails/public'),
      headers: { Authorization:  }
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('fails');
      expect(res.body.fails).to.be.an('array');
    });
  });
});
