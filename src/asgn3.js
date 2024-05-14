// Asgn3.js
// Shaun Munshi

var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`;


var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;
  uniform sampler2D u_Sampler4;
  uniform int u_whichTexture;
  void main() {
    if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;
    } else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV,1.0,1.0);
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if (u_whichTexture == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    } else if(u_whichTexture == 3){
        gl_FragColor = texture2D(u_Sampler3, v_UV);
    } else if(u_whichTexture == 4){
        gl_FragColor = texture2D(u_Sampler4, v_UV);
    } else {
      gl_FragColor = vec4(1.0, 0.2, 0.2, 1.0);
    }
  }`;




let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let g_FOV = 60;

let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_Sampler3;
let u_Sampler4;
let u_whichTexture;

var move_front = false;
var move_back = false;
var move_left = false;
var move_right = false;

let camera = new Camera();

let canvas;
let gl;
let a_Position;
let a_UV;
let gaX = 180;
let gaY = 0;


function main() {
  
    // Set up canvas and GL variables
    setupWebGL();
  
    
    connectVariablesToGLSL();
  
    document.onkeydown = keydown;
    document.onkeyup = keyup;
  
    initTextures();
    
    canvas.addEventListener("click", async() => {  await canvas.requestPointerLock(); });
    canvas.addEventListener("mousemove", mouseMovement);
  
    
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
  
    requestAnimationFrame(tick);
  }

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('WebGL aint working lmao get a new laptop');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Big dawg ur shaders broken ngl');
    return;
  }

  
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler0');
    return false;
  }

  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1) {
    console.log('Failed to get the storage location of u_Sampler1');
    return false;
  }

  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  if (!u_Sampler2) {
    console.log('Failed to get the storage location of u_Sampler2');
    return false;
  }

  u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
  if(!u_Sampler3){
    console.log('Failed to get the storage location of u_Sampler3');
    return false;
  }

  u_Sampler4 = gl.getUniformLocation(gl.program, 'u_Sampler4');
  if(!u_Sampler4){
    console.log('Failed to get the storage location of u_Sampler3');
    return false;
  }

  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return false;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }


  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}




function mouseMovement(event) {
  if (document.pointerLockElement == canvas) {
    if (event.movementX < 0) {
      camera.panLeft(-event.movementX * 0.1);
    } else {
      camera.panRight(event.movementX * 0.1);
    }
  }
}

// FPS code taken from ChatGPT and Stack Overflow
var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;
var fps = 0;
var counter = [];

function tick(timestamp) {
  g_seconds = performance.now()/1000.0-g_startTime;
  while (counter.length > 0 && counter[0] <= timestamp - 1000) {
    counter.shift();
  }

  counter.push(timestamp)
  fps = counter.length;
  renderScene();

  requestAnimationFrame(tick);
}



var left_rotate = false;
var right_rotate = false;

function keydown(ev) {
  if (ev.keyCode == 87) {
    move_front = true;
  }
  if (ev.keyCode == 83) {
    move_back = true;
  }
  if (ev.keyCode == 68) {
    move_right = true;
  }
  if (ev.keyCode == 65) {
    move_left = true;
  }
  if (ev.keyCode == 81) {
    left_rotate = true;
  }
  if (ev.keyCode == 69) {
    right_rotate = true;
  }
}

function keyup(ev) {
  if (ev.keyCode == 87) {
    move_front = false;
  }
  if (ev.keyCode == 83) {
    move_back = false;
  }
  if (ev.keyCode == 68) {
    move_right = false;
  }
  if (ev.keyCode == 65) {
    move_left = false;
  }
  if (ev.keyCode == 81) {
    left_rotate = false;
  }
  if (ev.keyCode == 69) {
    right_rotate = false;
  }
}

function cameraMovement() {
  if (move_front) {
    camera.moveForward();
  }
  if (move_back) {
    camera.moveBackwards();
  }
  if (move_right) {
    camera.moveRight();
  }
  if (move_left) {
    camera.moveLeft();
  }
  if (left_rotate) {
    camera.panLeft(1);
  }
  if (right_rotate) {
    camera.panRight(1);
  }
}

