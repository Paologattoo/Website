import {Config} from '@remotion/cli/config';
// @ts-expect-error modulo JS senza tipi
import {trovaBrowser} from './browser.mjs';

Config.setVideoImageFormat('jpeg');
Config.setBrowserExecutable(trovaBrowser());
