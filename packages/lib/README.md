# Player SDK

The official JavaScript SDK to interact with an embedded Qumu Cloud presentation.

## Get Started

### via CDN (easiest)

The simplest way to use the SDK is to load it via the CDN.

#### Using UMD build
If you need to support older browsers, this is the version for you. The script will add a new `playerSdk` property to the `window` object.

⚠️ You need to load the script BEFORE your code to interact with the SDK.

In order to control a Qumu Cloud presentation, you will need to add it to your webpage via an iframe.

```html
<iframe src="<url-to-presentation>" frameborder="0"></iframe>

<script src="https://unpkg.com/@enghouse-qumu/player-sdk@<version>/dist/index.umd.js"></script>
<script>
  const iframe = document.querySelector('iframe');

  const sdk = new window.playerSdk.PlayerSdk(iframe);

  sdk.addEventListener('timeupdate', (newTime) => console.log('timeupdate', newTime));

  sdk.getDuration().then((duration) => console.log('duration', duration));

  sdk.play();
</script>
```

#### Using Module build

This version is only supported on modern browsers (no IE11) but offers a code style closer to what you would write with a module bundler.

```html
<iframe src="<url-to-presentation>" frameborder="0"></iframe>

<script type="module">
  import { PlayerSdk } from 'https://unpkg.com/@enghouse-qumu/player-sdk@<version>/dist/index.modern.mjs'

  const iframe = document.querySelector('iframe');

  const sdk = new PlayerSdk(iframe);

  sdk.addEventListener('timeupdate', (newTime) => console.log('timeupdate', newTime));

  sdk.getDuration().then((duration) => console.log('duration', duration));

  sdk.play();
</script>
```

### With a module bundler (advanced)

If you use a module bundler (like Webpack or rollup), you will first need to install the dependency.

```shell
npm install @enghouse-qumu/player-sdk
```

```js
import { PlayerSdk } from '@enghouse-qumu/player-sdk';

const iframe = document.querySelector('iframe');

const sdk = new PlayerSdk(iframe);

sdk.addEventListener('timeupdate', (newTime) => console.log('timeupdate', newTime));

sdk.getDuration().then((duration) => console.log('duration', duration));

sdk.play();
```

### TypeScript support

This library supports TypeScript by default.

## API

### addEventListener(name: SdkEventListener, callback: Function): void

Registers a callback to be run when the event is triggered.

* `name`: the event to listen to
* `callback`: the callback to run when the event is triggered

Events you can listen to:

| Event name             | Description                                         | 
|------------------------|-----------------------------------------------------|
| `audiotrackchange`     | Triggered when the current audio track is updated   |
| `captiontrackchange`   | Triggered when the current caption track is updated |
| `chapterchange`        | Triggered when the current chapter changes          |
| `ended`                | Triggered when the playback ends                    |
| `layoutchange`         | Triggered when the layout changes                   |
| `livestatechange`      | Triggered when the state of a live event changes    |
| `pause`                | Triggered when the playback pauses                  |
| `play`                 | Triggered when the playback resumes                 |
| `playbackratechange`   | Triggered when the playback rate changes            |
| `primarycontentchange` | Triggered when the primary content is updated       |
| `timeupdate`           | Triggered when the current time is updated          |
| `volumechange`         | Triggered when the volume changes                   |

### destroy(): void

Destroys the whole SDK.

### disableCaptionTrack(): void

Disables the caption track.

### enableCaptionTrack(language: string): void;

Sets the current caption track.

* `language`: the language of the active track. Use null to disable captions.

### getAudioTracks(): Promise&lt;SdkAudioTrack[]&gt;

Gets the available audio tracks.

### getCaptionTracks(): Promise&lt;SdkCaptionTrack[]&gt;

Gets the available caption tracks.

### getChapters(): Promise&lt;Chapter[]&gt;

Gets the list of chapters for the presentation.

### getCurrentAudioTrack(): Promise&lt;SdkAudioTrack&gt;

Gets the current audio track.

### getCurrentChapter(): Promise&lt;Chapter%gt;

Gets the current chapter.

### getCurrentCaptionTrack(): Promise&lt;SdkCaptionTrack&gt;

Gets the current caption track.

### getCurrentTime(): Promise&lt;number&gt;

Gets the current time in milliseconds.

### getDuration(): Promise&lt;number&gt;

Gets the presentation's duration in milliseconds.

### getLayout(): Promise&lt;string&gt;

Gets the layout.

### getLiveEndTime(): Promise&lt;string | null&gt;

Gets the end date of a live event.

### getLiveStartTime(): Promise&lt;string | null&gt;

Gets the start date of a live event.

### getLiveState(): Promise&lt;string | null&gt;

Gets the state of a live event.

### getPictureInPicturePosition(): Promise&lt;'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'&gt;

Gets the position of the PiP box.

### getPlaybackRate(): Promise&lt;number&gt;

Gets the playback rate.

### getPlaybackRates(): Promise&lt;number&gt;

Gets the list of playback rates.

### getPresentation(): Promise&lt;Presentation>

Gets the presentation.

### getPrimaryContent(): Promise&lt;'media' | 'slides'&gt;

Gets the primary content.

### getSideBySideRatio(): Promise&lt;number&gt;

Gets the side by side ratio between 50% and 80%.

### getVolume(): Promise&lt;number&gt;

Gets the player's volume between 0 and 100.

### isPaused(): Promise&lt;boolean&gt;

Checks whether the player is paused or playing.

### pause(): void;

Pauses the player.

### play(): void;

Plays the player.

### removeEventListener(name: string, callback?: Function): void

Removes the callback for the provided event name.

* `name`: the event name to listen to
* `callback`: the callback to remove. If no callback is provided, all callbacks will be removed for the event name

### setCurrentTime(time: number): void;

Sets the current time in the player.

* `time`: the new current time in milliseconds

### setLayout(layout: 'pip' | 'sbs'): void;

Sets the layout.

* `layout`: the new layout

### setPictureInPicturePosition(position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'): Promise&lt;void&gt;

Sets the position of the PiP box.

* `position`: the new position

### setPlaybackRate(time: number): void;

Sets the playback rate in the player.

* `playbackRate`: the new playback rate.The range is 0-2.

### setPrimaryContent(content: 'media' | 'slides'): void;

Sets the primary content.

* `content`: the new primary content

### setSideBySideRatio(ratio: number): void;

Sets the ratio for the Side by Side mode.

* `ratio`: The new ratio. The range is 50-80.

### setVolume(volume: number): void;

Sets the volume in the player.

* `volume`: The new volume. The range is 0-100.
