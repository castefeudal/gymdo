# Exercise video sources

The existing Gym visual GIFs remain 180 × 180 assets under NOTICE.md. No HD
videos are bundled: no redistribution rights for such sources were supplied.
The player never labels an enlarged GIF as HD.

Add cleared sources by exercise ID in `data/exercise-media.json`:

```json
{
  "schemaVersion": 1,
  "exercises": {
    "0025": {
      "author": "Rights holder",
      "license": "Your documented license",
      "attributionUrl": "https://example.org/original",
      "poster": "assets/own-poster.jpg",
      "sources": [
        { "src": "videos/own-demo.webm", "type": "video/webm", "width": 1920, "height": 1080 },
        { "src": "videos/own-demo.mp4", "type": "video/mp4", "width": 1280, "height": 720 }
      ]
    }
  }
}
```

Use same-origin assets where possible. The manifest rejects sources without
credit, license, type and dimensions. Native browser video controls provide
keyboard play/pause, seeking and fullscreen. Replay and 0.5/1/1.5 speed controls
appear only for video. No video bytes are requested until playback. Sources are
ordered from smaller to larger; browser codec support chooses a playable source.
This is not adaptive bitrate streaming. The quality badge uses decoded video
dimensions, never the declared dimensions. Closing or changing an exercise
stops playback and detaches all sources. A network or decode error restores GIF.

Prioritize common squat, hinge, horizontal/vertical push and pull movements.
Record rights evidence before adding each asset; verify technique with a qualified
reviewer. Test each codec, reduced motion, failure, fullscreen and offline fallback.
