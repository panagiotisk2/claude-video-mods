# Render Meter

A Claude Code mod that puts a live progress bar above the prompt while a video render runs: the file name, a bar, the percent
and about how long is left, then "Rendered in 2m 10s" for a few seconds when it finishes. Your render script reports through
`helpers/render_progress.py`, which writes `.render-progress.json` in the folder Claude Code is open in; the mod reads it once a
second. A render that stops updating for 15 seconds drops off the bar.

Built by asking Claude: "Make me a mod that shows a live progress bar above my prompt while my Reel renders."
