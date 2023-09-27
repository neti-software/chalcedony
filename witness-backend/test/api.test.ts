import request from 'supertest';
import app from '../src/app';

describe('GET /api/v1/witness', () => {
  it('gives VC + proof', async () => {
    const inBlancoVCId = 'did:ethr:0x0000000000000000000000000000000000000000';
    const subjectId = 'did:ethr:0x0000000000000000000000000000000000000001';
    const domainSeparator = {
      name: 'ChalcedonyAccount',
      version: '0.0.1',
      chainId: '0x0104',
      verifyingContract: '0x0000000000000000000000000000000000000000',
      salt: '0x0000000000000000000000000000000000000000',
    };
    const payload = { inBlancoVCId, subjectId, domainSeparator };

    const response = await request(app)
      .post('/api/v1/witness')
      .send(payload)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    expect(response.body).toHaveProperty('vc');
    expect(response.body).toHaveProperty('proofValue');
  });
});