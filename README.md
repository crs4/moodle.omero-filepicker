# moodle.omero-filepicker

An extended Moodle filepicker which supports the Moodle OMERO repository (see [moodle.omero-repository](https://github.com/crs4/moodle.omero-repository.git))

## How to install

- copy this repository into the lib/form folder of your Moodle installation
- add the following line at the end of the `<MOODLE-ROOT-DIR>/lib/formslib.php` file:

        MoodleQuickForm::registerElementType('omerofilepicker',   	      	   
         	    "$CFG->libdir/form/omerofilepicker.php", 'MoodleQuickForm_omerofilepicker');
	
	
## Usage

To add an instance of omefilepicker within a new Moodle form use the standard filepicker syntax changing the the name of the form element to `omerofilepicker`, i.e:

	   $mform->addElement('omefilepicker', 'userfile', get_string('file'), null,
            array('maxbytes' => 2048, 'accepted_types' => array('*'),
                  'return_types'=> array( FILE_INTERNAL | FILE_EXTERNAL)));

## Requirements

* Moodle 2.9 or later (available on the [Moodle site](https://download.moodle.org/releases/supported/))
* Omero Repository for Moodle (available on [Github](https://github.com/crs4/moodle.omero-repository))

## Copyright and licence
Code and documentation Copyright © 2015-2016, [CRS4](http://www.crs4.it). 
Code released under the [MIT license](https://opensource.org/licenses/mit-license.php). 