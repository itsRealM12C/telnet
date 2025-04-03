const WebSocket = require('ws');
const net = require('net');

const wss = new WebSocket.Server({ port: 3000 });

wss.on('connection', (ws) => {
    let telnetSocket = null;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.action === 'connect') {
                telnetSocket = new net.Socket();
                telnetSocket.connect(data.port, data.ip, () => {
                    // Send credentials automatically
                    if (data.username) {
                        setTimeout(() => {
                            telnetSocket.write(data.username + '\n');
                            if (data.password) {
                                setTimeout(() => {
                                    telnetSocket.write(data.password + '\n');
                                }, 300);
                            }
                        }, 500);
                    }
                });

                telnetSocket.on('data', (data) => {
                    ws.send(JSON.stringify({
                        type: 'output',
                        content: data.toString()
                    }));
                });

                telnetSocket.on('close', () => {
                    ws.send(JSON.stringify({
                        type: 'status',
                        content: 'DISCONNECTED'
                    }));
                });

            } else if (data.action === 'disconnect') {
                if (telnetSocket) telnetSocket.end();
            } else if (data.type === 'input') {
                if (telnetSocket) telnetSocket.write(data.data + '\n');
            }
        } catch (err) {
            console.error('Error:', err);
        }
    });

    ws.on('close', () => {
        if (telnetSocket) telnetSocket.end();
    });
});

console.log('Telnet proxy running on ws://localhost:3000');
