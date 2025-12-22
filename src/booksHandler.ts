import http from 'http';
import { authenticationHandler } from './auth.ts';
import { users, books } from './database.ts'
import statusCode from './statusCodes.ts';

const issueBook = (req: http.IncomingMessage, res:http.ServerResponse) => {
    try {
        type data = {
            book_title: string,
        }
        const user = authenticationHandler(req,res);
        if(user){
            req.on('data',async (data) => {
                try{
                    const dataReceived: data = JSON.parse(data);
                    if(dataReceived.book_title){
                        const book = await books.findOne({title: dataReceived.book_title})
                        if(book){
                            const booksUserHave = await users.findOne({uid: user.uid});
                            const booksUserHaveList: [number] = booksUserHave?.issued_books;
                            if(!booksUserHaveList.includes(book.bid)){
                                const op = await users.updateOne({uid: user.uid},{$push: {issued_books: book.bid}});
                                if(op.acknowledged){
                                    res.end(JSON.stringify({
                                        book_issued: book.title,
                                        to_user: user.username,
                                        books_issued: booksUserHaveList.concat(book.bid)
                                    }))
                                }else{
                                    res.statusCode = statusCode.serverError;
                                    throw 'Server Error';
                                }
                            }else{
                                res.statusCode = statusCode.duplicated;
                                throw {
                                    error: `user already have book "${book.title}" having bid of ${book.bid}`,
                                    books_issued: booksUserHaveList
                                }
                            }
                        }else{
                            res.statusCode = statusCode.notFound;
                            throw `Book "${dataReceived.book_title} is not available"`;
                        }
                    }
                } catch (error){
                    res.end(JSON.stringify({
                        error_message: error
                    }))
                }
                
            })
        }
    } catch (error) {
        res.end(JSON.stringify({
            error_message: error
        }))
    }
}

const returnBook = (req: http.IncomingMessage, res: http.ServerResponse) => {
    try {
        type data = {
            book_title: string,
        }
        const user = authenticationHandler(req,res);
        if(user){
            req.on('data',async (data) => {
                try {
                    const dataReceived: data = JSON.parse(data);
                    const book = await books.findOne({title: dataReceived.book_title});
                    if(book){
                        const booksUserHave = await users.findOne({uid: user.uid});
                        const booksUserHaveList: [number] = booksUserHave?.issued_books;
                        if(booksUserHaveList.includes(book.bid)){
                            const ops = await users.updateOne({uid: user.uid},{$pull: {issued_books: book.bid}});
                            if(ops.acknowledged){
                                let booksAfter = await users.findOne({uid: user.uid});
                                booksAfter = booksAfter?.issued_books;
                                res.end(JSON.stringify({
                                        book_returned: book.title,
                                        by_user: user.username,
                                        books_issued: booksAfter
                                    }))
                            }else{
                                res.statusCode = statusCode.serverError;
                                throw 'Server Error';
                            }
                        }else{
                            res.statusCode = statusCode.notFound;
                            throw `User not have book '${dataReceived.book_title}'`;
                        }
                    }
                } catch (error) {
                    res.end(JSON.stringify({error_message: error}));
                }
            })
        }
    } catch (error) {
        res.end(JSON.stringify({error_message: error}));
    }
}

export { issueBook, returnBook };