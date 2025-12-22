import http from 'http'


//logger middleware
const logger = (req: http.IncomingMessage,res: http.ServerResponse,next: any) =>{
    next();
    console.log(`${res.statusCode} ${req.method} ${req.url}`);
}
//header middleware
const setHeader = (req: http.IncomingMessage,res: http.ServerResponse,next: any) =>{
    let headers = new Map([
        ['content-type','application/json'],
    ])
    res.setHeaders(headers);
    next();
}

export {logger, setHeader};
