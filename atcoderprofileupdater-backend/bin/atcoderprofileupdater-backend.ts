#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AtCoderProfileUpdaterBackendStack } from '../lib/atcoderprofileupdater-backend-stack';

const app = new cdk.App();
new AtCoderProfileUpdaterBackendStack(app, 'AtCoderProfileUpdaterBackendStack');
