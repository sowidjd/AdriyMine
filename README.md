# AdriyMine

Kumpulan repo animasi/film berbasis kode untuk dipakai bersama Claude Code.

| Folder | Sumber | Isi |
|---|---|---|
| `repos/lemo-opuscar` | [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) | 99 gaya film + skill Claude Code |
| `repos/mg-styles-15` | [Vincentwei1021/mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15) | 15 gaya motion design (prompt + source) |
| `repos/ClaudeAnimationBase` | [JohnHeibel/ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase) | Starter kit animasi karakter Clawd (p5.js) |

## Setelah clone

```sh
git submodule update --init --depth 1
```

Skill lemo-opuscar (opsional, dipasang sekali di Claude Code):

```sh
claude plugin marketplace add lemomo-ai/lemo-opuscar
claude plugin install lemo-opuscar@lemolab
```

ClaudeAnimationBase butuh Node.js, Chrome dan ffmpeg: `cd repos/ClaudeAnimationBase && npm install`.

## Contoh prompt

- *Make a 30-second film in the Neon Tubes style about ...* (lemo-opuscar)
- *Baca `repos/mg-styles-15/prompts/03-isometric.md`, lalu buat film 10 detik gaya itu tentang ...*
- *Baca `repos/ClaudeAnimationBase/ANIMATION_GUIDE.md`, lalu buat video 15 detik Clawd mengejar kupu-kupu.*
