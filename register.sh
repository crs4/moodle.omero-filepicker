#!/bin/bash

if [[ -z ${MOODLE_WWW} ]]; then
	echo -e "ERROR: MOODLE_WWW not found in your environment !!!"
	exit -1
fi

if grep -o 'MoodleQuickForm_omerofilepicker' ${MOODLE_WWW}/lib/formslib.php ; then
	echo -e "\n NOTICE: 'omerofilepicker' form already registered."
else	
	echo -e "# OmeroFilePicker \nMoodleQuickForm::registerElementType('omerofilepicker', \"\$CFG->libdir/form/omerofilepicker/omerofilepicker.php\", 'MoodleQuickForm_omerofilepicker');" >> ${MOODLE_WWW}/lib/formslib.php
	echo -e "Registering the omerofilepicker form.... done."
fi

