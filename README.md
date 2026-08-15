# LFORGE Public Image Mini App

Public Telegram Mini App prototype for a 3-step image workflow.

## Workflow
1. Attach source image
2. Add text overlay
3. Add logo overlay
4. Preview
5. Create PNG

## Core Rule
**SOURCE IMAGE = AUTHORITY**

The supplied image is the fixed canvas/source of truth. Text and logo are overlays; the app does not replace the source image with a newly generated composition.

## Telegram
This is a frontend prototype. It can run as a Telegram Mini App once deployed to an HTTPS origin and configured in BotFather.

## Note
`index.html` references `assets/LFORGE_background.webm`. The binary video asset still needs to be uploaded to `assets/` before the background video will play.
