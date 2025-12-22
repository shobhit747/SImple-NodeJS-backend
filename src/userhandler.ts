import http from 'http'
import { users } from './database.ts'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import { authenticationHandler, permissionHandler } from './auth.ts'
import statusCode from './statusCodes.ts'

const SECRET = process.env.SECRET as string;

//create SHA256 hash string
const makeHash = (stringToHash: string) => {
    const hashedString = crypto.createHash('SHA256').update(stringToHash).digest('hex');
    return hashedString
}

const signUpHandler = (req: http.IncomingMessage, res: http.ServerResponse) => {
    type User = {
        uid: number,
        username: string,
        password: string,
        type?: string
    };
    let user: User;
    req.on('data', async (data)=> {
        try {
            user = JSON.parse(data);
            if(user.username && user.password){
                const hashedPassword = makeHash(user.password);
                const isValidUsername = /^[a-z0-9._]+$/;
                let uid: number;
                if(isValidUsername.test(user.username)){
                    const lastUser = (await users.find({},{sort:{uid:-1},limit:1}).toArray()).at(0);
                    if(lastUser != undefined){
                        uid = lastUser.uid + 1;
                    }else{
                        uid = 1;
                    }
                    //only super user can make an admin user
                    let newUser: User;
                    newUser = {uid: uid, username: user.username,password: hashedPassword}
                    if(user.type && user.type === 'admin'){
                        const loggedInUser = authenticationHandler(req,res);
                        if(loggedInUser){
                            const isLoggedInUserSuper = await users.findOne({uid: loggedInUser.uid});
                            if(isLoggedInUserSuper?.type === 'super'){
                                newUser = {...newUser, type:user.type}
                                const userInsertOp = await users.insertOne(newUser)
                                .then(()=>{
                                    res.end(JSON.stringify({
                                                new_user_created: true,
                                                username: user.username,
                                                type:user.type,
                                                login_url: '/login'
                                            }))
                                }).catch((error)=>{
                                    res.statusCode = statusCode.duplicated;
                                    throw 'Try different username.'
                                })
                            }else{
                                res.statusCode = statusCode.forbidden;
                                throw 'Only User with \'super\' can create user with type \'admin\'.'   
                            }
                        }
                        // return ;
                    }
                    
                    const userInsertOp = await users.insertOne(newUser).then(()=>{
                        res.end(
                            JSON.stringify({
                                new_user_created: true,
                                username: user.username,
                                login_url: '/login'
                            })
                        )
                    }).catch((error)=>{
                        res.statusCode = statusCode.duplicated;
                        throw 'Try different username.'
                    })
                }else{
                    res.statusCode = statusCode.badRequest;
                    throw 'Invalid username, only lowercase letters, numbers, dot(.) and underscore(_) are allowed';
                }
            }else{
                res.statusCode = statusCode.badRequest;
                throw 'Invalid Login Request'
            }
        } catch (error) {
            res.end(JSON.stringify({error_message: error}))
        }
    })
}

const loginHandler = async (req: http.IncomingMessage,res: http.ServerResponse) => {
    type User = {
        uid: number,
        username: string,
        password: string
    };
    let receivedUserData: User;
    req.on('data', async (data)=> {
        try{
            receivedUserData = JSON.parse(data);
            let user = await users.findOne({username: receivedUserData.username})
            
            if(user && user.password === makeHash(receivedUserData.password)){
                const tokenAge = Math.floor(Date.now() / 1000) + (60 * 60);
                let token = jwt.sign({uid: user.uid, username: user.username},SECRET,{algorithm: 'HS256'})
                let cookie = `token=${token}; HttpOnly; Secure; Max-Age=${tokenAge}; path=/`
                res.setHeader('set-cookie',cookie);
                res.end(JSON.stringify({loginSuccessful: true, username: user.username}))
            }else{
                res.statusCode = statusCode.notFound;
                res.end(JSON.stringify({loginSuccessful: false, errorMessage: 'User Not Found', signupUrl: '/signup'}));
            }
        } catch (error){
            res.end(JSON.stringify({error: error}));
        }
    })
}

const logoutHandler = (req:http.IncomingMessage, res:http.ServerResponse) => {
    res.setHeader('set-cookie','token=; max-age=0; HttpOnly; Secure; path=/');
    res.end(JSON.stringify({
        message: 'logged out'
    }))
}

const searchUser = async (req: http.IncomingMessage ,res: http.ServerResponse) => {
    const onlyNumberRegEx = /^\d+$/;
    const isValidUsername = /^[a-z0-9._]+$/;
    let url: string[] | undefined = req.url?.split('/');   
    if(url != undefined){
        let [_, route, resource] = url
        await permissionHandler(req,res,async (isAuthorized: boolean) => {
            //search by id
            let user;
            if(onlyNumberRegEx.test(resource)){
                user = await users.findOne({uid: parseInt(resource)});
            }
            //search by username
            else if(isValidUsername.test(resource)){
                user = await users.findOne({username: resource});
            }
            if(user){
                res.end(JSON.stringify(user));
            }else{
                res.statusCode = statusCode.notFound;
                res.end(JSON.stringify({error: 'User Not Found'}));
            }
        })
    } 
}

const deleteUser = async (req: http.IncomingMessage ,res: http.ServerResponse) => {
    type data = {
        username?: string,
        uid?: number
    }
    try {
        await permissionHandler(req,res,(isAuthorized: boolean) => {
            if(isAuthorized){
                req.on('data',async (data) => {
                    try {
                        const receivedData: data = JSON.parse(data);
                        if(receivedData.uid){
                            let deletOps = await users.findOneAndDelete({uid: receivedData.uid});
                            if(deletOps){
                                res.statusCode = statusCode.ok;
                                res.end(JSON.stringify({
                                    user_deleted: deletOps.username,
                                    uid: deletOps.uid
                                }))
                            }else{
                                res.statusCode = statusCode.serverError;
                                throw 'Server Error';
                            }
                        }else if(receivedData.username){
                            let deletOps = await users.findOneAndDelete({username: receivedData.username});
                            if(deletOps){
                                res.statusCode = statusCode.ok;
                                res.end(JSON.stringify({
                                    user_deleted: deletOps.username,
                                    uid: deletOps.uid
                                }))
                            }else{
                                res.statusCode = statusCode.serverError;
                                throw 'Server Error';
                            }
                        }else{
                            res.statusCode = statusCode.badRequest;
                            throw 'Invalid data format';
                        }
                    } catch (error) {
                        res.end(JSON.stringify({error_message: error}));
                    }
                })
            }
        });
    } catch (error) {
        res.end(JSON.stringify({error_message: error}))
    }
}

export { signUpHandler, loginHandler, logoutHandler, searchUser, deleteUser };