/**
 * @param pixlrSendImageUrl    the url called by pixlr to send you an updated image, as declared in node.js with app.get('/pixlr/sendImage', pixlr.sendImageUrl);
 * @param pixlrCloseWindowUrl    the url opened by the user when he closes the pixlr editor, as declared in node.js with app.get('/pixlr/close.html', pixlr.close);
 * @param opt_settings a dynamic object with these values:
 *   - referrer    The name of the referring service for example "Your site name" or "Facebook"
 *   - icon    A url to a 16*16 icon to be shown at the save tab
 *   - exit    The URL to send the visitor if the user click exit/close
 *   - title    The title of the opened image
 *   - type    The filetype of the image, just type no ".", the apps will try to get the type from the URL if type param is not
 *   - redirect    Set to "false" if you don't want the browser to follow the save post. i.e the user stay in the editor after saving.
 *   - locktarget    Remove the possibility for the user to "save to computer" and other service in Pixlr Editor
 *   - locktitle    Lock the image title so the user can't change it
 *   - locktype    Lock the save format, values are jpg, png, bmp, pxd or source, do not include "."
 *   - quality    Set the jpg quality when the user saves the image, values are 0-100
 *   - copy    Shows a checkbox on the save dialog that lets the user select "Save as copy"
 *   - maxwidth    Set the maximum width of an image the user saves
 *   - maxheight    Set the maximum height of an image the user saves
 *
 * TODO: handle window closed by the user while editing?
 *
 */
function Pixlr(pixlrSendImageUrl, pixlrCloseWindowUrl, opt_settings) {
    // console object pollyfill
    window.console = window.console || {
        log: function () {}
        , warn: function () {}
        , error: function () {}
    };
    // check that we are not with protocol file://
    if (window.location.href.indexOf('file') === 0){
        console.error('you need to run this page online, not with file:// protocol');
    }
    if (window.location.href.indexOf('http://localhost') === 0){
        console.error('you need to run this page online, not from localhost');
    }
    /**
     * default settings
     */
    var defaultSettings = {
    };
    /*
     * build settings object
     */
    function absoluteUrl(url) {
        if (url.indexOf('http') === 0) {
            // absolute URL is fine
            return url;
        }
        else{
            // relative URLs
            var absoluteUrl = window.location + '';
            // remove  trailing slash
            if (absoluteUrl.lastIndexOf('/') === absoluteUrl.length - 1) {
                absoluteUrl = absoluteUrl.substr(0, absoluteUrl.length - 1);
            }
            if (url.indexOf('/') != 0) {
                absoluteUrl += '/';
            }
            console.log('absoluteUrl', absoluteUrl, url);

            absoluteUrl += url;
            return absoluteUrl;
        }
    }
    /*
     * retrieve the pixels of an image
     * only compatible with recent browsers
     * @see http://stackoverflow.com/questions/934012/get-image-data-in-javascript
     */
    function getPixels(image) {
        // Create an empty canvas element
        var canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;

        // Copy the image contents to the canvas
        var ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0);

        // Get the data-URL formatted image
        // Firefox supports PNG and JPEG. You could check img.src to
        // guess the original format, but be aware the using "image/jpg"
        // will re-encode the image.
        var dataURL = canvas.toDataURL("image/png");

        return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
    }

    /*
     * build settings object
     */
    function buildSettings(image, opt_target) {
        var settings = opt_settings || defaultSettings;
        // image Url
        if(typeof(image) === 'string'){
            settings.image = absoluteUrl(image);
            settings.title = image.substr(image.lastIndexOf('/'));
            settings.target = absoluteUrl(pixlrSendImageUrl) + '?path=' + encodeURIComponent(image);
        }
        else{
            settings.image = getPixels(image);
            settings.title = image.getAttribute('src').substr(image.getAttribute('src').lastIndexOf('/'));
            settings.target = absoluteUrl(pixlrSendImageUrl) + '?path=' + encodeURIComponent(image.getAttribute('src'));
        }
        // the url of your backend service, as declared in node.js with app.get('/pixlr', pixlr.middleware);
        // which pixlr service will call with the image data in get
        settings.method = 'GET';
        // exit page
        if (!opt_target || opt_target === '_blank') {
            settings.exit = absoluteUrl(pixlrCloseWindowUrl);
        }
        else {
            settings.exit = 'pixlr://exit';
        }
        // merge with default settings
        for (var attribute in settings) {
            settings[attribute] = settings[attribute] || defaultSettings[attribute];
        }
        console.log('settings: ', settings);
        return settings;
    }
    /*
     * build pixlr URL
     */
    function buildUrl(serviceName, settings) {
        // build the string for URL
        var queryString = '';
        for (var attribute in settings) {
            queryString += encodeURIComponent(attribute) + '=' + encodeURIComponent(settings[attribute]) + '&'
        }
        return 'http://pixlr.com/' + serviceName + '/?' + queryString;
    }
    /**
     * edit the provided image in pixlr editor or pixlr express
     */
    function openPixlr(image, serviceName, opt_target) {
        // default target is blank
        if(!opt_target) opt_target = '_blank';
        // build the settings object
        var settings = buildSettings(image);
        // build the URL
        var url = buildUrl(serviceName, settings);
        // load pixlr
        if(opt_target === '_blank') {
            // open pixlr in a new window
            var pixlrWindow = window.open(url, 'pixlrWindow');
            if (pixlrWindow) {
                pixlrWindow.focus();
            }
            else{
                // error, popup blocker?
            }
        }
        else{
            // open pixlr in an iframe
            var iframe = document.getElementById(opt_target) || document.getElementByClassName(opt_target);
            iframe.src = url;
        }
    }
    /*
     * the returned class
     */
    return {
        /**
         * callback for update events
         * called with the image param
         */
        onUpdate: null,
        /**
         * edit the provided image in pixlr editor
         */
        edit: function(image, opt_target) {
            openPixlr(image, 'editor', opt_target);
        },
        /**
         * edit the provided image in pixlr express
         */
        express: function(image, opt_target) {
            openPixlr(image, 'express', opt_target);
        }
    }
};
