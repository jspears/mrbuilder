Upgrading from version 3.x to version 4.x

This tool is provided to assist the upgrading from version 3 to version 4 of mrbuilder. Its not perfect however for
most common cases this tool should work.  Version 4 changes packaging to scoped packaging for better security and 
namespace availability.   


### Usage
```sh
 # review changes
 $ ./node_modules/.bin/mrbuilder-upgrade | less
 # write the changes to disk.  MAKE SURE YOU HAVE A BACKUP of .mrbuilderrc and package.json SAVED.
 $ ./node_modules/.bin/mrbuilder-upgrade --write
```
