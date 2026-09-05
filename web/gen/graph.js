/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const visualizer = $root.visualizer = (() => {

    /**
     * Namespace visualizer.
     * @exports visualizer
     * @namespace
     */
    const visualizer = {};

    visualizer.Graph = (function() {

        /**
         * Properties of a Graph.
         * @memberof visualizer
         * @interface IGraph
         * @property {string|null} [name] Graph name
         * @property {Array.<visualizer.INode>|null} [nodes] Graph nodes
         * @property {Array.<visualizer.IEdge>|null} [edges] Graph edges
         * @property {Array.<string>|null} [diagnostics] Graph diagnostics
         * @property {number|null} [fileCount] Graph fileCount
         */

        /**
         * Constructs a new Graph.
         * @memberof visualizer
         * @classdesc Represents a Graph.
         * @implements IGraph
         * @constructor
         * @param {visualizer.IGraph=} [properties] Properties to set
         */
        function Graph(properties) {
            this.nodes = [];
            this.edges = [];
            this.diagnostics = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Graph name.
         * @member {string} name
         * @memberof visualizer.Graph
         * @instance
         */
        Graph.prototype.name = "";

        /**
         * Graph nodes.
         * @member {Array.<visualizer.INode>} nodes
         * @memberof visualizer.Graph
         * @instance
         */
        Graph.prototype.nodes = $util.emptyArray;

        /**
         * Graph edges.
         * @member {Array.<visualizer.IEdge>} edges
         * @memberof visualizer.Graph
         * @instance
         */
        Graph.prototype.edges = $util.emptyArray;

        /**
         * Graph diagnostics.
         * @member {Array.<string>} diagnostics
         * @memberof visualizer.Graph
         * @instance
         */
        Graph.prototype.diagnostics = $util.emptyArray;

        /**
         * Graph fileCount.
         * @member {number} fileCount
         * @memberof visualizer.Graph
         * @instance
         */
        Graph.prototype.fileCount = 0;

        /**
         * Encodes the specified Graph message. Does not implicitly {@link visualizer.Graph.verify|verify} messages.
         * @function encode
         * @memberof visualizer.Graph
         * @static
         * @param {visualizer.IGraph} message Graph message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Graph.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
            if (message.nodes != null && message.nodes.length)
                for (let i = 0; i < message.nodes.length; ++i)
                    $root.visualizer.Node.encode(message.nodes[i], writer.uint32(/* id 2, wireType 2 =*/18).fork(), q + 1).ldelim();
            if (message.edges != null && message.edges.length)
                for (let i = 0; i < message.edges.length; ++i)
                    $root.visualizer.Edge.encode(message.edges[i], writer.uint32(/* id 3, wireType 2 =*/26).fork(), q + 1).ldelim();
            if (message.diagnostics != null && message.diagnostics.length)
                for (let i = 0; i < message.diagnostics.length; ++i)
                    writer.uint32(/* id 4, wireType 2 =*/34).string(message.diagnostics[i]);
            if (message.fileCount != null && Object.hasOwnProperty.call(message, "fileCount"))
                writer.uint32(/* id 5, wireType 0 =*/40).uint32(message.fileCount);
            return writer;
        };

        /**
         * Decodes a Graph message from the specified reader or buffer.
         * @function decode
         * @memberof visualizer.Graph
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {visualizer.Graph} Graph
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Graph.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end, message;
            if (length === undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = new $root.visualizer.Graph();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.name = reader.string();
                        break;
                    }
                case 2: {
                        if (!(message.nodes && message.nodes.length))
                            message.nodes = [];
                        message.nodes.push($root.visualizer.Node.decode(reader, reader.uint32(), undefined, long + 1));
                        break;
                    }
                case 3: {
                        if (!(message.edges && message.edges.length))
                            message.edges = [];
                        message.edges.push($root.visualizer.Edge.decode(reader, reader.uint32(), undefined, long + 1));
                        break;
                    }
                case 4: {
                        if (!(message.diagnostics && message.diagnostics.length))
                            message.diagnostics = [];
                        message.diagnostics.push(reader.string());
                        break;
                    }
                case 5: {
                        message.fileCount = reader.uint32();
                        break;
                    }
                default:
                    reader.skipType(tag & 7, long);
                    break;
                }
            }
            if (length !== undefined) {
                if (reader.pos !== end)
                    throw RangeError("index out of range");
                reader.len = length;
            }
            return message;
        };

        /**
         * Gets the default type url for Graph
         * @function getTypeUrl
         * @memberof visualizer.Graph
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        Graph.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/visualizer.Graph";
        };

        return Graph;
    })();

    visualizer.Node = (function() {

        /**
         * Properties of a Node.
         * @memberof visualizer
         * @interface INode
         * @property {string|null} [id] Node id
         * @property {string|null} [name] Node name
         * @property {string|null} [qualifiedName] Node qualifiedName
         * @property {string|null} [kind] Node kind
         * @property {string|null} [file] Node file
         * @property {number|null} [line] Node line
         * @property {number|null} [endLine] Node endLine
         * @property {string|null} [source] Node source
         * @property {string|null} [documentation] Node documentation
         * @property {string|null} [detail] Node detail
         * @property {string|null} [parent] Node parent
         * @property {boolean|null} [isAsync] Node isAsync
         * @property {boolean|null} [entryPoint] Node entryPoint
         * @property {string|null} [targetId] Node targetId
         */

        /**
         * Constructs a new Node.
         * @memberof visualizer
         * @classdesc Represents a Node.
         * @implements INode
         * @constructor
         * @param {visualizer.INode=} [properties] Properties to set
         */
        function Node(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Node id.
         * @member {string} id
         * @memberof visualizer.Node
         * @instance
         */
        Node.prototype.id = "";

        /**
         * Node name.
         * @member {string} name
         * @memberof visualizer.Node
         * @instance
         */
        Node.prototype.name = "";

        /**
         * Node qualifiedName.
         * @member {string} qualifiedName
         * @memberof visualizer.Node
         * @instance
         */
        Node.prototype.qualifiedName = "";

        /**
         * Node kind.
         * @member {string} kind
         * @memberof visualizer.Node
         * @instance
         */
        Node.prototype.kind = "";

        /**
         * Node file.
         * @member {string} file
         * @memberof visualizer.Node
         * @instance
         */
        Node.prototype.file = "";

        /**
         * Node line.
         * @member {number} line
         * @memberof visualizer.Node
         * @instance
         */
        Node.prototype.line = 0;

        /**
         * Node endLine.
         * @member {number} endLine
         * @memberof visualizer.Node
         * @instance
         */
        Node.prototype.endLine = 0;

        /**
         * Node source.
         * @member {string} source
         * @memberof visualizer.Node
         * @instance
         */
        Node.prototype.source = "";

        /**
         * Node documentation.
         * @member {string} documentation
         * @memberof visualizer.Node
         * @instance
         */
        Node.prototype.documentation = "";

        /**
         * Node detail.
         * @member {string} detail
         * @memberof visualizer.Node
         * @instance
         */
        Node.prototype.detail = "";

        /**
         * Node parent.
         * @member {string} parent
         * @memberof visualizer.Node
         * @instance
         */
        Node.prototype.parent = "";

        /**
         * Node isAsync.
         * @member {boolean} isAsync
         * @memberof visualizer.Node
         * @instance
         */
        Node.prototype.isAsync = false;

        /**
         * Node entryPoint.
         * @member {boolean} entryPoint
         * @memberof visualizer.Node
         * @instance
         */
        Node.prototype.entryPoint = false;

        /**
         * Node targetId.
         * @member {string} targetId
         * @memberof visualizer.Node
         * @instance
         */
        Node.prototype.targetId = "";

        /**
         * Encodes the specified Node message. Does not implicitly {@link visualizer.Node.verify|verify} messages.
         * @function encode
         * @memberof visualizer.Node
         * @static
         * @param {visualizer.INode} message Node message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Node.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
            if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.name);
            if (message.qualifiedName != null && Object.hasOwnProperty.call(message, "qualifiedName"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.qualifiedName);
            if (message.kind != null && Object.hasOwnProperty.call(message, "kind"))
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.kind);
            if (message.file != null && Object.hasOwnProperty.call(message, "file"))
                writer.uint32(/* id 5, wireType 2 =*/42).string(message.file);
            if (message.line != null && Object.hasOwnProperty.call(message, "line"))
                writer.uint32(/* id 6, wireType 0 =*/48).uint32(message.line);
            if (message.endLine != null && Object.hasOwnProperty.call(message, "endLine"))
                writer.uint32(/* id 7, wireType 0 =*/56).uint32(message.endLine);
            if (message.source != null && Object.hasOwnProperty.call(message, "source"))
                writer.uint32(/* id 8, wireType 2 =*/66).string(message.source);
            if (message.documentation != null && Object.hasOwnProperty.call(message, "documentation"))
                writer.uint32(/* id 9, wireType 2 =*/74).string(message.documentation);
            if (message.detail != null && Object.hasOwnProperty.call(message, "detail"))
                writer.uint32(/* id 10, wireType 2 =*/82).string(message.detail);
            if (message.parent != null && Object.hasOwnProperty.call(message, "parent"))
                writer.uint32(/* id 11, wireType 2 =*/90).string(message.parent);
            if (message.isAsync != null && Object.hasOwnProperty.call(message, "isAsync"))
                writer.uint32(/* id 12, wireType 0 =*/96).bool(message.isAsync);
            if (message.entryPoint != null && Object.hasOwnProperty.call(message, "entryPoint"))
                writer.uint32(/* id 13, wireType 0 =*/104).bool(message.entryPoint);
            if (message.targetId != null && Object.hasOwnProperty.call(message, "targetId"))
                writer.uint32(/* id 14, wireType 2 =*/114).string(message.targetId);
            return writer;
        };

        /**
         * Decodes a Node message from the specified reader or buffer.
         * @function decode
         * @memberof visualizer.Node
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {visualizer.Node} Node
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Node.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end, message;
            if (length === undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = new $root.visualizer.Node();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.id = reader.string();
                        break;
                    }
                case 2: {
                        message.name = reader.string();
                        break;
                    }
                case 3: {
                        message.qualifiedName = reader.string();
                        break;
                    }
                case 4: {
                        message.kind = reader.string();
                        break;
                    }
                case 5: {
                        message.file = reader.string();
                        break;
                    }
                case 6: {
                        message.line = reader.uint32();
                        break;
                    }
                case 7: {
                        message.endLine = reader.uint32();
                        break;
                    }
                case 8: {
                        message.source = reader.string();
                        break;
                    }
                case 9: {
                        message.documentation = reader.string();
                        break;
                    }
                case 10: {
                        message.detail = reader.string();
                        break;
                    }
                case 11: {
                        message.parent = reader.string();
                        break;
                    }
                case 12: {
                        message.isAsync = reader.bool();
                        break;
                    }
                case 13: {
                        message.entryPoint = reader.bool();
                        break;
                    }
                case 14: {
                        message.targetId = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7, long);
                    break;
                }
            }
            if (length !== undefined) {
                if (reader.pos !== end)
                    throw RangeError("index out of range");
                reader.len = length;
            }
            return message;
        };

        /**
         * Gets the default type url for Node
         * @function getTypeUrl
         * @memberof visualizer.Node
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        Node.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/visualizer.Node";
        };

        return Node;
    })();

    visualizer.Edge = (function() {

        /**
         * Properties of an Edge.
         * @memberof visualizer
         * @interface IEdge
         * @property {string|null} [from] Edge from
         * @property {string|null} [to] Edge to
         * @property {string|null} [kind] Edge kind
         * @property {string|null} [label] Edge label
         */

        /**
         * Constructs a new Edge.
         * @memberof visualizer
         * @classdesc Represents an Edge.
         * @implements IEdge
         * @constructor
         * @param {visualizer.IEdge=} [properties] Properties to set
         */
        function Edge(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Edge from.
         * @member {string} from
         * @memberof visualizer.Edge
         * @instance
         */
        Edge.prototype.from = "";

        /**
         * Edge to.
         * @member {string} to
         * @memberof visualizer.Edge
         * @instance
         */
        Edge.prototype.to = "";

        /**
         * Edge kind.
         * @member {string} kind
         * @memberof visualizer.Edge
         * @instance
         */
        Edge.prototype.kind = "";

        /**
         * Edge label.
         * @member {string} label
         * @memberof visualizer.Edge
         * @instance
         */
        Edge.prototype.label = "";

        /**
         * Encodes the specified Edge message. Does not implicitly {@link visualizer.Edge.verify|verify} messages.
         * @function encode
         * @memberof visualizer.Edge
         * @static
         * @param {visualizer.IEdge} message Edge message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Edge.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.from != null && Object.hasOwnProperty.call(message, "from"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.from);
            if (message.to != null && Object.hasOwnProperty.call(message, "to"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.to);
            if (message.kind != null && Object.hasOwnProperty.call(message, "kind"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.kind);
            if (message.label != null && Object.hasOwnProperty.call(message, "label"))
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.label);
            return writer;
        };

        /**
         * Decodes an Edge message from the specified reader or buffer.
         * @function decode
         * @memberof visualizer.Edge
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {visualizer.Edge} Edge
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Edge.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end, message;
            if (length === undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = new $root.visualizer.Edge();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.from = reader.string();
                        break;
                    }
                case 2: {
                        message.to = reader.string();
                        break;
                    }
                case 3: {
                        message.kind = reader.string();
                        break;
                    }
                case 4: {
                        message.label = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7, long);
                    break;
                }
            }
            if (length !== undefined) {
                if (reader.pos !== end)
                    throw RangeError("index out of range");
                reader.len = length;
            }
            return message;
        };

        /**
         * Gets the default type url for Edge
         * @function getTypeUrl
         * @memberof visualizer.Edge
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        Edge.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/visualizer.Edge";
        };

        return Edge;
    })();

    visualizer.Session = (function() {

        /**
         * Properties of a Session.
         * @memberof visualizer
         * @interface ISession
         * @property {boolean|null} [aiEnabled] Session aiEnabled
         * @property {string|null} [provider] Session provider
         * @property {string|null} [model] Session model
         * @property {string|null} [token] Session token
         */

        /**
         * Constructs a new Session.
         * @memberof visualizer
         * @classdesc Represents a Session.
         * @implements ISession
         * @constructor
         * @param {visualizer.ISession=} [properties] Properties to set
         */
        function Session(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Session aiEnabled.
         * @member {boolean} aiEnabled
         * @memberof visualizer.Session
         * @instance
         */
        Session.prototype.aiEnabled = false;

        /**
         * Session provider.
         * @member {string} provider
         * @memberof visualizer.Session
         * @instance
         */
        Session.prototype.provider = "";

        /**
         * Session model.
         * @member {string} model
         * @memberof visualizer.Session
         * @instance
         */
        Session.prototype.model = "";

        /**
         * Session token.
         * @member {string} token
         * @memberof visualizer.Session
         * @instance
         */
        Session.prototype.token = "";

        /**
         * Encodes the specified Session message. Does not implicitly {@link visualizer.Session.verify|verify} messages.
         * @function encode
         * @memberof visualizer.Session
         * @static
         * @param {visualizer.ISession} message Session message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Session.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.aiEnabled != null && Object.hasOwnProperty.call(message, "aiEnabled"))
                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.aiEnabled);
            if (message.provider != null && Object.hasOwnProperty.call(message, "provider"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.provider);
            if (message.model != null && Object.hasOwnProperty.call(message, "model"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.model);
            if (message.token != null && Object.hasOwnProperty.call(message, "token"))
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.token);
            return writer;
        };

        /**
         * Decodes a Session message from the specified reader or buffer.
         * @function decode
         * @memberof visualizer.Session
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {visualizer.Session} Session
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Session.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end, message;
            if (length === undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = new $root.visualizer.Session();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.aiEnabled = reader.bool();
                        break;
                    }
                case 2: {
                        message.provider = reader.string();
                        break;
                    }
                case 3: {
                        message.model = reader.string();
                        break;
                    }
                case 4: {
                        message.token = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7, long);
                    break;
                }
            }
            if (length !== undefined) {
                if (reader.pos !== end)
                    throw RangeError("index out of range");
                reader.len = length;
            }
            return message;
        };

        /**
         * Gets the default type url for Session
         * @function getTypeUrl
         * @memberof visualizer.Session
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        Session.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/visualizer.Session";
        };

        return Session;
    })();

    visualizer.Turn = (function() {

        /**
         * Properties of a Turn.
         * @memberof visualizer
         * @interface ITurn
         * @property {string|null} [role] Turn role
         * @property {string|null} [text] Turn text
         */

        /**
         * Constructs a new Turn.
         * @memberof visualizer
         * @classdesc Represents a Turn.
         * @implements ITurn
         * @constructor
         * @param {visualizer.ITurn=} [properties] Properties to set
         */
        function Turn(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Turn role.
         * @member {string} role
         * @memberof visualizer.Turn
         * @instance
         */
        Turn.prototype.role = "";

        /**
         * Turn text.
         * @member {string} text
         * @memberof visualizer.Turn
         * @instance
         */
        Turn.prototype.text = "";

        /**
         * Encodes the specified Turn message. Does not implicitly {@link visualizer.Turn.verify|verify} messages.
         * @function encode
         * @memberof visualizer.Turn
         * @static
         * @param {visualizer.ITurn} message Turn message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Turn.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.role != null && Object.hasOwnProperty.call(message, "role"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.role);
            if (message.text != null && Object.hasOwnProperty.call(message, "text"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.text);
            return writer;
        };

        /**
         * Decodes a Turn message from the specified reader or buffer.
         * @function decode
         * @memberof visualizer.Turn
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {visualizer.Turn} Turn
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Turn.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end, message;
            if (length === undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = new $root.visualizer.Turn();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.role = reader.string();
                        break;
                    }
                case 2: {
                        message.text = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7, long);
                    break;
                }
            }
            if (length !== undefined) {
                if (reader.pos !== end)
                    throw RangeError("index out of range");
                reader.len = length;
            }
            return message;
        };

        /**
         * Gets the default type url for Turn
         * @function getTypeUrl
         * @memberof visualizer.Turn
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        Turn.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/visualizer.Turn";
        };

        return Turn;
    })();

    visualizer.ChatRequest = (function() {

        /**
         * Properties of a ChatRequest.
         * @memberof visualizer
         * @interface IChatRequest
         * @property {string|null} [question] ChatRequest question
         * @property {Array.<string>|null} [selectedIds] ChatRequest selectedIds
         * @property {Array.<visualizer.ITurn>|null} [history] ChatRequest history
         */

        /**
         * Constructs a new ChatRequest.
         * @memberof visualizer
         * @classdesc Represents a ChatRequest.
         * @implements IChatRequest
         * @constructor
         * @param {visualizer.IChatRequest=} [properties] Properties to set
         */
        function ChatRequest(properties) {
            this.selectedIds = [];
            this.history = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ChatRequest question.
         * @member {string} question
         * @memberof visualizer.ChatRequest
         * @instance
         */
        ChatRequest.prototype.question = "";

        /**
         * ChatRequest selectedIds.
         * @member {Array.<string>} selectedIds
         * @memberof visualizer.ChatRequest
         * @instance
         */
        ChatRequest.prototype.selectedIds = $util.emptyArray;

        /**
         * ChatRequest history.
         * @member {Array.<visualizer.ITurn>} history
         * @memberof visualizer.ChatRequest
         * @instance
         */
        ChatRequest.prototype.history = $util.emptyArray;

        /**
         * Encodes the specified ChatRequest message. Does not implicitly {@link visualizer.ChatRequest.verify|verify} messages.
         * @function encode
         * @memberof visualizer.ChatRequest
         * @static
         * @param {visualizer.IChatRequest} message ChatRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ChatRequest.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.question != null && Object.hasOwnProperty.call(message, "question"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.question);
            if (message.selectedIds != null && message.selectedIds.length)
                for (let i = 0; i < message.selectedIds.length; ++i)
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.selectedIds[i]);
            if (message.history != null && message.history.length)
                for (let i = 0; i < message.history.length; ++i)
                    $root.visualizer.Turn.encode(message.history[i], writer.uint32(/* id 3, wireType 2 =*/26).fork(), q + 1).ldelim();
            return writer;
        };

        /**
         * Decodes a ChatRequest message from the specified reader or buffer.
         * @function decode
         * @memberof visualizer.ChatRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {visualizer.ChatRequest} ChatRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ChatRequest.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end, message;
            if (length === undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = new $root.visualizer.ChatRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.question = reader.string();
                        break;
                    }
                case 2: {
                        if (!(message.selectedIds && message.selectedIds.length))
                            message.selectedIds = [];
                        message.selectedIds.push(reader.string());
                        break;
                    }
                case 3: {
                        if (!(message.history && message.history.length))
                            message.history = [];
                        message.history.push($root.visualizer.Turn.decode(reader, reader.uint32(), undefined, long + 1));
                        break;
                    }
                default:
                    reader.skipType(tag & 7, long);
                    break;
                }
            }
            if (length !== undefined) {
                if (reader.pos !== end)
                    throw RangeError("index out of range");
                reader.len = length;
            }
            return message;
        };

        /**
         * Gets the default type url for ChatRequest
         * @function getTypeUrl
         * @memberof visualizer.ChatRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ChatRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/visualizer.ChatRequest";
        };

        return ChatRequest;
    })();

    visualizer.TourStep = (function() {

        /**
         * Properties of a TourStep.
         * @memberof visualizer
         * @interface ITourStep
         * @property {string|null} [nodeId] TourStep nodeId
         * @property {string|null} [explanation] TourStep explanation
         */

        /**
         * Constructs a new TourStep.
         * @memberof visualizer
         * @classdesc Represents a TourStep.
         * @implements ITourStep
         * @constructor
         * @param {visualizer.ITourStep=} [properties] Properties to set
         */
        function TourStep(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * TourStep nodeId.
         * @member {string} nodeId
         * @memberof visualizer.TourStep
         * @instance
         */
        TourStep.prototype.nodeId = "";

        /**
         * TourStep explanation.
         * @member {string} explanation
         * @memberof visualizer.TourStep
         * @instance
         */
        TourStep.prototype.explanation = "";

        /**
         * Encodes the specified TourStep message. Does not implicitly {@link visualizer.TourStep.verify|verify} messages.
         * @function encode
         * @memberof visualizer.TourStep
         * @static
         * @param {visualizer.ITourStep} message TourStep message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TourStep.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.nodeId != null && Object.hasOwnProperty.call(message, "nodeId"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.nodeId);
            if (message.explanation != null && Object.hasOwnProperty.call(message, "explanation"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.explanation);
            return writer;
        };

        /**
         * Decodes a TourStep message from the specified reader or buffer.
         * @function decode
         * @memberof visualizer.TourStep
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {visualizer.TourStep} TourStep
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TourStep.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end, message;
            if (length === undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = new $root.visualizer.TourStep();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.nodeId = reader.string();
                        break;
                    }
                case 2: {
                        message.explanation = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7, long);
                    break;
                }
            }
            if (length !== undefined) {
                if (reader.pos !== end)
                    throw RangeError("index out of range");
                reader.len = length;
            }
            return message;
        };

        /**
         * Gets the default type url for TourStep
         * @function getTypeUrl
         * @memberof visualizer.TourStep
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        TourStep.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/visualizer.TourStep";
        };

        return TourStep;
    })();

    visualizer.ChatResponse = (function() {

        /**
         * Properties of a ChatResponse.
         * @memberof visualizer
         * @interface IChatResponse
         * @property {string|null} [answer] ChatResponse answer
         * @property {Array.<string>|null} [highlights] ChatResponse highlights
         * @property {Array.<visualizer.ITourStep>|null} [steps] ChatResponse steps
         * @property {string|null} [error] ChatResponse error
         */

        /**
         * Constructs a new ChatResponse.
         * @memberof visualizer
         * @classdesc Represents a ChatResponse.
         * @implements IChatResponse
         * @constructor
         * @param {visualizer.IChatResponse=} [properties] Properties to set
         */
        function ChatResponse(properties) {
            this.highlights = [];
            this.steps = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ChatResponse answer.
         * @member {string} answer
         * @memberof visualizer.ChatResponse
         * @instance
         */
        ChatResponse.prototype.answer = "";

        /**
         * ChatResponse highlights.
         * @member {Array.<string>} highlights
         * @memberof visualizer.ChatResponse
         * @instance
         */
        ChatResponse.prototype.highlights = $util.emptyArray;

        /**
         * ChatResponse steps.
         * @member {Array.<visualizer.ITourStep>} steps
         * @memberof visualizer.ChatResponse
         * @instance
         */
        ChatResponse.prototype.steps = $util.emptyArray;

        /**
         * ChatResponse error.
         * @member {string} error
         * @memberof visualizer.ChatResponse
         * @instance
         */
        ChatResponse.prototype.error = "";

        /**
         * Encodes the specified ChatResponse message. Does not implicitly {@link visualizer.ChatResponse.verify|verify} messages.
         * @function encode
         * @memberof visualizer.ChatResponse
         * @static
         * @param {visualizer.IChatResponse} message ChatResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ChatResponse.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.answer != null && Object.hasOwnProperty.call(message, "answer"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.answer);
            if (message.highlights != null && message.highlights.length)
                for (let i = 0; i < message.highlights.length; ++i)
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.highlights[i]);
            if (message.steps != null && message.steps.length)
                for (let i = 0; i < message.steps.length; ++i)
                    $root.visualizer.TourStep.encode(message.steps[i], writer.uint32(/* id 3, wireType 2 =*/26).fork(), q + 1).ldelim();
            if (message.error != null && Object.hasOwnProperty.call(message, "error"))
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.error);
            return writer;
        };

        /**
         * Decodes a ChatResponse message from the specified reader or buffer.
         * @function decode
         * @memberof visualizer.ChatResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {visualizer.ChatResponse} ChatResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ChatResponse.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end, message;
            if (length === undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = new $root.visualizer.ChatResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.answer = reader.string();
                        break;
                    }
                case 2: {
                        if (!(message.highlights && message.highlights.length))
                            message.highlights = [];
                        message.highlights.push(reader.string());
                        break;
                    }
                case 3: {
                        if (!(message.steps && message.steps.length))
                            message.steps = [];
                        message.steps.push($root.visualizer.TourStep.decode(reader, reader.uint32(), undefined, long + 1));
                        break;
                    }
                case 4: {
                        message.error = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7, long);
                    break;
                }
            }
            if (length !== undefined) {
                if (reader.pos !== end)
                    throw RangeError("index out of range");
                reader.len = length;
            }
            return message;
        };

        /**
         * Gets the default type url for ChatResponse
         * @function getTypeUrl
         * @memberof visualizer.ChatResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ChatResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/visualizer.ChatResponse";
        };

        return ChatResponse;
    })();

    return visualizer;
})();

export { $root as default };
