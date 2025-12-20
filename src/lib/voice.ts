
import path from 'path';
import { Logger } from 'winston';
import EventEmitter from 'events';

class VoiceClient extends EventEmitter {
	logger: Logger


	constructor(logger: Logger) {
		super();
		this.logger = logger;

		EventEmitter.call(this);
	}

	
}

export default VoiceClient;