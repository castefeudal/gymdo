`player-test.webm` is a generated solid-color 160 × 90, one-second VP8 video.
It contains no exercise demonstration, third-party imagery or sound. It is a
CC0 test fixture for decoding, metadata and source cleanup, and is not copied
to the Pages production site. Its declared manifest dimensions are deliberately
wrong in the E2E test to verify that the player reports decoded dimensions.

Reproduce with:

```sh
ffmpeg -f lavfi -i color=c=0x202c15:s=160x90:d=1 -c:v libvpx -an player-test.webm
```
