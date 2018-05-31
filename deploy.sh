#!//bin/bash

function deploy {
    if [ -z $1 ]
    then 
        echo "* Enter version number: See package.json (increment before deploying)!"
        return 5
    else
        # Notify begin
        echo "** Building version $1" &&
        # compile JS
        npm run build && 
        # Notify Git actions
        echo "** Tag $1 and commit changes to git..." &&
        # Add working files
        git add . && 
        # commit
        git commit -m "** : AUTOCOMMIT : version $1" &&
        # Tag  current version
        git tag $1 && 
        # push to github
        git push -u --tags && 
        # Notify NPM Actions
        echo "Publishing $1 to NPM..." &&
        # publish to npm
        npm publish 
    fi

    return 0
}

deploy $1

# deploy