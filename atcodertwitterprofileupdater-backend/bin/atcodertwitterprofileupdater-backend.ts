#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AtCoderTwitterProfileUpdaterBackendStack } from '../lib/atcodertwitterprofileupdater-backend-stack';

const app = new cdk.App();
new AtCoderTwitterProfileUpdaterBackendStack(app, 'AtCoderTwitterProfileUpdaterBackendStack');
