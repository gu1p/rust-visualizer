import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace visualizer. */
export namespace visualizer {

    /** Properties of a Graph. */
    interface IGraph {

        /** Graph name */
        name?: (string|null);

        /** Graph nodes */
        nodes?: (visualizer.INode[]|null);

        /** Graph edges */
        edges?: (visualizer.IEdge[]|null);

        /** Graph diagnostics */
        diagnostics?: (string[]|null);

        /** Graph fileCount */
        fileCount?: (number|null);
    }

    /** Represents a Graph. */
    class Graph implements IGraph {

        /**
         * Constructs a new Graph.
         * @param [properties] Properties to set
         */
        constructor(properties?: visualizer.IGraph);

        /** Graph name. */
        public name: string;

        /** Graph nodes. */
        public nodes: visualizer.INode[];

        /** Graph edges. */
        public edges: visualizer.IEdge[];

        /** Graph diagnostics. */
        public diagnostics: string[];

        /** Graph fileCount. */
        public fileCount: number;

        /**
         * Encodes the specified Graph message. Does not implicitly {@link visualizer.Graph.verify|verify} messages.
         * @param message Graph message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: visualizer.IGraph, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Graph message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Graph
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): visualizer.Graph;

        /**
         * Gets the default type url for Graph
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a Node. */
    interface INode {

        /** Node id */
        id?: (string|null);

        /** Node name */
        name?: (string|null);

        /** Node qualifiedName */
        qualifiedName?: (string|null);

        /** Node kind */
        kind?: (string|null);

        /** Node file */
        file?: (string|null);

        /** Node line */
        line?: (number|null);

        /** Node endLine */
        endLine?: (number|null);

        /** Node source */
        source?: (string|null);

        /** Node documentation */
        documentation?: (string|null);

        /** Node detail */
        detail?: (string|null);

        /** Node parent */
        parent?: (string|null);

        /** Node isAsync */
        isAsync?: (boolean|null);

        /** Node entryPoint */
        entryPoint?: (boolean|null);

        /** Node targetId */
        targetId?: (string|null);
    }

    /** Represents a Node. */
    class Node implements INode {

        /**
         * Constructs a new Node.
         * @param [properties] Properties to set
         */
        constructor(properties?: visualizer.INode);

        /** Node id. */
        public id: string;

        /** Node name. */
        public name: string;

        /** Node qualifiedName. */
        public qualifiedName: string;

        /** Node kind. */
        public kind: string;

        /** Node file. */
        public file: string;

        /** Node line. */
        public line: number;

        /** Node endLine. */
        public endLine: number;

        /** Node source. */
        public source: string;

        /** Node documentation. */
        public documentation: string;

        /** Node detail. */
        public detail: string;

        /** Node parent. */
        public parent: string;

        /** Node isAsync. */
        public isAsync: boolean;

        /** Node entryPoint. */
        public entryPoint: boolean;

        /** Node targetId. */
        public targetId: string;

        /**
         * Encodes the specified Node message. Does not implicitly {@link visualizer.Node.verify|verify} messages.
         * @param message Node message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: visualizer.INode, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Node message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Node
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): visualizer.Node;

        /**
         * Gets the default type url for Node
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an Edge. */
    interface IEdge {

        /** Edge from */
        from?: (string|null);

        /** Edge to */
        to?: (string|null);

        /** Edge kind */
        kind?: (string|null);

        /** Edge label */
        label?: (string|null);
    }

    /** Represents an Edge. */
    class Edge implements IEdge {

        /**
         * Constructs a new Edge.
         * @param [properties] Properties to set
         */
        constructor(properties?: visualizer.IEdge);

        /** Edge from. */
        public from: string;

        /** Edge to. */
        public to: string;

        /** Edge kind. */
        public kind: string;

        /** Edge label. */
        public label: string;

        /**
         * Encodes the specified Edge message. Does not implicitly {@link visualizer.Edge.verify|verify} messages.
         * @param message Edge message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: visualizer.IEdge, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an Edge message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Edge
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): visualizer.Edge;

        /**
         * Gets the default type url for Edge
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a Session. */
    interface ISession {

        /** Session aiEnabled */
        aiEnabled?: (boolean|null);

        /** Session provider */
        provider?: (string|null);

