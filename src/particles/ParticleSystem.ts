import Particle from './Particle';
import Attractor from './Attractor';
import Square from '../geometry/Square';
import {vec3, vec4, mat4} from 'gl-matrix';

class ParticleSystem {
    particles: Array<Particle>;
    offsets: Float32Array;
    colors: Float32Array;
    square: Square;

    accTime: number;

    mouseAttractor: Attractor;

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

        this.mouseAttractor = new Attractor(vec3.fromValues(0, 0, 0), 0.0001);
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

    // dT: delta time
    update(dT: number) {
        let newTime = this.accTime + dT;
        let intervals = Math.floor(newTime / 16.0) - Math.floor(this.accTime / 16.0);
        let drag = Math.pow(0.9985, intervals);
        this.accTime = newTime;

        let acc: vec3 = vec3.fromValues(0, 0, 0.0001);

        if (this.particles[0].velocity[2] > -0.1) {
            acc[2] *= -1;
        }

        if (this.accTime > 5000.0) {
            this.mouseAttractor.target[0] = 10.0;
        }

        this.particles.forEach(function (value: Particle, index: number) {
            //vec3.copy(value.acceleration, acc);
            vec3.set(value.acceleration, 0, 0, 0);
            this.mouseAttractor.applyForce(value);
            vec3.scale(value.velocity, value.velocity, drag);
            value.update(dT);
            this.updateInstanceArrays(value, index);
        }, this);

        this.square.setInstanceVBOs(this.offsets, this.colors);
    }
};

export default ParticleSystem;
