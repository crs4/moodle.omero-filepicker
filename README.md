# README

### Install

- copy omefilepicker into the lib/form folder of your Moodle installation
- add the following line at the end of the lib/formslib.php Moodle file:

        MoodleQuickForm::registerElementType('omerofilepicker',   	      	   
         	    "$CFG->libdir/form/omerofilepicker.php", 'MoodleQuickForm_omerofilepicker');
	
	
### Usage

To add an instance of omefilepicker within a new Moodle form use the standard filepicker syntax: only the name fo the form element has to be changed, i.e:

	   $mform->addElement('omefilepicker', 'userfile', get_string('file'), null,
            array('maxbytes' => 2048, 'accepted_types' => array('*'),
                  'return_types'=> array( FILE_INTERNAL | FILE_EXTERNAL)));