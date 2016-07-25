// Copyright (c) 2015-2016, CRS4
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

/**
 * Builds a new instance of OmeroFilePicker
 *
 * @param Y reference to the current YUI instance
 * @param options an JSON object containing the set of configuration options
 *
 * @category   form
 * @copyright  2015-2016 CRS4
 * @license    https://opensource.org/licenses/mit-license.php MIT license
 */
M.omero_filepicker = function (options, dndoptions, use_defaults) {

    // reference to the current scope
    var me = this;

    /**
     * Returns the ID of the current filepicker
     *
     * @returns string
     */
    this.getId = function () {
        return this._id;
    };

    /**
     * Returns a JSON description of the currently selected image
     *
     * @returns {{server_address: string, image_id: *}|*}
     */
    this.getCurrentSelectedImage = function () {
        return me._current_selected_image;
    };


    /**
     * Initialize the current instance of OmeroFilePicker
     *
     * @param options
     * @returns {boolean}
     * @private
     */
    this._initialize = function (options, dndoptions, use_defaults) {

        // set configurations
        me.config = !use_defaults ? {} : JSON.parse(JSON.stringify(M.omero_filepicker.default_configuration));
        for (var attrname in options) {
            me.config[attrname] = options[attrname];
        }

        me.dndoptions = !use_defaults ? {} : JSON.parse(JSON.stringify(M.omero_filepicker.dndoptions));
        for (var attrname in dndoptions) {
            me.dndoptions[attrname] = dndoptions[attrname];
        }

        //Keep reference of YUI, so that it can be used in callback.
        me.Y = M.omero_filepicker.Y || YUI();

        // properties
        me.fileadded = false;
        me._id = M.omero_filepicker.getId(me.config);

        // FIXME: disallow all repositories but the Omero one
        for (var i in me.config.repositories) {
            if (me.config.repositories[i].type !== "omero")
                delete me.config.repositories[i];
        }

        //Set filepicker callback
        me.config.formcallback = me.callback;

        // Initialize the CoreFilepickerHelper
        if (!M.core_filepicker.instances[me._id]) {
            M.core_filepicker.init(me.Y, me.config);
        }

        // Get a reference to the System FilePickerHelper
        var filepicker_helper = M.core_filepicker.instances[me.config.client_id];
        if (!filepicker_helper) {
            console.error("Unable to find the FilePickerHelper for the client " + me.config.client_id);
            return false;
        }

        // Set the reference to the System FilePickerHelper
        me._helper = filepicker_helper;

        // Set the handler of the CLICK event triggered by the button with ID me.config["buttonid"]
        var button_element = document.getElementById(me.config["buttonid"]);
        if (!button_element)
            console.error("Unable to find the button element with ID " + me.config["buttonid"]);
        else {
            button_element.onclick = function (e) {
                e.preventDefault();
                filepicker_helper.show();
            };
        }

        // Update DOM
        var item = document.getElementById('nonjs-filepicker-' + me.config.client_id);
        if (item) {
            item.parentNode.removeChild(item);
        }
        item = document.getElementById('filepicker-wrapper-' + me.config.client_id);
        if (item) {
            item.style.display = '';
        }

        // Init dndoptions
        M.form_dndupload.init(Y, me.dndoptions);

        // Checks whether an OMERO image has been selected (usefull after page refresh)
        var omeroimageurl = document.getElementsByName(me.config.elementname);
        if (omeroimageurl && omeroimageurl.length > 0) {
            var visibilerois = document.getElementsByName("visibilerois");
            if (visibilerois && visibilerois.length > 0)
                visibilerois = visibilerois[0].value;
            var showroitable = document.getElementsByName("showroitable");
            if (showroitable && showroitable.length > 0)
                showroitable = showroitable[0].value;
            omeroimageurl = omeroimageurl[0].value;
        }

        // Immediately apply the callback if the hidden element containing the selected image is defined
        if (omeroimageurl != null && omeroimageurl.length > 0 && omeroimageurl != 'none') {
            me.callback({
                client_id: dndoptions.clientid,
                url: omeroimageurl,
                visiblerois: options.visiblerois,
                showroitable: showroitable,
                options: dndoptions
            });
        }

        if (!M.omero_filepicker.instances[me._id])
            M.omero_filepicker.instances[me._id] = me;
    };


    /**
     * Handle the selection of an image from the OmeroRepository
     *
     * @param params
     */
    this.callback = function (params) {

        var html = "";
        var url = params['url'];
        var elementName = me.config["elementname"];
        var filenameElement = me.config["filename_element"];
        var moodle_server = me.config["moodle_server"];
        var newURL = window.location.protocol + "/" + window.location.host + "/" + window.location.pathname;

        // FIXME: check whether there exists a better method to identify the file type
        if (url.indexOf("webgateway") > -1 || url.indexOf("omero-image-repository") > -1) {

            var server_address = url.substring(0, url.indexOf("webgateway") - 1);
            var filepicker_container_id = '#file_info_' + params['client_id'];

            // compute the imageId from the actual url
            var image_id = url.substring(url.lastIndexOf("/") + 1);
            var image_params = null;
            var image_params_index = url.indexOf("?");
            if (image_params_index > 0) {
                image_params = url.substr(image_params_index + 1);
                image_id = url.substring(url.lastIndexOf("/") + 1, image_params_index);
            }

            var visiblerois = params['visiblerois'];
            if (!visiblerois || visiblerois == "none") {
                var visiblerois_index = url.indexOf("&visibleRois=");
                if (visiblerois_index > 0) {
                    visiblerois = url.substr(visiblerois_index);
                }
            }

            // FIXME: only for debug
            console.log("Server Address: " + server_address);
            console.log("URL: " + url);
            console.log("IMAGE_ID: " + image_id);
            console.log("IMAGE_PARAMS: " + image_params);
            console.log("VISIBLE_ROIS: " + visiblerois);
            console.log("Moodle Server:" + moodle_server);


            var moodle_viewer_for_omero_url = moodle_server + "/repository/omero/viewer/viewer.php";
            me._current_selected_image = {
                omero_server_address: server_address,
                moodle_viewer_for_omero_url: moodle_viewer_for_omero_url,
                container_id: filepicker_container_id,
                image_id: image_id
            };

            // Update the URL of the current selected image
            if (filenameElement && document.getElementById(filenameElement)) {
                document.getElementById(filenameElement).innerHTML = "id." + image_id;
            }

            if (document.getElementById("id_" + elementName)) {
                document.getElementById("id_" + elementName).setAttribute("value", url);
            }


        } else { // Default filepicker viewer
            html = '<a href="' + params['url'] + '">' + params['file'] + '</a>';
            html += '<div class="dndupload-progressbars"></div>';
            me.Y.one('#file_info_' + params['client_id'] + ' .filepicker-filename').setContent(html);
        }

        //When file is added then set status of global variable to true
        me.fileadded = true;
        //generate event to indicate changes which will be used by disable if or validation code
        if (me.Y.one('#id_' + elementName))
            me.Y.one('#id_' + elementName).simulate('change');
    };

    // initialize the current instance
    this._initialize(options, dndoptions, use_defaults);
};


