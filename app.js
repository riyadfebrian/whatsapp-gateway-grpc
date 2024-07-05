import { promises as fsPromises} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import Whatsapp from 'whatsapp-web.js';
import WhatsappClient  from './services/wa.js';
import 'dotenv/config'

const { MessageMedia } = Whatsapp;

// Define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the path to the proto file
const PROTO_PATH = path.join(__dirname, 'protobufs', 'whatsapp.proto');

const packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
    }
);

const whatsappDefinition = grpc.loadPackageDefinition(packageDefinition).whatsapp;

let WaClient = null;


/**
 * Implements RPC method.
 */
async function sendMessages(call, callback) {
    const message = call.request.message || null;
    const phoneNumber = call.request.phone_number ? `${call.request.phone_number}@c.us` : null;

    if (!phoneNumber) {
        return callback({ 
            code: grpc.status.INVALID_ARGUMENT,
            message: 'Failure: phone number is undefined' 
        });
    }

    if (!message) {
        return callback({ 
            code: grpc.status.INVALID_ARGUMENT,
            message: 'Failure: message must be set' 
        });
    }

    try {
        const Client = WaClient.client;

        if (Client == null) return callback({
            code: grpc.status.UNAVAILABLE,
            message: 'Failure: Server not ready'
        });

        const user = await Client.isRegisteredUser(phoneNumber)

        if (! user ) {
            return callback({
                code: grpc.status.NOT_FOUND,
                status: grpc.status.NOT_FOUND,
                message: 'Failure: user not found'
            });

        } 


        const isSent = await Client.sendMessage(phoneNumber, message)

        if (! isSent) return callback({
            code: grpc.status.ABORTED,
            message: "Failure"
         });


        return callback(null, {
            code: grpc.status.OK,
            message: 'Success'
        });

        
        
    } catch {
        console.log("Error when Sending message")
        return callback({
            code: grpc.status.INTERNAL,
            message: 'Failure'});
    }

  }


async function sendMessagesWithAttachments(call, callback) {
    const message = call.request.message || null;
    const phoneNumber = call.request.phone_number ? `${call.request.phone_number}@c.us` : null;
    const attachmentFile = call.request.attachment ? path.join(__dirname, call.request.attachment) : null;

    if (!phoneNumber) {
        return callback({ 
            code: grpc.status.INVALID_ARGUMENT,
            message: 'Failure: phone number is undefined' 
        });
    }

    if (!attachmentFile ) {
        return callback({ 
            code: grpc.status.INVALID_ARGUMENT,
            message: 'Failure: attachment file is undefined' 
        }); 
    } 

    const fileStats = await fsPromises.stat(attachmentFile);
    const isFile = fileStats.isFile();
    if (!isFile) return callback({ 
        code: grpc.status.NOT_FOUND,
        message: 'Failure: Attachment is not a file' 
    })

    const fileSizeInMB = fileStats.size / (1024 * 1024);
    if (fileSizeInMB > 30) return callback({ 
        code: grpc.status.FAILED_PRECONDITION,
        message: 'Failure: Attachment too large' 
    })


    try {
        const Client = WaClient.client;

        if (Client == null) return callback({
            code: grpc.status.UNAVAILABLE,
            message: 'Failure: Server not ready'
        });

        const user = await Client.isRegisteredUser(phoneNumber)

        if (! user ) {
            callback({
                code: grpc.status.NOT_FOUND,
                message: 'Failure: user not found'
            });

        } else {
            const media = MessageMedia.fromFilePath(attachmentFile);

            if (message) await Client.sendMessage(phoneNumber, message);

            const isSent = await Client.sendMessage(phoneNumber, media);

            if (! isSent) return callback({
                code: grpc.status.ABORTED,
                message: "Failure"
            });

            return callback(null, {
                code: grpc.status.OK,
                message: 'Success'
            });

        }
        
    } catch {
        console.log("Error when Sending message")
        return callback(null, {
            code: grpc.status.INTERNAL,
            message: 'Failure'});
    }

  }



/**
 * Starts an RPC server that receives requests for the services.
 */

const constructServer = async () => {
    const server = new grpc.Server();
    
    server.addService(
        whatsappDefinition.WhatsAppService.service, {
            sendMessages,
            sendMessagesWithAttachments
        
        }
    )

    return server;

}

async function startWhatsappClient() {
    // Setup Whatsapp Agent
    const whatsappClient = new WhatsappClient();

    try {
        await whatsappClient.createClientConnection();
        console.log('WhatsApp client initialized and ready.');
        return whatsappClient
    } catch (error) {
        console.error('Error initializing WhatsApp client:', error);
        throw error;
    }
}


const main = async () => {

    WaClient = await startWhatsappClient();
   
    const routeServer = await constructServer();

    routeServer.bindAsync(
        `${process.env.GRPC_HOST}:${process.env.GRPC_PORT}`, 
        grpc.ServerCredentials.createInsecure(), (err, port) => {

    if (err != null) return console.error(err);

        console.log(`gRPC listening on ${port}`)


    });

}


main();

