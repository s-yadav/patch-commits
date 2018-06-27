#!/usr/bin/env node

const {argv} = require('yargs');
const {green} = require('chalk');
const {exec} = require('shelljs');

const masterBranch = argv.against;

const command = argv.with;

const randomId = Math.ceil(Math.random() * 10000000);

const workerBranch = `worker-branch-${randomId}`;

const patchedBranch = `patched-branch-${randomId}`;


function getGitStdout(command) {
  return exec(command).stdout.replace('\n', '')
}

function evaluateExpression(committedFiles, expression) {
  expression = expression.replace(/committedFiles/g, JSON.stringify(committedFiles));
  return new Function(`return ${expression}`)();
}

const currentBranch = getGitStdout('git rev-parse --abbrev-ref HEAD');

const commits = exec(`git log ${masterBranch}..${currentBranch} --pretty=format:"%h"`).stdout.split('\n').reverse();

const parentCommit = getGitStdout(`git rev-parse --short HEAD~${commits.length}`);

exec(`git checkout -b ${patchedBranch}`);

//reset patched branch to parent commit of the first commit
exec(`git reset --hard ${parentCommit}`);

exec(`git checkout -b ${workerBranch}`);

//patch each commits to have desired changes
commits.forEach((commitHash, idx) => {
  console.log(green(`Patching commit ${commitHash}. ${commits.length - idx - 1} commits left.`));

  exec(`git checkout ${workerBranch}`);
  exec(`git reset --hard ${commitHash}`);

  //get all the committed files
  const committedFiles = exec(`git diff-tree --no-commit-id --name-only -r ${commitHash}`).stdout;

  const committedFilesArray = committedFiles.split('\n').filter(file => !!file);

  //evaluate expressions inside command
  const commandToRun = command.replace(/\{{(.*?)}}/g, ($0, $1) => {
    return evaluateExpression(committedFilesArray, $1);
  });

  //run command
  exec(`${commandToRun}`);

  //commit changes on the last commit as single commit
  exec(`git add .`);
  exec('git commit -n --amend -C HEAD');

  const currentCommitHash = getGitStdout('git rev-parse --short HEAD');

  //cherry pick commit on the patched branch
  exec(`git checkout ${patchedBranch}`);
  exec(`git cherry-pick ${currentCommitHash} -X theirs`)

  console.log(green(`Finished patching commit ${commitHash}.`));
});

//apply patches on current branch
exec(`git checkout ${currentBranch}`);

exec(`git reset --hard ${patchedBranch}`);

//delete temprory branch
exec(`git branch -D ${patchedBranch}`);
exec(`git branch -D ${workerBranch}`);

console.log(green(`Finished patching all commits.`));
