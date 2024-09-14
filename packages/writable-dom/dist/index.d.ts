declare type Writable = {
    write(html: string): void;
    abort(err: Error): void;
    close(): Promise<void>;
};
declare const _default: {
    (target: ParentNode, previousSibling?: ChildNode | null | undefined): Writable;
    new (target: ParentNode, previousSibling?: ChildNode | null | undefined): WritableStream<string>;
};
export = _default;
