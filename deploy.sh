#!//bin/bash

# compile
npm run build && 

# publish to npm
npm publish && 

# push to github
github push -u