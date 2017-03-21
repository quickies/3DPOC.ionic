/*
 * This class is based on the following file
 * https://github.com/mrdoob/three.js/blob/master/examples/js/loaders/STLLoader.js
 */

import {
  BufferAttribute,
  Vector3,
  DefaultLoadingManager,
  FileLoader,
  BufferGeometry
} from "three"

export class STLLoader {

  manager: any;

  constructor() {
    this.manager = DefaultLoadingManager;
  }

  load = function (url, onLoad, onProgress, onError) {
    var scope = this;

    var loader = new FileLoader(scope.manager);
    loader.setResponseType('arraybuffer');
    loader.load(url, function (text) {
      onLoad(scope.parse(text));
    }, onProgress, onError);
  };

  parse = function (data) {

    var isBinary = function () {

      var expect, face_size, n_faces, reader;
      reader = new DataView(binData);
      face_size = ( 32 / 8 * 3 ) + ( ( 32 / 8 * 3 ) * 3 ) + ( 16 / 8 );
      n_faces = reader.getUint32(80, true);
      expect = 80 + ( 32 / 8 ) + ( n_faces * face_size );

      if (expect === reader.byteLength) {
        return true;
      }

      // some binary files will have different size from expected,
      // checking characters higher than ASCII to confirm is binary
      var fileLength = reader.byteLength;
      for (var index = 0; index < fileLength; index++) {

        if (reader.getUint8(index, false) > 127) {
          return true;
        }
      }

      return false;
    };

    var binData = this.ensureBinary(data);

    return isBinary() ? this.parseBinary(binData) : this.parseASCII(this.ensureString(data));

  };

  parseBinary = function (data) {

    var reader = new DataView(data);
    var faces = reader.getUint32(80, true);

    var r, g, b, hasColors = false, colors;
    var defaultR, defaultG, defaultB, alpha;

    // process STL header
    // check for default color in header ("COLOR=rgba" sequence).

    for (var index = 0; index < 80 - 10; index++) {

      if (( reader.getUint32(index, false) == 0x434F4C4F /*COLO*/ ) &&
        ( reader.getUint8(index + 4) == 0x52 /*'R'*/ ) &&
        ( reader.getUint8(index + 5) == 0x3D /*'='*/ )) {

        hasColors = true;
        colors = [];

        defaultR = reader.getUint8(index + 6) / 255;
        defaultG = reader.getUint8(index + 7) / 255;
        defaultB = reader.getUint8(index + 8) / 255;
        alpha = reader.getUint8(index + 9) / 255;
      }

    }

    var dataOffset = 84;
    var faceLength = 12 * 4 + 2;

    var geometry = new BufferGeometry();

    var vertices = [];
    var normals = [];

    for (var face = 0; face < faces; face++) {

      var start = dataOffset + face * faceLength;
      var normalX = reader.getFloat32(start, true);
      var normalY = reader.getFloat32(start + 4, true);
      var normalZ = reader.getFloat32(start + 8, true);

      if (hasColors) {

        var packedColor = reader.getUint16(start + 48, true);
        if (( packedColor & 0x8000 ) === 0) {

          // facet has its own unique color
          r = ( packedColor & 0x1F ) / 31;
          g = ( ( packedColor >> 5 ) & 0x1F ) / 31;
          b = ( ( packedColor >> 10 ) & 0x1F ) / 31;
        } else {
          r = defaultR;
          g = defaultG;
          b = defaultB;
        }
      }

      for (var i = 1; i <= 3; i++) {

        var vertexstart = start + i * 12;

        vertices.push(reader.getFloat32(vertexstart, true));
        vertices.push(reader.getFloat32(vertexstart + 4, true));
        vertices.push(reader.getFloat32(vertexstart + 8, true));

        normals.push(normalX, normalY, normalZ);

        if (hasColors) {
          colors.push(r, g, b);
        }
      }
    }

    geometry.addAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    geometry.addAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));

    if (hasColors) {

      geometry
      geometry.addAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
      // TODO: geometry.hasColors = true;
      // TODO: geometry.alpha = alpha;

    }

    return geometry;

  };

  parseASCII = function (data) {

    var geometry, length, patternFace, patternNormal, patternVertex, result, text;
    geometry = new BufferGeometry();
    patternFace = /facet([\s\S]*?)endfacet/g;

    var vertices = [];
    var normals = [];

    var normal = new Vector3();

    while (( result = patternFace.exec(data) ) !== null) {

      text = result[0];
      patternNormal = /normal[\s]+([\-+]?[0-9]+\.?[0-9]*([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+/g;

      while (( result = patternNormal.exec(text) ) !== null) {

        normal.x = parseFloat(result[1]);
        normal.y = parseFloat(result[3]);
        normal.z = parseFloat(result[5]);

      }

      patternVertex = /vertex[\s]+([\-+]?[0-9]+\.?[0-9]*([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+/g;

      while (( result = patternVertex.exec(text) ) !== null) {

        vertices.push(parseFloat(result[1]), parseFloat(result[3]), parseFloat(result[5]));
        normals.push(normal.x, normal.y, normal.z);

      }

    }

    geometry.addAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    geometry.addAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));

    return geometry;

  };

  ensureString = function (buf) {

    if (typeof buf !== "string") {

      var array_buffer = new Uint8Array(buf);
      var strArray = [];
      for (var i = 0; i < buf.byteLength; i++) {

        strArray.push(String.fromCharCode(array_buffer[i])); // implicitly assumes little-endian

      }
      return strArray.join('');

    } else {
      return buf;
    }
  };

  ensureBinary = function (buf) {

    if (typeof buf === "string") {

      var array_buffer = new Uint8Array(buf.length);
      for (var i = 0; i < buf.length; i++) {
        array_buffer[i] = buf.charCodeAt(i) & 0xff; // implicitly assumes little-endian
      }
      return array_buffer.buffer || array_buffer;

    } else {
      return buf;
    }

  };

}