        /** Session model */
        model?: (string|null);

        /** Session token */
        token?: (string|null);
    }

    /** Represents a Session. */
    class Session implements ISession {

        /**
         * Constructs a new Session.
         * @param [properties] Properties to set
         */
        constructor(properties?: visualizer.ISession);

        /** Session aiEnabled. */
        public aiEnabled: boolean;

        /** Session provider. */
        public provider: string;

        /** Session model. */
        public model: string;

        /** Session token. */
        public token: string;

        /**
         * Encodes the specified Session message. Does not implicitly {@link visualizer.Session.verify|verify} messages.
         * @param message Session message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: visualizer.ISession, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Session message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Session
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): visualizer.Session;

        /**
         * Gets the default type url for Session
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a Turn. */
    interface ITurn {

        /** Turn role */
        role?: (string|null);

        /** Turn text */
        text?: (string|null);
    }

    /** Represents a Turn. */
    class Turn implements ITurn {

        /**
         * Constructs a new Turn.
         * @param [properties] Properties to set
         */
        constructor(properties?: visualizer.ITurn);

        /** Turn role. */
        public role: string;

        /** Turn text. */
        public text: string;

        /**
         * Encodes the specified Turn message. Does not implicitly {@link visualizer.Turn.verify|verify} messages.
         * @param message Turn message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: visualizer.ITurn, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Turn message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Turn
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): visualizer.Turn;

        /**
         * Gets the default type url for Turn
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ChatRequest. */
    interface IChatRequest {

        /** ChatRequest question */
        question?: (string|null);

        /** ChatRequest selectedIds */
        selectedIds?: (string[]|null);

        /** ChatRequest history */
        history?: (visualizer.ITurn[]|null);
    }

    /** Represents a ChatRequest. */
    class ChatRequest implements IChatRequest {

        /**
         * Constructs a new ChatRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: visualizer.IChatRequest);

        /** ChatRequest question. */
        public question: string;

        /** ChatRequest selectedIds. */
        public selectedIds: string[];

        /** ChatRequest history. */
        public history: visualizer.ITurn[];

        /**
         * Encodes the specified ChatRequest message. Does not implicitly {@link visualizer.ChatRequest.verify|verify} messages.
         * @param message ChatRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: visualizer.IChatRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ChatRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ChatRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): visualizer.ChatRequest;

        /**
         * Gets the default type url for ChatRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a TourStep. */
    interface ITourStep {

        /** TourStep nodeId */
        nodeId?: (string|null);

        /** TourStep explanation */
        explanation?: (string|null);
    }

    /** Represents a TourStep. */
    class TourStep implements ITourStep {

        /**
         * Constructs a new TourStep.
         * @param [properties] Properties to set
         */
        constructor(properties?: visualizer.ITourStep);

        /** TourStep nodeId. */
        public nodeId: string;

        /** TourStep explanation. */
        public explanation: string;

        /**
         * Encodes the specified TourStep message. Does not implicitly {@link visualizer.TourStep.verify|verify} messages.
         * @param message TourStep message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: visualizer.ITourStep, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a TourStep message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns TourStep
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): visualizer.TourStep;

        /**
         * Gets the default type url for TourStep
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ChatResponse. */
    interface IChatResponse {

        /** ChatResponse answer */
        answer?: (string|null);

        /** ChatResponse highlights */
        highlights?: (string[]|null);

        /** ChatResponse steps */
        steps?: (visualizer.ITourStep[]|null);

        /** ChatResponse error */
        error?: (string|null);
    }

    /** Represents a ChatResponse. */
    class ChatResponse implements IChatResponse {

        /**
         * Constructs a new ChatResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: visualizer.IChatResponse);

        /** ChatResponse answer. */
        public answer: string;

        /** ChatResponse highlights. */
        public highlights: string[];

        /** ChatResponse steps. */
        public steps: visualizer.ITourStep[];

        /** ChatResponse error. */
        public error: string;

        /**
         * Encodes the specified ChatResponse message. Does not implicitly {@link visualizer.ChatResponse.verify|verify} messages.
         * @param message ChatResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: visualizer.IChatResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ChatResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ChatResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): visualizer.ChatResponse;

        /**
         * Gets the default type url for ChatResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }
}
