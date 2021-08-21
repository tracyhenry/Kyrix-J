# Kyrix-J Installation

1. Use this command to start the Kyrix docker containers (using port 5433 is important):
```
sudo ./run-kyrix.sh --build --dbport 5433
```
  
2. Load `mondial.sql` into kyrix db (using `load-sql.sh` provided by Kyrix):
```
./load-sql.sh <path to mondial.sql>
```

3. Replace this ip address with your own ip address in [this line](https://github.com/tracyhenry/Kyrix-J/blob/fb89ed82f4d37b6f85514f613d1bf4d0a78965f6/client/src/js/KyrixVis.js#L11). This ip can also be `localhost` if client and server are both on your own machine. 

4. Set env variable KYRIXJ_PROJECT to `mondial`:
```
export KYRIXJ_PROJECT=mondial
```

4. Under `authoring`, run `npm start`. This will generates a Kyrix app, loads it into the kyrix backend and also generates some metadata stuff for the frontend.

5. Under `client/auto-complete`, run `npm start`. This is the Kyrix-J middleware (backend) used only for search queries under dev mode. In prod mode, this will also serve the React production build. 

6. Under `client/`, run `npm start` to start the frontend. 
   
