import http from 'http';
import winston from 'winston';
import url from 'url';
import path from 'path';
import send from 'send';
import axios from 'axios';
import config from 'config/config.prod';

const logFile = config.logFile;

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({filename: logFile})
    ]
});

const onRequest = (request, response) => {
    const requestPath = url.parse(request.url).pathname;
    const input = requestPath.split('/')[1];
    const payload = Buffer.from(input, 'base64').toString();
    const payloadObject = JSON.parse(payload);
    const {linkHash, attachmentHash, attachmentName, auth} = payloadObject;
    const shortHash = attachmentHash.substring(0, 2);
    const attachmentLocation = path.resolve(config.dataLocation, shortHash, attachmentHash);
    logger.info(`OTL Hash ${linkHash} with attachment ${attachmentHash} requested with payload ${payload}`);

    request.socket.on('close', (hadError) => {
        if (hadError) {
            logger.info(`Socket was closed with an error. OTL Hash was ${attachmentHash} with payload ${payload}`);
        }
    });

    send(request, attachmentLocation, {etag: false, cacheControl: false})
        .on('headers', (res) => {
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Content-Disposition', `attachment; filename="${attachmentName}"`);
        })
        .on('end', () => {
            logger.info('Download done');
            axios({
                method: 'POST',
                url: config.apiURL,
                data: {
                    linkHash,
                    auth
                }
            }).catch((err) => {
                logger.error('Could not call API, error message ' + err);
            });
        })
        .on('stream', () => {
            logger.info('Download started');
        })
        .pipe(response);
};

const server = http.createServer(onRequest);

server.listen(3141);
logger.info('Server listening on port 3141');
