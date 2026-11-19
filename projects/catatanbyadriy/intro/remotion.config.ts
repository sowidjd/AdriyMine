import {Config} from '@remotion/cli/config';
// Pakai Chrome yang sudah ada bila disediakan (mis. REMOTION_BROWSER=/path/chrome-headless-shell)
if (process.env.REMOTION_BROWSER) Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
