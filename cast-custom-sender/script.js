Polymer('cast-custom-sender', {

    ready : function() {
      setTimeout(this.initializeCastApi.bind(this), 500);
    },

    initializeCastApi : function() {
        this.applicationId = this.applicationId || chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID
        console.log('ready: '  + this.applicationId);

        var sessionListener = function(e) {
          this.session = e;
          console.log(e);
          if (this.session.media.length != 0) {
            this.onMediaDiscovered('sessionListener', this.session.media[0]);
          } else {
            this.onRequestSessionSuccess(e);
          }
        };

        var receiverListener  = function(e) {
          console.log('receiver: ' + e);
          if (e === chrome.cast.ReceiverAvailability.AVAILABLE) {
            //now we can enable something, because we've found a chrome cast
          }
        };

        var sessionRequest = new chrome.cast.SessionRequest(this.applicationId);
        var apiConfig = new chrome.cast.ApiConfig(sessionRequest, sessionListener.bind(this), receiverListener.bind(this));

        var onSuccess = function() {
            this.initialized = true;
            console.log('init success');
        };

        var onError = function(e) {
          this.initialized = false;
          this.error = e;
        };

        chrome.cast.initialize(apiConfig, onSuccess.bind(this), onError.bind(this));
    },

    mediaURLChanged : function(oldValue, newValue) {
      console.log('new media url', newValue);
      if (this.session) {


      var onError = function(e) {
        console.log('media error', e);
        this.error = e;
      };

      var mediaInfo = new chrome.cast.media.MediaInfo(this.mediaURL);
        mediaInfo.contentType = 'video/mp4';
        var request = new chrome.cast.media.LoadRequest(mediaInfo);
        console.log('loadMedia: ' + this.mediaURL);
        this.session.loadMedia(request, this.onMediaDiscovered.bind(this, 'loadMedia'), onError.bind(this));
      } else {
        this.error = { code : 'no session' };
      }
    },

    launch : function() {
      console.log('launching...');

      var onSuccess = function(e) {
        this.session = e;
      };

      var onError = function(e) {
        console.log('launch error', e);
        this.error = e;
      };

      chrome.cast.requestSession(onSuccess.bind(this), onError.bind(this));
    },

    stop : function() {
      console.log('stopping...');
      if (this.session) {

        var onSuccess = function() {
          console.log('stopped');
          delete this.session;
        };

        var onError = function(e) {
          console.log('stop failed');
          this.error = e;
        };

        this.session.stop(onSuccess.bind(this), onError.bind(this));
      }
    },

    onMediaDiscovered : function(how, media) {
      console.log('media discovered: ' + how);
      this.media = media;
    }



});