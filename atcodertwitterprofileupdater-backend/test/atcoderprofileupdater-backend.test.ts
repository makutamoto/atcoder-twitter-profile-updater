import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as AtCoderTwitterProfileUpdaterBackend from '../lib/atcodertwitterprofileupdater-backend-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new AtCoderTwitterProfileUpdaterBackend.AtCoderTwitterProfileUpdaterBackendStack(app, 'AtCoderTwitterProfileUpdaterBackendStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
