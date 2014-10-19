Polymer('cast-custom-sender', {

    ready : function() {
      setTimeout(this.initializeCastApi.bind(this), 500);
    },

    initializeCastApi : function() {
        this.applicationId = this.applicationId || chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID
        console.log('ready: '  + this.applicationId);

        var sessionRequest = new chrome.cast.SessionRequest(this.applicationId);
        var apiConfig = new chrome.cast.ApiConfig(sessionRequest, this.sessionListener.bind(this), this.receiverListener.bind(this));

        chrome.cast.initialize(apiConfig, this.onInitSuccess.bind(this), this.onError.bind(this));
    },

    mediaURLChanged : function(oldValue, newValue) {
      console.log('new media url', newValue);
      if (this.session) {
        var mediaInfo = new chrome.cast.media.MediaInfo(this.mediaURL);
        mediaInfo.contentType = 'video/mp4';
        var request = new chrome.cast.media.LoadRequest(mediaInfo);
        console.log('loadMedia: ' + this.mediaURL);
        this.session.loadMedia(request, this.onMediaDiscovered.bind(this, 'loadMedia'), this.onMediaError.bind(this));
      } else {
        this.error = { code : 'no session' };
      }
    },

    sessionListener : function(e) {
      this.session = e;
      console.log(e);
      if (this.session.media.length != 0) {
        this.onMediaDiscovered('sessionListener', this.session.media[0]);
      } else {
        this.onRequestSessionSuccess(e);
      }
    },

    receiverListener :function(e) {
      console.log('receiver: ' + e);
      if (e === chrome.cast.ReceiverAvailability.AVAILABLE) {

      }
    },

    onInitSuccess : function() {
      this.initialized = true;
    },

    onError : function(e) {
      this.initialized = false;
      this.error = e;
    },

    launch : function() {
      console.log('launching...');
      chrome.cast.requestSession(this.onRequestSessionSuccess.bind(this), this.onLaunchError.bind(this));
    },

    stop : function() {
      console.log('stopping...');
      if (this.session) {
        this.session.stop(this.onStopSuccess.bind(this), this.onStopError.bind(this));
      }
    },

    onStopSuccess : function() {
      console.log('stopped');
      delete this.session;
    },

    onStopError : function(e) {
      console.log('stop failed');
      this.error = e;
    },

    onRequestSessionSuccess : function(e) {
      this.session = e;
    },

    onLaunchError : function(e) {
      console.log('launch error', e);
      this.error = e;
    },

    onMediaError : function(e) {
      console.log('media error', e);
      this.error = e;
    },

    onMediaDiscovered : function(how, media) {
      console.log('media discovered: ' + how);
      this.media = media;
      //this.media.addUpdateListener(this.onMediaStatusUpdate.bind(this));
    }


});