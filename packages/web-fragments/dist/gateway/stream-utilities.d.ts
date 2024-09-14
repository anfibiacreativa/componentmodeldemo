/**
 * Generates a stream which wraps a provided stream into two strings.
 *
 * For example given the two strings 'start' and 'end' and the stream
 * _s_ it generates a stream which emits 'start', all the chunks of
 * _s_ and then 'end'
 *
 * @param preStream the string to emit before the stream content
 * @param postStream the string to emit after the stream content
 * @param stream the stream to wrap
 * @returns a new stream
 */
export declare function wrapStreamInText(preStream: string, postStream: string, stream: ReadableStream<Uint8Array>): ReadableStream;
/**
 * Transforms a stream by applying the provided transformerFn on each chunk.
 *
 * @param stream the input stream to be transformed
 * @param transformerFn the function to be applied to each chunk
 * @returns a transformed stream
 */
export declare function transformStream(stream: ReadableStream<Uint8Array>, transformerFn: (str: string) => string): ReadableStream<any>;
/**
 * Generates a stream which is the result of the concatenation of different
 * streams, meaning that it generates a stream which emits in order all
 * the chunks emitted by the provided streams.
 *
 * @param streams the streams to concatenate
 * @returns a new stream
 */
export declare function concatenateStreams(streams: ReadableStream[]): ReadableStream;
