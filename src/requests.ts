import http from 'http'
import statusCode from './statusCodes.ts';
import { authenticationHandler } from './auth.ts';
import { books, users } from './database.ts';
import { signUpHandler, loginHandler, logoutHandler, searchUser, deleteUser } from './userhandler.ts';
import { issueBook,returnBook } from './booksHandler.ts';

//GET request handler
let getRequestHandler = async (req: http.IncomingMessage,res: http.ServerResponse) =>{
    let url: string[] | undefined = req.url?.split('/');
    if(url != undefined){
        try {            
            const [_, route, resource] = url;
            if(url.length === 2){
                if(route === ''){
                    res.end(JSON.stringify({node_backend_message: 'NodeJS+Monogdb server running.'}))
                }
                else if(route === 'books'){
                    const user = authenticationHandler(req,res);
                    if(user){
                        const data = await books.find().toArray();
                        res.statusCode = statusCode.ok;
                        res.end(JSON.stringify(data));
                    }
                }else if(route === 'profile'){
                    const loggedInUser = authenticationHandler(req,res);
                    if(loggedInUser){
                        const user = await users.findOne({uid: loggedInUser.uid});
                        if(user){
                            res.end(JSON.stringify({
                                uid: user.uid,
                                username: user.username,
                                issued_books: user.issued_books
                            }))
                        }
                    }
                }else{
                    res.statusCode = statusCode.notFound;
                    throw 'Invalid URL';
                }
            }else if(url.length === 3){
                if(url[1] === 'books' && !isNaN(parseInt(url[2]))){
                    const user = authenticationHandler(req,res);

                    if(user){
                        const bid:number = parseInt(url[2]);
                        const data = await books.findOne({bid:bid});
                        
                        if(data === null){ throw 'Data Not Found' };
    
                        res.statusCode = statusCode.ok
                        res.end(JSON.stringify(data));
                    }
                }else{
                    res.statusCode = statusCode.notFound;
                    throw 'Invalid URL';
                }
            }else{
                res.statusCode = statusCode.notFound;
                throw 'Invalid URL';
            }
        } catch (error) {
            res.end(JSON.stringify({error_message: error}));
        }
    }
}


//POST request handler
const postRequestHandler = async (req: http.IncomingMessage, res: http.ServerResponse) =>{
    let url: string[] | undefined = req.url?.split('/');    
    if(url != undefined){
        try {
            let [_, route, resource] = url;
            if(url.length === 2){
                switch (route) {
                    case 'login':
                        loginHandler(req,res);
                        break;

                    case 'signup':
                        signUpHandler(req,res);
                        break;

                    case 'logout':
                        logoutHandler(req,res);
                        break;

                    case 'issue':
                        issueBook(req,res);
                        break;

                    case 'return':
                        returnBook(req,res);
                        break;

                    default:
                        res.statusCode = statusCode.notFound;
                        throw 'Invalid URL';
                        break;
                }
            }else if (url.length === 3){
                const onlyNumberRegEx = /^\d+$/;
                const isValidUsername = /^[a-z0-9._]+$/;
                switch (route){
                    case 'user':
                        await searchUser(req,res);
                        break;
                    case 'delete':
                        if(resource === 'user'){
                            await deleteUser(req,res);
                        }else{
                            res.statusCode = statusCode.notFound;
                            throw 'Invalid url';
                        }
                        break;
                    default:
                        res.statusCode = statusCode.notFound;
                        throw 'Invalid URL';
                        break;
                }
            }else{
                res.statusCode = statusCode.notFound;
                throw 'Invalid URL';
            }
        } catch (error) {
            res.end(JSON.stringify({Error_message: error}));
        }
    }
}

export {getRequestHandler, postRequestHandler};