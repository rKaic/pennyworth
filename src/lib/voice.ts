import { Logger } from 'winston';
import EventEmitter from 'events';
import http from 'http';
import { Server as IOServer, Socket as IOSocket } from 'socket.io';

class VoiceClient extends EventEmitter {
	logger: Logger;
	private httpServer?: http.Server;
	private io?: IOServer;
	private sockets: Set<IOSocket> = new Set();


	constructor(logger: Logger) {
		super();
		this.logger = logger;
	}

	private handleIncoming(raw: unknown) {
		try {
			let payload: any = null;

			// If raw is a string, try to parse JSON; otherwise treat as text
			if (typeof raw === 'string') {
				try { payload = JSON.parse(raw); } catch { /* not JSON */ }
			} else if (raw && typeof raw === 'object') {
				payload = raw;
			}

			// Accept either { event: 'speech', ... } or { type: 'speech', ... }
			if (payload && (payload.event === 'speech' || payload.type === 'speech') && typeof payload.text === 'string') {
				// If the sender provides a "final" flag, only emit on final=true (ignore interim).
				if (payload.final === undefined || payload.final === true) {
					const text = payload.text;
					this.logger.info(`Recognized speech: ${text}`);
					this.emit('voiceCommand', text);
				} else {
					this.logger.info(`Interim speech received (ignored): ${payload.text}`);
				}
				return;
			}

			// If payload has a text field, use it
			if (payload && typeof payload.text === 'string') {
				this.logger.info(`Recognized speech: ${payload.text}`);
				this.emit('voiceCommand', payload.text);
				return;
			}

			// Fallback: treat entire message as text (stringify objects)
			let text = '';
			if (typeof raw === 'string') text = raw;
			else if (raw !== undefined && raw !== null) {
				try { text = JSON.stringify(raw); } catch { text = String(raw); }
			}

			if (text && text.length) {
				this.logger.info(`Recognized speech: ${text}`);
				this.emit('voiceCommand', text);
			}
		} catch (err) {
			this.logger.error('Error handling voice message', err);
		}
	}

	// Start the socket.io receiver for voice input
	async start(port = 9002) {
		if (this.io) return;

		this.httpServer = http.createServer();
		this.httpServer.listen(port, () => {
			this.logger.info(`Voice HTTP server started on port ${port}`);
		});
		this.httpServer.on('error', (err) => this.logger.error('Voice HTTP server error', err));

		this.io = new IOServer(this.httpServer, {
			cors: { origin: '*' }
		});
		this.logger.info(`Voice socket.io server created on port ${port}`);

		this.io.on('connection', (socket: IOSocket) => {
			this.logger.info(`Voice client connected: ${socket.id}`);
			this.sockets.add(socket);

			const onData = (data: unknown) => {
				this.logger.info(`Voice message received from ${socket.id}: ${typeof data === 'string' ? data : '[object]'}`);
				this.handleIncoming(data);
			};

			socket.on('message', onData);
			socket.on('speech', onData);
			// catch-all for other event names which may carry payloads
			socket.onAny((event, ...args) => {
				if (event === 'speech' || event === 'message') return;
				if (args.length > 0) onData(args.length === 1 ? args[0] : args);
			});

			socket.on('disconnect', () => {
				this.sockets.delete(socket);
				this.logger.info('Voice client disconnected');
			});
			socket.on('error', (err) => {
				this.sockets.delete(socket);
				this.logger.info('Voice client error and disconnected');
				this.logger.error(err);
			});
		});
	}

	// Stop the receiver and free resources.
	stop() {
		if (!this.io && !this.httpServer) return;

		// Disconnect all connected sockets
		for (const s of this.sockets) {
			try { s.disconnect(true); } catch { /* ignore */ }
		}
		this.sockets.clear();

		// Close socket.io server
		if (this.io) {
			try { this.io.close(); } catch (err) { this.logger.error('Error closing socket.io server', err); }
			this.io = undefined;
		}

		// Close HTTP server
		if (this.httpServer) {
			const server = this.httpServer;
			this.httpServer = undefined;
			server.close((err) => {
				if (err) this.logger.error('Error closing Voice HTTP server', err);
				else this.logger.info('Voice HTTP server stopped');
			});
		}
	}
}

export default VoiceClient;