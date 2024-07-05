import qrcode from 'qrcode-terminal';
import Whatsapp from 'whatsapp-web.js';
const { Client, LocalAuth } = Whatsapp

class WhatsappClient {

    constructor() {
        this.client = null;
        this.clientReady = false;
    }

    setClient(client) {
        if (client) {
          this.client = client;
        } else {
          console.log("setClient: Client inexistente!");
        }
      }
    
    setReadyClient(state) {
        this.clientReady = state;
    }

    async createClientConnection() {
        try {
            const WaClient = new Client({
                authStrategy: new LocalAuth(),
                puppeteer: {
                    headless: true,
                    args: ['--no-sandbox'],
                    timeout: 1200000,
                    // executablePath: '/path/to/Chrome',
                }
            });

            // When the client received QR-Code
            WaClient.on('qr', (qr) => {
                qrcode.generate(qr, { small: true } );
            });

            WaClient.on('authenticated', () => {
                console.log("Authenticated")
            });

            // Start Whatsapp client
            await WaClient.initialize();

            WaClient.once('ready', async () => {
                const version = await WaClient.getWWebVersion();
                console.log(`Whatsapp Web v${version}`);

                this.setClient(WaClient);
                this.setReadyClient(true);

            });

            WaClient.once('disconnected', (reason) => {
                console.log(`Whatsapp client disconnected: ${reason}`);
                this.setClient(null);
                this.setReadyClient(false);
            });

        } catch {
            console.error('Error initializing WhatsApp client:', error);
            throw error;
        }


    }

}



export default WhatsappClient;