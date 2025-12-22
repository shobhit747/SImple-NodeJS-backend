import http from 'http'
import { books, users } from './database.ts'
import jwt from 'jsonwebtoken'
import statusCode from './statusCodes.ts'

const SECRET = process.env.SECRET as string;

const authenticationHandler = (req:http.IncomingMessage,res: http.ServerResponse) =>{
    try{
        type Payload = {
            uid: number,
            username: string,
            iat: number
        }
        const [_,jwtToken] = req.headers.cookie?.toString().split('=') as [string,string];
        let payload = jwt.verify(jwtToken,SECRET);        
        return payload as Payload;
    }catch (error){
        res.statusCode = statusCode.forbidden;
        res.writeHead(statusCode.forbidden);
        throw {
            error_message: `${req.url} need authentication.`,
            login_url: '/login'
        }
    }
}


const permissionHandler = async (req: http.IncomingMessage, res:http.ServerResponse, next: any) => {
    try {
        const authorizedRoles = ['admin', 'super'];
        const loggedInUserPayload = authenticationHandler(req,res);
        const loggedInUser = await users.findOne({uid: loggedInUserPayload.uid});
        
        if(loggedInUser?.type && authorizedRoles.includes(loggedInUser.type)){
            next(true);
        }else{
            throw `Only Admin and Super users can use ${req.url}`;
        }
    } catch (error) {
        throw {error: error}
    }
}

export {authenticationHandler, permissionHandler};