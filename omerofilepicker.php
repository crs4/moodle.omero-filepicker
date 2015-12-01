<?php

/**
 * Extension of the default Moodle filepicker for viewing images
 * picked from the Omero Repository for Moodle
 *
 * @package   core_form
 * @copyright 2015 CRS4
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

global $CFG;

require_once("HTML/QuickForm/button.php");
require_once($CFG->dirroot . '/repository/lib.php');

require_once($CFG->dirroot . '/lib/form/filepicker.php');

/**
 * Omero Filepicker form element
 *
 * HTML class which extends the core filepicker element (based on button)
 *
 * @package   core_form
 * @category  form
 * @copyright 2015 CRS4
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later // FIXME: to be checked
 */
class MoodleQuickForm_omerofilepicker extends MoodleQuickForm_filepicker
{
    /** @var string html for help button, if empty then no help will icon will be dispalyed. */
    public $_helpbutton = '';

    /** @var array options provided to initalize filemanager */
    // PHP doesn't support 'key' => $value1 | $value2 in class definition
    // We cannot do $_options = array('return_types'=> FILE_INTERNAL | FILE_REFERENCE);
    // So I have to set null here, and do it in constructor
    protected $_options = array('maxbytes' => 0, 'accepted_types' => '*', 'return_types' => null);

    /**
     * Constructor
     *
     * @param string $elementName (optional) name of the filepicker
     * @param string $elementLabel (optional) filepicker label
     * @param array $attributes (optional) Either a typical HTML attribute string
     *              or an associative array
     * @param array $options set of options to initalize filepicker
     * @throws Exception
     */
    function MoodleQuickForm_omerofilepicker($elementName = null, $elementLabel = null, $attributes = null, $options = null)
    {
        parent::MoodleQuickForm_filepicker($elementName, $elementLabel, $attributes, $options);
        if (isset($options["omero_image_url"]))
            $this->omero_image_url = $options["omero_image_url"];
        if (isset($options["visible_rois"]))
            $this->visible_rois = $options["visible_rois"];

        $this->omero_image_server = $options["omero_image_server"];

        if (isset($options["show_roi_table"]))
            $this->show_roi_table = $options["show_roi_table"];
        else $this->show_roi_table = false;
    }

    /**
     * Returns HTML for filepicker form element.
     *
     * @return string
     */
    function toHtml()
    {
        global $CFG, $COURSE, $USER, $PAGE, $OUTPUT;

        $id = $this->_attributes['id'];
        $elname = $this->_attributes['name'];

        if ($this->_flagFrozen) {
            return $this->getFrozenHtml();
        }
        if (!$draftitemid = (int)$this->getValue()) {
            // no existing area info provided - let's use fresh new draft area
            $draftitemid = file_get_unused_draft_itemid();
            $this->setValue($draftitemid);
        }

        if ($COURSE->id == SITEID) {
            $context = context_system::instance();
        } else {
            $context = context_course::instance($COURSE->id);
        }

        $client_id = uniqid();

        $args = new stdClass();
        // need these three to filter repositories list
        $args->accepted_types = $this->_options['accepted_types'] ? $this->_options['accepted_types'] : '*';
        $args->return_types = $this->_options['return_types'];
        $args->itemid = $draftitemid;
        $args->maxbytes = $this->_options['maxbytes'];
        $args->context = $PAGE->context;
        $args->buttonname = $elname . 'choose';
        $args->elementname = $elname;

        $html = $this->_getTabs();
        $fp = new file_picker($args);
        $options = $fp->options;
        // sets omero_image_url
        if (isset($_REQUEST['omero_image_url']))
            $options->omero_image_url = $_REQUEST['omero_image_url'];
        else if (isset($this->omero_image_url))
            $options->omero_image_url = $this->omero_image_url;
        // sets the list of ROIs to display
        if (isset($_REQUEST['visible_rois']))
            $options->visible_rois = $_REQUEST['visible_rois'];
        else if (isset($this->visible_rois))
            $options->visible_rois = $this->visible_rois;
        // other settings
        $options->context = $PAGE->context;
        $options->moodle_server = $CFG->wwwroot;
        $options->omero_image_server = $this->omero_image_server;
        $options->show_roi_table = $this->show_roi_table;
        $html .= $this->render_file_picker($fp);
        $html .= '<input type="hidden" name="' . $elname . '" id="' . $id .
            '" value="' . $draftitemid . '" class="filepickerhidden"/>';
        // initializes the filepicker controller
        $module = array('name' => 'form_filepicker', 'fullpath' => '/lib/form/omerofilepicker.js',
            'requires' => array('core_filepicker', 'node', 'node-event-simulate', 'core_dndupload'));
        $PAGE->requires->js_init_call('M.form_filepicker.init', array($fp->options), true, $module);
        // defaults
        $nonjsfilepicker = new moodle_url('/repository/draftfiles_manager.php', array(
            'env' => 'filepicker',
            'action' => 'browse',
            'itemid' => $draftitemid,
            'subdirs' => 0,
            'maxbytes' => $options->maxbytes,
            'maxfiles' => 1,
            'ctx_id' => $PAGE->context->id,
            'course' => $PAGE->course->id,
            'sesskey' => sesskey(),
        ));

        // non js file picker
        $html .= '<noscript>';
        $html .= "<div><object type='text/html' data='$nonjsfilepicker' height='160' width='600' style='border:1px solid #000'></object></div>";
        $html .= '</noscript>';

        return $html;
    }


