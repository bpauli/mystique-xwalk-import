const jwtAuth = require('./jwtAuth.js');

function replaceJcrRoot(xmlString, nodeName) {
  const replacedOpeningTag = xmlString.replace(
    /<jcr:root([^>]*)>/,
    `<${nodeName}$1>`,
  );

  const replacedBothTags = replacedOpeningTag.replace(
    /<\/jcr:root>/,
    `</${nodeName}>`,
  );

  return replacedBothTags;
}

async function getAemToken(params) {
  const config = {
    clientId: params.clientId,
    clientSecret: params.clientSecret,
    technicalAccountId: params.technicalAccountId,
    orgId: params.orgId,
    metaScopes: params.metaScopes ? params.metaScopes.split(',') : [],
    privateKey: params.privateKey,
  };

  const tokenResponse = await jwtAuth(config);
  return tokenResponse.access_token;
}

module.exports = {
  replaceJcrRoot,
  getAemToken,
};
