import {Context} from 'aws-lambda';

interface ContextOptions {
	region?: string;
	account?: string;
	alias?: string;
	functionName?: string;
	functionVersion?: string;
	memoryLimitInMB?: string;
	timeout?: number;
}

declare var mockContext: {
	(options?: ContextOptions): Context;
};

export = mockContext;
