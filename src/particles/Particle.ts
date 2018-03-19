import {vec3, vec4, mat4} from 'gl-matrix';

class Particle {
    position: vec3;
    velocity: vec3;
    acceleration: vec3;
    color: vec4;

    constructor(position: vec3, velocity: vec3, acceleration: vec3, color: vec4) {
        this.position = vec3.clone(position);
        this.velocity = vec3.clone(velocity);
        this.acceleration = vec3.clone(acceleration);
        this.color = vec4.clone(color);
    }

    // dT: delta time
    update(dT: number) {
        // vec3.scaleAndAdd(u, u, v, s) is equivalent to u = u + v * s
        vec3.scaleAndAdd(this.position, this.position, this.velocity, dT);
        vec3.scaleAndAdd(this.velocity, this.velocity, this.acceleration, dT);
    }
};

export default Particle;
