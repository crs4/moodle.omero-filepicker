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
 * OmeroFilepickerForm callback handler.
 *
 * @package    core_form
 * @category   form
 * @copyright  2015-2016 CRS4
 * @licence    https://opensource.org/licenses/mit-license.php MIT licence
 */

M.form_filepicker = {};
M.form_filepicker.Y = null;
M.form_filepicker.instances = [];

M.form_filepicker.callback = function (params) {

    var me = M.form_filepicker;
    var html = "";
    var url = params['url'];

    var newURL = window.location.protocol + "/" + window.location.host + "/" + window.location.pathname;

    // FIXME: check whether there exists a better method to identify the file type
    if (url.indexOf("webgateway") > -1 || url.indexOf("omero-image-repository") > -1) {

        var server_address = url.substring(0, url.indexOf("webgateway") - 1);

        // FIXME: configure me !!!
        var frame_id = "omero-image-viewer";

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
        console.log("Moodle Server:" + M.form_filepicker.Y.moodle_server);

        var moodle_viewer_for_omero_url = M.form_filepicker.Y.moodle_server + "/repository/omero/viewer/viewer.php";

        me.current_loaded_image = {
            omero_server_address: server_address,
            image_id: image_id,
            frame_id: frame_id,
            moodle_viewer_for_omero_url: moodle_viewer_for_omero_url
        };

        // Update the URL of the current selected image
        document.getElementById("omerofilepicker-selected-filename").innerHTML = "id." + image_id;
        document.getElementById("id_omeroimageurl").setAttribute("value", url);

        // Builds the iframe containing the viewer
        html = '<iframe width="100%" height="400px"' +
            ' src="' + moodle_viewer_for_omero_url +
            '?id=' + +image_id +
            '&frame=' + frame_id +
            '&width=' + encodeURIComponent("100%") +
            '&height=' + encodeURIComponent("500px") +
            '&showRoiTable=' + M.form_filepicker.Y.showroitable +
            '&' + image_params +
            (visiblerois ? '&visibleRois=' + visiblerois : "") +
            '" id="' + frame_id + '" name="' + frame_id + '" ' +
            ' onload="M.form_filepicker.notifyFrameLoaded(this)" ' +
            ' style="margin: 0 auto;"' +
            '></iframe>';

        M.form_filepicker.Y.one('#file_info_' + params['client_id'] + ' .filepicker-filename').setContent(html);

    } else { // Default filepicker viewer
        html = '<a href="' + params['url'] + '">' + params['file'] + '</a>';
        html += '<div class="dndupload-progressbars"></div>';
        M.form_filepicker.Y.one('#file_info_' + params['client_id'] + ' .filepicker-filename').setContent(html);
    }

    //When file is added then set status of global variable to true
    var elementName = M.core_filepicker.instances[params['client_id']].options.elementname;
    M.form_filepicker.instances[elementName].fileadded = true;
    //generate event to indicate changes which will be used by disable if or validation code
    M.form_filepicker.Y.one('#id_' + elementName).simulate('change');
};

/**
 * This function is called for each file picker on page.
 */
M.form_filepicker.init = function (Y, options) {
    //Keep reference of YUI, so that it can be used in callback.
    M.form_filepicker.Y = Y;

    // FIXME: disallow not needed repositories from the PHP code
    for (var i in options.repositories) {
        if (options.repositories[i].type !== "omero")
            delete options.repositories[i];
    }

    //For client side validation, initialize file status for this filepicker
    M.form_filepicker.instances[options.elementname] = {};
    M.form_filepicker.instances[options.elementname].fileadded = false;

    //Set filepicker callback
    options.formcallback = M.form_filepicker.callback;

    // Set MoodleServer
    M.form_filepicker.Y.moodle_server = options.moodle_server;

    // Set 'showroitable' flag
    M.form_filepicker.Y.showroitable = options.showroitable;

    if (!M.core_filepicker.instances[options.client_id]) {
        M.core_filepicker.init(Y, options);
    }
    Y.on('click', function (e, client_id) {
        e.preventDefault();
        if (this.ancestor('.fitem.disabled') == null) {
            M.core_filepicker.instances[client_id].show();
        }
    }, '#filepicker-button-' + options.client_id, null, options.client_id);

    var item = document.getElementById('nonjs-filepicker-' + options.client_id);
    if (item) {
        item.parentNode.removeChild(item);
    }
    item = document.getElementById('filepicker-wrapper-' + options.client_id);
    if (item) {
        item.style.display = '';
    }

    var dndoptions = {
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

    M.form_dndupload.init(Y, dndoptions);

    // Checks whether an OMERO image has been selected (usefull after page refresh)
    var omeroimageurl = document.getElementsByName(options.elementname);
    if (omeroimageurl && omeroimageurl.length > 0) {
        var visibilerois = document.getElementsByName("visibilerois");
        if (visibilerois && visibilerois.length > 0)
            visibilerois = visibilerois[0].value;
        var showroitable = document.getElementsByName("showroitable");
        if (showroitable && showroitable.length > 0)
            showroitable = showroitable[0].value;
        omeroimageurl = omeroimageurl[0].value;
    }

    if (omeroimageurl != null && omeroimageurl.length > 0 && omeroimageurl != 'none') {
        M.form_filepicker.callback({
            client_id: dndoptions.clientid,
            url: omeroimageurl,
            visiblerois: options.visiblerois,
            showroitable: showroitable,
            options: dndoptions
        });
    }
};

/**
 * Returns a JSON description of the current loaded image
 *
 * @returns {{server_address: string, image_id: *}|*}
 */
M.form_filepicker.getCurrentLoadedImage = function () {
    return M.form_filepicker.current_loaded_image;
};


/**
 * Notifies that frame is completely loaded !!!
 * @param frame_obj frame object reference
 */
M.form_filepicker.notifyFrameLoaded = function (frame_obj) {
    console.log("Frame '" + frame_obj.id + "' is loaded!!!", frame_obj);
    document.dispatchEvent(new CustomEvent('frameLoaded', {
        detail: M.form_filepicker.current_loaded_image,
        bubbles: true
    }));
};