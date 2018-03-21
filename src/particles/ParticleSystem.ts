import Particle from './Particle';
import Attractor from './Attractor';
import Repeller from './Repeller';
import MeshAttractor from './MeshAttractor';
import Square from '../geometry/Square';
import {vec3, vec4, mat4} from 'gl-matrix';

const BASE_COLOR = vec3.fromValues(0.3, 0.3, 0.3);

const MINTY_PALETTE = [
    vec4.fromValues(13 / 255, 251 / 255, 255 / 255, 1),
    vec4.fromValues(12 / 255, 232 / 255, 173 / 255, 1),
    vec4.fromValues(0 / 255, 255 / 255, 115 / 255, 1),
    vec4.fromValues(12 / 255, 232 / 255, 48 / 255, 1),
    vec4.fromValues(47 / 255, 255 / 255, 13 / 255, 1),
];

const SPICY_PALETTE = [
    vec4.fromValues(255 / 255, 179 / 255, 13 / 255, 1),
    vec4.fromValues(232 / 255, 141 / 255, 12 / 255, 1),
    vec4.fromValues(255 / 255, 113 / 255, 0 / 255, 1),
    vec4.fromValues(232 / 255, 77 / 255, 12 / 255, 1),
    vec4.fromValues(255 / 255, 49 / 255, 13 / 255, 1),
];

const GRAPY_PALETTE = [
    vec4.fromValues(156 / 255, 45 / 255, 178 / 255, 1),
    vec4.fromValues(231 / 255, 116 / 255, 255 / 255, 1),
    vec4.fromValues(227 / 255, 90 / 255, 255 / 255, 1),
    vec4.fromValues(113 / 255, 178 / 255, 27 / 255, 1),
    vec4.fromValues(183 / 255, 255 / 255, 90 / 255, 1),
];

export enum ColorMethod {
    DIRECTION = 1,
    MINTY,
    SPICY,
    GRAPY,
};

export class ParticleSystem {
    particles: Array<Particle>;
    offsets: Float32Array;
    colors: Float32Array;
    square: Square;

    accTime: number;

    mouseAttractor: Attractor;
    mouseRepeller: Repeller;
    meshAttractor: MeshAttractor;

    colorFunction: (particle: Particle) => void;
    useForceField: boolean;

    constructor(n: number, square: Square) {
        this.accTime = 0.0;

        this.square = square;
        this.square.setNumInstances(n * n);

        this.particles = [];
        this.offsets = new Float32Array(3 * n * n);
        this.colors = new Float32Array(4 * n * n);

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                let p = new Particle(vec3.fromValues(i, j, 0), vec3.fromValues(0, 0, 0.0), vec3.create(), vec4.fromValues(i / n, j / n, 1, 1));
                this.particles.push(p);
                let idx = i * n + j;
                this.updateInstanceArrays(p, idx);
            }
        }

        this.mouseAttractor = new Attractor(vec3.fromValues(0, 0, 0), 0.0003, false);
        this.mouseRepeller = new Repeller(vec3.fromValues(0, 0, 0), 0.0001, false);
        this.meshAttractor = null;

        this.colorFunction = this.colorByVelDir;
        this.useForceField = true;
    }

    updateInstanceArrays(particle: Particle, index: number) {
        this.offsets[3 * index + 0] = particle.position[0];
        this.offsets[3 * index + 1] = particle.position[1];
        this.offsets[3 * index + 2] = particle.position[2];

        this.colors[4 * index + 0] = particle.color[0];
        this.colors[4 * index + 1] = particle.color[1];
        this.colors[4 * index + 2] = particle.color[2];
        this.colors[4 * index + 3] = particle.color[3];
    }

    setMeshAttractor(meshAttractor: MeshAttractor) {
        this.meshAttractor = meshAttractor;
    }

    colorByVelDir(particle: Particle) {
        let dir = vec3.create();
        vec3.normalize(dir, particle.velocity);
        vec3.scaleAndAdd(dir, BASE_COLOR, dir, 0.3);
        vec4.set(particle.color, dir[0], dir[1], dir[2], 1.0);
    }

    colorByMintyPalette(particle: Particle) {
        let speed = vec3.len(particle.velocity);
        let idx = Math.min(4, Math.floor(speed * 50.0));
        vec4.copy(particle.color, MINTY_PALETTE[idx]);
    }

    colorBySpicyPalette(particle: Particle) {
        let speed = vec3.len(particle.velocity);
        let idx = Math.min(4, Math.floor(speed * 30.0));
        vec4.copy(particle.color, SPICY_PALETTE[idx]);
    }

    colorByGrapyPalette(particle: Particle) {
        let speed = vec3.len(particle.velocity);
        let idx = Math.min(4, Math.floor(speed * 40.0));
        vec4.copy(particle.color, GRAPY_PALETTE[idx]);
    }


    sphericalField(particle: Particle) {
        const UP = vec3.fromValues(0, 1, 0);
        let toParticle = vec3.clone(particle.position);
        vec3.normalize(toParticle, toParticle);
        let bit = vec3.create();
        vec3.cross(bit, toParticle, UP);
        let tan = vec3.create();
        vec3.cross(tan, bit, toParticle);

        vec3.scale(toParticle, toParticle, -0.000002);
        vec3.scale(tan, tan, -0.000008);
        vec3.scale(bit, bit, -0.000002);
        vec3.add(particle.acceleration, particle.acceleration, toParticle);
        vec3.add(particle.acceleration, particle.acceleration, tan);
        vec3.add(particle.acceleration, particle.acceleration, bit);
    }

    setColorMethod(method: ColorMethod) {
        if (method == ColorMethod.DIRECTION) {
            this.colorFunction = this.colorByVelDir;
        }
        else if (method == ColorMethod.MINTY) {
            this.colorFunction = this.colorByMintyPalette;
        }
        else if (method == ColorMethod.SPICY) {
            this.colorFunction = this.colorBySpicyPalette;
        }
        else if (method == ColorMethod.GRAPY) {
            this.colorFunction = this.colorByGrapyPalette;
        }
    }

    // dT: delta time
    update(dT: number) {
        let newTime = this.accTime + dT;
        let intervals = Math.floor(newTime / 16.0) - Math.floor(this.accTime / 16.0);
        let drag = Math.pow(0.9985, intervals);
        this.accTime = newTime;

        //if (this.accTime > 5000.0) {
            //this.mouseAttractor.target[0] = 10.0;
        //}

        let dir = vec3.create();

        this.particles.forEach(function (value: Particle, index: number) {
            //vec3.copy(value.acceleration, acc);
            vec3.set(value.acceleration, 0, 0, 0);
            this.mouseAttractor.applyForce(value);
            this.mouseRepeller.applyForce(value);
            if (this.meshAttractor != null) {
                this.meshAttractor.applyMeshForce(value, index);
            }
            if (this.useForceField) {
                this.sphericalField(value);
            }
            vec3.scale(value.velocity, value.velocity, drag);
            value.update(dT);
            // set color
            this.colorFunction(value);
            this.updateInstanceArrays(value, index);
        }, this);

        this.square.setInstanceVBOs(this.offsets, this.colors);
    }
};
