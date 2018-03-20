import {vec2, vec3, vec4} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import ParticleSystem from './particles/ParticleSystem';
import MeshAttractor from './particles/MeshAttractor';

var OBJ = require('webgl-obj-loader');
let objString: string = "";
let mesh: any;

function readTextFile(file: string) {
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status == 0) {
                objString = rawFile.responseText;
                mesh = new OBJ.Mesh(objString);
                //alert(objString);
            }
        }
        //objString = "Error when loading OBJ file!"        
    }
    rawFile.send(null);
}

function loadMesh(filename: string) {
    objString = "";
    readTextFile(filename);
}

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const ENABLE_CAM_MOVEMENT = "Enable camera movement"
const ENABLE_CLICK_FORCES = "Enable click forces"
const controls = {
    tesselations: 5,
    'Load Scene': loadScene, // A function pointer, essentially
    "Enable camera movement": true,
    "Enable click forces": true
};

let square: Square;
let bgSquare: Square;
let time: number = 0.0;
let lastTickTime: number = 0.0;
let particleSystem: ParticleSystem;

let mousePos: vec2 = vec2.fromValues(-2, -2);

function loadScene() {
    square = new Square(false);
    square.create();

    bgSquare = new Square(true);
    bgSquare.create();
    bgSquare.setNumInstances(1);

    particleSystem = new ParticleSystem(50, square);

    loadMesh("models/n64.obj");
    console.log(mesh);
    let ma = new MeshAttractor(0.0001, true, mesh, 0.5);
    particleSystem.setMeshAttractor(ma);

    /*
    // Set up particles here. Hard-coded example data for now
    let offsetsArray = [];
    let colorsArray = [];
    let n: number = 100.0;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            offsetsArray.push(i);
            offsetsArray.push(j);
            offsetsArray.push(0);

            colorsArray.push(i / n);
            colorsArray.push(j / n);
            colorsArray.push(1.0);
            colorsArray.push(1.0); // Alpha channel
        }
    }
    let offsets: Float32Array = new Float32Array(offsetsArray);
    let colors: Float32Array = new Float32Array(colorsArray);
    square.setInstanceVBOs(offsets, colors);
    square.setNumInstances(n * n); // 10x10 grid of "particles"
    */
}

function main() {
    // Initial display for framerate
    const stats = Stats();
    stats.setMode(0);
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    document.body.appendChild(stats.domElement);

    // Add controls to the gui
    const gui = new DAT.GUI();
    let camMovController = gui.add(controls, ENABLE_CAM_MOVEMENT);
    gui.add(controls, ENABLE_CLICK_FORCES);

    // get canvas and webgl context
    const canvas = <HTMLCanvasElement>document.getElementById('canvas');
    const gl = <WebGL2RenderingContext>canvas.getContext('webgl2');
    if (!gl) {
        alert('WebGL 2 not supported!');
    }
    // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
    // Later, we can import `gl` from `globals.ts` to access it
    setGL(gl);

    // Initial call to load scene
    loadScene();

    const camera = new Camera(vec3.fromValues(50, 50, 10), vec3.fromValues(50, 50, 0));

    const renderer = new OpenGLRenderer(canvas);
    renderer.setClearColor(0.2, 0.2, 0.2, 1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE); // Additive blending

    // set up controller listeners
    camMovController.onChange(function (val: boolean) {
        if (val) {
            camera.controls.rotateSpeed = 1;
            camera.controls.zoomSpeed = 1;
            camera.controls.translateSpeed = 1;
        }
        else {
            camera.controls.rotateSpeed = 0;
            camera.controls.zoomSpeed = 0;
            camera.controls.translateSpeed = 0;
        }
    });

    const lambert = new ShaderProgram([
        new Shader(gl.VERTEX_SHADER, require('./shaders/particle-vert.glsl')),
        new Shader(gl.FRAGMENT_SHADER, require('./shaders/particle-frag.glsl')),
    ]);

    const bgShader = new ShaderProgram([
        new Shader(gl.VERTEX_SHADER, require('./shaders/bg-vert.glsl')),
        new Shader(gl.FRAGMENT_SHADER, require('./shaders/bg-frag.glsl')),
    ]);

    lastTickTime = Date.now();
    let startTime = lastTickTime;

    // This function will be called every frame
    function tick() {

        let now = Date.now();
        particleSystem.update(now - lastTickTime);
        lastTickTime = now;

        camera.update();
        stats.begin();
        //lambert.setTime(time++);
        bgShader.setDims(vec2.fromValues(window.innerWidth, window.innerHeight));
        bgShader.setMousePos(mousePos);
        bgShader.setTime(now - startTime);
        gl.viewport(0, 0, window.innerWidth, window.innerHeight);
        renderer.clear();
        renderer.render(camera, lambert, [
            square,
        ]);
        renderer.render(camera, bgShader, [
            bgSquare,
        ]);
        stats.end();

        // Tell the browser to call `tick` again whenever it renders a new frame
        requestAnimationFrame(tick);
    }

    window.addEventListener('resize', function () {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.setAspectRatio(window.innerWidth / window.innerHeight);
        camera.updateProjectionMatrix();
    }, false);

    function raycast(mousePos: vec2): vec3 {
        // create screen point
        let screenPos = vec4.fromValues(
            mousePos[0],
            mousePos[1],
            1,
            1
        );
        vec4.scale(screenPos, screenPos, camera.far);

        // create world-space screen point
        let worldPos = vec4.create();
        vec4.transformMat4(worldPos, screenPos, camera.getInvViewProjMatrix());

        // get world-space ray direction
        let direction = vec3.fromValues(worldPos[0], worldPos[1], worldPos[2]);
        vec3.subtract(direction, direction, camera.position);
        vec3.normalize(direction, direction);

        // compute final position
        let attractPos = vec3.create();
        vec3.scaleAndAdd(attractPos, camera.position, direction, 20.0);
        return attractPos;
    }

    function handleMouseDown(event: MouseEvent) {
        // ignore if not on canvas
        if (event.target != canvas) {
            return;
        }
        // update mouse position for shader
        if (!event.buttons) {
            return;
        }
        if (!controls[ENABLE_CLICK_FORCES]) {
            return;
        }
        vec2.set(mousePos,
            2.0 * event.clientX / window.innerWidth - 1.0,
            -2.0 * event.clientY / window.innerHeight + 1.0);

        // update attractors in particle system
        let attractPos = raycast(mousePos);

        if (event.buttons & 1) {
            // enable attractor
            particleSystem.mouseAttractor.enable();

            vec3.set(particleSystem.mouseAttractor.target, attractPos[0], attractPos[1], attractPos[2]);
        }
        if (event.buttons & 2) {
            // enable attractor
            particleSystem.mouseRepeller.enable();

            vec3.set(particleSystem.mouseRepeller.target, attractPos[0], attractPos[1], attractPos[2]);
        }
    }

    window.addEventListener('mousedown', handleMouseDown, false);
    window.addEventListener('mousemove', handleMouseDown, false);

    window.addEventListener('mouseup', function (event: MouseEvent) {
        // ignore if not on canvas
        if (event.target != canvas) {
            return;
        }
        if (!controls[ENABLE_CLICK_FORCES]) {
            return;
        }
        // update mouse position for shader
        vec2.set(mousePos, -2, -2);

        if (!(event.buttons & 1)) {
            particleSystem.mouseAttractor.disable();
        }
        if (!(event.buttons & 2)) {
            particleSystem.mouseRepeller.disable();
        }
    }, false);

    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();

    // Start the render loop
    tick();
}

main();
