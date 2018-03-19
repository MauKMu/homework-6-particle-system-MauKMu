import {vec3, vec4, mat4} from 'gl-matrix';
import Particle from './Particle';

class TargetForce {
    target: vec3;
    intensity: number;
    isEnabled: boolean;

    constructor(target: vec3, intensity: number, enable: boolean) {
        this.target = target;
        this.intensity = intensity;
        this.isEnabled = enable;
    }

    enable() {
        this.isEnabled = true;
    }

    disable() {
        this.isEnabled = false;
    }

    applyForce(particle: Particle) {
    }

};

export default TargetForce;
