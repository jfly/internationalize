describe('authService', () => {
  beforeEach(module('app.services'));

  let $httpBackend,
      authService,
      $rootScope;

  beforeEach(inject((_$httpBackend_, _authService_, _$rootScope_) => {
    $httpBackend = _$httpBackend_;
    authService = _authService_;
    $rootScope = _$rootScope_;
  }));

  afterEach(() => {
    $httpBackend.verifyNoOutstandingExpectation(false);
    $httpBackend.verifyNoOutstandingRequest();
  });

  const userData = { username: 'sherlock', name: 'Sherlock' },
        credentials = { username: 'sherlock', password: 'secret' },
        forward = error => error;

  describe('currentUser', () => {
    it('when the request is unahuthorized, resolves with null', done => {
      $httpBackend.expectGET('/auth/me').respond(401, { error: 'Unauthorized request.' });
      authService.currentUser()
        .then(user => expect(user).toBeNull())
        .then(done, done.fail);
      $httpBackend.flush();
    });

    it('when the request is successful, resolves with the user data', done => {
      $httpBackend.expectGET('/auth/me').respond(200, { user: userData });
      authService.currentUser()
        .then(user => expect(user).toEqual(userData))
        .then(done, done.fail);
      $httpBackend.flush();
    });

    it('does only one request for a user data', done => {
      $httpBackend.expectGET('/auth/me').respond(200, { user: userData });
      authService.currentUser()
        .then(() => authService.currentUser())
        .then(user => expect(user).toEqual(userData))
        .then(done, done.fail);
      $httpBackend.flush();
    });
  });

  describe('signIn', () => {
    it('when the response is successful, resolves with the new user', done => {
      $httpBackend.expectPOST('/auth/signin', credentials).respond(200, { user: userData });
      authService.signIn(credentials)
        .then(user => expect(user).toEqual(userData))
        .then(done, done.fail);
      $httpBackend.flush();
    });

    it('when the response is unsuccessful, rejects with an error', done => {
      const error = 'Invalid credentials.';
      $httpBackend.expectPOST('/auth/signin', credentials).respond(422, { error: error });
      authService.signIn(credentials)
        .catch(forward)
        .then(err => expect(err).toEqual(error))
        .then(done, done.fail);
      $httpBackend.flush();
    });
  });

  describe('signOut', () => {
    it('clears the user data cache', done => {
      $httpBackend.expectDELETE('/auth/signout').respond(200);
      authService.setCurrentUser(userData);
      authService.signOut()
        .then(() => authService.currentUser())
        .then(user => expect(user).toBeNull())
        .then(done, done.fail);
      $httpBackend.flush();
    });
  });

  describe('watchUser', () => {
    it('calls the function with the current user immediately', done => {
      authService.setCurrentUser(userData);
      authService.watchUser(user => {
        expect(user).toEqual(userData);
        done();
      });
      $rootScope.$digest(); /* Resolve $q promises. */
    });

    it('calls the function whenever the user changes', done => {
      authService.setCurrentUser(userData);
      const callback = jasmine.createSpy('callback');
      authService.watchUser(callback)
        .then(() => {
          authService.setCurrentUser(null);
          authService.setCurrentUser({ username: 'someone' });
          /* The two calls above and the one done by the `watchUser` method. */
          expect(callback.calls.count()).toEqual(3);
          expect(callback.calls.allArgs()).toEqual([[userData], [null], [{ username: 'someone' }]]);
        })
        .then(done, done.fail);
      $rootScope.$digest(); /* Resolve $q promises. */
    });
  });
});
