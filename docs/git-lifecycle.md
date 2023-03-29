-- Just for sharing Git lifecycle, hope useful for our teamwork to reduce conflicts
and good control source code next time:
(There are many ways to rebase/merge and commit, we can implement this way for fast process on develop branch directly)

1. Before you implement a new feature
From develop branch,
$ git pull origin develop

2. Implement the feature and review (done) + Stash code
$ git add .
$ git stash                     // store code in stash

3. Pull the latest code from develop
$ git pull origin develop

4. Take code from stash out and resolve conflicts (if any) + commit code
$ git stash pop
$ git commit -a -m "feat: implement abc"

5. Push code to develop again to sync remote repository
$ git push origin develop

=> Finish + and do same with other features
