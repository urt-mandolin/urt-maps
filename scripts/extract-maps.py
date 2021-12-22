##
# Copy a .pk3 files in a folder to .zip, and then extract them.
# Keeps a copy of the original pk3 in the same folder.
#
# IMPORTANT: If extracting a lot of large files,
# make sure you have sufficient disk space.
#
# Usage:> extract-maps.py 'mydir'
##

import sys
import re
import json
import shutil
from zipfile import ZipFile
from os import listdir, path


folder = sys.argv[1]
zips = []

for item in listdir(folder):
    if item.endswith(".pk3"):
        print('Copying', item)
        src = path.join(folder, item)
        zipfilename = item[0:-4] + '.zip'
        dst = path.join(folder, zipfilename)
        shutil.copyfile(src, dst)
        zips.append({'map':item[0:-4], 'file':zipfilename})

errors = []
success = []
for item in zips:
    with ZipFile(path.join(folder,item['file']), 'r') as zf:
        try:
            zf.extractall(path.join(folder,item['map']))
        except:
            errors.append(item)
        else:
            print('Extracted',item['file'])
            success.append(item)

print()
print('Extracted {} files'.format(len(success)))

if (len(errors)):
    print('{} errors:'.format(len(errors)))
    for e in errors:
        print(e['file'])
