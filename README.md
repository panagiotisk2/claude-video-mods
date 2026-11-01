# Claude video mods

Three Claude Code mods for people who make AI videos with Claude Code, Higgsfield and HeyGen.

| mod | what it does |
|---|---|
| **credit-guard** | Stops any tool call that spends Higgsfield or HeyGen credits (generate a video or image, render an avatar, lip-sync, upscale, dub) before it runs, and shows which service, action and model. Type `/approve-credits` to let the next paid job through within 5 minutes. Price quotes, balance and status checks pass untouched. |
| **render-meter** | A live progress bar above the prompt while a render runs: file name, percent and time left. Your render script reports through `render-meter/helpers/render_progress.py` (see its top comment). |
| **reel-board** | `/reels` opens a side panel with every upcoming video in the project's `content/` folder (one folder per video, named `YYYY-MM-DD-name`) and the step each one is on: script, voice, avatar, edit, approved, caption, link. |

## Install

At the prompt of a terminal Claude Code session (2.1.287 or newer, as the Claude Code docs ask), one line per mod:

```
/plugin install credit-guard --marketplace panagiotisk2/claude-video-mods
/plugin install render-meter --marketplace panagiotisk2/claude-video-mods
/plugin install reel-board --marketplace panagiotisk2/claude-video-mods
```

Answer `y` to add the marketplace, then pick a scope (user scope loads the mod in every session).

From a shell: `claude plugin install credit-guard --marketplace panagiotisk2/claude-video-mods` (and the same for the others).

In the Claude desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with
`panagiotisk2/claude-video-mods`, then Add plugin.

## Notes

- credit-guard recognises Higgsfield and HeyGen by their tools' names, so it works whatever your connectors are called.
- render-meter reads `.render-progress.json` in the folder Claude Code is open in.
- reel-board reads the files in each video folder (script.txt, voice, avatar and reel MP4s, caption.txt) and its NOTES.md
  (a line with "approved", a line saying the short link was created).

Made by [@ai_maverick_](https://www.instagram.com/ai_maverick_/). MIT licensed.
