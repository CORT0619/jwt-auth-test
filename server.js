const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const router = express.Router()
const util = require('util');
const https = require('https');
const fs = require('fs');


const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(cookieParser());

/* set up the port */
const port = process.env.PORT || 3000;
const privateKey = 'shhhh';


router.post('/login', (req, res, next) => {
    // console.log(util.inspect(req));
    const body = req.body;
    
    if (body.login && body.password) {
        return signJWT(body.login).then((token) => {
            return res.cookie('jwtToken', token, {
                httpOnly: true,
                secure: false
            }).status(200).send('ok');
        });
    }
    res.status(400).send('invalid login');
});

router.post('/check-auth', (req, res, next) => {
    if (!req.cookies.jwtToken) {
        return next(new Error('jwtToken not available.'));
    }
    return verifyJWT(req.cookies.jwtToken).then((result) => {
        return res.send(result);
    }, (err) => {
        console.log('err ', err);
        next(err);
    });
});

app.use(router);

/* error handling */
app.use((err, req, res, next) => {
    res.status(500).send('something went wrong');
});

app.listen(port, () => {
    console.log('listening on port %d', port);
});

/* setup JWT token */
function signJWT(login) {
    return new Promise(async (resolve, reject) => {
        const payload = {};
        
        payload.login = login;

        try {
            const data = await readKeys('private.key');
            return jwt.sign(payload, data, { expiresIn: '1h', algorithm: 'RS256' }, (err, token) => {
                if (err) return reject(err);
                return resolve(token);
            });
        } catch (e) {

        }

    });
}

function readKeys(key) {
    return new Promise((resolve, reject) => {
        fs.readFile(`keys/${key}`, 'utf8', (err, data) => {
            if (err) return reject(err);

            return resolve(data);
        });
    });
}

/* verify jwt token */
function verifyJWT(token) {
    return new Promise(async (resolve, reject) => {
        try {
            const data = await readKeys('public.key');
            jwt.verify(token, data, (err, decoded) => {
                if (err) {
                    console.log('error', err);
                    return reject(err);
                }
                return resolve('matched!');
            });
        } catch(e) {
            console.error(e);
        }
    });
}