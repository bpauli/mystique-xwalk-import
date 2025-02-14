/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import 'dotenv/config.js';
import ow from 'openwhisk';
import path from 'path';
import fs from 'fs';

const {
  WSK_AUTH,
  WSK_NAMESPACE,
  WSK_APIHOST = 'adobeioruntime.net',
  CLIENT_ID,
  CLIENT_SECRET,
  TECHNICAL_ACCOUNT_ID,
  ORG_ID,
  PRIVATE_KEY,
  META_SCOPES,
  AEM_URL,
} = process.env;

if (!WSK_AUTH || !WSK_NAMESPACE) {
  throw new Error('WSK_AUTH or WSK_NAMESPACE not set.');
}

const [, , zipFilePath, givenName] = process.argv;
const [packageName, actionName] = givenName?.split('/') || [];

const resolvedZipFilePath = path.resolve(zipFilePath);
const zipFileExists = fs.existsSync(resolvedZipFilePath);

if (!packageName || !actionName || !zipFileExists) {
  if (!zipFileExists) {
    console.log(`zip file not found: ${resolvedZipFilePath}`);
  }
  if (!packageName || !actionName) {
    console.log(`package or action name not set: ${packageName}/${actionName}`);
  }
  console.log();
  console.log('Usage: node bin/deploy.mjs <zipFile> <packageName>/<actionName>');
  process.exit(2);
}

const openwhisk = ow({ api_key: WSK_AUTH, namespace: WSK_NAMESPACE, apihost: WSK_APIHOST });

async function deploy() {
  // 1. create the package if it doesn't yet exist
  try {
    await openwhisk.packages.get({ name: packageName });
    console.log(`Package '${packageName}' exists`);
  } catch (ex) {
    if (ex.statusCode === 404) {
      console.log(`Creating package '${packageName}' ...`);
      await openwhisk.packages.create({ name: packageName });
    } else {
      throw ex;
    }
  }
  // 2. deploy action
  const actionCode = fs.readFileSync(resolvedZipFilePath);
  const annotations = {
    'web-export': true,
    'require-adobe-auth': false,
    'raw-http': true,
    final: true,
    'provide-api-key': true,
  };
  const kind = 'nodejs:18';

  const parameter = {
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    technicalAccountId: TECHNICAL_ACCOUNT_ID,
    orgId: ORG_ID,
    metaScopes: META_SCOPES,
    privateKey: PRIVATE_KEY,
    aemUrl: AEM_URL,
  };

  let action;
  try {
    await openwhisk.actions.get({ name: `${packageName}/${actionName}` });
    console.log(`Action '${packageName}/${packageName}' exists`);
    console.log(`Updating action '${packageName}/${actionName}' ...`);
    action = await openwhisk.actions.update({
      name: `${packageName}/${actionName}`,
      action: actionCode,
      kind,
      annotations,
      params: parameter,
    });
  } catch (ex) {
    if (ex.statusCode === 404) {
      console.log(`Creating action '${packageName}/${actionName}' ...`);
      action = await openwhisk.actions.create({
        name: `${packageName}/${actionName}`,
        action: actionCode,
        kind,
        annotations,
        params: parameter,
      });
    } else {
      throw ex;
    }
  } finally {
    if (action) {
      console.log(`Deployed action ${action.namespace}/${action.name}`);
    }
  }
}

deploy();