    /**
     * Internal implementation of file picker rendering.
     *
     * @param file_picker $fp
     * @return string
     */
    public
    function render_file_picker(file_picker $fp)
    {
        global $CFG, $OUTPUT, $USER;
        $options = $fp->options;
        $client_id = $options->client_id;
        $strsaved = get_string('filesaved', 'repository');
        $straddfile = get_string('openpicker', 'repository');
        $strloading = get_string('loading', 'repository');
        $strdndenabled = get_string('dndenabled_inbox', 'moodle');
        $strdroptoupload = get_string('droptoupload', 'moodle');
        $icon_progress = $OUTPUT->pix_icon('i/loading_small', $strloading) . '';

        $currentfile = $options->currentfile;
        if (empty($currentfile)) {
            $currentfile = '';
        } else {
            $currentfile .= ' - ';
        }
        if ($options->maxbytes) {
            $size = $options->maxbytes;
        } else {
            $size = get_max_upload_file_size();
        }
        if ($size == -1) {
            $maxsize = '';
        } else {
            $maxsize = get_string('maxfilesize', 'moodle', display_size($size));
        }
        if ($options->buttonname) {
            $buttonname = ' name="' . $options->buttonname . '"';
        } else {
            $buttonname = '';
        }
        $html = <<<EOD

        <!-- Removes the label -->
        <script type="text/javascript">$("#fitem_id_omeroimagefilereference div.fitemtitle").css("display", "none");</script>

        <!-- if no URL has been selected yet -->
        <strong>Current omero image:</strong>

        <div style="float: right;">
            <input type="button" class="fp-btn-choose" id="filepicker-button-{$client_id}" value="{$straddfile}"{$buttonname}/>
            <span> $maxsize </span>
        </div>
EOD;
        // Print the current selected file
        $html.= ' <span id="omerofilepicker-selected-filename">' . (!empty($currentfile) ? $currentfile : "none") . '</span>';

        $html .= <<<EOD

        <div class="filemanager-loading mdl-align" id='filepicker-loading-{$client_id}' style="border: none;">
            $icon_progress
        </div>

        <div id="filepicker-wrapper-{$client_id}" class="mdl-left" style="display:none; min-width: 100%;">
EOD;
        if ($options->env != 'url') {
            $html .= <<<EOD

            <!-- if a URL has been selected -->
            <div id="file_info_{$client_id}" class="mdl-left filepicker-filelist" style="border: none; position: relative;">
                <div class="filepicker-filename" style="border: none;">
                    <div class="filepicker-container" style="border: none;">
                        <div class="dndupload-message">$strdndenabled <br/>
                            <div class="dndupload-arrow"></div>
                        </div>
                    </div>
                    <div class="dndupload-progressbars"></div>
                </div>
                <div>
                    <div class="dndupload-target">{$strdroptoupload}<br/>
                        <div class="dndupload-arrow"></div>
                    </div>
                </div>
            </div>
        </div>
EOD;
        }
        return $html;
    }
}
