# Player SDK

The official JavaScript SDK to interact with an embedded Qumu Cloud presentation.

## Get Started

### via CDN (easiest)

The simplest way to use the SDK is to load it via the CDN. The script will add a new `playerSdk` property to the `window` object.

**Note**: You need to load the script BEFORE your code to interact wit the SDK

**Note**: You need to add this script only ONCE for each webpage

In order to control a Qumu Cloud presentation, you will need to add it to your webpage via an iframe.

```html

<iframe src="<url-to-presentation>" frameborder="0"></iframe>

<script src=""></script>
<script>
  var iframe = document.querySelector('iframe');

  var sdk = new window.playerSdk.PlayerSdk(iframe);

  sdk
      .init()
      .then(() => {
        sdk.addEventListener('timeupdate', (newTime) => console.log('timeupdate', newTime));

        sdk.getDuration().then((duration) => console.log('duration', duration));

        sdk.play();
      })
      .catch((error) => console.error(error));
</script>
```

### With a module bundler (advanced)

If you use a module bundler (like Webpack or rollup), you will first need to install the dependency.

```shell
npm install @qumu/player-sdk
```

```js
const iframe = document.querySelector('iframe');

const sdk = new window.playerSdk.PlayerSdk(iframe);

sdk
  .init()
  .then(() => {
    sdk.addEventListener('timeupdate', (newTime) => console.log('timeupdate', newTime));

    sdk.getDuration().then((duration) => console.log('duration', duration));

    sdk.play();
  })
  .catch((error) => console.error(error));
```

## API

### addEventListener(name: SdkEventListener, callback: Function): void

Registers a callback to be run when the event is triggered.

* `name`: the event to listen to
* `callback`: the callback to run when the event is triggered

Events you can listen to:

| Event name                     | Description                                            | 
|--------------------------------|--------------------------------------------------------|
| `chapterchange`                | Triggered when the current chapter changes             |
| `closedcaptionslanguagechange` | Triggered when the closed captions language is updated |
| `ended`                        | Triggered when the playback ends                       |
| `layoutchange`                 | Triggered when the layout changes                      |
| `liveState`                    | Triggered when the state of a live event changes       |
| `pause`                        | Triggered when the playback pauses                     |
| `play`                         | Triggered when the playback resumes                    |
| `playbackratechange`           | Triggered when the playback rate changes               |
| `primarycontentchange`         | Triggered when the primary content is updated          |
| `timeupdate`                   | Triggered when the current time is updated             |
| `volumechange`                 | Triggered when the volume changes                      |

### destroy(): void

Destroys the whole SDK.

### getClosedCaptions(): Promise<CaptionTrack[]&gt;

Gets the available closed captions.

### getChapter(): Promise<Chapter%gt;

Gets the current chapter

### getChapters(): Promise<Chapter[]&gt;

Gets the list of chapters for the presentation

### getClosedCaptionsLanguage(): Promise<string&gt;

Gets the active closed captions' language.

### getCurrentTime(): Promise<number&gt;

Gets the current time in milliseconds.

### getDuration(): Promise<number&gt;

Gets the presentation's duration in milliseconds.

### getLayout(): Promise<string&gt;

Gets the layout

### getLiveEndTime(): Promise<string | null&gt;

Gets the end date of a live event

### getLiveStartTime(): Promise<string | null&gt;

Gets the start date of a live event

### getPlaybackRate(): Promise<number&gt;

Gets the current playback rate.

### getPlaybackRates(): Promise<number&gt;

Gets the list of playback rates.

### getPresentation(): Promise<Presentation>

Gets the presentation.

### getPrimaryContent(): Promise<'media' | 'slides'>

Gets the primary content.

### getVolume(): Promise<number&gt;

Gets the player's volume between 0 and 100.

### init(): Promise<void&gt;

Initializes the SDK. It is imperative that this method is the first one called as it starts a handshake communication with the embedded presentation.

### isPaused(): Promise<boolean&gt;

Checks whether the player is paused or playing.

### pause(): Promise<void&gt;

Pauses the player.

### play(): Promise<void&gt;

Plays the player.

### removeEventListener(name: string, callback?: Function): void

Removes the callback for the provided event name.

* `name`: the event name to listen to
* `callback`: the callback to remove. If no callback is provided, all callbacks will be removed for the event name

### setClosedCaptionsLanguage(guid: string): Promise<void&gt;

Sets the active closed captions' language

* `language`: the language of the new active closed captions. Use an empty string to deactivate the captions.

### setCurrentTime(time: number): Promise<void&gt;

Sets the current time in the player

* `time`: the new current time in milliseconds

### setLayout(layout: 'pip' | 'sbs'): Promise<void&gt;

Sets the layout

* `layout`: the new layout

### setPlaybackRate(time: number): Promise<void&gt;

Sets the playbak rate in the player.

* `playbackRate`: the new playback rate.The range is 0-2.

### setPrimaryContent(content: 'media' | 'slides'): Promise<void&gt;

Sets the primary content

* `content`: the new primary content

### setVolume(volume: number): Promise<void&gt;

Sets the volume in the player

* `volume`: The new volume. The range is 0-100.

## Generate a new package

To generate a new Github package, all you have to do is run npm version <major|minor|patch on the master branch.

This will generate a new tag that will then trigger the Package github action and create a release and publish to Github package.
