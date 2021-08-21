# Kyrix-J Installation

* Checkout the `kyrixj` branch of the kyrix repo:
  ```
  git checkout kyrixj
  ```

* Use this command to start the Kyrix docker containers (using port 5433 is important):
  ```
  sudo ./run-kyrix.sh --build --dbport 5433
  ```
  
* Load `mondial.sql` into kyrix db (using `load-sql.sh` provided by Kyrix):
  ```
  sudo ./docker-scripts/load-sql.sh <path to mondial.sql>
  ```

* Now, go to the Kyrix-J repo. Replace the IP address in [this line](https://github.com/tracyhenry/Kyrix-J/blob/fb89ed82f4d37b6f85514f613d1bf4d0a78965f6/client/src/js/KyrixVis.js#L11) with your own ip address. This ip can also be `localhost` if client and server are both on your own machine. 

* Set env variable `KYRIXJ_PROJECT` to `mondial`:
  ```
  export KYRIXJ_PROJECT=mondial
  ```
   Or to do it permanently you can add it as one line in `~/.bashrc`

* Install latest node and npm, and run `npm i` under three folders: `authoring/`, `client/` and `client/auto-complete`

* Make a new directory for the auto-generated Kyrix app, and copy the Kyrix compile script into it:
  ```
  mkdir authoring/apps/mondial/output/
  cp ../Kyrix/docker-scripts/compile.sh authoring/apps/mondial/output/compile.sh
  cd authoring/apps/mondial/output/ && chmod +x compile.sh
  ```
* Under `authoring`, run `npm start`. This will generate a Kyrix app, loads it into the kyrix backend and also generates some metadata stuff for the frontend.

* Under `client/auto-complete`, run `npm start`. This is the Kyrix-J middleware (backend) used only for search queries under dev mode. In prod mode, this will also serve the React production build. 

* Under `client/`, run `npm start` to start the frontend. 

* Go to `<ip>:3000` to see the app. 
   