function initTextures() {
    var image0 = new Image(); 
    if (!image0) {
      console.log('Failed to create the image object');
      return false;
    }
  
    var image1 = new Image(); 
    if (!image1) {
      console.log('Failed to create the image object');
      return false;
    }
  
    var image2 = new Image();
    if (!image2) {
      console.log('Failed to create the image object');
      return false;
    }
  
    var image3 = new Image();
    if(!image3){
      console.log('Failed to create Image3 Object');
      return false;
    }
  
    var image4 = new Image();
    if(!image4){
      console.log('Failed to create Image4 Object');
      return false;
    }
    
    image0.onload = function(){ img_to_tx_0(image0); };
    
    image0.src = '../lib/sky.jpg';
  
    image1.onload = function(){ img_to_tx_1(image1); };
    
    image1.src = '../lib/floor.jpg';
  
    image2.onload = function(){ img_to_tx_2(image2); };
    
    image2.src = '../lib/cobblestone.jpg';
  
    image3.onload = function(){ img_to_tx_3(image3); };
    image3.src = '../lib/obsidian.jpg';
  
    image4.onload = function(){ img_to_tx_4(image4); };
    image4.src = '../lib/gold_block.jpeg';
    
  }
  

function renderScene() {
  var startTime = performance.now(); 

  cameraMovement();

  
  var viewMat = new Matrix4();
  viewMat.setLookAt(
    camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2], 
    camera.at.elements[0], camera.at.elements[1], camera.at.elements[2], 
    camera.up.elements[0], camera.up.elements[1], camera.up.elements[2]
  );
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  
  
  var projMat = new Matrix4();
  projMat.setPerspective(camera.fov, canvas.width/canvas.height, .1, 1000);  
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);
  var globalRotMat = new Matrix4();
  globalRotMat.rotate(gaX,0,1,0);
  globalRotMat.rotate((gaY % 360), 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements)

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);

  var grass = new Cube();
  var night_sky = new Cube();

  grass.textureNum = 1;
  night_sky.textureNum = 0;

  grass.matrix.translate(0, -.75, 0.0);
  grass.matrix.scale(36,-.25, 36);
  grass.matrix.translate(-.5, 0, -0.5);
  grass.render();

  night_sky.matrix.scale(60, 60, 60);
  night_sky.matrix.translate(-.5, 0, -0.5);
  night_sky.render();

  renderBlocks();


  var duration = performance.now() - startTime;
  sendTextToHTML("ms: " + Math.ceil(duration) + " fps: " + Math.floor(fps), "numdot");
}
function img_to_tx_0(image) {
    var texture0 = gl.createTexture();   
    if (!texture0) {
        console.log('Failed to create the texture object');
        return false;
    }

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); 
    
    gl.activeTexture(gl.TEXTURE0);
    
    gl.bindTexture(gl.TEXTURE_2D, texture0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler0, 0);

}

function img_to_tx_1(image) {
var texture1 = gl.createTexture();   
if (!texture1) {
    console.log('Failed to create the texture object');
    return false;
}

gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); 
gl.activeTexture(gl.TEXTURE1);
gl.bindTexture(gl.TEXTURE_2D, texture1);


gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
gl.uniform1i(u_Sampler1, 1);
}

function img_to_tx_2(image) {
    var texture2 = gl.createTexture();  
    if (!texture2) {
        console.log('Failed to create the texture object');
        return false;
    }
    
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); 
    
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler2, 2);
    }

function img_to_tx_3(image) {
    var texture3 = gl.createTexture();   
    if (!texture3) {
        console.log('Failed to create the texture object3');
        return false;
    }
    
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); 
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, texture3);
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler3, 3);
}

function img_to_tx_4(image) {
    var texture4 = gl.createTexture();   
    if (!texture4) {
        console.log('Failed to create the textured object4');
        return false;
    }
    
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); 
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, texture4);
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler4, 4);
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}

