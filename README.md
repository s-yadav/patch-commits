# patch-commits
Patch all commits to have desired changes in a branch

This script allows you to go to each commits on a branch and run a script on each commits to have desired changes.

## Warning
Later discovered about git filter-branch and you can do what this module does with [git filter branch](https://git-scm.com/docs/git-filter-branch). Even though you have to write more bash script to get the committed files and filter them with git filter branch, I would suggest you to use git commands to do git changes.

## Installation
```sh
npm install -g patch-commits
```

## Usage
```sh
patch-commits --against branchName/commitHash --with "script"
```

## Options
--against (required): branch name or commit hash against which you are planning to patch. This is used to find commit difference between a branch / commit to the latest commit on your current branch.

--with (required): script you want to run on all commits.

## Getting diff files
You can get the diff files of a commit so you only run a script on only those files. You can pass a js expression which will return the diff files in the format you are expecting. 

```sh
patch-commits --against master --with "eslint --fix {{committedFiles.filter(file => file.endsWith('.js')).join(' ')}}"
```

Inside the expression you will get committedFiles as an array, in which you can apply any transformation. You should always convert it to a string which can be used with your script. In the above example we want to filter only js files and join them with space separator. So effectively following code will run.

```sh 
eslint --fix dir/file1.js dir/file2.js dir2/file3.js
```

The expression can be as simple as
```js
{{committedFiles.join(' ')}}
```

This is very helpful when you want to rebase from a branch where you applied some codemod, and you are getting a lot of conflicts while rebase because codemod has updated same lines which you have changed on your branch. 

## Example
Imagine a scenario when you are working a feature on branch which is branched out from master and you have a lot of commits on your branch. You have defined some new rules in eslint and applied eslint auto fix on master branch. And now you want to rebase your branch from master. Even if you have applied eslint auto fix on your branch rebase will replay all the commits on top of master, and might give you conflicts on each commit if there is changes on the same line where eslint auto fix have updated the code.

With this script you can patch all the commits to have eslint auto fix applied, so while replaying commits it will not report conflict on auto fixed code as master's top commit and your commit have same auto fixed code.

Here's the script you will need to run before rebase
```sh
patch-commits --against master --with "git checkout master -- .eslintrc && yarn eslint --fix {{committedFiles.filter(file => file.endsWith('.js')).join(' ')}}"
```

In the above script for every commit we are checking out eslintrc file from master and then applying eslint -fix for all committed/changed files.

After running this you can go ahead with normal rebase. And you will get less conflicts.
```sh
git rebase master
```

## Notes
While this script applies transformation on temporary branch and then apply the changes on current branch once everything is successfully finished, but you should make a backup branch from the current branch or push the commits on origin. Reflog will also help but as the script runs a couple of git branch it will be hard to find the correct head which you would want to reset on.

## Support 
- Mention what all you can do with this script. Add some examples.
- [:star: this repo](https://github.com/s-yadav/patch-commits)
