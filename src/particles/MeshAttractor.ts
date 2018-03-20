import {vec3, vec4, mat4} from 'gl-matrix';
import Particle from './Particle';
import TargetForce from './TargetForce';
import Attractor from './Attractor';

function clamp(min: number, max: number, val: number): number {
    return val < min ? min :
           val > max ? max : val;
}

class MeshAttractor extends TargetForce {
    attractors: Array<Attractor>;

    constructor(intensity: number, enable: boolean, mesh: any, meshScale: number) {
        super(vec3.create(), intensity, enable);

        this.attractors = [];
        // attract particles to vertices
        for (let i = 0; i < mesh.vertices.length; i += 3) {
            this.attractors.push(new Attractor(vec3.fromValues(mesh.vertices[i] * meshScale, mesh.vertices[i + 1] * meshScale, mesh.vertices[i + 2] * meshScale), this.intensity, true));
        }
        // attract particles to barycenters of triangles
        let barycenter = vec3.create();

        for (let i = 0; i < mesh.indices.length; i += 3) {
            // add 3 positions to barycenter, then divide by 3
            vec3.copy(barycenter, this.attractors[mesh.indices[i]].target);
            vec3.add(barycenter, barycenter, this.attractors[mesh.indices[i + 1]].target);
            vec3.add(barycenter, barycenter, this.attractors[mesh.indices[i + 2]].target);
            vec3.scale(barycenter, barycenter, 0.333333);
            this.attractors.push(new Attractor(vec3.clone(barycenter), this.intensity, true));
        }
    }

    applyMeshForce(particle: Particle, index: number) {
        if (!this.isEnabled || index >= this.attractors.length) {
            return;
        }
        this.attractors[index].applyForce(particle);
    }

};

export default MeshAttractor;