// Collects all instances of the OmeroFilePicker class
M.omero_filepicker.instances = {};


/**
 * Utility function to generate an ID for a picker
 * given its configuration properties.
 *
 * @param options
 * @returns {string}
 */
M.omero_filepicker.getId = function (options) {
    return options["client_id"] + "_" + options["elementname"];
};


/**
 * This function is called for each file picker on page.
 */
M.omero_filepicker.init = function (Y, options) {
    M.omero_filepicker.Y = Y;
    M.omero_filepicker.default_configuration = JSON.parse(JSON.stringify(options));
    M.omero_filepicker.dndoptions = {
        clientid: options.client_id,
        moodle_server: options.moodle_server,
        acceptedtypes: options.accepted_types,
        author: options.author,
        maxfiles: -1,
        maxbytes: options.maxbytes,
        itemid: options.itemid,
        repositories: options.repositories,
        formcallback: options.formcallback,
        containerprefix: '#file_info_',
        containerid: 'file_info_' + options.client_id,
        contextid: options.context.id,
        omero_image_server: options.omero_image_server,
        showroitable: options.showroitable
    };
    console.log("Default configuration", options);
    var id = M.omero_filepicker.getId(options);
    return new M.omero_filepicker(options, M.omero_filepicker.dndoptions, false);
};

/**
 * Notifies that frame is completely loaded !!!
 * @param frame_obj frame object reference
 */
M.omero_filepicker.notifyFrameLoaded = function (frame_obj) {
    console.log("Frame '" + frame_obj.id + "' is loaded!!!", frame_obj);
    document.dispatchEvent(new CustomEvent('frameLoaded', {
        detail: M.omero_filepicker._current_selected_image,
        bubbles: true
    }));
};
