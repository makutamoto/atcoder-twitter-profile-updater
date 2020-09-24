import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as AtCoderProfileUpdaterBackend from '../lib/atcoderprofileupdater-backend-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new AtCoderProfileUpdaterBackend.AtCoderProfileUpdaterBackendStack(app, 'AtCoderProfileUpdaterBackendStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
