import {vec3, vec4, mat4} from 'gl-matrix';
import Particle from './Particle';
import TargetForce from './TargetForce';

function clamp(min: number, max: number, val: number): number {
    return val < min ? min :
           val > max ? max : val;
}

class Attractor extends TargetForce {
    constructor(target: vec3, intensity: number, enable: boolean) {
        super(target, intensity, enable);
    }

    applyForce(particle: Particle) {
        if (!this.isEnabled) {
            return;
        }
        // want to do two things:
        // 1. move towards target
        // 2. reduce velocity if close to target

        // move towards target
        let diff = vec3.create();
        vec3.subtract(diff, this.target, particle.position);

        let dist = vec3.length(diff);
        let distScale = clamp(2.5, 100.0, dist);

        if (dist < 1.0) {
            dist *= -1;
        }
        else if (dist > 5.0) {
            dist = 5.0;
        }   
        //let sqrDist = clamp(0.1, 2.0, vec3.length(diff));

        vec3.normalize(diff, diff);
        vec3.scale(diff, diff, this.intensity * distScale * 0.1);

        // reduce velocity if close to target
        if (dist < 10.0) {
            particle.color[0] = 0.0;
            let velDiff = vec3.clone(particle.velocity);
            let vel = vec3.length(velDiff);
            if (vel > 0.005) {
                //vec3.scale(particle.velocity, particle.velocity, 0.01);
                //vec3.scaleAndAdd(diff, diff, velDiff, -this.intensity * 1000);
                vec3.scaleAndAdd(diff, diff, velDiff, -0.01);
            }
        }
        else {
            particle.color[0] = 0.0;
        }
        particle.color[1] = Math.abs(particle.velocity[0] * 10000);

        vec3.add(particle.acceleration, particle.acceleration, diff);
        //vec3.copy(particle.velocity, diff);
    }

};

export default Attractor;
