"use strict";

Polymer('cast-custom-receiver', {
        applicationState : '-',
        sessionCount : 0,
        mediaElementState : '-',
        castReceiverManagerMessage : '',
        mediaManagerMessage : '-',
        messageBusMessage : '-',
        volumeMessage : 'Unknown',
        mediaHostState : 'Unknown',
        mediaType : 'Unknown',
        mediaProtocolType : 'Unknown',
        //objects
        castReceiverManager : null,
        mediaManager : null,
        messageBus : null,
        mediaElement : null,
        mediaHost : null,
        mediaProtocol : null,
        mediaPlayer : null,
        connectedCastSenders : [], // {senderId:'', channel:obj}
        channelName : 'urn:x-cast:com.google.devrel.custom',

        ready :   function() {
            console.log('ready');
            this.init();
        },


        init :  function() {

        var self = this;
        var setHudMessage = function(elementId, message) {
            self.$[elementId].innerHTML = '' + JSON.stringify(message);
        };

        // Initialize the receiver SDK before starting the app-specific logic

        this.mediaElement = this.$.receiverVideoElement;
        this.mediaElement.autoplay = true;

        console.log('### Application Loaded. Starting system.');
        setHudMessage('applicationState','Loaded. Starting up.');

        /**
         * Sets the log verbosity level.
         *
         * Debug logging (all messages).
         * DEBUG
         *
         * Verbose logging (sender messages).
         * VERBOSE
         *
         * Info logging (events, general logs).
         * INFO
         *
         * Error logging (errors).
         * ERROR
         *
         * No logging.
         * NONE
         **/
        cast.receiver.logger.setLevelValue(cast.receiver.LoggerLevel.DEBUG);

        this.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();

        /**
         * Called to process 'ready' event. Only called after calling castReceiverManager.start(config) and the
         * system becomes ready to start receiving messages.
         *
         * @param {cast.receiver.CastReceiverManager.Event} event - can be null
         *
         * There is no default handler
         */
        this.castReceiverManager.onReady = function(event) {
            console.log("### Cast Receiver Manager is READY: " + JSON.stringify(event));
            setHudMessage('castReceiverManagerMessage', 'READY: ' + JSON.stringify(event));
            setHudMessage('applicationState','Loaded. Started. Ready.');
        }

        /**
         * If provided, it processes the 'senderconnected' event.
         * Called to process the 'senderconnected' event.
         * @param {cast.receiver.CastReceiverManager.Event} event - can be null
         *
         * There is no default handler
         */
        this.castReceiverManager.onSenderConnected = function(event) {
            console.log("### Cast Receiver Manager - Sender Connected : " + JSON.stringify(event));
            setHudMessage('castReceiverManagerMessage', 'Sender Connected: ' + JSON.stringify(event));

            // TODO - add sender and grab CastChannel from CastMessageBus.getCastChannel(senderId)
            var senders = this.castReceiverManager.getSenders();
            setHudMessage('sessionCount', '' + senders.length);
        }

        /**
         * If provided, it processes the 'senderdisconnected' event.
         * Called to process the 'senderdisconnected' event.
         * @param {cast.receiver.CastReceiverManager.Event} event - can be null
         *
         * There is no default handler
         */
        this.castReceiverManager.onSenderDisconnected = function(event) {
            console.log("### Cast Receiver Manager - Sender Disconnected : " + JSON.stringify(event));
            setHudMessage('castReceiverManagerMessage', 'Sender Disconnected: ' + JSON.stringify(event));

            var senders = this.castReceiverManager.getSenders();
            setHudMessage('sessionCount', '' + senders.length);

            //If last sender explicity disconnects, turn off
            if(senders.length == 0 && event.reason == cast.receiver.system.DisconnectReason.REQUESTED_BY_SENDER) {
              window.close();
            }
        }

        /**
         * If provided, it processes the 'systemvolumechanged' event.
         * Called to process the 'systemvolumechanged' event.
         * @param {cast.receiver.CastReceiverManager.Event} event - can be null
         *
         * There is no default handler
         */
        this.castReceiverManager.onSystemVolumeChanged = function(event) {
            console.log("### Cast Receiver Manager - System Volume Changed : " + JSON.stringify(event));
            setHudMessage('castReceiverManagerMessage', 'System Volume Changed: ' + JSON.stringify(event));

            // See cast.receiver.media.Volume
            console.log("### Volume: " + event.data['level'] + " is muted? " + event.data['muted']);
            setHudMessage('volumeMessage', 'Level: ' + event.data['level'] + ' -- muted? ' + event.data['muted']);
        }

        /**
         * Called to process the 'visibilitychanged' event.
         *
         * Fired when the visibility of the application has changed (for example
         * after a HDMI Input change or when the TV is turned off/on and the cast
         * device is externally powered). Note that this API has the same effect as
         * the webkitvisibilitychange event raised by your document, we provided it
         * as CastReceiverManager API for convenience and to avoid a dependency on a
         * webkit-prefixed event.
         *
         * @param {cast.receiver.CastReceiverManager.Event} event - can be null
         *
         * There is no default handler for this event type.
         */
        this.castReceiverManager.onVisibilityChanged = function(event) {
            console.log("### Cast Receiver Manager - Visibility Changed : " + JSON.stringify(event));
            setHudMessage('castReceiverManagerMessage', 'Visibility Changed: ' + JSON.stringify(event));

            /** check if visible and pause media if not - add a timer to tear down after a period of time
               if visibilty does not change back **/
            if (event.data) { // It is visible
                this.$.mediaElement.play(); // Resume media playback
                window.clearTimeout(window.timeout); // Turn off the timeout
                window.timeout = null;
            } else {
                this.$.mediaElement.pause(); // Pause playback
                window.timeout = window.setTimeout(function(){window.close();}, 10000); // 10 Minute timeout
            }
        }

        /**
         * Use the messageBus to listen for incoming messages on a virtual channel using a namespace string.
         * Also use messageBus to send messages back to a sender or broadcast a message to all senders.
         * You can check the cast.receiver.CastMessageBus.MessageType that a message bus processes though a call
         * to getMessageType. As well, you get the namespace of a message bus by calling getNamespace()
         */
        this.messageBus = this.castReceiverManager.getCastMessageBus(this.channelName);
        /**
         * The namespace urn:x-cast:com.google.devrel.custom is used to identify the protocol of showing/hiding
         * the heads up display messages (The messages defined at the beginning of the html).
         *
         * The protocol consists of one string message: show
         * In the case of the message value not being show - the assumed value is hide.
         **/
        this.messageBus.onMessage = function(event) {
            console.log("### Message Bus - Media Message: " + JSON.stringify(event));
            setHudMessage('messageBusMessage', event);

            console.log("### CUSTOM MESSAGE: " + JSON.stringify(event));
            // show/hide messages
            console.log(event['data']);
            if(event['data']==='show') {
                this.$.messages.style.display = 'block';
            } else {
                this.$.messages.style.display = 'none';
            }
        }

        // This class is used to send/receive media messages/events using the media protocol/namesapce (urn:x-cast:com.google.cast.media).
        this.mediaManager = new cast.receiver.MediaManager(this.mediaElement);

        /**
         * Called when the media ends.
         *
         * mediaManager.resetMediaElement(cast.receiver.media.IdleReason.FINISHED);
         **/
        this.mediaManager['onEndedOrig'] = this.mediaManager.onEnded;
        /**
         * Called when the media ends
         */
        this.mediaManager.onEnded = function() {
            console.log("### Media Manager - ENDED" );
            setHudMessage('mediaManagerMessage', 'ENDED');

            this.mediaManager['onEndedOrig']();
        }

        /**
         * Default implementation of onError.
         *
         * mediaManager.resetMediaElement(cast.receiver.media.IdleReason.ERROR)
         **/
        this.mediaManager['onErrorOrig'] = this.mediaManager.onError;
        /**
         * Called when there is an error not triggered by a LOAD request
         * @param obj
         */
        this.mediaManager.onError = function(obj) {
            console.log("### Media Manager - error: " + JSON.stringify(obj));
            setHudMessage('mediaManagerMessage', 'ERROR - ' + JSON.stringify(obj));

            this.mediaManager['onErrorOrig'](obj);
        }

        /**
         * Processes the get status event.
         *
         * Sends a media status message to the requesting sender (event.data.requestId)
         **/
        this.mediaManager['onGetStatusOrig'] = this.mediaManager.onGetStatus;
        /**
         * Processes the get status event.
         * @param event
         */
        this.mediaManager.onGetStatus = function(event) {
            console.log("### Media Manager - GET STATUS: " + JSON.stringify(event));
            setHudMessage('mediaManagerMessage', 'GET STATUS ' + JSON.stringify(event));

            this.mediaManager['onGetStatusOrig'](event);
        }

        /**
         * Default implementation of onLoadMetadataError.
         *
         * mediaManager.resetMediaElement(cast.receiver.media.IdleReason.ERROR, false);
         * mediaManager.sendLoadError(cast.receiver.media.ErrorType.LOAD_FAILED);
         **/
        this.mediaManager['onLoadMetadataErrorOrig'] = this.mediaManager.onLoadMetadataError;
        /**
         * Called when load has had an error, overridden to handle application specific logic.
         * @param event
         */
        this.mediaManager.onLoadMetadataError = function(event) {
            console.log("### Media Manager - LOAD METADATA ERROR: " + JSON.stringify(event));
            setHudMessage('mediaManagerMessage', 'LOAD METADATA ERROR: ' + JSON.stringify(event));

            this.mediaManager['onLoadMetadataErrorOrig'](event);
        }

        /**
         * Default implementation of onMetadataLoaded
         *
         * Passed a cast.receiver.MediaManager.LoadInfo event object
         * Sets the mediaElement.currentTime = loadInfo.message.currentTime
         * Sends the new status after a LOAD message has been completed succesfully.
         * Note: Applications do not normally need to call this API.
         * When the application overrides onLoad, it may need to manually declare that
         * the LOAD request was sucessful. The default implementaion will send the new
         * status to the sender when the video/audio element raises the
         * 'loadedmetadata' event.
         * The default behavior may not be acceptable in a couple scenarios:
         *
         * 1) When the application does not want to declare LOAD succesful until for
         *    example 'canPlay' is raised (instead of 'loadedmetadata').
         * 2) When the application is not actually loading the media element (for
         *    example if LOAD is used to load an image).
         **/
        this.mediaManager['onLoadMetadataOrig'] = this.mediaManager.onLoadMetadataLoaded;
        /**
         * Called when load has completed, overridden to handle application specific logic.
         * @param event
         */
        this.mediaManager.onLoadMetadataLoaded = function(event) {
            console.log("### Media Manager - LOADED METADATA: " + JSON.stringify(event));
            setHudMessage('mediaManagerMessage', 'LOADED METADATA: ' + JSON.stringify(event));

            this.mediaManager['onLoadMetadataOrig'](event);
        }

        /**
         * Processes the pause event.
         *
         * mediaElement.pause();
         * Broadcast (without sending media information) to all senders that pause has happened.
         **/
        this.mediaManager['onPauseOrig'] = this.mediaManager.onPause;
        /**
         * Process pause event
         * @param event
         */
        this.mediaManager.onPause = function(event) {
            console.log("### Media Manager - PAUSE: " + JSON.stringify(event));
            setHudMessage('mediaManagerMessage', 'PAUSE: ' + JSON.stringify(event));

            this.mediaManager['onPauseOrig'](event);
        }

        /**
         * Default - Processes the play event.
         *
         * mediaElement.play();
         *
         **/
        this.mediaManager['onPlayOrig'] = this.mediaManager.onPlay;
        /**
         * Process play event
         * @param event
         */
        this.mediaManager.onPlay = function(event) {
            console.log("### Media Manager - PLAY: " + JSON.stringify(event));
            setHudMessage('mediaManagerMessage', 'PLAY: ' + JSON.stringify(event));

            this.mediaManager['onPlayOrig'](event);
        }

        /**
         * Default implementation of the seek event.
         * Sets the mediaElement.currentTime to event.data.currentTime.
         * If the event.data.resumeState is cast.receiver.media.SeekResumeState.PLAYBACK_START and the mediaElement is paused then
         * call mediaElement.play(). Otherwise if event.data.resumeState is cast.receiver.media.SeekResumeState.PLAYBACK_PAUSE and
         * the mediaElement is not paused, call mediaElement.pause().
         * Broadcast (without sending media information) to all senders that seek has happened.
         **/
        this.mediaManager['onSeekOrig'] = this.mediaManager.onSeek;
        /**
         * Process seek event
         * @param event
         */
        this.mediaManager.onSeek = function(event) {
            console.log("### Media Manager - SEEK: " + JSON.stringify(event));
            setHudMessage('mediaManagerMessage', 'SEEK: ' + JSON.stringify(event));

            this.mediaManager['onSeekOrig'](event);
        }

        /**
         * Default implementation of the set volume event.
         * Checks event.data.volume.level is defined and sets the mediaElement.volume to the value
         * Checks event.data.volume.muted is defined and sets the mediaElement.muted to the value
         * Broadcasts (without sending media information) to all senders that the volume has changed.
         **/
        this.mediaManager['onSetVolumeOrig'] = this.mediaManager.onSetVolume;
        /**
         * Process set volume event
         * @param event
         */
        this.mediaManager.onSetVolume = function(event) {
            console.log("### Media Manager - SET VOLUME: " + JSON.stringify(event));
            setHudMessage('mediaManagerMessage', 'SET VOLUME: ' + JSON.stringify(event));

            this.mediaManager['onSetVolumeOrig'](event);
        }

        /**
         * Processes the stop event.
         *
         * window.mediaManager.resetMediaElement(cast.receiver.media.IdleReason.CANCELLED, true, event.data.requestId);
         *
         * Resets Media Element to IDLE state. After this call the mediaElement
         * properties will change, paused will be true, currentTime will be zero and
         * the src attribute will be empty. This only needs to be manually called if the
         * developer wants to override the default behavior of onError, onStop or
         * onEnded, for example.
         **/
        this.mediaManager['onStopOrig'] = this.mediaManager.onStop;
        /**
         * Process stop event
         * @param event
         */
        this.mediaManager.onStop = function(event) {
            console.log("### Media Manager - STOP: " + JSON.stringify(event));
            setHudMessage('mediaManagerMessage', 'STOP: ' + JSON.stringify(event));

            this.mediaManager['onStopOrig'](event);
        }

        /**
         * Default implementation for the load event.
         *
         * Sets the mediaElement.autoplay to false.
         * Checks that data.media and data.media.contentId are valid then sets the mediaElement.src to the
         * data.media.contentId.
         *
         * Checks the data.autoplay value:
         *   - if undefined sets mediaElement.autoplay = true
         *   - if has value then sets mediaElement.autoplay to that value
         **/
        this.mediaManager['onLoadOrig'] = this.mediaManager.onLoad;
        /**
         * Processes the load event.
         * @param event
         */
        this.mediaManager.onLoad = function(event) {
            console.log("### Media Manager - LOAD: " + JSON.stringify(event));
            setHudMessage('mediaManagerMessage', 'LOAD ' + JSON.stringify(event));

            // TODO - setup for load here
            // TODO - if there is an error during load: call mediaManager.sendLoadError to notify sender
            // TODO - if there is no error call mediaManager.sendLoadCompleteComplete
            // TODO - call mediaManager.setMediaInformation(MediaInformation)

            if(this.mediaPlayer !== null) {
                this.mediaPlayer.unload(); // Ensure unload before loading again
            }

            if (event.data['media'] && event.data['media']['contentId']) {
                var url = event.data['media']['contentId'];

                this.mediaHost = new cast.player.api.Host({
                    'mediaElement': this.mediaElement,
                    'url': url
                });

                this.mediaHost.onError = function (errorCode) {
                    console.error('### HOST ERROR - Fatal Error: code = ' + errorCode);
                    setHudMessage('mediaHostState', 'Fatal Error: code = ' + errorCode);
                    if (this.mediaPlayer !== null) {
                        this.mediaPlayer.unload();
                    }
                }

                var initialTimeIndexSeconds = event.data['media']['currentTime'] || 0;
                // TODO: real code would know what content it was going to access and this would not be here.
                var protocol = null;

                var parser = document.createElement('a');
                parser.href = url;

                var ext = ext = parser.pathname.split('.').pop();
                if (ext === 'm3u8') {
                    protocol =  cast.player.api.CreateHlsStreamingProtocol(this.mediaHost);
                } else if (ext === 'mpd') {
                    protocol = cast.player.api.CreateDashStreamingProtocol(this.mediaHost);
                } else if (ext === 'ism/') {
                    protocol = cast.player.api.CreateSmoothStreamingProtocol(this.mediaHost);
                }
                console.log('### Media Protocol Identified as ' + ext);
                setHudMessage('mediaProtocol', ext);

                if (protocol === null) {
                    // Call on original handler
                    this.mediaManager['onLoadOrig'](event); // Call on the original callback
                } else {
                    // Advanced Playback - HLS, MPEG DASH, SMOOTH STREAMING
                    // Player registers to listen to the media element events through the mediaHost property of the
                    // mediaElement
                    this.mediaPlayer = new cast.player.api.Player(this.mediaHost);
                    this.mediaPlayer.load(protocol, initialTimeIndexSeconds);
                }
            }
        } //onload

        /**
         * Application config
         **/
        var appConfig = new cast.receiver.CastReceiverManager.Config();

        /**
         * Text that represents the application status. It should meet
         * internationalization rules as may be displayed by the sender application.
         * @type {string|undefined}
         **/
        appConfig.statusText = 'Ready to play';
        /**
         * Maximum time in seconds before closing an idle
         * sender connection. Setting this value enables a heartbeat message to keep
         * the connection alive. Used to detect unresponsive senders faster than
         * typical TCP timeouts. The minimum value is 5 seconds, there is no upper
         * bound enforced but practically it's minutes before platform TCP timeouts
         * come into play. Default value is 10 seconds.
         * @type {number|undefined}
         **/
        appConfig.maxInactivity = 6000; // 10 minutes for testing, use default 10sec in prod by not setting this value

        /**
         * Initializes the system manager. The application should call this method when
         * it is ready to start receiving messages, typically after registering
         * to listen for the events it is interested on.
         */
        this.castReceiverManager.start(appConfig);


        /**
         play - The process of play has started
         waiting - When the video stops due to buffering
         volumechange - volume has changed
         stalled - trying to get data, but not available
         ratechange - some speed changed
         canplay - It is possible to start playback, but no guarantee of not buffering
         canplaythrough - It seems likely that we can play w/o buffering issues
         ended - the video has finished
         error - error occured during loading of the video
         playing - when the video has started playing
         seeking - started seeking
         seeked - seeking has completed

         http://www.w3.org/2010/05/video/mediaevents.html for more info.
         **/
        this.mediaElement.addEventListener('loadstart', function(e){
            console.log("######### MEDIA ELEMENT LOAD START");
            setHudMessage('mediaElementState','Load Start');
        });
        this.mediaElement.addEventListener('loadeddata', function(e){
            console.log("######### MEDIA ELEMENT DATA LOADED");
            setHudMessage('mediaElementState','Data Loaded');
        });
        this.mediaElement.addEventListener('canplay', function(e){
            console.log("######### MEDIA ELEMENT CAN PLAY");
            setHudMessage('mediaElementState','Can Play');
        });
        this.mediaElement.addEventListener('ended', function(e){
            console.log("######### MEDIA ELEMENT ENDED");
            setHudMessage('mediaElementState','Ended');
        });
        this.mediaElement.addEventListener('playing', function(e){
            console.log("######### MEDIA ELEMENT PLAYING");
            setHudMessage('mediaElementState','Playing');
        });
        this.mediaElement.addEventListener('waiting', function(e){
            console.log("######### MEDIA ELEMENT WAITING");
            setHudMessage('mediaElementState','Waiting');
        });
        this.mediaElement.addEventListener('stalled', function(e){
            console.log("######### MEDIA ELEMENT STALLED");
            setHudMessage('mediaElementState','Stalled');
        });
        this.mediaElement.addEventListener('error', function(e){
            console.log("######### MEDIA ELEMENT ERROR " + e);
            setHudMessage('mediaElementState','Error');
        });
        this.mediaElement.addEventListener('abort', function(e){
            console.log("######### MEDIA ELEMENT ABORT " + e);
            setHudMessage('mediaElementState','Abort');
        });
        this.mediaElement.addEventListener('suspend', function(e){
            console.log("######### MEDIA ELEMENT SUSPEND " + e);
            setHudMessage('mediaElementState','Suspended');
        });
        this.mediaElement.addEventListener('progress', function(e){
            setHudMessage('mediaElementState','Progress');
        });

        this.mediaElement.addEventListener('seeking', function(e){
            console.log("######### MEDIA ELEMENT SEEKING " + e);
            setHudMessage('mediaElementState','Seeking');
        });
        this.mediaElement.addEventListener('seeked', function(e){
            console.log("######### MEDIA ELEMENT SEEKED " + e);
            setHudMessage('mediaElementState','Seeked');
        });

        /**
         * ALTERNATIVE TO onVisibilityChanged
         *
         * Use this to know when the user switched away from the Cast device input. It depends on the TV
         * Supporting CEC
         **/
        document.addEventListener('webkitvisibilitychange', function(){
            if(document.webkithidden) {
                this.mediaElement.pause(); // Pause playback
                window.timeout = window.setTimeout(function(){window.close();}, 10000); // 10 second timeout
            } else {
                this.mediaElement.play(); // Resume media playback
                window.clearTimeout(window.timeout); // Turn off the timeout
                window.timeout = null;
            }
        });
  }
});