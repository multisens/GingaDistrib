# Broadcaster Application

The **Broadcaster Application** provides an evironment for simulating a TV 3.0 broadcaster streaming.


# Features

* Bootstrap app DTV+ interface
* App includes itself in the list of available services


# Dependencies

* [FFmpeg](https://ffmpeg.org)
* Node JS


# Environment

* PORT : Port used for broadcaster apps
* BROKER : MQTT broker url


# Execution

To execute the project, initiate the video HLS stream together with the project. For the stream execute:

```
$./stream.sh
```

For the project execute:

```
$ npm run build
$ npm run start
```