import http from 'http';
import crypto from 'crypto';
import winston from 'winston';
import url from 'url';
import path from 'path';
import send from 'send';
import axios from 'axios';
import config from 'config/config.prod';

const logFile = config.logFile;

const memoryFormat = winston.format((info, opts) => {
    const memoryUsage = process.memoryUsage();
    info.memoryUsage = {
        rss: (memoryUsage.rss / 1024 / 1024).toFixed(2) + ' MB',
        heapTotal: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
        heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
        external: (memoryUsage.external / 1024 / 1024).toFixed(2) + ' MB',
    };

    return info;
});

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        memoryFormat(),
        winston.format.json(),
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({filename: logFile})
    ]
});

const onRequest = (request, response) => {
    const requestPath = url.parse(request.url).pathname;
    const input = requestPath.split('/')[2];
    const payload = Buffer.from(input, 'base64').toString();
    const logID = crypto.createHash('SHA512')
        .update(request.rawHeaders.reduce((a, b) => {return a + b;}) + requestPath + payload)
        .digest('hex')
        .slice(0, 8);
    let payloadObject = {};
    logger.info(`Received payload ${payload}`, {id: logID});

    try {
        payloadObject = JSON.parse(payload);
    } catch (e) {
        logger.error('Cannot parse payload, exiting...', {id: logID});
        return;
    }

    const {linkHash, attachmentHash, attachmentName, auth} = payloadObject;
    const shortHash = attachmentHash.substring(0, 2);
    const attachmentLocation = path.resolve(config.dataLocation, shortHash, attachmentHash);
    logger.info(`OTL Hash ${linkHash} with attachment ${attachmentHash} requested with payload ${payload}`, {id: logID});

    request.socket.on('close', (hadError) => {
        if (hadError) {
            logger.info(`Socket was closed with an error. OTL Hash was ${attachmentHash} with payload ${payload}`, {id: logID});
        }
    });

    send(request, attachmentLocation, {etag: false, cacheControl: false})
        .on('headers', (res) => {
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Content-Disposition', `attachment; filename="${attachmentName}"`);
        })
        .on('end', () => {
            logger.info('Download done', {id: logID});
            axios({
                method: 'POST',
                url: config.apiURL,
                data: {
                    linkHash,
                    auth
                }
            }).then(() => {
                logger.info('Deleted OTL', {id: logID});
            }).catch((err) => {
                logger.error('Could not call API, error message ' + err, {id: logID});
            });
        })
        .on('stream', () => {
            logger.info('Download started', {id: logID});
        })
        .pipe(response);
};

const server = http.createServer(onRequest);

server.listen(3141);
logger.info('Server listening on port 3141');
