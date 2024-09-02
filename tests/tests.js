const request = require('supertest');
const { expect } = require('chai');
const app = require('../server'); // Adjust to your actual server file

describe('API Endpoints', () => {
  // Test for AppController
  describe('AppController', () => {
    describe('GET /status', () => {
      it('should return status 200 with correct message', (done) => {
        request(app)
          .get('/status')
          .expect(200)
          .end((err, res) => {
            expect(res.body).to.deep.equal({ redis: true, db: true });
            done(err);
          });
      });
    });

    describe('GET /stats', () => {
      it('should return file and user stats', (done) => {
        request(app)
          .get('/stats')
          .expect(200)
          .end((err, res) => {
            expect(res.body).to.have.keys('users', 'files');
            done(err);
          });
      });
    });
  });

  // Test for UsersController
  describe('UsersController', () => {
    describe('POST /users', () => {
      it('should create a new user and return status 201', (done) => {
        request(app)
          .post('/users')
          .send({ email: 'testuser@example.com', password: 'password123' })
          .expect(201)
          .end((err, res) => {
            expect(res.body).to.have.keys('id', 'email');
            done(err);
          });
      });

      it('should return 400 if email is missing', (done) => {
        request(app)
          .post('/users')
          .send({ password: 'password123' })
          .expect(400)
          .end((err, res) => {
            expect(res.body).to.deep.equal({ error: 'Missing email' });
            done(err);
          });
      });

      it('should return 400 if password is missing', (done) => {
        request(app)
          .post('/users')
          .send({ email: 'testuser@example.com' })
          .expect(400)
          .end((err, res) => {
            expect(res.body).to.deep.equal({ error: 'Missing password' });
            done(err);
          });
      });

      it('should return 400 if user already exists', (done) => {
        request(app)
          .post('/users')
          .send({ email: 'testuser@example.com', password: 'password123' })
          .expect(400)
          .end((err, res) => {
            expect(res.body).to.deep.equal({ error: 'Already exist' });
            done(err);
          });
      });
    });

    describe('GET /users/me', () => {
      it('should return user data if token is valid', (done) => {
        // Assuming you have a valid token for the test
        const token = 'validToken';

        request(app)
          .get('/users/me')
          .set('X-Token', token)
          .expect(200)
          .end((err, res) => {
            expect(res.body).to.have.keys('id', 'email');
            done(err);
          });
      });

      it('should return 401 if token is missing or invalid', (done) => {
        request(app)
          .get('/users/me')
          .expect(401)
          .end((err, res) => {
            expect(res.body).to.deep.equal({ error: 'Unauthorized' });
            done(err);
          });
      });
    });
  });

  // Test for AuthController
  describe('AuthController', () => {
    describe('GET /connect', () => {
      it('should return a token if authorization is valid', (done) => {
        // Mock valid authorization
        request(app)
          .get('/connect')
          .set('Authorization', 'Basic validCredentials')
          .expect(200)
          .end((err, res) => {
            expect(res.body).to.have.keys('token');
            done(err);
          });
      });

      it('should return 401 if authorization is invalid', (done) => {
        request(app)
          .get('/connect')
          .set('Authorization', 'Basic invalidCredentials')
          .expect(401)
          .end((err, res) => {
            expect(res.body).to.deep.equal({ error: 'Unauthorized' });
            done(err);
          });
      });
    });

    describe('GET /disconnect', () => {
      it('should return 200 on successful disconnect', (done) => {
        // Mock valid authorization
        request(app)
          .get('/disconnect')
          .set('Authorization', 'Basic validCredentials')
          .expect(200)
          .end((err, res) => {
            expect(res.body).to.deep.equal({
              message: 'Disconnected successfully',
            });
            done(err);
          });
      });
    });
  });

  // Test for FilesController
  describe('FilesController', () => {
    describe('POST /files', () => {
      it('should upload a new file and return status 201', (done) => {
        // Mock token and file upload
        const token = 'validToken';
        request(app)
          .post('/files')
          .set('X-Token', token)
          .send({
            name: 'testfile.png',
            type: 'image',
            data: 'base64data',
            isPublic: true,
          })
          .expect(201)
          .end((err, res) => {
            expect(res.body).to.have.keys(
              'id',
              'userId',
              'name',
              'type',
              'isPublic',
              'parentId'
            );
            done(err);
          });
      });

      it('should return 400 if required fields are missing', (done) => {
        request(app)
          .post('/files')
          .send({})
          .expect(400)
          .end((err, res) => {
            expect(res.body).to.have.keys('error');
            done(err);
          });
      });
    });

    describe('GET /files/:id', () => {
      it('should return file details if file exists', (done) => {
        // Replace with actual file ID for the test
        const fileId = 'validFileId';
        request(app)
          .get(`/files/${fileId}`)
          .expect(200)
          .end((err, res) => {
            expect(res.body).to.have.keys(
              'id',
              'name',
              'type',
              'userId',
              'parentId',
              'isPublic'
            );
            done(err);
          });
      });

      it('should return 404 if file not found', (done) => {
        request(app)
          .get('/files/invalidFileId')
          .expect(404)
          .end((err, res) => {
            expect(res.body).to.deep.equal({ error: 'Not found' });
            done(err);
          });
      });
    });

    describe('GET /files', () => {
      it('should return paginated file list', (done) => {
        request(app)
          .get('/files?page=1')
          .expect(200)
          .end((err, res) => {
            expect(res.body).to.be.an('array');
            done(err);
          });
      });
    });

    describe('PUT /files/:id/publish', () => {
      it('should update file to be public and return status 200', (done) => {
        // Replace with actual file ID for the test
        const fileId = 'validFileId';
        request(app)
          .put(`/files/${fileId}/publish`)
          .expect(200)
          .end((err, res) => {
            expect(res.body).to.have.property('isPublic', true);
            done(err);
          });
      });

      it('should return 404 if file not found', (done) => {
        request(app)
          .put('/files/invalidFileId/publish')
          .expect(404)
          .end((err, res) => {
            expect(res.body).to.deep.equal({ error: 'Not found' });
            done(err);
          });
      });
    });

    describe('PUT /files/:id/unpublish', () => {
      it('should update file to be private and return status 200', (done) => {
        // Replace with actual file ID for the test
        const fileId = 'validFileId';
        request(app)
          .put(`/files/${fileId}/unpublish`)
          .expect(200)
          .end((err, res) => {
            expect(res.body).to.have.property('isPublic', false);
            done(err);
          });
      });

      it('should return 404 if file not found', (done) => {
        request(app)
          .put('/files/invalidFileId/unpublish')
          .expect(404)
          .end((err, res) => {
            expect(res.body).to.deep.equal({ error: 'Not found' });
            done(err);
          });
      });
    });

    describe('GET /files/:id/data', () => {
      it('should return file content if size is not specified', (done) => {
        // Replace with actual file ID for the test
        const fileId = 'validFileId';
        request(app)
          .get(`/files/${fileId}/data`)
          .expect(200)
          .end((err, res) => {
            expect(res.headers['content-type']).to.match(/image/);
            done(err);
          });
      });

      it('should return resized image based on size parameter', (done) => {
        // Replace with actual file ID and size for the test
        const fileId = 'validFileId';
        request(app)
          .get(`/files/${fileId}/data?size=100`)
          .expect(200)
          .end((err, res) => {
            expect(res.headers['content-type']).to.match(/image/);
            done(err);
          });
      });

      it('should return 404 if file or size is not found', (done) => {
        request(app)
          .get('/files/invalidFileId/data?size=100')
          .expect(404)
          .end((err, res) => {
            expect(res.body).to.deep.equal({ error: 'Not found' });
            done(err);
          });
      });
    });
  });
});
