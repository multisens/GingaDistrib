# Ginga Distributed Framework

![Lua Version](https://img.shields.io/badge/Lua-5.4.7-blueviolet?logo=lua)  ![Node Version](https://img.shields.io/badge/Node.js-23.11.0-blueviolet?logo=nodedotjs)  ![MQTT](https://img.shields.io/badge/MQTT-blueviolet?logo=mqtt)

The **Ginga Distributed Framework (GDF)** project provides an evironment for testing and demonstration of new Ginga features. It encompasses all the components to simmulate a TV 3.0 receiver.


# Features

* Distributed implementation of TV 3.0 components in a microservices fashion
   * App based DTV+ interface
   * Broadcaster apps with video streaming
   * WebServices APIs
   * Ginga NCL Scheduler
* MQTT-based
   * Application state stored in broker topics
   * Topic viewer allows one to keep track of the app state
   * Remote device simulator allows one to keep track of exchanged messages


# Architecture

```mermaid
---
config:
  look: handDrawn
  theme: neutral
---
block-beta
   columns 5
   TV["AoP\n(Node.js)"] space B["Broker\n(MQTT)"] space WS["TV 3.0 WebServices\n(Node.js)"]
   TV --> B
   B --> TV
   WS --> B
   B --> WS
   space:5
   APP["Broadcaster Apps\n(Node.js)"] space NCL["TV 3.0 Ginga-NCL"]
   B --> NCL
   NCL --> B
   TV --> APP
   APP --> B
   B --> APP
```

# Dependencies

* Mosquitto MQTT Broker
* Lua
* Node JS
* [PM2](https://pm2.keymetrics.io)
* [NW.js](https://nwjs.io)
* [FFmpeg](https://ffmpeg.org)


# Execution

Components managed by PM2.
```$ pm2 start ecosystem.config.js```