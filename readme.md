## Simple NodeJS Bankend

It is a simple library management system backend built using vanilla NodeJS that uses Mongodb as its database and Docker for its containerisation.

For authentication and authorisation [JSON Web Token](https://www.npmjs.com/package/jsonwebtoken) are used.

### How to run using docker:

- Make sure docker desktop is installed on your system.
  
- Open the cloned repository directory in terminal .
  
- Use the following docker commands
  
    - start docker desktop (If you haven’t already): ``` docker desktop start ```
      
    - Build and start mongodb and nodejs backend containers using: ``` docker compose up -d ```
      
- Wait a little and once the setup is finished, check if the containers are running: ``` docker ps ```
  
- Now go to the browser and type: http://localhost:8000
  
    - You should get this response if the containers are running properly:
      ###
    ```JSON
    {
      "node_backend_message": "NodeJS+Monogdb server running."
    }
    ```