// Dibundel terpisah dan baru dimuat saat tombol Rapikan ditekan (agar aplikasi cepat terbuka).
import * as prettier from 'prettier/standalone';
import * as babel from 'prettier/plugins/babel';
import * as estree from 'prettier/plugins/estree';
import * as typescript from 'prettier/plugins/typescript';
import * as postcss from 'prettier/plugins/postcss';
window.__prettier = { prettier, plugins: [babel, estree, typescript, postcss] };
