#!//bin/bash

function deploy {
    if [ -z $1 ]
    then 
        echo "* Enter version number (increment package.json)!"
        return 5
    elif [ -z $2 ]
    then 
        echo "* Enter version number AND commit notes!"
        return 5
    else
        # Notify begin
        echo "** Building version $1" &&
        # compile JS
        npm run build && clear && 
        # Notify Git actions
        echo "** Built v.$1"
        echo "" 
        echo "** Tag $1 and commit changes to git..." &&
        # Add working files
        git add . && 
        # commit
        git commit -m "** : AUTOCOMMIT : $1 : Notes: $2" &&
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

deploy $1 $2

# deploy