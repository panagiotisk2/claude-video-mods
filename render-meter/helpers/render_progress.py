"""Tell the Render Meter mod how a render is going. Run your render from your project folder (the one Claude Code is open in),
or set RENDER_PROGRESS_FILE to that folder's .render-progress.json.

    from render_progress import RenderProgress
    rp = RenderProgress("my_reel.mp4", total_frames)
    for n in range(total_frames):
        ...render frame n...
        rp.tick(n + 1)
    rp.finish()
"""
import json, os, time

FILE = os.environ.get("RENDER_PROGRESS_FILE", os.path.join(os.getcwd(), ".render-progress.json"))


class RenderProgress:
    def __init__(self, label, total, every=0.5):
        self.label, self.total, self.every = label, max(1, int(total)), every
        self.started = time.time() * 1000
        self.last = 0.0
        self._write(0)

    def _write(self, done):
        tmp = FILE + ".tmp"
        with open(tmp, "w") as f:
            json.dump(dict(label=self.label, done=int(done), total=self.total, startedAt=self.started,
                           updatedAt=time.time() * 1000), f)
        os.replace(tmp, FILE)  # whole file at once, so the mod never reads half of it

    def tick(self, done):
        now = time.time()
        if now - self.last >= self.every:
            self.last = now
            self._write(done)

    def finish(self):
        self._write(self.total)