let map = [
    [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
    [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
    [7, 7, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7],
    [7, 7, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 7],
    [7, 7, 0, 3, 0, 0, 3, 0, 0, 3, 0, 0, 3, 3, 0, 3, 3, 3, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 3, 0, 0, 7],
    [7, 7, 0, 0, 0, 0, 3, 0, 0, 3, 1, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 3, 0, 0, 7],
    [7, 7, 0, 0, 1, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 7],
    [7, 7, 0, 3, 0, 0, 3, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1, 0, 0, 3, 0, 0, 7],
    [7, 7, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7],
    [7, 7, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7],
    [7, 7, 0, 0, 0, 1, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 7],
    [7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 7],
    [7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 7],
    [7, 7, 0, 0, 0, 3, 0, 3, 3, 3, 0, 0, 0, 3, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 7],
    [7, 7, 0, 3, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 3, 0, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 1, 0, 0, 7],
    [7, 7, 0, 1, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 3, 0, 7],
    [7, 7, 0, 0, 0, 0, 3, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3, 0, 1, 0, 0, 0, 0, 0, 7],
    [7, 7, 0, 1, 0, 0, 3, 0, 0, 0, 0, 0, 3, 0, 0, 3, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 7],
    [7, 7, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 7],
    [7, 7, 0, 1, 0, 0, 0, 0, 0, 3, 0, 3, 0, 3, 0, 3, 0, 0, 3, 0, 3, 0, 3, 0, 3, 3, 3, 3, 3, 0, 0, 7],
    [7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7],
    [7, 7, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7],
    [7, 7, 0, 0, 3, 0, 3, 0, 3, 0, 0, 3, 0, 0, 0, 3, 0, 0, 3, 0, 0, 3, 0, 3, 3, 3, 3, 3, 3, 0, 0, 7],
    [7, 7, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7],
    [7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7],
    [7, 7, 0, 3, 0, 0, 3, 3, 0, 3, 3, 3, 3, 3, 3, 3, 0, 0, 3, 0, 0, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 7],
    [7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 7],
    [7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 7],
    [7, 7, 0, 3, 0, 3, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 7],
    [7, 7, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 3, 0, 0, 7],
    [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
    [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7]
];

function renderBlocks() {
    for (var x = 0; x < 32; x++) {
        for (var y = 0; y < 32; y++) {
            if (map[x][y] != 0){
                for (var i = 0; i < map[x][y]; i++) {
                    var minecraft_blocks = new Cube();
                    if(map[x][y] == 7){
                        minecraft_blocks.textureNum = 3;
                    } else if (map[x][y] == 1){
                        minecraft_blocks.textureNum = 4;
                    } else{
                        minecraft_blocks.textureNum = 2;
                    }
                    minecraft_blocks.matrix.translate(0, -0.8, 0);
                    minecraft_blocks.matrix.translate(x-14, i, y-12);
                    minecraft_blocks.render();
                }
            }
        }
    }
}

function renderMinecraftPig() {
  var light_pink = [1.0, 0.6, 0.6, 1];
  var dark_pink = [0.8, 0.4, 0.4, 1];
  var pork_belly = new Cube();
  var pig_head = new Cube();
  var pig_face = new Cube();
  var eye_white_left = new Cube();
  var eye_black_left = new Cube();
  var eye_white_right = new Cube();
  var eye_black_right = new Cube();
  var snout = new Cube();
  var leg_front_left = new Cube();
  var leg_back_left = new Cube();
  var leg_back_right = new Cube();
  var foot_front_left = new Cube();
  var foot_front_right = new Cube();
  var foot_back_left = new Cube();
  var foot_back_right = new Cube();

  
  pork_belly.color = dark_pink;
  pork_belly.matrix.scale(.4, .4, .4);
  pork_belly.matrix.translate(-0.5, -0, -0.5);

  
  pig_head.color = light_pink;
  pig_head.matrix.rotate(shake/2, 0.5, 1, 1);
  pig_head.matrix.scale(0.4, 0.4, 0.4);
  pig_head.matrix.translate(-0.5, 0.65, -1.5);

  
  pig_face.color = light_pink;
  pig_face.matrix.rotate(shake/2, 0.5, 1, 1);
  pig_face.matrix.scale(0.4, 0.4, 0.03);
  pig_face.matrix.translate(-0.5, 0.65, -21);


  
  eye_white_left.color = [1, 1, 1, 1];
  eye_white_left.matrix.rotate(shake/2, 0.5, 1, 1);
  eye_white_left.matrix.scale(0.1, 0.058, 0.04);
  eye_white_left.matrix.translate(-2, 8, -16.2);

  
  eye_black_left.color = [0, 0, 0, 1];
  eye_black_left.matrix.rotate(shake/2, 0.5, 1, 1);
  eye_black_left.matrix.scale(0.05, 0.058, 0.04);
  eye_black_left.matrix.translate(-3, 8, -16.5);

  
  eye_white_right.color = [1, 1, 1, 1];
  eye_white_right.matrix.rotate(shake/2, 0.5, 1, 1);
  eye_white_right.matrix.scale(0.1, 0.058, 0.04);
  eye_white_right.matrix.translate(1, 8, -16.2);
  
  eye_black_right.color = [0, 0, 0, 1];
  eye_black_right.matrix.rotate(shake/2, 0.5, 1, 1);
  eye_black_right.matrix.scale(0.05, 0.058, 0.04);
  eye_black_right.matrix.translate(3, 8, -16.5);

  
  snout.color = [0.2, 0.1, 0.05, 1.0];
  snout.matrix.rotate(0, 1, 0, 0);
  snout.matrix.rotate(shake/2, 0.5, 1, 1);
  snout.matrix.scale(0.1, 0.1, 0.04);
  snout.matrix.translate(-0.5, 3, -17);


  
  leg_front_left.color = light_pink;
  leg_front_left.matrix.setTranslate(0,0, 0);
  leg_front_left.matrix.rotate(-leg_1_angle/6,0.2,0,0); // Joint 1
  var frontleftlegCoord = new Matrix4(leg_front_left.matrix);
  leg_front_left.matrix.scale(0.1, -0.25, 0.1);
  leg_front_left.matrix.translate(-1.7, 0, -2);

  var frontrightleg = new Cube();
  frontrightleg.color = light_pink;
  frontrightleg.matrix.setTranslate(0, 0, 0);
  frontrightleg.matrix.rotate(leg_1_angle/6,1,0,0); // Joint 1
  var frontrightlegCoord = new Matrix4(frontrightleg.matrix);
  frontrightleg.matrix.scale(0.1, -0.25, 0.1);
  frontrightleg.matrix.translate(0.8, 0, -2);

  
  leg_back_left.color = light_pink;
  leg_back_left.matrix.setTranslate(0, 0, 0);
  leg_back_left.matrix.rotate(-leg_1_angle/6, 1, 0, 0);
  var backleftlegsCoord = new Matrix4(leg_back_left.matrix);
  leg_back_left.matrix.scale(0.1, -0.25, 0.1);
  leg_back_left.matrix.translate(-1.7, 0, 1);

  
  leg_back_right.color = light_pink;
  leg_back_right.matrix.setTranslate(0, 0, 0);
  leg_back_right.matrix.rotate(leg_1_angle/6, 1, 0, 0); 
  var backrightCoord = new Matrix4(leg_back_right.matrix);
  leg_back_right.matrix.scale(0.1, -0.25, 0.1);
  leg_back_right.matrix.translate(.8, 0, 1);

  
  foot_front_left.color = dark_pink;
  foot_front_left.matrix = frontleftlegCoord;
  foot_front_left.matrix.rotate(-leg_2_angle/6, 1, 0, 0);
  foot_front_left.matrix.scale(0.1, 0.1, 0.1);
  foot_front_left.matrix.translate(-1.7, -3,-2.6);

  
  foot_front_right.color = dark_pink;
  foot_front_right.matrix = frontrightlegCoord;
  foot_front_right.matrix.rotate(leg_2_angle/6, 1, 0, 0);
  foot_front_right.matrix.scale(0.1, 0.1, 0.1);
  foot_front_right.matrix.translate(0.8, -3, -2.4);

  
  foot_back_left.color = dark_pink;
  foot_back_left.matrix = backleftlegsCoord;
  foot_back_left.matrix.rotate(-leg_2_angle/6, 1, 0, 0);
  foot_back_left.matrix.scale(0.1, 0.1, 0.1);
  foot_back_left.matrix.translate(-1.7, -3, 0.5);

  
  foot_back_right.color = dark_pink;
  foot_back_right.matrix = backrightCoord;
  foot_back_right.matrix.rotate(leg_2_angle/6, 1, 0, 0);
  foot_back_right.matrix.scale(0.1, 0.1, 0.1);
  foot_back_right.matrix.translate(0.8, -3, 0.5);

  var tails = new Cylinder();
  tails.color = [1.0, 0.6, 0.6, 1];
  tails.matrix.setTranslate(0, 0, 0);
  tails.matrix.rotate(-g_tails_animation/6, -0.5, -0.5, 0)
  tails.matrix.scale(0.1, 0.1, 0.2)
  tails.matrix.translate(-0.3, 2, 1)
}
