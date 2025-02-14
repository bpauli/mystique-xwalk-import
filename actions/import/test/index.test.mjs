import { expect } from 'chai';
import nock from 'nock';
import { main } from '../src/index.js';

describe('Index - main function', () => {
  const customAuth = 'Bearer customToken';

  beforeEach(() => {
    nock('http://fake-aem-server', {
      reqheaders: {
        Authorization: customAuth,
      },
    })
      .post('/content/xwalk')
      .reply(200, 'Import success with custom auth');
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should use the provided authorization header if present', async () => {
    const body = Buffer.from(JSON.stringify({
      markdown: '# Some markdown',
      aemUrl: 'http://fake-aem-server/content/xwalk',
    })).toString('base64');

    const params = {
      __ow_method: 'post',
      __ow_body: body,
      authorization: customAuth,
    };

    const result = await main(params);
    expect(result.statusCode).to.equal(200);

    const expectedUeUrl =
      'http://fake-aem-server/ui#/@sitesinternal/aem/universal-editor/canvas/fake-aem-server/content/xwalk/sample.html';

    const responseBody = result.body;
    expect(responseBody).to.have.property('ueUrl', expectedUeUrl);
  });
});
