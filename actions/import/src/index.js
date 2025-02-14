const FormData = require('form-data');
const { md2jcr } = require('@adobe/helix-md2jcr');
const { replaceJcrRoot, getAemToken } = require('./utils/helpers.js');

async function importXmlContent(xmlString, params) {
  const {
    nodeName = 'sample', // default node name
  } = params;

  const authHeader = params.authorization || `Bearer ${await getAemToken(params)}`;

  const xmlStringWithNodeName = replaceJcrRoot(xmlString, nodeName);
  const formData = new FormData();
  formData.append(':operation', 'import');
  formData.append(':contentType', 'jcr.xml');
  formData.append(':name', nodeName);
  formData.append(':replace', 'true');
  formData.append(':replaceProperty', 'true');
  formData.append(':content', xmlStringWithNodeName);
  const response = await fetch(params.aemUrl, {
    method: 'POST',
    body: formData,
    headers: {
      Authorization: authHeader,
    },
  });

  if (!response.ok) {
    const errorText = response.text();
    throw new Error(`Import failed (${response.status}): ${errorText}`);
  }

  const domain = new URL(params.aemUrl).origin;
  const pathWithoutProtocol = params.aemUrl.replace(/^https?:\/\//, '');
  const ueUrl = `${domain}/ui#/@sitesinternal/aem/universal-editor/canvas/${pathWithoutProtocol}/${nodeName}.html`;

  return { ueUrl };
}

async function postMethod(params) {
  // eslint-disable-next-line no-underscore-dangle
  if (!params.__ow_body) {
    return {
      statusCode: 400,
      body: { message: 'Missing request body' },
    };
  }
  // eslint-disable-next-line no-underscore-dangle
  const decodedString = Buffer.from(params.__ow_body, 'base64').toString('utf-8');
  const body = JSON.parse(decodedString);
  const { markdown } = body;
  const xml = await md2jcr(markdown);
  params.nodeName = body.nodeName;
  params.aemUrl = body.aemUrl || params.aemUrl;
  const response = await importXmlContent(xml, params);

  return {
    statusCode: 200,
    body: response,
  };
}

async function main(params) {
  try {
    // eslint-disable-next-line no-underscore-dangle
    const method = params.__ow_method;
    if (method === 'post') {
      return postMethod(params);
    }

    throw new Error(`Unsupported method: ${method}`);
  } catch (err) {
    return {
      statusCode: 500,
      body: { message: 'Internal server error', error: err },
    };
  }
}

exports.main = main;
