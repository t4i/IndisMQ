export default flatbuffers;
export declare module flatbuffers {
    /**
     * @enum {number}
     */
    enum Encoding {
        UTF8_BYTES = 1,
        UTF16_STRING = 2,
    }
    /**
   * @typedef {number}
   */
    type Offset = number;
    /**
   * @typedef {{
   *   bb: flatbuffers.ByteBuffer,
   *   bb_pos: number
   * }}
   */
    class Table {
        bb: flatbuffers.ByteBuffer;
        bb_pos: number;
    }
    class Long {
        low: number;
        high: number;
        constructor(low: number, high: number);
        /**
         * @param {number} high
         * @param {number} low
         * @returns {flatbuffers.Long}
         */
        static create(low: number, high: number): Long;
        /**
         * @returns {number}
         */
        toFloat64(): number;
        /**
         * @param {flatbuffers.Long} other
         * @returns {boolean}
         */
        equals(other: flatbuffers.Long): boolean;
    }
    module Long {
        const ZERO: Long;
    }
    /**
     * Create a FlatBufferBuilder.
     *
     * @constructor
     * @param {number=} initial_size
     */
    class Builder {
        bb: flatbuffers.ByteBuffer;
        space: number;
        minalign: number;
        vtable: number[];
        vtable_in_use: number;
        isNested: boolean;
        object_start: number;
        vtables: number[];
        vector_num_elems: number;
        force_defaults: boolean;
        constructor(initial_size?: number);
        /**
         * In order to save space, fields that are set to their default value
         * don't get serialized into the buffer. Forcing defaults provides a
         * way to manually disable this optimization.
         *
         * @param {boolean} forceDefaults true always serializes default values
         */
        forceDefaults(forceDefaults: boolean): void;
        /**
         * Get the ByteBuffer representing the FlatBuffer. Only call this after you've
         * called finish(). The actual data starts at the ByteBuffer's current position,
         * not necessarily at 0.
         *
         * @returns {flatbuffers.ByteBuffer}
         */
        dataBuffer(): flatbuffers.ByteBuffer;
        /**
         * Get the bytes representing the FlatBuffer. Only call this after you've
         * called finish().
         *
         * @returns {Uint8Array}
         */
        asUint8Array(): Uint8Array;
        /**
         * Prepare to write an element of `size` after `additional_bytes` have been
         * written, e.g. if you write a string, you need to align such the int length
         * field is aligned to 4 bytes, and the string data follows it directly. If all
         * you need to do is alignment, `additional_bytes` will be 0.
         *
         * @param {number} size This is the of the new element to write
         * @param {number} additional_bytes The padding size
         */
        prep(size: number, additional_bytes: number): void;
        /**
         * @param {number} byte_size
         */
        pad(byte_size: number): void;
        /**
         * @param {number} value
         */
        writeInt8(value: number): void;
        /**
         * @param {number} value
         */
        writeInt16(value: number): void;
        /**
         * @param {number} value
         */
        writeInt32(value: number): void;
        /**
         * @param {flatbuffers.Long} value
         */
        writeInt64(value: flatbuffers.Long): void;
        /**
         * @param {number} value
         */
        writeFloat32(value: number): void;
        /**
         * @param {number} value
         */
        writeFloat64(value: number): void;
        /**
         * Add an `int8` to the buffer, properly aligned, and grows the buffer (if necessary).
         * @param {number} value The `int8` to add the the buffer.
         */
        addInt8(value: number): void;
        /**
         * Add an `int16` to the buffer, properly aligned, and grows the buffer (if necessary).
         * @param {number} value The `int16` to add the the buffer.
         */
        addInt16(value: number): void;
        /**
         * Add an `int32` to the buffer, properly aligned, and grows the buffer (if necessary).
         * @param {number} value The `int32` to add the the buffer.
         */
        addInt32(value: number): void;
        /**
         * Add an `int64` to the buffer, properly aligned, and grows the buffer (if necessary).
         * @param {flatbuffers.Long} value The `int64` to add the the buffer.
         */
        addInt64(value: flatbuffers.Long): void;
        /**
         * Add a `float32` to the buffer, properly aligned, and grows the buffer (if necessary).
         * @param {number} value The `float32` to add the the buffer.
         */
        addFloat32(value: number): void;
        /**
         * Add a `float64` to the buffer, properly aligned, and grows the buffer (if necessary).
         * @param {number} value The `float64` to add the the buffer.
         */
        addFloat64(value: number): void;
        /**
         * @param {number} voffset
         * @param {number} value
         * @param {number} defaultValue
         */
        addFieldInt8(voffset: number, value: number, defaultValue: number): void;
        /**
         * @param {number} voffset
         * @param {number} value
         * @param {number} defaultValue
         */
        addFieldInt16(voffset: number, value: number, defaultValue: number): void;
        /**
         * @param {number} voffset
         * @param {number} value
         * @param {number} defaultValue
         */
        addFieldInt32(voffset: number, value: number, defaultValue: number): void;
        /**
         * @param {number} voffset
         * @param {flatbuffers.Long} value
         * @param {flatbuffers.Long} defaultValue
         */
        addFieldInt64(voffset: number, value: flatbuffers.Long, defaultValue: flatbuffers.Long): void;
        /**
         * @param {number} voffset
         * @param {number} value
         * @param {number} defaultValue
         */
        addFieldFloat32(voffset: number, value: number, defaultValue: number): void;
        /**
         * @param {number} voffset
         * @param {number} value
         * @param {number} defaultValue
         */
        addFieldFloat64(voffset: number, value: number, defaultValue: number): void;
        /**
         * @param {number} voffset
         * @param {flatbuffers.Offset} value
         * @param {flatbuffers.Offset} defaultValue
         */
        addFieldOffset(voffset: number, value: flatbuffers.Offset, defaultValue: flatbuffers.Offset): void;
        /**
         * Structs are stored inline, so nothing additional is being added. `d` is always 0.
         *
         * @param {number} voffset
         * @param {flatbuffers.Offset} value
         * @param {flatbuffers.Offset} defaultValue
         */
        addFieldStruct(voffset: number, value: flatbuffers.Offset, defaultValue: flatbuffers.Offset): void;
        /**
         * Structures are always stored inline, they need to be created right
         * where they're used.  You'll get this assertion failure if you
         * created it elsewhere.
         *
         * @param {flatbuffers.Offset} obj The offset of the created object
         */
        nested(obj: flatbuffers.Offset): void;
        /**
         * Should not be creating any other object, string or vector
         * while an object is being constructed
         */
        notNested(): void;
        /**
         * Set the current vtable at `voffset` to the current location in the buffer.
         *
         * @param {number} voffset
         */
        slot(voffset: number): void;
        /**
         * @returns {flatbuffers.Offset} Offset relative to the end of the buffer.
         */
        offset(): flatbuffers.Offset;
        /**
         * Doubles the size of the backing ByteBuffer and copies the old data towards
         * the end of the new buffer (since we build the buffer backwards).
         *
         * @param {flatbuffers.ByteBuffer} bb The current buffer with the existing data
         * @returns {flatbuffers.ByteBuffer} A new byte buffer with the old data copied
         * to it. The data is located at the end of the buffer.
         */
        growByteBuffer(bb: flatbuffers.ByteBuffer): flatbuffers.ByteBuffer;
        /**
         * Adds on offset, relative to where it will be written.
         *
         * @param {flatbuffers.Offset} offset The offset to add.
         */
        addOffset(offset: flatbuffers.Offset): void;
        /**
         * Start encoding a new object in the buffer.  Users will not usually need to
         * call this directly. The FlatBuffers compiler will generate helper methods
         * that call this method internally.
         *
         * @param {number} numfields
         */
        startObject(numfields: number): void;
        /**
         * Finish off writing the object that is under construction.
         *
         * @returns {flatbuffers.Offset} The offset to the object inside `dataBuffer`
         */
        endObject(): flatbuffers.Offset;
        /**
         * Finalize a buffer, poiting to the given `root_table`.
         *
         * @param {flatbuffers.Offset} root_table
         * @param {string=} file_identifier
         */
        finish(root_table: flatbuffers.Offset, file_identifier?: string): void;
        /**
         * This checks a required field has been set in a given table that has
         * just been constructed.
         *
         * @param {flatbuffers.Offset} table
         * @param {number} field
         */
        requiredField(table: flatbuffers.Offset, field: number): void;
        /**
         * Start a new array/vector of objects.  Users usually will not call
         * this directly. The FlatBuffers compiler will create a start/end
         * method for vector types in generated code.
         *
         * @param {number} elem_size The size of each element in the array
         * @param {number} num_elems The number of elements in the array
         * @param {number} alignment The alignment of the array
         */
        startVector(elem_size: number, num_elems: number, alignment: number): void;
        /**
         * Finish off the creation of an array and all its elements. The array must be
         * created with `startVector`.
         *
         * @returns {flatbuffers.Offset} The offset at which the newly created array
         * starts.
         */
        endVector(): flatbuffers.Offset;
        /**
         * Encode the string `s` in the buffer using UTF-8. If a Uint8Array is passed
         * instead of a string, it is assumed to contain valid UTF-8 encoded data.
         *
         * @param {string|Uint8Array} s The string to encode
         * @return {flatbuffers.Offset} The offset in the buffer where the encoded string starts
         */
        createString(s: string | Uint8Array): flatbuffers.Offset;
        /**
         * A helper function to avoid generated code depending on this file directly.
         *
         * @param {number} low
         * @param {number} high
         * @returns {flatbuffers.Long}
         */
        createLong(low: any, high: any): Long;
    }
    /**
     * Create a new ByteBuffer with a given array of bytes (`Uint8Array`).
     *
     * @constructor
     * @param {Uint8Array} bytes
     */
    class ByteBuffer {
        bytes_: Uint8Array;
        position_: number;
        constructor(bytes: Uint8Array);
        /**
         * Create and allocate a new ByteBuffer with a given size.
         *
         * @param {number} byte_size
         * @returns {flatbuffers.ByteBuffer}
         */
        static allocate(byte_size: number): ByteBuffer;
        /**
         * Get the underlying `Uint8Array`.
         *
         * @returns {Uint8Array}
         */
        bytes(): Uint8Array;
        /**
         * Get the buffer's position.
         *
         * @returns {number}
         */
        position(): number;
        /**
         * Set the buffer's position.
         *
         * @param {number} position
         */
        setPosition(position: number): void;
        /**
         * Get the buffer's capacity.
         *
         * @returns {number}
         */
        capacity(): number;
        /**
         * @param {number} offset
         * @returns {number}
         */
        readInt8(offset: number): number;
        /**
         * @param {number} offset
         * @returns {number}
         */
        readUint8(offset: number): number;
        /**
         * @param {number} offset
         * @returns {number}
         */
        readInt16(offset: number): number;
        /**
         * @param {number} offset
         * @returns {number}
         */
        readUint16(offset: number): number;
        /**
         * @param {number} offset
         * @returns {number}
         */
        readInt32(offset: number): number;
        /**
         * @param {number} offset
         * @returns {number}
         */
        readUint32(offset: number): number;
        /**
         * @param {number} offset
         * @returns {flatbuffers.Long}
         */
        readInt64(offset: number): flatbuffers.Long;
        /**
         * @param {number} offset
         * @returns {flatbuffers.Long}
         */
        readUint64(offset: number): flatbuffers.Long;
        /**
         * @param {number} offset
         * @returns {number}
         */
        readFloat32(offset: number): number;
        /**
         * @param {number} offset
         * @returns {number}
         */
        readFloat64(offset: number): number;
        /**
         * @param {number} offset
         * @param {number} value
         */
        writeInt8(offset: number, value: number): void;
        /**
         * @param {number} offset
         * @param {number} value
         */
        writeInt16(offset: number, value: number): void;
        /**
         * @param {number} offset
         * @param {number} value
         */
        writeInt32(offset: number, value: number): void;
        /**
         * @param {number} offset
         * @param {flatbuffers.Long} value
         */
        writeInt64(offset: number, value: flatbuffers.Long): void;
        /**
         * @param {number} offset
         * @param {number} value
         */
        writeFloat32(offset: number, value: number): void;
        /**
         * @param {number} offset
         * @param {number} value
         */
        writeFloat64(offset: number, value: number): void;
        /**
         * Look up a field in the vtable, return an offset into the object, or 0 if the
         * field is not present.
         *
         * @param {number} bb_pos
         * @param {number} vtable_offset
         * @returns {number}
         */
        __offset(bb_pos: number, vtable_offset: number): number;
        /**
         * Initialize any Table-derived type to point to the union at the given offset.
         *
         * @param {flatbuffers.Table} t
         * @param {number} offset
         * @returns {flatbuffers.Table}
         */
        __union(t: flatbuffers.Table, offset: number): flatbuffers.Table;
        /**
         * Create a JavaScript string from UTF-8 data stored inside the FlatBuffer.
         * This allocates a new string and converts to wide chars upon each access.
         *
         * To avoid the conversion to UTF-16, pass flatbuffers.Encoding.UTF8_BYTES as
         * the "optionalEncoding" argument. This is useful for avoiding conversion to
         * and from UTF-16 when the data will just be packaged back up in another
         * FlatBuffer later on.
         *
         * @param {number} offset
         * @param {flatbuffers.Encoding=} optionalEncoding Defaults to UTF16_STRING
         * @returns {string|Uint8Array}
         */
        __string(offset: number): string;
        __string(offset: number, optionalEncoding: flatbuffers.Encoding): string | Uint8Array;
        /**
         * Retrieve the relative offset stored at "offset"
         * @param {number} offset
         * @returns {number}
         */
        __indirect(offset: number): number;
        /**
         * Get the start of data of a vector whose offset is stored at "offset" in this object.
         *
         * @param {number} offset
         * @returns {number}
         */
        __vector(offset: number): number;
        /**
         * Get the length of a vector whose offset is stored at "offset" in this object.
         *
         * @param {number} offset
         * @returns {number}
         */
        __vector_len(offset: number): number;
        /**
         * @param {string} ident
         * @returns {boolean}
         */
        __has_identifier(ident: string): boolean;
        /**
         * A helper function to avoid generated code depending on this file directly.
         *
         * @param {number} low
         * @param {number} high
         * @returns {flatbuffers.Long}
         */
        createLong(low: number, high: number): flatbuffers.Long;
    }
}
