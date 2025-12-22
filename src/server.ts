import http from 'http'
import { logger, setHeader } from './middleware.ts'
import { getRequestHandler, postRequestHandler } from './requests.ts';
import statusCode from './statusCodes.ts';


const PORT = process.env.PORT;

const server: http.Server = http.createServer((req, res) =>{
    const url = req.url;
    logger(req,res,() => {
        setHeader(req,res,() => {
            switch (req.method) {
                case 'GET':
                    getRequestHandler(req, res);
                    break;
        
                case 'POST':
                    postRequestHandler(req,res);
                    break;
        
                case 'PUT':
                    break;
        
                case 'DELETE':
                    break;
        
                default:
                    res.writeHead(statusCode.methodNotAllowed,{'content-type': 'application/json'});
                    res.write(JSON.stringify({message: 'Invalid Request Method'}));
                    break;
            }
        })
    })
})

server.listen(PORT,()=>{
    console.log("Server started at localhost: "+PORT);
})