# Credit Guard

A Claude Code mod for AI video work. When Claude is about to run a tool that spends credits on Higgsfield or HeyGen (generate a
video or image, render an avatar, lip-sync, upscale, swap, dub), Credit Guard stops it before anything runs and shows a note
naming the service, the action and the model. Claude then has to ask you; type `/approve-credits` to let the next paid job
through within 5 minutes. Price quotes, balance, lists and status checks pass untouched.

Built by asking Claude: "Make me a mod that stops any tool call that spends Higgsfield or HeyGen credits until I approve it,
and shows which tool and model it is."
